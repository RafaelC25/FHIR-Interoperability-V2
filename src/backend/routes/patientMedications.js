const express = require('express');
const router = express.Router();
const db = require('../db');

// Obtener todos los pacientes con sus medicamentos y médico asignador
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        p.id AS paciente_id,
        u_p.nombre AS paciente_nombre,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', med.id,
            'nombre', med.nombre,
            'descripcion', med.descripcion,
            'fecha_prescripcion', pm.fecha_prescripcion,
            'dosis', pm.dosis,
            'frecuencia', pm.frecuencia,
            'observaciones', pm.observaciones,
            'medico_asignador', JSON_OBJECT(
              'id', m.id,
              'nombre', u_m.nombre
            )
          )
        ) AS medicamentos
      FROM paciente_medicamento pm
      JOIN paciente p ON pm.paciente_id = p.id
      JOIN usuario u_p ON p.usuario_id = u_p.id
      JOIN medicamento med ON pm.medicamento_id = med.id
      JOIN medico m ON pm.medico_id = m.id
      JOIN usuario u_m ON m.usuario_id = u_m.id
      GROUP BY p.id, u_p.nombre
      ORDER BY u_p.nombre
    `;

    const [rows] = await db.query(query);

    const result = rows.map(row => ({
      paciente_id: row.paciente_id,
      paciente_nombre: row.paciente_nombre,
      medicamentos: row.medicamentos
    }));

    res.json(result);
  } catch (err) {
    console.error('Error al obtener pacientes con medicamentos:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Asignar medicamento a paciente (incluyendo médico)
router.post('/', async (req, res) => {
  const { paciente_id, medicamento_id, medico_id, fecha_prescripcion, dosis, frecuencia, observaciones } = req.body;

  if (!paciente_id || !medicamento_id || !medico_id) {
    return res.status(400).json({ 
      error: 'paciente_id, medicamento_id y medico_id son requeridos' 
    });
  }

  try {
    // Verificar existencia previa
    const [exist] = await db.query(
      `SELECT id FROM paciente_medicamento 
       WHERE paciente_id = ? AND medicamento_id = ?`,
      [paciente_id, medicamento_id]
    );

    if (exist.length > 0) {
      return res.status(400).json({ 
        error: 'Este medicamento ya está asignado al paciente' 
      });
    }

    // Insertar nueva asignación
    const [result] = await db.query(
      `INSERT INTO paciente_medicamento (
        paciente_id,
        medicamento_id,
        medico_id,
        fecha_prescripcion,
        dosis,
        frecuencia,
        observaciones
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        paciente_id,
        medicamento_id,
        medico_id,
        fecha_prescripcion || null,
        dosis || null,
        frecuencia || null,
        observaciones || null
      ]
    );

    // Obtener datos completos para respuesta
    const [response] = await db.query(`
      SELECT 
        p.id AS paciente_id,
        u_p.nombre AS paciente_nombre,
        m.id AS medicamento_id,
        m.nombre AS medicamento_nombre,
        md.id AS medico_id,
        u_m.nombre AS medico_nombre,
        pm.fecha_prescripcion,
        pm.dosis,
        pm.frecuencia,
        pm.observaciones
      FROM paciente_medicamento pm
      JOIN paciente p ON pm.paciente_id = p.id
      JOIN usuario u_p ON p.usuario_id = u_p.id
      JOIN medicamento m ON pm.medicamento_id = m.id
      JOIN medico md ON pm.medico_id = md.id
      JOIN usuario u_m ON md.usuario_id = u_m.id
      WHERE pm.paciente_id = ? AND pm.medicamento_id = ?
    `, [paciente_id, medicamento_id]);

    res.status(201).json({
      paciente_id: response[0].paciente_id,
      paciente_nombre: response[0].paciente_nombre,
      medicamento: {
        id: response[0].medicamento_id,
        nombre: response[0].medicamento_nombre,
        fecha_prescripcion: response[0].fecha_prescripcion,
        dosis: response[0].dosis,
        frecuencia: response[0].frecuencia,
        observaciones: response[0].observaciones
      },
      medico: {
        id: response[0].medico_id,
        nombre: response[0].medico_nombre
      }
    });
  } catch (err) {
    console.error('Error al asignar medicamento:', err);
    res.status(500).json({ error: 'Error al asignar medicamento' });
  }
});

