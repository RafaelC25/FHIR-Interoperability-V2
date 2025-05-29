const express = require('express');
const router = express.Router();
const db = require('../db');

// GET todas las condiciones
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, nombre, descripcion FROM condicion_medica');
    
    // Asegúrate de devolver un array, incluso si está vacío
    if (!Array.isArray(rows)) {
      console.error('La consulta no devolvió un array:', rows);
      return res.status(500).json({ error: 'Error en el formato de datos' });
    }
    
    res.json(rows);
  } catch (err) {
    console.error('Error en GET /conditions:', err);
    res.status(500).json({ 
      error: 'Error al obtener condiciones',
      details: err.message
    });
  }
});

// POST nueva condición
router.post('/', async (req, res) => {
  const { nombre, descripcion } = req.body;
  
  try {
    const [result] = await db.query(
      'INSERT INTO condicion_medica (nombre, descripcion) VALUES (?, ?)',
      [nombre, descripcion]
    );
    
    // Obtener el ID insertado
    const [newCondition] = await db.query(
      'SELECT id, nombre, descripcion FROM condicion_medica WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json(newCondition[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear condición médica' });
  }
});

// PUT actualizar condición
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion } = req.body;

  try {
    await db.query(
      'UPDATE condicion_medica SET nombre = ?, descripcion = ? WHERE id = ?',
      [nombre, descripcion, id]
    );
    
    // Obtener el registro actualizado
    const [updatedCondition] = await db.query(
      'SELECT id, nombre, descripcion FROM condicion_medica WHERE id = ?',
      [id]
    );
    
    if (updatedCondition.length === 0) {
      return res.status(404).json({ error: 'Condición no encontrada' });
    }
    
    res.json(updatedCondition[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar condición' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Eliminando condición con ID: ${id}`);
    
    // Ejemplo con MySQL
    const [result] = await db.query('DELETE FROM condicion_medica WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Condición no encontrada' });
    }
    
    res.status(204).send();
  } catch (err) {
    console.error('Error al eliminar:', err);
    res.status(500).json({ 
      error: 'Error al eliminar condición',
      details: err.message 
    });
  }
});

module.exports = router;