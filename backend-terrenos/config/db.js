const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER, // Ejemplo: proyectoterrenos.database.windows.net
    database: process.env.DB_NAME,
    options: {
        encrypt: true, // Obligatorio para Azure
        trustServerCertificate: false // True solo si fuera local
    }
};

async function connectDB() {
    try {
        let pool = await sql.connect(config);
        console.log("✅ Conectado a Azure SQL Database");
        return pool;
    } catch (err) {
        console.error("❌ Error conectando a la BD:", err);
    }
}

module.exports = { sql, connectDB };