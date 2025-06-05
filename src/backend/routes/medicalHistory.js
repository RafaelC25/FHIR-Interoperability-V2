const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');

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

// En backend/routes/medicalHistory.js
router.get('/patient/:pacienteId', authenticate('paciente'), async (req, res) => {
  let connection;
  try {
    connection = await db.getConnection();
    
    // 1. Verificar que el paciente existe y pertenece al usuario (ya verificado por middleware)
    const [paciente] = await connection.query(
      `SELECT p.*, u.nombre as nombre_paciente 
       FROM paciente p 
       JOIN usuario u ON p.usuario_id = u.id 
       WHERE p.id = ?`, 
      [req.params.pacienteId]
    );

    if (paciente.length === 0) {
      return res.status(404).json({ success: false, error: 'Paciente no encontrado' });
    }

    // 2. Obtener todos los datos médicos en paralelo
    const [citas, condiciones, medicamentos] = await Promise.all([
      connection.query(`
        SELECT c.*, m.especialidad, u.nombre as medico_nombre 
        FROM cita c
        LEFT JOIN medico m ON c.medico_id = m.id
        LEFT JOIN usuario u ON m.usuario_id = u.id
        WHERE c.paciente_id = ?
        ORDER BY c.fecha_cita DESC
      `, [req.params.pacienteId]),
      
      connection.query(`
        SELECT pc.*, cm.nombre as condicion_nombre, cm.descripcion,
               m.especialidad, u.nombre as medico_nombre
        FROM paciente_condicion_medica pc
        JOIN condicion_medica cm ON pc.condicion_medica_id = cm.id
        LEFT JOIN medico m ON pc.medico_id = m.id
        LEFT JOIN usuario u ON m.usuario_id = u.id
        WHERE pc.paciente_id = ?
        ORDER BY pc.fecha_diagnostico DESC
      `, [req.params.pacienteId]),
      
      connection.query(`
        SELECT pm.*, m.nombre as medicamento_nombre, m.descripcion,
               md.especialidad, u.nombre as medico_nombre
        FROM paciente_medicamento pm
        JOIN medicamento m ON pm.medicamento_id = m.id
        LEFT JOIN medico md ON pm.medico_id = md.id
        LEFT JOIN usuario u ON md.usuario_id = u.id
        WHERE pm.paciente_id = ?
        ORDER BY pm.fecha_prescripcion DESC
      `, [req.params.pacienteId])
    ]);

    // 3. Formatear respuesta
    const response = {
      success: true,
      data: {
        paciente: {
          id: paciente[0].id,
          nombre: paciente[0].nombre_paciente,
          identificacion: paciente[0].numero_identificacion,
          fecha_nacimiento: paciente[0].fecha_nacimiento?.toISOString().split('T')[0] || null,
          genero: paciente[0].genero,
          telefono: paciente[0].telefono,
          direccion: paciente[0].direccion
        },
        citas: citas[0].map(c => ({
          id: c.id,
          fecha: c.fecha_cita?.toISOString().split('T')[0] || null,
          motivo: c.motivo,
          estado: c.estado,
          medico: c.medico_id ? {
            nombre: c.medico_nombre,
            especialidad: c.especialidad
          } : null
        })),
        condiciones: condiciones[0].map(cond => ({
          id: cond.id,
          nombre: cond.condicion_nombre,
          descripcion: cond.descripcion,
          fecha_diagnostico: cond.fecha_diagnostico?.toISOString().split('T')[0] || null,
          medico: cond.medico_id ? {
            nombre: cond.medico_nombre,
            especialidad: cond.especialidad
          } : null
        })),
        medicamentos: medicamentos[0].map(med => ({
          id: med.id,
          medicamento: {
            nombre: med.medicamento_nombre,
            descripcion: med.descripcion
          },
          fecha_prescripcion: med.fecha_prescripcion?.toISOString().split('T')[0] || null,
          dosis: med.dosis,
          frecuencia: med.frecuencia,
          medico: med.medico_id ? {
            nombre: med.medico_nombre,
            especialidad: med.especialidad
          } : null
        }))
      }
    };

    res.json(response);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener historia clínica' 
    });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;