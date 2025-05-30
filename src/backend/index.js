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

require('dotenv').config();  // Carga las variables de entorno
const db = require('./db');




const app = express();
const PORT = 3001;



// // Conexión a MySQL
// const db = mysql.createConnection({
//   host: 'localhost',
//   user: 'root', 
//   password: '',
//   database: 'parcial_int',
// });



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

// Ruta para login (versión async/await)
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Faltan datos' });
  }

  try {
    const query = 'SELECT * FROM usuario WHERE nombre = ?';
    const [results] = await db.query(query, [username]);

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

  } catch (err) {
    console.error('Error en la consulta:', err);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Ruta para obtener usuarios (versión con async/await)
app.get('/api/users', async (req, res) => {
  try {
    const query = 'SELECT id, nombre, email, rol_id, activo FROM usuario';
    const [results] = await db.query(query); // Destructuración del array
    
    const users = results.map(user => ({
      ...user,
      activo: user.activo === 1 || user.activo === true
    }));

    res.json(users);
  } catch (err) {
    console.error('Error al obtener usuarios:', err.message);
    res.status(500).json({ 
      message: 'Error en el servidor', 
      error: err.message 
    });
  }
});

// Ruta para crear un nuevo usuario (async wait)
app.post('/api/users', async (req, res) => {
  try {
    const { nombre, email, contraseña, contrasena, rol_id, activo } = req.body;
    const password = contrasena || contraseña;

    // Validación de campos obligatorios
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

    // Validación de formato de email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email inválido'
      });
    }

    // Validación de longitud de contraseña
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    const isActive = activo !== false && activo !== 0 ? 1 : 0;
    const query = 'INSERT INTO usuario (nombre, email, contrasena, rol_id, activo) VALUES (?, ?, ?, ?, ?)';
    
    // Ejecutar la consulta con async/await
    const results = await new Promise((resolve, reject) => {
      db.query(query, [nombre, email, password, rol_id, isActive], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    // Respuesta exitosa
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

  } catch (err) {
    console.error('Error al crear usuario:', err);
    
    // Manejo de errores específicos
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }
    
    // Error genérico del servidor
    res.status(500).json({ 
      success: false,
      message: 'Error en el servidor',
      error: err.message,
      code: err.code
    });
  }
});

// Ruta para actualizar un usuario (async wait)
app.put('/api/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const { nombre, email, contraseña, contrasena, rol_id, activo } = req.body;
    const password = contrasena || contraseña;

    // Validación de campos obligatorios
    if (!nombre || !email || rol_id === undefined || activo === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Faltan campos obligatorios',
        details: {
          nombre: !nombre ? 'Campo requerido' : undefined,
          email: !email ? 'Campo requerido' : undefined,
          rol_id: rol_id === undefined ? 'Campo requerido' : undefined,
          activo: activo === undefined ? 'Campo requerido' : undefined
        }
      });
    }

    // Validación de formato de email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email inválido'
      });
    }

    // Validación de contraseña si se proporciona
    if (password && password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    const isActive = activo !== false && activo !== 0 ? 1 : 0;
    let query, params;

    if (password) {
      query = 'UPDATE usuario SET nombre = ?, email = ?, contrasena = ?, rol_id = ?, activo = ? WHERE id = ?';
      params = [nombre, email, password, rol_id, isActive, userId];
    } else {
      query = 'UPDATE usuario SET nombre = ?, email = ?, rol_id = ?, activo = ? WHERE id = ?';
      params = [nombre, email, rol_id, isActive, userId];
    }

    // Ejecutar la consulta con async/await
    const results = await new Promise((resolve, reject) => {
      db.query(query, params, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    // Verificar si se actualizó algún registro
    if (results.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Respuesta exitosa
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

  } catch (err) {
    console.error('Error al actualizar usuario:', err);
    
    // Manejo de errores específicos
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado por otro usuario'
      });
    }
    
    // Error genérico del servidor
    res.status(500).json({ 
      success: false,
      message: 'Error en el servidor',
      error: err.message,
      code: err.code
    });
  }
});

// Ruta para eliminar un usuario (async wait)
app.delete('/api/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    // Validar que el ID sea un número válido
    if (isNaN(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario inválido'
      });
    }

    const query = 'DELETE FROM usuario WHERE id = ?';
    
    // Ejecutar la consulta con async/await
    const results = await new Promise((resolve, reject) => {
      db.query(query, [userId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    // Verificar si se eliminó algún registro
    if (results.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Respuesta exitosa
    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente',
      userId: userId
    });

  } catch (err) {
    console.error('Error al eliminar usuario:', err);
    
    // Error genérico del servidor
    res.status(500).json({ 
      success: false,
      message: 'Error en el servidor',
      error: err.message,
      code: err.code
    });
  }
});

