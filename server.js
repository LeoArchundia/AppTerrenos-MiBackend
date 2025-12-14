const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// 1. IMPORTAR LAS RUTAS
const landRoutes = require('./routes/landRoutes');
const authRoutes = require('./routes/authRoutes'); // <--- NUEVO: Importamos autenticación

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware (Configuraciones)
app.use(cors());
app.use(express.json()); // Para entender los JSON que llegan
app.use(express.static(path.join(__dirname, 'public'))); // Carpeta pública

// 2. USAR LAS RUTAS
app.use('/api/terrenos', landRoutes);
app.use('/api/auth', authRoutes); // <--- NUEVO: Habilitamos login y registro

// Rutas directas para el navegador
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// --- AGREGA ESTA NUEVA ---
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Arrancar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    console.log(`Login disponible en http://localhost:${PORT}/login`);
});