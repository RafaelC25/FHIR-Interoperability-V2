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

// Helper para convertir médico local a recurso FHIR Practitioner
const localDoctorToFhirPractitioner = (localDoctor) => {
  const nombreCompleto = localDoctor.usuario?.nombre || `Doctor ${localDoctor.id}`;
  const [givenName, ...familyNames] = nombreCompleto.split(' ');
  
  return {
    resourceType: 'Practitioner',
    id: localDoctor.fhir_id || uuidv4(),
    identifier: [{
      system: 'http://hospital.local/ids',
      value: localDoctor.id.toString()
    }],
    name: [{
      use: 'official',
      given: [givenName],
      family: familyNames.join(' ') || 'Unknown'
    }],
    telecom: [{
      system: 'email',
      value: localDoctor.usuario?.email || 'unknown@hospital.com'
    }],
    qualification: [{
      identifier: [{
        system: 'http://hospital.local/qualifications',
        value: 'MD'
      }],
      code: {
        coding: [{
          system: 'http://snomed.info/sct',
          code: '309343006', // Código SNOMED para Physician
          display: 'Physician'
        }],
        text: localDoctor.especialidad
      },
      period: {
        start: new Date().toISOString()
      }
    }]
  };
};

// Helper para sincronizar con FHIR
const syncDoctorToFHIR = async (localDoctor, method = 'PUT') => {
  try {
    const fhirPractitioner = localDoctorToFhirPractitioner(localDoctor);
    const url = `${FHIR_BASE_URL}/Practitioner/${fhirPractitioner.id}`;
    
    const response = await axios({
      method,
      url,
      headers: FHIR_HEADERS,
      data: fhirPractitioner
    });

    return response.data;
  } catch (error) {
    console.error('Error sincronizando con FHIR:', error.message);
    throw error;
  }
};