// Obtener todos los roles (async wait)
app.get('/api/roles', async (req, res) => {
  try {
    const query = 'SELECT id, nombre FROM rol';
    const [rows, fields] = await db.query(query); // rows contiene los resultados

    res.json({
      success: true,
      data: rows
    });
    
  } catch (err) {
    // mismo manejo de errores
  }
});

// Crear un nuevo rol (async wait)
app.post('/api/roles', async (req, res) => {
  try {
    const { nombre } = req.body;

    // Validación del campo nombre
    if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Nombre de rol inválido',
        details: {
          nombre: !nombre ? 'Campo requerido' : 'Debe ser una cadena de texto válida'
        }
      });
    }

    const trimmedNombre = nombre.trim();
    
    // Validación adicional de longitud si es necesaria
    if (trimmedNombre.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del rol debe tener al menos 3 caracteres'
      });
    }

    const query = 'INSERT INTO rol (nombre) VALUES (?)';
    
    // Ejecutar la consulta con async/await
    const results = await new Promise((resolve, reject) => {
      db.query(query, [trimmedNombre], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    // Construir respuesta exitosa
    const newRole = {
      id: results.insertId,
      nombre: trimmedNombre
    };

    res.status(201).json({
      success: true,
      message: 'Rol creado exitosamente',
      data: newRole
    });

  } catch (err) {
    console.error('Error al crear rol:', err);
    
    // Manejo de errores específicos
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'El nombre de rol ya existe'
      });
    }
    
    // Error genérico del servidor
    res.status(500).json({ 
      success: false,
      message: 'Error en el servidor',
      error: err.message,
      code: err.code
    });
  }
});

// Actualizar un rol (async wait)
app.put('/api/roles/:id', async (req, res) => {
  try {
    const roleId = req.params.id;
    const { nombre, descripcion } = req.body;

    // Validación del ID
    if (isNaN(roleId) || roleId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID de rol inválido'
      });
    }

    // Validación del campo nombre
    if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Nombre de rol inválido',
        details: {
          nombre: !nombre ? 'Campo requerido' : 'Debe ser una cadena de texto válida'
        }
      });
    }

    const trimmedNombre = nombre.trim();
    const trimmedDescripcion = descripcion ? descripcion.trim() : null;

    // Validación de longitud del nombre
    if (trimmedNombre.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del rol debe tener al menos 3 caracteres'
      });
    }

    const query = 'UPDATE rol SET nombre = ?, descripcion = ? WHERE id = ?';
    
    // Ejecutar la consulta con async/await
    const results = await new Promise((resolve, reject) => {
      db.query(query, [trimmedNombre, trimmedDescripcion, roleId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    // Verificar si se actualizó algún registro
    if (results.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Rol no encontrado'
      });
    }

    // Respuesta exitosa
    res.json({
      success: true,
      message: 'Rol actualizado exitosamente',
      data: {
        id: roleId,
        nombre: trimmedNombre,
        descripcion: trimmedDescripcion
      }
    });

  } catch (err) {
    console.error('Error al actualizar rol:', err);
    
    // Manejo de errores específicos
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'El nombre de rol ya existe'
      });
    }
    
    // Error genérico del servidor
    res.status(500).json({ 
      success: false,
      message: 'Error en el servidor',
      error: err.message,
      code: err.code
    });
  }
});

