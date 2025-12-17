const express = require('express');
const router = express.Router();
const { enviarCorreoApartado } = require('../controllers/emailController');
const { enviarCorreoApartado, testEmail } = require('../controllers/emailController');

router.post('/apartado/:reservationId', enviarCorreoApartado);
router.get('/test', testEmail);

module.exports = router;
