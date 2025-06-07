require('dotenv').config(); // Añade esto al inicio del archivo
const jwt = require('jsonwebtoken');
const db = require('../db');

const authenticate = (requiredRole) => {
  return async (req, res, next) => {
    let connection;
    try {
      // Verificar que exista JWT_SECRET
      if (!process.env.JWT_SECRET) {
        throw new Error('Configuración JWT no encontrada');
      }

      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ success: false, error: 'Token no proporcionado' });
      }

      // Verificar token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Normalizar rol (según tu estructura de base de datos)
      let userRole = decoded.role.toLowerCase();
      if (userRole === 'patient') userRole = 'paciente';
      if (userRole === 'physician') userRole = 'médico';
      if (userRole === 'admin') userRole = 'administrador';
      
      // Obtener conexión a la base de datos
      connection = await db.getConnection();

      // Verificar si el usuario aún existe y está activo
      const [user] = await connection.query(
        'SELECT id, activo FROM usuario WHERE id = ?',
        [decoded.id]
      );

      if (!user.length || !user[0].activo) {
        throw new Error('Usuario no encontrado o inactivo');
      }

      // Verificar relación usuario-paciente para rutas de paciente
      if (req.path.includes('/patient/') || userRole === 'paciente') {
        const [paciente] = await connection.query(
          'SELECT id, usuario_id FROM paciente WHERE usuario_id = ?',
          [decoded.id]
        );

        // Si es paciente, asignar el ID de paciente al request
        if (paciente.length) {
          req.pacienteId = paciente[0].id;
        }

        // Si la ruta es específica de un paciente, verificar permiso
        if (req.params.pacienteId || req.params.id) {
          const requestedId = req.params.pacienteId || req.params.id;
          if (paciente.length && paciente[0].id.toString() !== requestedId.toString()) {
            throw new Error('No tienes permiso para acceder a estos datos');
          }
        }
      }

      // Verificar rol si es necesario
      if (requiredRole && userRole !== requiredRole.toLowerCase()) {
        throw new Error('Acceso denegado. Rol incorrecto.');
      }

      // Añadir información al request
      req.user = {
        id: decoded.id,
        username: decoded.username,
        role: userRole,
        pacienteId: req.pacienteId // Solo estará presente si es paciente
      };

      next();
    } catch (error) {
      console.error('Error de autenticación:', error.message);
      
      let status = 401;
      let message = error.message;
      
      if (error.message.includes('No tienes permiso') || error.message.includes('Rol incorrecto')) {
        status = 403;
      } else if (error.message.includes('jwt')) {
        message = 'Token inválido o expirado';
      }
      
      res.status(status).json({ 
        success: false, 
        error: message 
      });
    } finally {
      if (connection) connection.release();
    }
  };
};

module.exports = { authenticate };