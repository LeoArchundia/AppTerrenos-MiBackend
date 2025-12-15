const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// --- DASHBOARD ---
router.get('/dashboard-stats', verifyToken, requireRole('admin'), adminController.getStats);
router.get('/reservas-pendientes', verifyToken, requireRole('admin'), adminController.getPendingReservations);
router.post('/confirmar-venta', verifyToken, requireRole('admin'), adminController.confirmarVenta);

// --- CRUD DE TERRENOS (Aquí era donde te daba error) ---
router.get('/lands', verifyToken, requireRole('admin'), adminController.getAllLandsAdmin);
router.post('/lands', verifyToken, requireRole('admin'), adminController.createLand);
router.put('/lands/:landId', verifyToken, requireRole('admin'), adminController.updateLand);

// --- REPORTES ---
router.get('/all-reservations', verifyToken, requireRole('admin'), adminController.getAllReservations);

// ...
// Nueva ruta para el requisito del Dashboard
router.get('/lands-status', verifyToken, requireRole('admin'), adminController.getLandsStatus);

module.exports = router;