const express = require('express');
const router = express.Router();
const db = require('../db'); // Ajusta según tu configuración

// Obtener todos los pacientes con sus condiciones
router.get('/patients-with-conditions', async (req, res) => {
  try {
    const query = `
      SELECT 
        p.id as paciente_id,
        u.nombre as paciente_nombre,
        cm.id as condicion_id,
        cm.nombre as condicion_nombre,
        cm.descripcion,
        pcm.fecha_diagnostico,
        pcm.observaciones
      FROM paciente p
      JOIN usuario u ON p.usuario_id = u.id
      JOIN paciente_condicion_medica pcm ON p.id = pcm.paciente_id
      JOIN condicion_medica cm ON pcm.condicion_medica_id = cm.id
      ORDER BY p.id, cm.nombre
    `;
    
    const [results] = await db.query(query);
    
    // Agrupar por paciente
    const grouped = results.reduce((acc, item) => {
      const existingPatient = acc.find(p => p.paciente_id === item.paciente_id);
      
      const condition = {
        id: item.condicion_id,
        nombre: item.condicion_nombre,
        descripcion: item.descripcion,
        fecha_diagnostico: item.fecha_diagnostico,
        observaciones: item.observaciones
      };

      if (existingPatient) {
        existingPatient.condiciones.push(condition);
      } else {
        acc.push({
          paciente_id: item.paciente_id,
          paciente_nombre: item.paciente_nombre,
          condiciones: [condition]
        });
      }
      return acc;
    }, []);
    
    res.json({ success: true, data: grouped });
    
  } catch (error) {
    console.error('Error en GET /patients-with-conditions:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al obtener pacientes con condiciones',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Crear nueva relación paciente-condición
router.post('/patient-conditions', async (req, res) => {
  try {
    const { paciente_id, condicion_medica_id, fecha_diagnostico, observaciones } = req.body;
    
    const query = `
      INSERT INTO paciente_condicion_medica 
        (paciente_id, condicion_medica_id, fecha_diagnostico, observaciones)
      VALUES (?, ?, ?, ?)
    `;
    
    const [result] = await db.query(query, [
      paciente_id,
      condicion_medica_id,
      fecha_diagnostico || null,
      observaciones || null
    ]);
    
    res.status(201).json({ 
      success: true,
      id: result.insertId
    });
    
  } catch (error) {
    console.error('Error en POST /patient-conditions:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al crear relación paciente-condición'
    });
  }
});

// Actualizar relación paciente-condición
router.put('/patient-conditions', async (req, res) => {
  try {
    const { paciente_id, condicion_medica_id, fecha_diagnostico, observaciones } = req.body;
    
    const query = `
      UPDATE paciente_condicion_medica
      SET 
        fecha_diagnostico = ?,
        observaciones = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE paciente_id = ? AND condicion_medica_id = ?
    `;
    
    const [result] = await db.query(query, [
      fecha_diagnostico || null,
      observaciones || null,
      paciente_id,
      condicion_medica_id
    ]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Relación no encontrada' 
      });
    }
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('Error en PUT /patient-conditions:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al actualizar relación',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Obtener condiciones médicas para asociar a pacientes
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
      error: 'Error al obtener condiciones médicas'
    });
  }
});

// Obtener pacientes con nombres para el módulo de condiciones
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

// Eliminar relación paciente-condición
router.delete('/patient-conditions', async (req, res) => {
  try {
    const { paciente_id, condicion_medica_id } = req.body;

    const query = `
      DELETE FROM paciente_condicion_medica
      WHERE paciente_id = ? AND condicion_medica_id = ?
    `;
    
    const [result] = await db.query(query, [
      paciente_id,
      condicion_medica_id
    ]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Relación no encontrada' 
      });
    }
    
    res.json({ success: true });
    
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