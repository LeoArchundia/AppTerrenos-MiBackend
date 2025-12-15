const { sql, connectDB } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. REGISTRO DE USUARIO
exports.register = async (req, res) => {
    const { fullName, email, password, role } = req.body; // Role puede ser 'admin' o 'client'

    try {
        const pool = await connectDB();
        
        // A. Validar si ya existe el email
        const checkUser = await pool.request()
            .input('Email', sql.NVarChar, email)
            .query('SELECT * FROM Users WHERE Email = @Email');
            
        if (checkUser.recordset.length > 0) {
            return res.status(400).json({ msg: 'El usuario ya existe' });
        }

        // B. Encriptar contraseña (Hashing)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // C. Insertar en Base de Datos
        // NOTA: Si es cliente, forzamos el rol 'client'. Solo un admin podría crear otro admin (lógica opcional)
        const userRole = role || 'client'; 

        await pool.request()
            .input('FullName', sql.NVarChar, fullName)
            .input('Email', sql.NVarChar, email)
            .input('PasswordHash', sql.NVarChar, hashedPassword)
            .input('Role', sql.NVarChar, userRole)
            .query(`INSERT INTO Users (FullName, Email, PasswordHash, Role) 
                    VALUES (@FullName, @Email, @PasswordHash, @Role)`);

        res.status(201).json({ msg: 'Usuario registrado exitosamente' });

    } catch (error) {
        console.error(error);
        res.status(500).send('Error en el servidor');
    }
};

// 2. LOGIN
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const pool = await connectDB();

        // A. Buscar usuario
        const result = await pool.request()
            .input('Email', sql.NVarChar, email)
            .query('SELECT * FROM Users WHERE Email = @Email');

        const user = result.recordset[0];

        if (!user) {
            return res.status(400).json({ msg: 'Credenciales inválidas' });
        }

        // B. Comparar contraseña (Texto plano vs Hash en BD)
        const isMatch = await bcrypt.compare(password, user.PasswordHash);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Credenciales inválidas' });
        }

        // C. Crear Token (JWT)
        const payload = {
            user: {
                id: user.UserId,
                role: user.Role 
            }
        };

        // Firma del token correcta con respaldo 'secreto'
        jwt.sign(
            payload, 
            process.env.JWT_SECRET || 'secreto', 
            { expiresIn: '12h' }, 
            (err, token) => {
                if (err) throw err;
                res.json({ token, role: user.Role, fullName: user.FullName });
            }
        );

    } catch (error) {
        console.error(error);
        res.status(500).send('Error en el servidor');
    }
};