// Eliminar un rol (async wait)
app.delete('/api/roles/:id', async (req, res) => {
  try {
    const roleId = req.params.id;

    // Validación del ID
    if (isNaN(roleId) || roleId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID de rol inválido'
      });
    }

    // 1. Verificar si el rol está siendo usado por algún usuario
    const checkQuery = 'SELECT COUNT(*) as userCount FROM usuario WHERE rol_id = ?';
    const checkResults = await new Promise((resolve, reject) => {
      db.query(checkQuery, [roleId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    if (checkResults[0].userCount > 0) {
      return res.status(409).json({ // 409 Conflict es más apropiado para este caso
        success: false,
        message: 'No se puede eliminar el rol porque está asignado a usuarios',
        userCount: checkResults[0].userCount
      });
    }

    // 2. Si no está siendo usado, proceder a eliminar
    const deleteQuery = 'DELETE FROM rol WHERE id = ?';
    const deleteResults = await new Promise((resolve, reject) => {
      db.query(deleteQuery, [roleId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    if (deleteResults.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Rol no encontrado'
      });
    }

    // Respuesta exitosa
    res.json({
      success: true,
      message: 'Rol eliminado exitosamente',
      data: {
        roleId: roleId
      }
    });

  } catch (err) {
    console.error('Error en eliminación de rol:', err);
    
    // Manejo de errores específicos si es necesario
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({
        success: false,
        message: 'No se puede eliminar el rol porque está siendo referenciado',
        error: err.message
      });
    }
    
    // Error genérico del servidor
    res.status(500).json({ 
      success: false,
      message: 'Error en el servidor',
      error: err.message,
      code: err.code
    });
  }
});

// Obtener usuarios por rol (async wait)
router.get('/api/users', async (req, res) => {
  try {
    const { rol, pagina = 1, porPagina = 10, buscar } = req.query;
    
    // Validación de parámetros
    if (rol && isNaN(rol)) {
      return res.status(400).json({
        success: false,
        message: 'El parámetro rol debe ser un número'
      });
    }

    if (pagina && (isNaN(pagina) || pagina < 1)) {
      return res.status(400).json({
        success: false,
        message: 'El parámetro pagina debe ser un número mayor a 0'
      });
    }

    if (porPagina && (isNaN(porPagina) || porPagina < 1 || porPagina > 100)) {
      return res.status(400).json({
        success: false,
        message: 'El parámetro porPagina debe ser un número entre 1 y 100'
      });
    }

    // Construcción de la consulta base
    let query = `
      SELECT 
        u.id, 
        u.nombre, 
        u.email, 
        u.rol_id,
        r.nombre as rol_nombre,
        u.activo
      FROM usuario u
      LEFT JOIN rol r ON u.rol_id = r.id
    `;
    const params = [];
    const whereClauses = [];

    // Filtros
    if (rol) {
      whereClauses.push('u.rol_id = ?');
      params.push(parseInt(rol));
    }

    if (buscar) {
      whereClauses.push('(u.nombre LIKE ? OR u.email LIKE ?)');
      params.push(`%${buscar}%`, `%${buscar}%`);
    }

    if (whereClauses.length > 0) {
      query += ' WHERE ' + whereClauses.join(' AND ');
    }

    // Paginación
    const offset = (pagina - 1) * porPagina;
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(porPagina), offset);

    // Consulta para el total de registros (para paginación)
    let countQuery = 'SELECT COUNT(*) as total FROM usuario u';
    if (whereClauses.length > 0) {
      countQuery += ' WHERE ' + whereClauses.join(' AND ');
    }

    // Ejecutar consultas en paralelo
    const [users, [totalResult]] = await Promise.all([
      db.query(query, params),
      db.query(countQuery, params.slice(0, -2)) // Excluye LIMIT y OFFSET
    ]);

    const total = totalResult.total;
    const totalPaginas = Math.ceil(total / porPagina);

    res.json({
      success: true,
      data: users,
      paginacion: {
        pagina: parseInt(pagina),
        porPagina: parseInt(porPagina),
        total,
        totalPaginas
      }
    });

  } catch (err) {
    console.error('Error al obtener usuarios:', err);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los usuarios',
      error: err.message
    });
  }
});

// En tu backend (index.js), agrega rutas que combinen datos FHIR con tu DB local
app.get('/api/combined/patients', async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;

    // Validación de parámetros
    if (isNaN(page) || page < 1) {
      return res.status(400).json({
        success: false,
        message: 'El parámetro page debe ser un número mayor a 0'
      });
    }

    if (isNaN(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: 'El parámetro limit debe ser un número entre 1 y 100'
      });
    }

    // 1. Obtener pacientes locales con paginación
    let localQuery = `
      SELECT 
        p.*,
        r.nombre as rol_nombre
      FROM pacientes p
      LEFT JOIN roles r ON p.rol_id = r.id
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM pacientes';
    const queryParams = [];

    // Aplicar filtro de búsqueda si existe
    if (search) {
      const searchCondition = `
        WHERE (p.nombre LIKE ? OR p.apellido LIKE ? OR p.email LIKE ?)
      `;
      const searchParam = `%${search}%`;
      localQuery += searchCondition;
      countQuery += searchCondition;
      queryParams.push(searchParam, searchParam, searchParam);
    }

    // Agregar paginación a la consulta principal
    localQuery += ' LIMIT ? OFFSET ?';

    // 2. Ejecutar consultas en paralelo
    const [localPatients, [totalCount], fhirPatients] = await Promise.all([
      db.query(localQuery, [...queryParams, parseInt(limit), parseInt(offset)]),
      db.query(countQuery, queryParams),
      searchPatients() // Función FHIR existente
    ]);

    // 3. Combinar datos de manera eficiente
    const fhirPatientMap = new Map(fhirPatients.map(patient => [patient.id, patient]));
    
    const combinedPatients = localPatients.map(localPatient => {
      const fhirData = fhirPatientMap.get(localPatient.fhir_id) || {};
      return {
        ...localPatient,
        fhirData: {
          identifier: fhirData.identifier,
          birthDate: fhirData.birthDate,
          gender: fhirData.gender,
          // Otros campos relevantes de FHIR
        }
      };
    });

    // 4. Preparar respuesta
    res.json({
      success: true,
      data: combinedPatients,
      pagination: {
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit),
        totalItems: totalCount.total,
        totalPages: Math.ceil(totalCount.total / limit)
      },
      metadata: {
        localCount: localPatients.length,
        fhirCount: fhirPatients.length,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error al obtener pacientes combinados:', error);
    
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener los datos combinados de pacientes',
      error: error.message,
      code: error.code || 'INTERNAL_SERVER_ERROR'
    });
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