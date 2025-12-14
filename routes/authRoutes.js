const express = require('express');
const router = express.Router();
// Importamos el controlador de seguridad que hicimos antes
const authController = require('../controllers/authController');

// Ruta para registrarse
// POST http://localhost:3000/api/auth/register
router.post('/register', authController.registrarUsuario);

// Ruta para iniciar sesión
// POST http://localhost:3000/api/auth/login
router.post('/login', authController.loginUsuario);

module.exports = router;