const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');

// Ruta de login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Intento de login para:', username); // Log para diagnóstico

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nombre de usuario y contraseña son requeridos' 
      });
    }

    // Consulta con más detalles para diagnóstico
    const [users] = await db.query(
      `SELECT 
        u.id, 
        u.nombre as username, 
        u.email, 
        u.contrasena as password,
        u.activo,
        r.id as role_id,
        r.nombre as role_name
       FROM usuario u
       JOIN rol r ON u.rol_id = r.id
       WHERE u.nombre = ?`,
      [username]
    );

    console.log('Resultado de BD:', users); // Log para ver qué devuelve la consulta

    if (!users || users.length === 0) {
      console.log('Usuario no encontrado');
      return res.status(401).json({ 
        success: false, 
        error: 'Credenciales inválidas' 
      });
    }

    const user = users[0];
    
    // Verificar si el usuario está activo
    if (!user.activo) {
      console.log('Usuario inactivo');
      return res.status(401).json({ 
        success: false, 
        error: 'Cuenta desactivada' 
      });
    }

    // Comparación de contraseña (sensible a mayúsculas)
    if (password !== user.password) {
      console.log('Contraseña no coincide');
      console.log('Ingresada:', password);
      console.log('En BD:', user.password);
      return res.status(401).json({ 
        success: false, 
        error: 'Credenciales inválidas' 
      });
    }

    console.log('Rol encontrado:', user.role_name); // Verificar el rol

    // Mapeo de roles
    const roleMapping = {
      'Administrador': 'admin',
      'Médico': 'physician',
      'Paciente': 'patient'
    };

    const normalizedRole = roleMapping[user.role_name];
    
    if (!normalizedRole) {
      console.log('Rol no reconocido:', user.role_name);
      return res.status(403).json({
        success: false,
        error: 'Rol de usuario no válido'
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: normalizedRole
      },
      process.env.JWT_SECRET || 'secret_key_development',
      { expiresIn: '1h' }
    );

    console.log('Login exitoso para:', user.username);
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.username,
        email: user.email,
        role: user.role_name // Enviamos el nombre original del rol
      }
    });

  } catch (error) {
    console.error('Error completo en login:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error en el servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Ruta de prueba
router.get('/status', (req, res) => {
  res.json({ 
    success: true,
    status: 'El servicio de autenticación está activo',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;