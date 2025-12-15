// UBICACIÓN: backend-terrenos/app.js
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Importar Servicios y Rutas
const iniciarTareaLiberacion = require('./services/cronJobs');
const authRoutes = require('./routes/authRoutes');
const terrenoRoutes = require('./routes/terrenoRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reservaRoutes = require('./routes/reservaRoutes');

const app = express();

// 1. Middlewares
app.use(cors());
app.use(express.json());
// Esto sirve los archivos estáticos (HTML, CSS, JS del frontend)
app.use(express.static(path.join(__dirname, 'public'))); 

// 2. Rutas del API
app.use('/api/auth', authRoutes);
app.use('/api/terrenos', terrenoRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reservas', reservaRoutes);
app.use('/api/admin', adminRoutes);

app.use('/api/dashboard', adminRoutes);

// 3. Tareas Programadas
iniciarTareaLiberacion();

// 4. Iniciar Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});