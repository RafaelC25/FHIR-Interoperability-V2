const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

// Ruta de ejemplo para administradores
router.get('/dashboard', authenticate('administrador'), (req, res) => {
  res.json({ 
    success: true,
    message: 'Panel de administración',
    user: req.user
  });
});

module.exports = router;