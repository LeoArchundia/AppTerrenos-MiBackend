const express = require('express');
const cors = require('cors');
const path = require('path'); // Necesario para encontrar la carpeta public
require('dotenv').config();

// Importar rutas y servicios
const iniciarTareaLiberacion = require('./services/cronJobs');
const authRoutes = require('./routes/authRoutes');
const terrenoRoutes = require('./routes/terrenoRoutes'); // (Asegúrate de crear este archivo)

const app = express();

// 1. Middlewares Generales
app.use(cors());
app.use(express.json()); // Para entender los JSON que envía el frontend

// 2. Servir Archivos Estáticos (¡ESTA ES LA CLAVE!)
// Esto le dice a Node: "Todo lo que esté en la carpeta 'public', muéstralo al mundo"
app.use(express.static(path.join(__dirname, 'public')));

// 3. Rutas del API (Backend)
// Todas las peticiones de datos empezarán con /api
app.use('/api/auth', authRoutes);
app.use('/api/terrenos', terrenoRoutes);

// 4. Iniciar Tareas Programadas (Cron Jobs)
iniciarTareaLiberacion();

// 5. Iniciar Servidor
const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
