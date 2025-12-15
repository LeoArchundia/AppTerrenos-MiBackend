// ARCHIVO: routes/terrenoRoutes.js
const express = require('express');
const router = express.Router();
const { sql, connectDB } = require('../config/db');

// RUTA: GET /api/terrenos
// Esta es la ruta que usará tu mapa para pintar los polígonos
router.get('/', async (req, res) => {
    try {
        const pool = await connectDB();
        // Traemos solo los terrenos activos
        const result = await pool.request().query("SELECT * FROM Lands WHERE IsActive = 1");
        
        // Enviamos la lista al frontend
        res.json(result.recordset);
    } catch (error) {
        console.error("Error al obtener terrenos:", error);
        res.status(500).json({ msg: 'Error del servidor' });
    }
});

// IMPORTANTE: Esta línea es la que evita el error "router is not defined" en app.js
module.exports = router;