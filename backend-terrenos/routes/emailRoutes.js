const express = require('express');
const router = express.Router();
const { enviarCorreoApartado } = require('../controllers/emailController');

router.post('/apartado/:reservationId', enviarCorreoApartado);

module.exports = router;
