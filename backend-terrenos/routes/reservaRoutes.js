const express = require('express');
const router = express.Router();
const reservaController = require('../controllers/reservaController');
const { verifyToken } = require('../middleware/authMiddleware');

// 1. Ruta para apartar (POST)
// Llama a la función crearApartado del controlador
router.post('/apartar', verifyToken, reservaController.crearApartado);

// 2. Ruta para historial (GET)
// Llama a la función getMisApartados del controlador (que ya creamos)
router.get('/mis-apartados', verifyToken, reservaController.getMisApartados);

module.exports = router;