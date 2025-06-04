const jwt = require('jsonwebtoken');
const db = require('../db');

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nombre de usuario y contraseña son requeridos' 
      });
    }

    // Consulta modificada para usar el nombre correcto del campo (contrasena)
    const [users] = await db.query(
      `SELECT u.id, u.nombre, u.email, u.contrasena, r.nombre as rol 
       FROM usuario u
       JOIN rol r ON u.rol_id = r.id
       WHERE u.nombre = ? AND u.activo = 1`,
      [username]
    );

    if (!users || users.length === 0) {
      return res.status(401).json({ 
        success: false, 
        error: 'Usuario no encontrado' 
      });
    }

    const user = users[0];

    // Verificación de contraseña (usa el campo contrasena)
    if (password !== user.contrasena) {  // Cambiado a contrasena
      console.log('Contraseña proporcionada:', password);
      console.log('Contraseña en DB:', user.contrasena);
      return res.status(401).json({ 
        success: false, 
        error: 'Contraseña incorrecta' 
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.nombre,
        email: user.email,
        role: user.rol.toLowerCase()
      },
      process.env.JWT_SECRET || 'secret_key_development',
      { expiresIn: '12h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.nombre,
        email: user.email,
        role: user.rol
      }
    });

  } catch (error) {
    console.error('Error detallado:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error en el servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// En authController.js
exports.refreshToken = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, error: 'Token no proporcionado' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const newToken = jwt.sign(
      { ...decoded, iat: Math.floor(Date.now() / 1000) },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );
    res.json({ success: true, token: newToken });
  } catch (error) {
    res.status(401).json({ success: false, error: 'Token inválido' });
  }
};

exports.logout = async (req, res) => {
  // En un sistema real, aquí invalidarías el token
  res.json({ success: true, message: 'Sesión cerrada exitosamente' });
};