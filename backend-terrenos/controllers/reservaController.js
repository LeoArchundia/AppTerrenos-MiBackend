const { sql, connectDB } = require('../config/db');
const enviarCorreo = require('../services/emailService'); 

// 1. FUNCIÓN CREAR APARTADO
exports.crearApartado = async (req, res) => {
    console.log("📥 --- INICIANDO PROCESO DE APARTADO ---");
    
    // Obtenemos datos
    const userId = req.user ? req.user.id : req.body.userId;
    const { landId } = req.body;
    
    try {
        const pool = await connectDB();

        // A. Obtener datos del usuario y terreno para el correo
        const datos = await pool.request()
            .input('UserId', sql.Int, userId)
            .input('LandId', sql.Int, landId)
            .query(`
                SELECT u.Email, u.FullName, l.Code, l.Price 
                FROM Users u, Lands l 
                WHERE u.UserId = @UserId AND l.LandId = @LandId
            `);
        
        const info = datos.recordset[0];
        if (!info) throw new Error("Usuario o Terreno no encontrado");

        // B. Ejecutar Apartado en BD
        await pool.request()
            .input('LandId', sql.Int, landId)
            .input('UserId', sql.Int, userId) 
            .input('DurationHours', sql.Int, 24)
            .execute('sp_ApartarTerreno');

        console.log("✅ BD Actualizada.");

        // C. ENVIAR CORREO
        const mensaje = `
            <h1>¡Felicidades ${info.FullName}!</h1>
            <p>Has apartado el terreno <strong>${info.Code}</strong>.</p>
            <p>Precio: $${info.Price}</p>
            <p>Tienes 24 horas para completar tu pago.</p>
            <hr>
            <small>Atte: Equipo Vista Azure</small>
        `;

        await enviarCorreo(info.Email, 'Confirmación de Apartado', mensaje);

        res.json({ msg: 'Apartado exitoso y correo enviado.' });

    } catch (error) {
        console.error("❌ Error:", error);
        if (error.number === 51001) { 
            return res.status(409).json({ msg: 'El terreno ya no está disponible.' });
        }
        res.status(500).json({ msg: 'Error al procesar el apartado' });
    }
}; // <--- AQUÍ SE CIERRA LA PRIMERA FUNCIÓN


// 2. FUNCIÓN OBTENER HISTORIAL (Separada de la anterior)
exports.getMisApartados = async (req, res) => {
    try {
        const pool = await connectDB(); // Ya no necesitas requerir sql/connectDB de nuevo

        // Buscamos las reservas SOLO de este usuario
        const result = await pool.request()
            .input('UserId', sql.Int, req.user.id)
            .query(`
                SELECT r.ReservationId, r.CreatedAt, r.ExpiresAt, r.Status as ReservaStatus, 
                       l.Code, l.Price, l.Size, l.LandId
                FROM Reservations r
                JOIN Lands l ON r.LandId = l.LandId
                WHERE r.UserId = @UserId
                ORDER BY r.CreatedAt DESC
            `);

        res.json(result.recordset);

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al obtener historial' });
    }
};