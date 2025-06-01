// D:\Things\Universidad\Ultimo semestre\Integracion\FHIR-Interoperability-V2\src\backend\routes\medications.js
const express = require('express');
const router = express.Router();
const db = require('../db'); // Asegúrate de que db.js está configurado para MySQL

/**
 * @swagger
 * tags:
 *   name: Medications
 *   description: API para manejar medicamentos
 */

/**
 * @swagger
 * /api/medications:
 *   get:
 *     summary: Obtiene todos los medicamentos
 *     tags: [Medications]
 *     responses:
 *       200:
 *         description: Lista de medicamentos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Medication'
 */
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM medicamento');
    // Mapear nombres de campos si es necesario (español → inglés)
    const medications = rows.map(row => ({
      id: row.id,
      name: row.nombre,
      description: row.descripcion
    }));
    res.json(medications);
  } catch (err) {
    console.error('Error al obtener medicamentos:', err);
    res.status(500).json({ 
      error: 'Error al obtener los medicamentos',
      details: err.message 
    });
  }
});

/**
 * @swagger
 * /api/medications:
 *   post:
 *     summary: Crea un nuevo medicamento
 *     tags: [Medications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Medication'
 *     responses:
 *       201:
 *         description: Medicamento creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Medication'
 */
router.post('/', async (req, res) => {
  const { name, description } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'El nombre es requerido' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO medicamento (nombre, descripcion) VALUES (?, ?)',
      [name, description || null]
    );
    
    // Obtener el medicamento recién creado
    const [rows] = await db.query(
      'SELECT * FROM medicamento WHERE id = ?',
      [result.insertId]
    );
    
    if (rows.length === 0) {
      return res.status(500).json({ error: 'No se pudo recuperar el medicamento creado' });
    }
    
    const newMedication = {
      id: rows[0].id,
      name: rows[0].nombre,
      description: rows[0].descripcion
    };
    
    res.status(201).json(newMedication);
  } catch (err) {
    console.error('Error al crear medicamento:', err);
    res.status(500).json({ 
      error: 'Error al crear el medicamento',
      details: err.message 
    });
  }
});

/**
 * @swagger
 * /api/medications/{id}:
 *   put:
 *     summary: Actualiza un medicamento existente
 *     tags: [Medications]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del medicamento
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Medication'
 *     responses:
 *       200:
 *         description: Medicamento actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Medication'
 */
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'El nombre es requerido' });
  }

  try {
    const [result] = await db.query(
      'UPDATE medicamento SET nombre = ?, descripcion = ? WHERE id = ?',
      [name, description || null, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Medicamento no encontrado' });
    }
    
    // Obtener el medicamento actualizado
    const [rows] = await db.query(
      'SELECT * FROM medicamento WHERE id = ?',
      [id]
    );
    
    const updatedMedication = {
      id: rows[0].id,
      name: rows[0].nombre,
      description: rows[0].descripcion
    };
    
    res.json(updatedMedication);
  } catch (err) {
    console.error('Error al actualizar medicamento:', err);
    res.status(500).json({ 
      error: 'Error al actualizar el medicamento',
      details: err.message 
    });
  }
});

/**
 * @swagger
 * /api/medications/{id}:
 *   delete:
 *     summary: Elimina un medicamento
 *     tags: [Medications]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del medicamento
 *     responses:
 *       204:
 *         description: Medicamento eliminado exitosamente
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query(
      'DELETE FROM medicamento WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Medicamento no encontrado' });
    }
    
    res.status(204).end();
  } catch (err) {
    console.error('Error al eliminar medicamento:', err);
    res.status(500).json({ 
      error: 'Error al eliminar el medicamento',
      details: err.message 
    });
  }
});

router.get('/options', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, nombre, descripcion FROM medicamento ORDER BY nombre');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener medicamentos' });
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Medication:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         id:
 *           type: integer
 *           format: int64
 *           description: ID auto-generado del medicamento
 *         name:
 *           type: string
 *           description: Nombre del medicamento
 *         description:
 *           type: string
 *           description: Descripción del medicamento
 *       example:
 *         id: 1
 *         name: Paracetamol
 *         description: Analgésico y antipirético
 */
module.exports = router;