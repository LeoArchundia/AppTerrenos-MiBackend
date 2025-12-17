const { sql, connectDB } = require('../config/db');
const sendEmail = require('../services/emailService');
const { generarPlantillaApartado } = require('../services/templates');

/**
 * Enviar correo de confirmación de apartado
 * Se basa en ReservationId (NO en lógica de apartado)
 */
exports.enviarCorreoApartado = async (req, res) => {
    const { reservationId } = req.params;

    if (!reservationId) {
        return res.status(400).json({ msg: 'ReservationId requerido.' });
    }

    try {
        const pool = await connectDB();

        // 🔎 Obtener datos del apartado
        const result = await pool.request()
            .input('ReservationId', sql.Int, reservationId)
            .query(`
                SELECT 
                    u.Email,
                    u.FullName,
                    l.Code,
                    l.Price AS Price_Total,
                    l.Size AS Size_Sqm,
                    r.CreatedAt AS Created_At,
                    r.ExpiresAt
                FROM Reservations r
                JOIN Users u ON r.UserId = u.UserId
                JOIN Lands l ON r.LandId = l.LandId
                WHERE r.ReservationId = @ReservationId
            `);

        const info = result.recordset[0];

        if (!info || !info.Email) {
            return res.status(404).json({ msg: 'No se encontró información válida para enviar el correo.' });
        }

        // 🧩 Generar HTML del correo
        const { bodyHtml } = generarPlantillaApartado(info);

        // 📧 Enviar correo
        await sendEmail({
    to: info.Email,
    subject: `Confirmación de Apartado - Terreno ${info.Code}`,
    html: bodyHtml
});

        res.json({
            msg: 'Correo de apartado enviado correctamente.',
            email: info.Email
        });

    } catch (error) {
        console.error('❌ Error al enviar correo de apartado:', error);
        res.status(500).json({ msg: 'Error al enviar el correo de apartado.' });
    }
};

exports.testEmail = async (req, res) => {
    try {
        await sendEmail({
            to: process.env.EMAIL_USER,
            subject: '📧 PRUEBA EMAIL AZURE',
            html: '<h1>Correo de prueba exitoso</h1><p>Si ves esto, Nodemailer funciona.</p>'
        });

        res.json({ msg: 'Correo de prueba enviado correctamente' });
    } catch (error) {
        console.error('❌ Error en testEmail:', error);
        res.status(500).json({ msg: 'Falló el envío de correo', error: error.message });
    }
};
