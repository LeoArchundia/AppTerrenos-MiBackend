const express = require('express');
const router = express.Router();
const reservaController = require('../controllers/reservaController'); // <-- Objeto completo del controlador
const { verifyToken } = require('../middleware/authMiddleware');
// const { apartarTerreno, confirmarVenta } = require('../controllers/reservaController'); <-- ELIMINAR ESTA LÍNEA

// 1. Ruta para apartar (POST)
// ASUMIENDO que la función se llama 'crearApartado' en el controlador
router.post('/apartar', verifyToken, reservaController.crearApartado);

// 2. Ruta para confirmar venta (POST)
// ASUMIENDO que la función se llama 'confirmarVenta' en el controlador
router.post('/ventas/confirmar', verifyToken, reservaController.confirmarVenta); 
 
// 3. Ruta para historial (GET)
// ASUMIENDO que la función se llama 'getMisApartados' en el controlador
router.get('/mis-apartados', verifyToken, reservaController.getMisApartados);


module.exports = router;