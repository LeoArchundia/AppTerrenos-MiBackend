// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ msg: 'No hay token, permiso denegado' });
    }

    try {
        // AQUÍ ESTABA EL PROBLEMA:
        // Ambos archivos deben tener "|| 'secreto'" por si falla el .env
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secreto');
        
        req.user = decoded.user;
        next();
    } catch (err) {
        // Aquí es donde te salta el error
        console.error("Error verificando token:", err.message);
        res.status(401).json({ msg: 'Token no válido' });
    }
};

exports.requireRole = (requiredRole) => {
    return (req, res, next) => {
        if (!req.user || req.user.role !== requiredRole) {
            return res.status(403).json({ msg: 'Acceso prohibido' });
        }
        next();
    };
};