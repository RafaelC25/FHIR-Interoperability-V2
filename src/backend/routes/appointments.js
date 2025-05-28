const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * @swagger
 * /api/appointments:
 *   get:
 *     summary: Obtiene todas las citas médicas
 *     responses:
 *       200:
 *         description: Lista de citas médicas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Appointment'
 *       500:
 *         description: Error del servidor
 */
router.get('/', async (req, res) => {
  try {
    const connection = await db.getConnection();
    
    try {
      const [results] = await connection.query(`
        SELECT 
          c.id,
          c.paciente_id,
          c.medico_id,
          DATE_FORMAT(c.fecha_cita, '%Y-%m-%dT%H:%i:%s') as fecha_cita,
          c.motivo,
          c.estado,
          up.nombre as paciente_nombre,
          um.nombre as medico_nombre,
          m.especialidad
        FROM cita c
        JOIN paciente p ON c.paciente_id = p.id
        JOIN usuario up ON p.usuario_id = up.id
        JOIN medico m ON c.medico_id = m.id
        JOIN usuario um ON m.usuario_id = um.id
        WHERE up.activo = 1 AND um.activo = 1
        ORDER BY c.fecha_cita DESC
      `);
      
      const citas = results.map(cita => ({
        ...cita,
        fecha_cita: new Date(cita.fecha_cita).toISOString()
      }));
      
      res.json(citas);
      
    } finally {
      connection.release();
    }
    
  } catch (err) {
    console.error('Error en GET /appointments:', err);
    res.status(500).json({
      error: 'Error al obtener citas',
      details: process.env.NODE_ENV === 'development' ? {
        message: err.message,
        sql: err.sql
      } : undefined
    });
  }
});

/**
 * @swagger
 * /api/appointments:
 *   post:
 *     summary: Crea una nueva cita médica
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewAppointment'
 *     responses:
 *       201:
 *         description: Cita creada exitosamente
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error del servidor
 */
