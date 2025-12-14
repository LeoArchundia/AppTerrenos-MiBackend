const { getConnection, sql } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const secretKey = 'proyecto-terrenos-secreto'; // En producción esto va en .env

// REGISTRO
const registrarUsuario = async (req, res) => {
    const { fullname, email, password } = req.body;
    try {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt); // Encriptamos contraseña

        const pool = await getConnection();
        await pool.request()
            .input('Name', sql.VarChar, fullname)
            .input('Email', sql.VarChar, email)
            .input('Pass', sql.VarChar, hash)
            .query("INSERT INTO Users (FullName, Email, PasswordHash, Role) VALUES (@Name, @Email, @Pass, 'client')");

        res.json({ success: true, mensaje: 'Usuario registrado' });
    } catch (error) {
        res.status(500).json({ success: false, mensaje: 'Error al registrar (posible email duplicado)' });
    }
};

// LOGIN
const loginUsuario = async (req, res) => {
    const { email, password } = req.body;
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('Email', sql.VarChar, email)
            .query("SELECT * FROM Users WHERE Email = @Email");

        if (result.recordset.length === 0) {
            return res.status(400).json({ success: false, mensaje: 'Usuario no encontrado' });
        }

        const usuario = result.recordset[0];
        
        // Comparar contraseñas
        const valida = await bcrypt.compare(password, usuario.PasswordHash);
        if (!valida) {
            return res.status(400).json({ success: false, mensaje: 'Contraseña incorrecta' });
        }

        // Crear Token
        const token = jwt.sign({ id: usuario.UserId, role: usuario.Role }, secretKey, { expiresIn: '2h' });

        res.json({ success: true, token, role: usuario.Role, userId: usuario.UserId });

    } catch (error) {
        res.status(500).json({ success: false, mensaje: error.message });
    }
};

module.exports = { registrarUsuario, loginUsuario };