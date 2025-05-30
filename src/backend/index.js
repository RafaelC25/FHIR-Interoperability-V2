const express = require('express');
const cors = require('cors');
const router = express.Router();
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const doctorsRouter = require('./routes/doctors');
const patientsRouter = require('./routes/patients');
const appointmentsRouter = require('./routes/appointments');
const conditionsRouter = require('./routes/conditions');
const patientConditionsRoutes = require('./routes/patientConditions');



const app = express();
const PORT = 3001;



// Conexión a MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root', 
  password: '',
  database: 'parcial_int',
});



// Importar rutas
//const usersRouter = require('./routes/users'); 
//const doctorsRouter = require('./routes/doctors'); 

// Middlewares
app.use(cors({
  origin: 'http://localhost:5173', // Ajusta según tu puerto frontend
  credentials: true
}));
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api/doctors', doctorsRouter);
app.use('/api/patients', patientsRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/conditions', conditionsRouter);
app.use('/api', patientConditionsRoutes);

// Middleware
app.use(express.json());


// =============================================
// MIDDLEWARE DE AUTENTICACIÓN
// =============================================
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ error: 'Token no proporcionado' });

  
  try {
    const user = { id: 1, role: 'admin' }; // Mock user
    req.user = user;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Token inválido' });
  }
};

// Ruta de prueba básica
app.get('/', (req, res) => {
  res.send('API funcionando');
});

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
// Obtener todos los roles
app.get('/api/roles', (req, res) => {
  const query = 'SELECT id, nombre FROM rol'; // Eliminamos descripcion de la consulta
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener roles:', err.message);
      return res.status(500).json({ 
        success: false,
        message: 'Error en el servidor', 
        error: err.message 
      });
    }

    res.json({
      success: true,
      data: results
    });
  });
});

// Crear un nuevo rol
app.post('/api/roles', (req, res) => {
  const { nombre } = req.body;

  if (!nombre) {
    return res.status(400).json({ 
      success: false, 
      message: 'El nombre es requerido',
      details: {
        nombre: !nombre ? 'Campo requerido' : undefined
      }
    });
  }

  const query = 'INSERT INTO rol (nombre) VALUES (?)';
  
  db.query(query, [nombre], (err, results) => {
    if (err) {
      console.error('Error al crear rol:', err);
      
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          success: false,
          message: 'El nombre de rol ya existe'
        });
      }
      
      return res.status(500).json({ 
        success: false,
        message: 'Error en el servidor',
        error: err.message
      });
    }

    // Devuelve el nuevo rol creado con su ID
    const newRole = {
      id: results.insertId,
      nombre: nombre
    };

    res.status(201).json({
      success: true,
      message: 'Rol creado exitosamente',
      data: newRole
    });
  });
});

// Actualizar un rol
app.put('/api/roles/:id', (req, res) => {
  const roleId = req.params.id;
  const { nombre, descripcion } = req.body;

  if (!nombre) {
    return res.status(400).json({ 
      success: false, 
      message: 'El nombre es requerido',
      details: {
        nombre: !nombre ? 'Campo requerido' : undefined
      }
    });
  }

  const query = 'UPDATE rol SET nombre = ?, descripcion = ? WHERE id = ?';
  
  db.query(query, [nombre, descripcion || null, roleId], (err, results) => {
    if (err) {
      console.error('Error al actualizar rol:', err);
      
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          success: false,
          message: 'El nombre de rol ya existe'
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
        message: 'Rol no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Rol actualizado exitosamente',
      role: {
        id: roleId,
        nombre,
        descripcion: descripcion || null
      }
    });
  });
});

// Eliminar un rol
app.delete('/api/roles/:id', (req, res) => {
  const roleId = req.params.id;

  // Primero verificamos si el rol está siendo usado por algún usuario
  const checkQuery = 'SELECT COUNT(*) as count FROM usuario WHERE rol_id = ?';
  
  db.query(checkQuery, [roleId], (err, results) => {
    if (err) {
      console.error('Error al verificar uso del rol:', err);
      return res.status(500).json({ 
        success: false,
        message: 'Error en el servidor',
        error: err.message
      });
    }

    if (results[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar el rol porque está asignado a usuarios'
      });
    }

    // Si no está siendo usado, procedemos a eliminar
    const deleteQuery = 'DELETE FROM rol WHERE id = ?';
    
    db.query(deleteQuery, [roleId], (err, results) => {
      if (err) {
        console.error('Error al eliminar rol:', err);
        return res.status(500).json({ 
          success: false,
          message: 'Error en el servidor',
          error: err.message
        });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Rol no encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Rol eliminado exitosamente',
        roleId: roleId
      });
    });
  });
});

// Obtener usuarios por rol
router.get('/api/users', async (req, res) => {
  const { rol } = req.query;
  let query = 'SELECT id, nombre, email, rol_id FROM usuario';
  const params = [];
  
  if (rol) {
    query += ' WHERE rol_id = ?';
    params.push(rol);
  }

  const [users] = await db.query(query, params);
  res.json(users);
});

// En tu backend (index.js), agrega rutas que combinen datos FHIR con tu DB local
app.get('/api/combined/patients', async (req, res) => {
  try {
    // Datos locales
    const localPatients = await db.query('SELECT * FROM pacientes');
    
    // Datos FHIR
    const fhirPatients = await searchPatients(); // Usa tu función existente
    
    // Combinar datos
    const combined = localPatients.map(local => {
      const fhirMatch = fhirPatients.find(f => f.id === local.fhir_id);
      return { ...local, ...fhirMatch };
    });
    
    res.json(combined);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Algo salió mal!');
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});