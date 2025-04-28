const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3001;

// Conexión a MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root', 
  password: '',
  database: 'parcial_int',
});

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Ruta para login
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Faltan datos' });
  }

  const query = 'SELECT * FROM usuario WHERE nombre = ?';
  db.query(query, [username], (err, results) => {
    if (err) {
      console.error('Error en la consulta:', err);
      return res.status(500).json({ message: 'Error en el servidor' });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    const user = results[0];

    if (user.contrasena !== password) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    let role;
    switch (user.rol_id) {
      case 1:
        role = 'admin';
        break;
      case 2:
        role = 'physician';
        break;
      case 3:
        role = 'patient';
        break;
      default:
        role = 'patient';
    }

    return res.json({
      id: user.id,
      username: user.nombre,
      role: role,
    });
  });
});

// Ruta para obtener usuarios
app.get('/api/users', (req, res) => {
  const query = 'SELECT id, nombre, email, rol_id, activo FROM usuario';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener usuarios:', err.message);
      return res.status(500).json({ message: 'Error en el servidor', error: err.message });
    }

    const users = results.map(user => ({
      ...user,
      activo: user.activo === 1 || user.activo === true
    }));

    res.json(users);
  });
});

// Ruta para crear un nuevo usuario
app.post('/api/users', (req, res) => {
  const { nombre, email, contraseña, contrasena, rol_id, activo } = req.body;
  const password = contrasena || contraseña;

  if (!nombre || !email || !password || rol_id === undefined) {
    return res.status(400).json({ 
      success: false, 
      message: 'Faltan campos obligatorios',
      details: {
        nombre: !nombre ? 'Campo requerido' : undefined,
        email: !email ? 'Campo requerido' : undefined,
        password: !password ? 'Campo requerido' : undefined,
        rol_id: rol_id === undefined ? 'Campo requerido' : undefined
      }
    });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Email inválido'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'La contraseña debe tener al menos 6 caracteres'
    });
  }

  const isActive = activo !== false && activo !== 0 ? 1 : 0;

  const query = 'INSERT INTO usuario (nombre, email, contrasena, rol_id, activo) VALUES (?, ?, ?, ?, ?)';
  
  db.query(query, [nombre, email, password, rol_id, isActive], (err, results) => {
    if (err) {
      console.error('Error al crear usuario:', err);
      
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          success: false,
          message: 'El email ya está registrado'
        });
      }
      
      return res.status(500).json({ 
        success: false,
        message: 'Error en el servidor',
        error: err.message,
        code: err.code
      });
    }

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      userId: results.insertId,
      user: {
        id: results.insertId,
        nombre,
        email,
        rol_id,
        activo: isActive === 1
      }
    });
  });
});

// Ruta para actualizar un usuario
app.put('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  const { nombre, email, contraseña, contrasena, rol_id, activo } = req.body;
  const password = contrasena || contraseña; // Usamos cualquiera que venga

  if (!nombre || !email || rol_id === undefined || activo === undefined) {
    return res.status(400).json({ 
      success: false, 
      message: 'Faltan campos obligatorios' 
    });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Email inválido'
    });
  }

  const isActive = activo !== false && activo !== 0 ? 1 : 0;

  let query;
  let params;
  
  if (password) {
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }
    
    query = 'UPDATE usuario SET nombre = ?, email = ?, contrasena = ?, rol_id = ?, activo = ? WHERE id = ?';
    params = [nombre, email, password, rol_id, isActive, userId];
  } else {
    query = 'UPDATE usuario SET nombre = ?, email = ?, rol_id = ?, activo = ? WHERE id = ?';
    params = [nombre, email, rol_id, isActive, userId];
  }

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Error al actualizar usuario:', err);
      
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          success: false,
          message: 'El email ya está registrado por otro usuario'
        });
      }
      
      return res.status(500).json({ 
        success: false,
        message: 'Error en el servidor',
        error: err.message
      });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      user: {
        id: userId,
        nombre,
        email,
        rol_id,
        activo: isActive === 1
      }
    });
  });
});

// Ruta para eliminar un usuario
app.delete('/api/users/:id', (req, res) => {
  const userId = req.params.id;

  const query = 'DELETE FROM usuario WHERE id = ?';
  
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error al eliminar usuario:', err);
      return res.status(500).json({ 
        success: false,
        message: 'Error en el servidor',
        error: err.message
      });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente',
      userId: userId
    });
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});