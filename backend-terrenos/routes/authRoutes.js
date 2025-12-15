const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Rutas públicas
router.post('/register', authController.register);
router.post('/login', authController.login);

// Ejemplo de cómo probar si funciona (Ruta protegida)
router.get('/perfil', verifyToken, (req, res) => {
    res.json({ msg: `Hola usuario ${req.user.id}, tienes acceso.` });
});

module.exports = router;