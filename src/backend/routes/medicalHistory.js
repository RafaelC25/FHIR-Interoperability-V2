const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  let connection;
  try {
    connection = await db.getConnection();

    // Consulta principal de pacientes
    const [patients] = await connection.query(`
      SELECT 
        p.id as paciente_id, 
        u.nombre as paciente_nombre,
        p.fecha_nacimiento, 
        p.genero, 
        p.telefono, 
        p.direccion
      FROM paciente p
      JOIN usuario u ON p.usuario_id = u.id
      WHERE u.activo = true
      ORDER BY p.id
    `);

    // Procesamiento en paralelo para mejor rendimiento
    const patientPromises = patients.map(async (patient) => {
      const [appointments] = await connection.query(`
        SELECT 
          c.id,
          c.fecha_cita as fecha,
          c.motivo,
          c.estado,
          u.nombre as medico_nombre,
          m.especialidad as medico_especialidad
        FROM cita c
        LEFT JOIN medico m ON c.medico_id = m.id
        LEFT JOIN usuario u ON m.usuario_id = u.id
        WHERE c.paciente_id = ?
        ORDER BY c.fecha_cita DESC
      `, [patient.paciente_id]);

      const [conditions] = await connection.query(`
        SELECT 
          cm.id,
          cm.nombre,
          cm.descripcion,
          pc.fecha_diagnostico,
          pc.observaciones,
          u.nombre as medico_nombre,
          m.especialidad as medico_especialidad
        FROM paciente_condicion_medica pc
        JOIN condicion_medica cm ON pc.condicion_medica_id = cm.id
        LEFT JOIN medico m ON pc.medico_id = m.id
        LEFT JOIN usuario u ON m.usuario_id = u.id
        WHERE pc.paciente_id = ?
        ORDER BY pc.fecha_diagnostico DESC
      `, [patient.paciente_id]);

      const [medications] = await connection.query(`
        SELECT 
          pm.id,
          m.id as medicamento_id,
          m.nombre,
          m.descripcion,
          pm.fecha_prescripcion,
          pm.dosis,
          pm.frecuencia,
          pm.observaciones,
          u.nombre as medico_nombre,
          m2.especialidad as medico_especialidad
        FROM paciente_medicamento pm
        JOIN medicamento m ON pm.medicamento_id = m.id
        LEFT JOIN medico m2 ON pm.medico_id = m2.id
        LEFT JOIN usuario u ON m2.usuario_id = u.id
        WHERE pm.paciente_id = ?
        ORDER BY pm.fecha_prescripcion DESC
      `, [patient.paciente_id]);

      return {
        paciente_id: patient.paciente_id,
        paciente_nombre: patient.paciente_nombre,
        fecha_nacimiento: patient.fecha_nacimiento?.toISOString().split('T')[0] || null,
        genero: patient.genero,
        telefono: patient.telefono,
        direccion: patient.direccion,
        citas: appointments.map(app => ({
          id: app.id,
          fecha: app.fecha,
          motivo: app.motivo,
          estado: app.estado,
          medico: app.medico_nombre ? {
            nombre: app.medico_nombre,
            especialidad: app.medico_especialidad
          } : null
        })),
        condiciones: conditions.map(cond => ({
          id: cond.id,
          nombre: cond.nombre,
          descripcion: cond.descripcion,
          fecha_diagnostico: cond.fecha_diagnostico?.toISOString().split('T')[0] || null,
          observaciones: cond.observaciones,
          medico: cond.medico_nombre ? {
            nombre: cond.medico_nombre,
            especialidad: cond.medico_especialidad
          } : null
        })),
        medicamentos: medications.map(med => ({
          id: med.id,
          medicamento: {
            id: med.medicamento_id,
            nombre: med.nombre,
            descripcion: med.descripcion
          },
          fecha_prescripcion: med.fecha_prescripcion?.toISOString().split('T')[0] || null,
          dosis: med.dosis,
          frecuencia: med.frecuencia,
          observaciones: med.observaciones,
          medico: med.medico_nombre ? {
            nombre: med.medico_nombre,
            especialidad: med.medico_especialidad
          } : null
        }))
      };
    });

    const result = await Promise.all(patientPromises);
    res.json(result);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Error al obtener historias clínicas',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;