// GET /api/doctors - Obtener todos los médicos
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        m.id,
        m.especialidad,
        m.fhir_id,
        m.usuario_id,
        u.nombre,
        u.email
      FROM medico m
      INNER JOIN usuario u ON m.usuario_id = u.id
      WHERE u.rol_id = 2
    `;
    const [medicos] = await db.query(query);
    
    res.status(200).json({
      success: true,
      data: medicos.map(medico => ({
        id: medico.id,
        usuario_id: medico.usuario_id,
        especialidad: medico.especialidad,
        usuario: {
          id: medico.usuario_id,
          nombre: medico.nombre,
          email: medico.email
        }
      }))
    });
  } catch (error) {
    console.error('Error al obtener médicos:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener médicos',
      error: error.message 
    });
  }
});

// POST /api/doctors - Crear nuevo médico
router.post('/', async (req, res) => {
  const { usuario_id, especialidad } = req.body;
  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // 1. Verificar que el usuario existe y es médico
    const [usuario] = await connection.query(
      `SELECT id, nombre, email 
       FROM usuario 
       WHERE id = ? AND rol_id = 2`, 
      [usuario_id]
    );

    if (!usuario || usuario.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'El usuario no existe o no tiene rol médico'
      });
    }

    // 2. Insertar en la tabla medico
    const [result] = await connection.query(
      `INSERT INTO medico (usuario_id, especialidad) 
       VALUES (?, ?)`,
      [usuario_id, especialidad]
    );

    // 3. Obtener el médico recién creado con los datos del usuario
    const [medico] = await connection.query(
      `SELECT m.id, m.especialidad, m.usuario_id,
              u.nombre, u.email
       FROM medico m
       JOIN usuario u ON m.usuario_id = u.id
       WHERE m.id = ?`,
      [result.insertId]
    );

    // 4. Crear en FHIR (opcional)
    try {
      const fhirDoctor = {
        resourceType: 'Practitioner',
        identifier: [{
          system: 'http://hospital.local/ids',
          value: medico[0].id.toString()
        }],
        name: [{
          given: [medico[0].nombre.split(' ')[0]],
          family: medico[0].nombre.split(' ').slice(1).join(' ') || 'Unknown'
        }],
        telecom: [{
          system: 'email',
          value: medico[0].email
        }],
        qualification: [{
          code: {
            text: medico[0].especialidad
          }
        }]
      };

      const fhirResponse = await axios.post(
        `${FHIR_BASE_URL}/Practitioner`, 
        fhirDoctor,
        { headers: FHIR_HEADERS }
      );

      // Actualizar con fhir_id si es necesario
      await connection.query(
        'UPDATE medico SET fhir_id = ? WHERE id = ?',
        [fhirResponse.data.id, result.insertId]
      );
    } catch (fhirError) {
      console.error('Error con FHIR:', fhirError.message);
      // No hacemos rollback por error en FHIR
    }

    await connection.commit();

    // 5. Responder con los datos completos
    res.status(201).json({
      success: true,
      data: {
        id: medico[0].id,
        usuario_id: medico[0].usuario_id,
        especialidad: medico[0].especialidad,
        usuario: {
          id: medico[0].usuario_id,
          nombre: medico[0].nombre,
          email: medico[0].email
        }
      }
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error completo:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error al crear médico',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        sqlError: error.sqlMessage
      } : undefined
    });
  } finally {
    if (connection) connection.release();
  }
});

// PUT /api/doctors/:id - Actualizar médico
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { especialidad } = req.body;
  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // 1. Actualizar especialidad
    const [result] = await connection.query(
      `UPDATE medico SET especialidad = ? 
       WHERE id = ?`,
      [especialidad, id]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Médico no encontrado'
      });
    }

    // 2. Obtener datos actualizados
    const [medico] = await connection.query(
      `SELECT m.id, m.especialidad, m.usuario_id,
              u.nombre, u.email
       FROM medico m
       JOIN usuario u ON m.usuario_id = u.id
       WHERE m.id = ?`,
      [id]
    );

    // 3. Actualizar en FHIR (opcional)
    if (medico[0].fhir_id) {
      try {
        await axios.put(
          `${FHIR_BASE_URL}/Practitioner/${medico[0].fhir_id}`,
          {
            resourceType: 'Practitioner',
            id: medico[0].fhir_id,
            qualification: [{
              code: {
                text: especialidad
              }
            }]
          },
          { headers: FHIR_HEADERS }
        );
      } catch (fhirError) {
        console.error('Error actualizando en FHIR:', fhirError);
      }
    }

    await connection.commit();

    res.json({
      success: true,
      data: medico[0]
    });

  } catch (error) {
    if (connection) await connection.rollback();
    res.status(500).json({
      success: false,
      message: 'Error al actualizar médico',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// DELETE /api/doctors/:id - Eliminar médico
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // 1. Primero obtener el médico para tener el usuario_id
    const [medico] = await connection.query(
      'SELECT usuario_id, fhir_id FROM medico WHERE id = ?',
      [id]
    );

    if (medico.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Médico no encontrado'
      });
    }

    // 2. Eliminar el médico
    const [result] = await connection.query(
      'DELETE FROM medico WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'No se pudo eliminar el médico'
      });
    }

    // 3. Opcional: Eliminar de FHIR
    if (medico[0].fhir_id) {
      try {
        await axios.delete(
          `${FHIR_BASE_URL}/Practitioner/${medico[0].fhir_id}`,
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
      message: 'Médico eliminado correctamente',
      deletedUserId: medico[0].usuario_id // Importante para el frontend
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error en DELETE:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar médico',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

router.get('/options', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT m.id, u.nombre 
      FROM medico m
      JOIN usuario u ON m.usuario_id = u.id
      ORDER BY u.nombre
    `);
    
    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'No se encontraron médicos' });
    }
    
    res.json(rows);
  } catch (err) {
    console.error('Error en GET /doctors/options:', err);
    res.status(500).json({ 
      error: 'Error al cargar médicos',
      details: err.message
    });
  }
});

module.exports = router;