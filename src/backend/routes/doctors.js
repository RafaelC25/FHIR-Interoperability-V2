const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/doctors - Obtener todos los médicos
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT m.id, m.especialidad, u.id as usuario_id, u.nombre, u.email 
      FROM medico m
      LEFT JOIN usuario u ON m.usuario_id = u.id
    `;
    const [medicos] = await db.query(query);
    
    // Estructura de respuesta modificada para mayor consistencia
    res.status(200).json({
      success: true,
      data: medicos.map(medico => ({
        id: medico.id,
        usuario_id: medico.usuario_id,
        especialidad: medico.especialidad,
        usuario: medico.usuario_id ? {
          id: medico.usuario_id,
          nombre: medico.nombre,
          email: medico.email
        } : null
      }))
    });
  } catch (error) {
    console.error('Error al obtener médicos:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener médicos',
      error: error.message 
    });
  }
});

router.post('/', async (req, res) => {
  const { usuario_id, especialidad } = req.body;
  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // Validación del rol médico
    if (usuario_id) {
      const [usuario] = await connection.query(
        'SELECT rol_id FROM usuario WHERE id = ?',
        [usuario_id]
      );
      
      if (usuario.length === 0 || usuario[0].rol_id !== 2) {
        await connection.rollback();
        return res.status(400).json({ 
          success: false,
          message: 'El usuario no tiene rol de médico' 
        });
      }
    }

    // Insertar médico
    const [result] = await connection.query(
      'INSERT INTO medico (usuario_id, especialidad) VALUES (?, ?)',
      [usuario_id || null, especialidad]
    );

    // Obtener médico creado
    const [medico] = await connection.query(`
      SELECT m.id, m.especialidad, u.id as usuario_id, u.nombre, u.email 
      FROM medico m
      LEFT JOIN usuario u ON m.usuario_id = u.id
      WHERE m.id = ?
    `, [result.insertId]);

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Médico creado exitosamente',
      data: {
        id: medico[0].id,
        usuario_id: medico[0].usuario_id,
        especialidad: medico[0].especialidad,
        usuario: medico[0].usuario_id ? {
          id: medico[0].usuario_id,
          nombre: medico[0].nombre,
          email: medico[0].email
        } : null
      }
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error al crear médico:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al crear médico',
      error: error.message 
    });
  } finally {
    if (connection) connection.release();
  }
});

// PUT /api/doctors/:id - Actualizar médico
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { especialidad } = req.body;
  let connection;

  if (!especialidad) {
    return res.status(400).json({ 
      success: false,
      message: 'La especialidad es requerida' 
    });
  }

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [result] = await connection.query(
      'UPDATE medico SET especialidad = ? WHERE id = ?',
      [especialidad, id]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ 
        success: false,
        message: 'Médico no encontrado' 
      });
    }

    const [medico] = await connection.query(`
      SELECT m.id, m.especialidad, u.id as usuario_id, u.nombre, u.email 
      FROM medico m
      LEFT JOIN usuario u ON m.usuario_id = u.id
      WHERE m.id = ?
    `, [id]);

    await connection.commit();

    res.json({
      success: true,
      message: 'Médico actualizado exitosamente',
      data: {
        id: medico[0].id,
        usuario_id: medico[0].usuario_id,
        especialidad: medico[0].especialidad,
        usuario: medico[0].usuario_id ? {
          id: medico[0].usuario_id,
          nombre: medico[0].nombre,
          email: medico[0].email
        } : null
      }
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error al actualizar médico:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al actualizar médico',
      error: error.message 
    });
  } finally {
    if (connection) connection.release();
  }
});

// DELETE /api/doctors/:id - Eliminar médico
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query(
      'DELETE FROM medico WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Médico no encontrado' 
      });
    }

    res.json({
      success: true,
      message: 'Médico eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar médico:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al eliminar médico',
      error: error.message 
    });
  }
});

module.exports = router;