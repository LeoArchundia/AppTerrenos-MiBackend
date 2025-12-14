const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: true, // Obligatorio en Azure
        trustServerCertificate: false
    }
};

// Función para obtener la conexión
async function getConnection() {
    try {
        const pool = await sql.connect(config);
        return pool;
    } catch (error) {
        console.error('❌ Error conectando a Azure:', error);
    }
}

module.exports = { getConnection, sql };