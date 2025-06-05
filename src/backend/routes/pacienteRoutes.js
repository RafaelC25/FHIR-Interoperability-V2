// pacienteRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');

router.get('/by-user/:userId', authenticate('paciente'), async (req, res) => {
  let connection;
  try {
    connection = await db.getConnection();
    
    // Consulta mejorada para obtener datos completos
    const [paciente] = await connection.query(
      `SELECT 
        p.id,
        p.usuario_id,
        p.numero_identificacion,
        p.fecha_nacimiento,
        p.genero,
        p.telefono,
        p.direccion,
        u.nombre as nombre_paciente
      FROM paciente p
      JOIN usuario u ON p.usuario_id = u.id
      WHERE p.usuario_id = ?`,
      [req.params.userId]
    );

    console.log('Resultado de la consulta:', paciente); // Log para depuración

    if (!paciente.length) {
      return res.status(404).json({
        success: false,
        error: 'No se encontró perfil de paciente'
      });
    }

    res.json({
      success: true,
      id: paciente[0].id,
      data: {
        nombre: paciente[0].nombre_paciente,
        identificacion: paciente[0].numero_identificacion,
        fecha_nacimiento: paciente[0].fecha_nacimiento,
        genero: paciente[0].genero,
        telefono: paciente[0].telefono,
        direccion: paciente[0].direccion
      }
    });

  } catch (error) {
    console.error('Error en /by-user:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;