router.post('/', async (req, res) => {
  try {
    const { paciente_id, medico_id, fecha_cita, motivo, estado } = req.body;
    const connection = await db.getConnection();
    
    try {
      // Verificar que existan paciente y médico
      const [paciente] = await connection.query(
        'SELECT p.id FROM paciente p JOIN usuario u ON p.usuario_id = u.id WHERE p.id = ? AND u.activo = 1',
        [paciente_id]
      );
      
      const [medico] = await connection.query(
        'SELECT m.id FROM medico m JOIN usuario u ON m.usuario_id = u.id WHERE m.id = ? AND u.activo = 1',
        [medico_id]
      );

      if (!paciente.length || !medico.length) {
        return res.status(400).json({
          error: 'Datos inválidos',
          details: !paciente.length ? 'Paciente no existe o está inactivo' : 'Médico no existe o está inactivo'
        });
      }

      // Insertar la cita
      const [result] = await connection.query(
        'INSERT INTO cita (paciente_id, medico_id, fecha_cita, motivo, estado) VALUES (?, ?, ?, ?, ?)',
        [paciente_id, medico_id, fecha_cita, motivo, estado || 'Programada']
      );

      // Obtener la cita recién creada
      const [newAppointment] = await connection.query(
        `SELECT 
          c.id,
          c.paciente_id,
          c.medico_id,
          DATE_FORMAT(c.fecha_cita, '%Y-%m-%dT%H:%i:%s') as fecha_cita,
          c.motivo,
          c.estado,
          up.nombre as paciente_nombre,
          um.nombre as medico_nombre,
          m.especialidad
        FROM cita c
        JOIN paciente p ON c.paciente_id = p.id
        JOIN usuario up ON p.usuario_id = up.id
        JOIN medico m ON c.medico_id = m.id
        JOIN usuario um ON m.usuario_id = um.id
        WHERE c.id = ?`,
        [result.insertId]
      );

      res.status(201).json(newAppointment[0]);
      
    } finally {
      connection.release();
    }
    
  } catch (err) {
    console.error('Error en POST /appointments:', err);
    res.status(500).json({
      error: 'Error al crear cita',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

/**
 * @swagger
 * /api/appointments/patients:
 *   get:
 *     summary: Obtiene pacientes activos
 *     responses:
 *       200:
 *         description: Lista de pacientes activos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Patient'
 *       500:
 *         description: Error del servidor
 */
router.get('/patients', async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT 
        p.id,
        u.nombre,
        u.email,
        p.numero_identificacion,
        p.fecha_nacimiento,
        p.telefono
      FROM paciente p
      JOIN usuario u ON p.usuario_id = u.id
      WHERE u.activo = 1
    `);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al obtener pacientes');
  }
});

/**
 * @swagger
 * /api/appointments/doctors:
 *   get:
 *     summary: Obtiene médicos activos
 *     responses:
 *       200:
 *         description: Lista de médicos activos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Doctor'
 *       500:
 *         description: Error del servidor
 */
router.get('/doctors', async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT 
        m.id,
        u.nombre,
        u.email,
        m.especialidad
      FROM medico m
      JOIN usuario u ON m.usuario_id = u.id
      WHERE u.activo = 1
    `);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al obtener médicos');
  }
});

/**
 * @swagger
 * /api/appointments/{id}:
 *   put:
 *     summary: Actualiza una cita médica
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateAppointment'
 *     responses:
 *       200:
 *         description: Cita actualizada
 *       404:
 *         description: Cita no encontrada
 *       500:
 *         description: Error del servidor
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { paciente_id, medico_id, fecha_cita, motivo, estado } = req.body;
    const connection = await db.getConnection();
    
    try {
      // Verificar que la cita exista
      const [existing] = await connection.query(
        'SELECT id FROM cita WHERE id = ?',
        [id]
      );
      
      if (!existing.length) {
        return res.status(404).send('Cita no encontrada');
      }

      // Verificar que existan paciente y médico si se están actualizando
      if (paciente_id) {
        const [paciente] = await connection.query(
          'SELECT p.id FROM paciente p JOIN usuario u ON p.usuario_id = u.id WHERE p.id = ? AND u.activo = 1',
          [paciente_id]
        );
        if (!paciente.length) {
          return res.status(400).json({ error: 'Paciente no existe o está inactivo' });
        }
      }

      if (medico_id) {
        const [medico] = await connection.query(
          'SELECT m.id FROM medico m JOIN usuario u ON m.usuario_id = u.id WHERE m.id = ? AND u.activo = 1',
          [medico_id]
        );
        if (!medico.length) {
          return res.status(400).json({ error: 'Médico no existe o está inactivo' });
        }
      }

      // Actualizar la cita
      await connection.query(
        `UPDATE cita 
         SET 
           paciente_id = COALESCE(?, paciente_id),
           medico_id = COALESCE(?, medico_id),
           fecha_cita = COALESCE(?, fecha_cita),
           motivo = COALESCE(?, motivo),
           estado = COALESCE(?, estado)
         WHERE id = ?`,
        [paciente_id, medico_id, fecha_cita, motivo, estado, id]
      );

      // Obtener la cita actualizada
      const [updatedAppointment] = await connection.query(
        `SELECT 
          c.id,
          c.paciente_id,
          c.medico_id,
          DATE_FORMAT(c.fecha_cita, '%Y-%m-%dT%H:%i:%s') as fecha_cita,
          c.motivo,
          c.estado,
          up.nombre as paciente_nombre,
          um.nombre as medico_nombre,
          m.especialidad
        FROM cita c
        JOIN paciente p ON c.paciente_id = p.id
        JOIN usuario up ON p.usuario_id = up.id
        JOIN medico m ON c.medico_id = m.id
        JOIN usuario um ON m.usuario_id = um.id
        WHERE c.id = ?`,
        [id]
      );

      res.json(updatedAppointment[0]);
      
    } finally {
      connection.release();
    }
    
  } catch (err) {
    console.error('Error en PUT /appointments/:id:', err);
    res.status(500).json({
      error: 'Error al actualizar cita',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

/**
 * @swagger
 * /api/appointments/{id}:
 *   delete:
 *     summary: Elimina una cita médica
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Cita eliminada
 *       404:
 *         description: Cita no encontrada
 *       500:
 *         description: Error del servidor
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await db.getConnection();
    
    try {
      const [result] = await connection.query(
        'DELETE FROM cita WHERE id = ?',
        [id]
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).send('Cita no encontrada');
      }
      
      res.status(204).send();
      
    } finally {
      connection.release();
    }
    
  } catch (err) {
    console.error('Error en DELETE /appointments/:id:', err);
    res.status(500).json({
      error: 'Error al eliminar cita',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router;