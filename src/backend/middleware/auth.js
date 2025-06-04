const jwt = require('jsonwebtoken');

const authenticate = (requiredRole) => {
  return (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ success: false, error: 'Token no proporcionado' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;

      // Normalizar comparación de roles (case insensitive)
      if (requiredRole) {
        const userRole = decoded.role.toLowerCase();
        const requiredRoleLower = requiredRole.toLowerCase();
        
        if (userRole !== requiredRoleLower) {
          return res.status(403).json({ 
            success: false, 
            error: 'No tienes permisos para esta acción' 
          });
        }
      }

      next();
    } catch (error) {
      console.error('Error de token:', error);
      return res.status(401).json({ 
        success: false, 
        error: 'Token inválido o expirado' 
      });
    }
  };
};

module.exports = { authenticate };