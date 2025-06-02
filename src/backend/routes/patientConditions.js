const express = require('express');
const router = express.Router();
const db = require('../db');

// Obtener todos los pacientes con sus condiciones médicas
router.get('/patients-with-conditions', async (req, res) => {
  try {
    const query = `
      SELECT 
        p.id AS paciente_id,
        u.nombre AS paciente_nombre,
        cm.id AS condicion_id,
        cm.nombre AS condicion_nombre,
        cm.descripcion AS condicion_descripcion,
        m.id AS medico_id,
        u_m.nombre AS medico_nombre,
        pcm.fecha_diagnostico,
        pcm.observaciones
      FROM paciente p
      JOIN usuario u ON p.usuario_id = u.id
      JOIN paciente_condicion_medica pcm ON p.id = pcm.paciente_id
      JOIN condicion_medica cm ON pcm.condicion_medica_id = cm.id
      LEFT JOIN medico m ON pcm.medico_id = m.id
      LEFT JOIN usuario u_m ON m.usuario_id = u_m.id
      ORDER BY u.nombre, cm.nombre
    `;
    
    const [results] = await db.query(query);
    
    // Procesar resultados para agrupar por paciente
    const pacientes = {};
    results.forEach(row => {
      if (!pacientes[row.paciente_id]) {
        pacientes[row.paciente_id] = {
          paciente_id: row.paciente_id,
          paciente_nombre: row.paciente_nombre,
          condiciones: []
        };
      }
      
      pacientes[row.paciente_id].condiciones.push({
        id: row.condicion_id,
        nombre: row.condicion_nombre,
        descripcion: row.condicion_descripcion,
        fecha_diagnostico: row.fecha_diagnostico,
        observaciones: row.observaciones,
        medico_asignador: row.medico_id ? {
          id: row.medico_id,
          nombre: row.medico_nombre
        } : undefined
      });
    });
    
    res.json({
      success: true,
      data: Object.values(pacientes)
    });
    
  } catch (error) {
    console.error('Error en GET /patients-with-conditions:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al obtener pacientes con condiciones',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Obtener opciones de pacientes
router.get('/patient-conditions/patient-options', async (req, res) => {
  try {
    const query = `
      SELECT 
        p.id,
        u.nombre AS nombre_completo
      FROM paciente p
      JOIN usuario u ON p.usuario_id = u.id
      ORDER BY u.nombre
    `;
    
    const [results] = await db.query(query);
    
    res.json({ 
      success: true,
      data: results 
    });
    
  } catch (error) {
    console.error('Error en GET /patient-conditions/patient-options:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al obtener opciones de pacientes',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Obtener opciones de condiciones médicas
router.get('/patient-conditions/options', async (req, res) => {
  try {
    const query = `
      SELECT id, nombre, descripcion 
      FROM condicion_medica
      ORDER BY nombre
    `;
    
    const [results] = await db.query(query);
    
    res.json({ 
      success: true,
      data: results 
    });
    
  } catch (error) {
    console.error('Error en GET /patient-conditions/options:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al obtener condiciones médicas',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Obtener opciones de médicos
router.get('/patient-conditions/medicos/options', async (req, res) => {
  try {
    const query = `
      SELECT m.id, u.nombre 
      FROM medico m
      JOIN usuario u ON m.usuario_id = u.id
      ORDER BY u.nombre
    `;
    
    const [results] = await db.query(query);
    
    res.json({ 
      success: true,
      data: results 
    });
    
  } catch (error) {
    console.error('Error en GET /patient-conditions/medicos/options:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al obtener opciones de médicos',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Crear nueva relación paciente-condición
// Crear nueva relación paciente-condición (versión corregida)
router.post('/patient-conditions', async (req, res) => {
  try {
    const { paciente_id, condicion_medica_id, medico_id, fecha_diagnostico, observaciones } = req.body;
    
    // Verificar existencia previa
    const [exist] = await db.query(
      `SELECT paciente_id FROM paciente_condicion_medica 
       WHERE paciente_id = ? AND condicion_medica_id = ?`,
      [paciente_id, condicion_medica_id]
    );

    if (exist.length > 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Esta condición ya está asignada al paciente' 
      });
    }
    
    // Insertar nueva relación
    const query = `
      INSERT INTO paciente_condicion_medica 
        (paciente_id, condicion_medica_id, medico_id, fecha_diagnostico, observaciones)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    await db.query(query, [
      paciente_id,
      condicion_medica_id,
      medico_id || null,
      fecha_diagnostico || null,
      observaciones || null
    ]);
    
    // Respuesta simplificada pero consistente
    res.status(201).json({ 
      success: true,
      data: {
        paciente_id,
        condicion_medica_id,
        medico_id: medico_id || null
      }
    });
    
  } catch (error) {
    console.error('Error en POST /patient-conditions:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al crear relación paciente-condición',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
// Actualizar relación paciente-condición
router.put('/patient-conditions/:paciente_id/:condicion_medica_id', async (req, res) => {
  try {
    const { paciente_id, condicion_medica_id } = req.params;
    const { medico_id, fecha_diagnostico, observaciones } = req.body;
    
    // Verificar existencia (corregido para no usar 'id')
    const [exist] = await db.query(
      `SELECT paciente_id FROM paciente_condicion_medica 
       WHERE paciente_id = ? AND condicion_medica_id = ?`,
      [paciente_id, condicion_medica_id]
    );

    if (exist.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Asignación no encontrada' 
      });
    }
    
    const query = `
      UPDATE paciente_condicion_medica
      SET 
        medico_id = ?,
        fecha_diagnostico = ?,
        observaciones = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE paciente_id = ? AND condicion_medica_id = ?
    `;
    
    await db.query(query, [
      medico_id || null,
      fecha_diagnostico || null,
      observaciones || null,
      paciente_id,
      condicion_medica_id
    ]);
    
    res.json({ 
      success: true,
      message: 'Relación actualizada correctamente'
    });
    
  } catch (error) {
    console.error('Error en PUT /patient-conditions:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al actualizar relación',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Eliminar relación paciente-condición
router.delete('/patient-conditions/:paciente_id/:condicion_medica_id', async (req, res) => {
  try {
    const { paciente_id, condicion_medica_id } = req.params;

    // Verificar existencia
    const [exist] = await db.query(
      `SELECT paciente_id FROM paciente_condicion_medica 
       WHERE paciente_id = ? AND condicion_medica_id = ?`,
      [paciente_id, condicion_medica_id]
    );

    if (exist.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Asignación no encontrada' 
      });
    }
    
    await db.query(
      `DELETE FROM paciente_condicion_medica
       WHERE paciente_id = ? AND condicion_medica_id = ?`,
      [paciente_id, condicion_medica_id]
    );
    
    res.json({ 
      success: true,
      message: 'Asignación eliminada correctamente'
    });
    
  } catch (error) {
    console.error('Error en DELETE /patient-conditions:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al eliminar relación',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router; 