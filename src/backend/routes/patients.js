const express = require('express');
const router = express.Router();
const db = require('../db');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Configuración FHIR
const FHIR_BASE_URL = 'https://hapi.fhir.org/baseR4';
const FHIR_HEADERS = {
  'Content-Type': 'application/json'
};

// Helper para convertir paciente local a recurso FHIR Patient
const localPatientToFhirPatient = (localPatient) => {
  const nombreCompleto = localPatient.usuario?.nombre || `Paciente ${localPatient.id}`;
  const [givenName, ...familyNames] = nombreCompleto.split(' ');
  
  // Mapear género a valores FHIR estándar
  const fhirGenderMap = {
    'male': 'male',
    'Masculino': 'male',
    'female': 'female',
    'Femenino': 'female',
    'other': 'other',
    'Otro': 'other',
    'unknown': 'unknown',
    'Desconocido': 'unknown'
  };
  
  const fhirGender = fhirGenderMap[localPatient.genero] || 'unknown';

  return {
    resourceType: 'Patient',
    id: localPatient.fhir_id || uuidv4(),
    identifier: [{
      system: 'http://hospital.local/ids',
      value: localPatient.numero_identificacion
    }],
    name: [{
      use: 'official',
      given: [givenName],
      family: familyNames.join(' ') || 'Unknown'
    }],
    telecom: [{
      system: 'phone',
      value: localPatient.telefono
    }, {
      system: 'email',
      value: localPatient.usuario?.email || 'unknown@hospital.com'
    }],
    gender: fhirGender,
    birthDate: localPatient.fecha_nacimiento,
    address: [{
      text: localPatient.direccion
    }]
  };
};

// GET /api/patients - Obtener todos los pacientes
router.get('/', async (req, res) => {
  try {
    const { include } = req.query;
    const query = `
      SELECT 
        p.id,
        p.numero_identificacion,
        p.fecha_nacimiento,
        p.telefono,
        p.direccion,
        p.genero,
        p.usuario_id,
        u.nombre,
        u.email
      FROM paciente p
      INNER JOIN usuario u ON p.usuario_id = u.id
      WHERE u.rol_id = 3
    `;
    const [pacientes] = await db.query(query);
    
    const responseData = pacientes.map(paciente => ({
      id: paciente.id,
      usuario_id: paciente.usuario_id,
      numero_identificacion: paciente.numero_identificacion,
      fecha_nacimiento: formatDate(paciente.fecha_nacimiento),
      telefono: paciente.telefono,
      direccion: paciente.direccion,
      genero: paciente.genero, // Mantenemos el valor original de la base de datos
      usuario: {
        id: paciente.usuario_id,
        nombre: paciente.nombre,
        email: paciente.email
      }
    }));

    res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Error al obtener pacientes:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener pacientes',
      error: error.message 
    });
  }
});

