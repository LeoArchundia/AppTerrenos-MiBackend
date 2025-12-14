const express = require('express');
const router = express.Router();
// Importamos el controlador con la nueva lógica profesional
const controller = require('../controllers/landController');

// --- RUTAS PÚBLICAS ---
router.get('/', controller.obtenerTerrenos); // Para el mapa del cliente

// --- RUTAS PRIVADAS (Admin / Cliente Logueado) ---
router.post('/apartar', controller.apartarTerreno);      // Para apartar
router.get('/dashboard-stats', controller.obtenerDashboard); // Para las gráficas
router.post('/create', controller.crearTerreno);         // Para crear terrenos (Admin)

module.exports = router;