const jwt = require('jsonwebtoken');
const db = require('../db');

const authenticate = (requiredRole) => {
  return async (req, res, next) => {
    let connection;
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ success: false, error: 'Token no proporcionado' });
      }

      // Verificar token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Normalizar rol
      decoded.role = decoded.role.toLowerCase() === 'patient' ? 'paciente' : decoded.role.toLowerCase();
      
      // Obtener conexión a la base de datos
      connection = await db.getConnection();

      // Verificar relación usuario-paciente para rutas de paciente
      if (req.path.includes('/patient/')) {
        const [paciente] = await connection.query(
          'SELECT usuario_id FROM paciente WHERE id = ?',
          [req.params.pacienteId || req.params.id]
        );

        if (!paciente.length || paciente[0].usuario_id !== decoded.id) {
          throw new Error('No tienes permiso para acceder a estos datos');
        }
      }

      // Verificar rol si es necesario
      if (requiredRole && decoded.role !== requiredRole.toLowerCase()) {
        throw new Error('Rol incorrecto');
      }

      req.user = decoded;
      next();
    } catch (error) {
      console.error('Error de autenticación:', error.message);
      const status = error.message.includes('No tienes permiso') ? 403 : 401;
      res.status(status).json({ 
        success: false, 
        error: error.message.includes('jwt') ? 'Token inválido' : error.message 
      });
    } finally {
      if (connection) connection.release();
    }
  };
};

module.exports = { authenticate };