// POST /api/patients - Crear nuevo paciente
router.post('/', async (req, res) => {
  const { 
    usuario_id, 
    numero_identificacion, 
    fecha_nacimiento, 
    telefono, 
    direccion, 
    genero 
  } = req.body;
  
  // Validar que el género esté en los valores permitidos
  const allowedGenders = ['male', 'female', 'other', 'unknown', 'Masculino', 'Femenino', 'Otro', 'Desconocido'];
  if (genero && !allowedGenders.includes(genero)) {
    return res.status(400).json({
      success: false,
      message: 'Género no válido. Valores permitidos: male, female, other, unknown o sus equivalentes en español'
    });
  }

  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // 1. Verificar que el usuario existe y es paciente (rol_id = 3)
    const [usuario] = await connection.query(
      `SELECT id, nombre, email 
       FROM usuario 
       WHERE id = ? AND rol_id = 3`, 
      [usuario_id]
    );

    if (!usuario || usuario.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'El usuario no existe o no tiene rol de paciente'
      });
    }

    // 2. Insertar en la tabla paciente
    const [result] = await connection.query(
      `INSERT INTO paciente (
        usuario_id, 
        numero_identificacion, 
        fecha_nacimiento, 
        telefono, 
        direccion, 
        genero
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        usuario_id, 
        numero_identificacion, 
        fecha_nacimiento, 
        telefono, 
        direccion, 
        genero // Guardamos el valor directamente
      ]
    );

    // 3. Obtener el paciente recién creado con los datos del usuario
    const [paciente] = await connection.query(
      `SELECT p.*, u.nombre, u.email
       FROM paciente p
       JOIN usuario u ON p.usuario_id = u.id
       WHERE p.id = ?`,
      [result.insertId]
    );

    // 4. Crear en FHIR (en segundo plano, no afecta la respuesta)
    try {
      const fhirResponse = await axios.post(
        `${FHIR_BASE_URL}/Patient`, 
        localPatientToFhirPatient(paciente[0]),
        { headers: FHIR_HEADERS }
      );

      // Actualizar con fhir_id (en segundo plano)
      connection.query(
        'UPDATE paciente SET fhir_id = ? WHERE id = ?',
        [fhirResponse.data.id, result.insertId]
      ).catch(fhirUpdateError => {
        console.error('Error actualizando FHIR ID:', fhirUpdateError);
      });
    } catch (fhirError) {
      console.error('Error con FHIR:', fhirError.message);
    }

    await connection.commit();

    // 5. Formatear respuesta
    const pacienteFormateado = {
      id: paciente[0].id,
      usuario_id: paciente[0].usuario_id,
      numero_identificacion: paciente[0].numero_identificacion,
      fecha_nacimiento: formatDate(paciente[0].fecha_nacimiento),
      telefono: paciente[0].telefono,
      direccion: paciente[0].direccion,
      genero: paciente[0].genero, // Mantenemos el valor original
      usuario: {
        id: paciente[0].usuario_id,
        nombre: paciente[0].nombre,
        email: paciente[0].email
      }
    };

    res.status(201).json({
      success: true,
      data: pacienteFormateado
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error completo:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error al crear paciente',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// PUT /api/patients/:id - Actualizar paciente
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { 
    numero_identificacion, 
    fecha_nacimiento, 
    telefono, 
    direccion, 
    genero 
  } = req.body;
  
  // Validar que el género esté en los valores permitidos
  if (genero) {
    const allowedGenders = ['male', 'female', 'other', 'unknown', 'Masculino', 'Femenino', 'Otro', 'Desconocido'];
    if (!allowedGenders.includes(genero)) {
      return res.status(400).json({
        success: false,
        message: 'Género no válido. Valores permitidos: male, female, other, unknown o sus equivalentes en español'
      });
    }
  }

  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // 1. Actualizar datos del paciente
    const [result] = await connection.query(
      `UPDATE paciente SET 
        numero_identificacion = COALESCE(?, numero_identificacion),
        fecha_nacimiento = COALESCE(?, fecha_nacimiento),
        telefono = COALESCE(?, telefono),
        direccion = COALESCE(?, direccion),
        genero = COALESCE(?, genero)
       WHERE id = ?`,
      [
        numero_identificacion, 
        fecha_nacimiento, 
        telefono, 
        direccion, 
        genero, // Guardamos el valor directamente
        id
      ]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    // 2. Obtener datos actualizados
    const [paciente] = await connection.query(
      `SELECT p.*, u.nombre, u.email
       FROM paciente p
       JOIN usuario u ON p.usuario_id = u.id
       WHERE p.id = ?`,
      [id]
    );

    // 3. Actualizar en FHIR (opcional)
    if (paciente[0].fhir_id) {
      try {
        await axios.put(
          `${FHIR_BASE_URL}/Patient/${paciente[0].fhir_id}`,
          localPatientToFhirPatient(paciente[0]),
          { headers: FHIR_HEADERS }
        );
      } catch (fhirError) {
        console.error('Error actualizando en FHIR:', fhirError);
      }
    }

    await connection.commit();

    res.json({
      success: true,
      data: {
        id: paciente[0].id,
        usuario_id: paciente[0].usuario_id,
        numero_identificacion: paciente[0].numero_identificacion,
        fecha_nacimiento: formatDate(paciente[0].fecha_nacimiento),
        telefono: paciente[0].telefono,
        direccion: paciente[0].direccion,
        genero: paciente[0].genero, // Mantenemos el valor original
        fhir_id: paciente[0].fhir_id,
        usuario: {
          id: paciente[0].usuario_id,
          nombre: paciente[0].nombre,
          email: paciente[0].email
        }
      }
    });

  } catch (error) {
    if (connection) await connection.rollback();
    res.status(500).json({
      success: false,
      message: 'Error al actualizar paciente',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// DELETE /api/patients/:id - Eliminar paciente
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // 1. Primero obtener el paciente para tener el usuario_id y fhir_id
    const [paciente] = await connection.query(
      'SELECT usuario_id, fhir_id, genero FROM paciente WHERE id = ?',
      [id]
    );

    if (paciente.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    // 2. Eliminar el paciente
    const [result] = await connection.query(
      'DELETE FROM paciente WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'No se pudo eliminar el paciente'
      });
    }

    // 3. Opcional: Eliminar de FHIR
    if (paciente[0].fhir_id) {
      try {
        await axios.delete(
          `${FHIR_BASE_URL}/Patient/${paciente[0].fhir_id}`,
          { headers: FHIR_HEADERS }
        );
      } catch (fhirError) {
        console.error('Error eliminando de FHIR:', fhirError.message);
        // No hacemos rollback por error en FHIR
      }
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Paciente eliminado correctamente',
      data: {
        deletedId: id,
        usuario_id: paciente[0].usuario_id,
        genero: paciente[0].genero, // Incluimos el género en la respuesta
        fhir_id: paciente[0].fhir_id
      }
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error en DELETE:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar paciente',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// Funciones auxiliares
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0]; // Formato YYYY-MM-DD
}

module.exports = router;