// Actualizar asignación de medicamento
router.put('/:pacienteId/:medicamentoId', async (req, res) => {
  const { pacienteId, medicamentoId } = req.params;
  const { medico_id, fecha_prescripcion, dosis, frecuencia, observaciones } = req.body;

  try {
    // Verificar existencia
    const [exist] = await db.query(
      `SELECT id FROM paciente_medicamento 
       WHERE paciente_id = ? AND medicamento_id = ?`,
      [pacienteId, medicamentoId]
    );

    if (exist.length === 0) {
      return res.status(404).json({ error: 'Asignación no encontrada' });
    }

    // Actualizar
    await db.query(
      `UPDATE paciente_medicamento SET
        medico_id = ?,
        fecha_prescripcion = ?,
        dosis = ?,
        frecuencia = ?,
        observaciones = ?
      WHERE paciente_id = ? AND medicamento_id = ?`,
      [
        medico_id || null,
        fecha_prescripcion || null,
        dosis || null,
        frecuencia || null,
        observaciones || null,
        pacienteId,
        medicamentoId
      ]
    );

    // Obtener datos actualizados
    const [response] = await db.query(`
      SELECT 
        p.id AS paciente_id,
        u_p.nombre AS paciente_nombre,
        m.id AS medicamento_id,
        m.nombre AS medicamento_nombre,
        md.id AS medico_id,
        u_m.nombre AS medico_nombre,
        pm.fecha_prescripcion,
        pm.dosis,
        pm.frecuencia,
        pm.observaciones
      FROM paciente_medicamento pm
      JOIN paciente p ON pm.paciente_id = p.id
      JOIN usuario u_p ON p.usuario_id = u_p.id
      JOIN medicamento m ON pm.medicamento_id = m.id
      JOIN medico md ON pm.medico_id = md.id
      JOIN usuario u_m ON md.usuario_id = u_m.id
      WHERE pm.paciente_id = ? AND pm.medicamento_id = ?
    `, [pacienteId, medicamentoId]);

    res.json({
      paciente_id: response[0].paciente_id,
      paciente_nombre: response[0].paciente_nombre,
      medicamento: {
        id: response[0].medicamento_id,
        nombre: response[0].medicamento_nombre,
        fecha_prescripcion: response[0].fecha_prescripcion,
        dosis: response[0].dosis,
        frecuencia: response[0].frecuencia,
        observaciones: response[0].observaciones
      },
      medico: {
        id: response[0].medico_id,
        nombre: response[0].medico_nombre
      }
    });
  } catch (err) {
    console.error('Error al actualizar asignación:', err);
    res.status(500).json({ error: 'Error al actualizar asignación' });
  }
});

// Eliminar asignación
router.delete('/:pacienteId/:medicamentoId', async (req, res) => {
  const { pacienteId, medicamentoId } = req.params;

  try {
    const [exist] = await db.query(
      `SELECT id FROM paciente_medicamento 
       WHERE paciente_id = ? AND medicamento_id = ?`,
      [pacienteId, medicamentoId]
    );

    if (exist.length === 0) {
      return res.status(404).json({ error: 'Asignación no encontrada' });
    }

    await db.query(
      `DELETE FROM paciente_medicamento 
       WHERE paciente_id = ? AND medicamento_id = ?`,
      [pacienteId, medicamentoId]
    );

    res.json({ 
      success: true,
      message: 'Asignación eliminada correctamente',
      paciente_id: parseInt(pacienteId),
      medicamento_id: parseInt(medicamentoId)
    });
  } catch (err) {
    console.error('Error al eliminar asignación:', err);
    res.status(500).json({ error: 'Error al eliminar asignación' });
  }
});

// Obtener opciones de médicos para select
router.get('/medicos/options', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT m.id, u.nombre 
      FROM medico m
      JOIN usuario u ON m.usuario_id = u.id
      ORDER BY u.nombre
    `);
    res.json(rows);
  } catch (err) {
    console.error('Error al obtener médicos:', err);
    res.status(500).json({ error: 'Error al obtener médicos' });
  }
});

router.get('/medicamentos/options', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, nombre, descripcion 
      FROM medicamento
      ORDER BY nombre
    `);
    res.json(rows);
  } catch (err) {
    console.error('Error al obtener medicamentos:', err);
    res.status(500).json({ error: 'Error al obtener medicamentos' });
  }
});

// Obtener todos los pacientes para select
router.get('/pacientes/options', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.id, u.nombre 
      FROM paciente p
      JOIN usuario u ON p.usuario_id = u.id
      ORDER BY u.nombre
    `);
    res.json(rows);
  } catch (err) {
    console.error('Error al obtener pacientes:', err);
    res.status(500).json({ error: 'Error al obtener pacientes' });
  }
});

module.exports = router;