const { sql, connectDB } = require('../config/db');
const enviarCorreo = require('../services/emailService'); 
// 1. NUEVOS REQUIRES
const { generarPlantillaApartado } = require('../services/templates'); // Asumiendo que has creado este archivo
const pdf = require('html-pdf');
const util = require('util');
const pdfCreatePromise = util.promisify(pdf.create); // Convierte la función de PDF a Promesa para usar async/await

// 1. FUNCIÓN CREAR APARTADO
exports.crearApartado = async (req, res) => {
    console.log("📥 --- INICIANDO PROCESO DE APARTADO ---");
    
    // Obtenemos datos
    const userId = req.user ? req.user.id : req.body.userId;
    const { landId } = req.body;
    
    try {
        const pool = await connectDB();

        // A. Obtener datos del usuario y terreno para el correo
        // IMPORTANTE: Asegúrate de obtener TODOS los datos que tu plantilla HTML necesite.
        const datos = await pool.request()
            .input('UserId', sql.Int, userId)
            .input('LandId', sql.Int, landId)
            .query(`SELECT u.Email, u.FullName, l.Code, l.Price AS Price_Total, l.Size AS Size_Sqm, 1000.00 AS Reservation_Amount, GETDATE() AS Created_At FROM Users u, Lands l WHERE u.UserId = @UserId AND l.LandId = @LandId`);
        
        const info = datos.recordset[0];
        if (!info) throw new Error("Usuario o Terreno no encontrado");
        
        // Asumiendo que info ahora tiene: { Email, FullName, Code, Price_Total, Size_Sqm, Reservation_Amount, Created_At }

        // B. Ejecutar Apartado en BD
        await pool.request()
            .input('LandId', sql.Int, landId)
            .input('UserId', sql.Int, userId) 
            .input('DurationHours', sql.Int, 24)
            .execute('sp_ApartarTerreno');

        console.log("✅ BD Actualizada.");

        // C. GENERACIÓN DEL PDF Y ENVÍO DEL CORREO (Sección modificada)
        
        // 1. Generar HTML completo con datos inyectados para el PDF
        const { fullHtml, bodyHtml } = generarPlantillaApartado(info); 
        
        // controllers/reservaController.js - Sección C

        // 2. Generar el buffer binario del PDF
        // Renombrado para claridad: pdfResult es el objeto completo
        const pdfResult = await pdfCreatePromise(fullHtml, { 
        format: 'Letter',
        orientation: 'portrait',
        border: '1in',
        timeout: 10000
        });

        // 3. Crear el objeto de adjunto
        // ¡CORRECCIÓN CLAVE AQUÍ! Usar pdfResult.buffer para obtener el contenido binario.
        const attachments = [{
        filename: `Confirmacion_Apartado_${info.Code}.pdf`,
        content: pdfResult.buffer, // <--- **DEBE SER .buffer**
        contentType: 'application/pdf'
        }];
        
        // 4. Enviar el correo con el adjunto
        await enviarCorreo(
            info.Email, 
            `Confirmación de Apartado - Terreno ${info.Code} [PDF Adjunto]`, 
            bodyHtml, // Usar el HTML simple para el cuerpo del email
            attachments // El array de adjuntos que contiene el PDF
        );

        // D. OBTENER EL ID DE RESERVA Y EL IMPORTE PARA EL FRONTEND
        const newReservation = await pool.request()
            .input('LandId', sql.Int, landId)
            .input('UserId', sql.Int, userId)
            .query(`
                SELECT TOP 1 
                    ReservationId, 
                    LandId, 
                    Status, 
                    1000.00 AS ReservationAmount /* <-- Usamos 1000 como importe de apartado */
                FROM Reservations 
                WHERE LandId = @LandId AND UserId = @UserId 
                ORDER BY CreatedAt DESC
            `);

        const resId = newReservation.recordset[0]?.ReservationId;
        const amount = newReservation.recordset[0]?.ReservationAmount;

        console.log(`✅ Apartado ID: ${resId} | Importe: ${amount}`);

        // E. ENVIAR LA RESPUESTA FINAL AL CLIENTE (CORREGIDA)
        res.json({ 
            msg: 'Apartado exitoso y correo enviado con PDF adjunto.',
            reservationId: resId, // <-- DEBE ENVIAR ESTO
            amount: amount      // <-- Y DEBE ENVIAR ESTO
        });

        res.json({ msg: 'Apartado exitoso y correo enviado con PDF adjunto.' });

    } catch (error) {
        console.error("❌ Error en Apartado:", error);
        if (error.number === 51001) { 
            return res.status(409).json({ msg: 'El terreno ya no está disponible.' });
        }
        res.status(500).json({ msg: 'Error al procesar el apartado' });
    }
};

// 2. FUNCIÓN OBTENER HISTORIAL (CORREGIDA)
exports.getMisApartados = async (req, res) => {
    const userId = req.user.id; 

    if (!userId) {
        return res.status(401).json({ msg: 'Usuario no autenticado.' });
    }

    try {
        const pool = await connectDB();
        
        const result = await pool.request()
            .input('UserId', sql.Int, userId)
            .query(`
                SELECT 
                    r.ReservationId,
                    r.CreatedAt,
                    r.ExpiresAt,
                    r.Status AS ReservaStatus,  /* <-- CAMBIO A ReserveraStatus */
                    l.Code AS Code,             /* <-- CAMBIO A Code */
                    l.Price AS Price,           /* <-- CAMBIO A Price */
                    l.Size AS Size              /* <-- CAMBIO A Size */
                FROM Reservations r
                JOIN Lands l ON r.LandId = l.LandId
                WHERE r.UserId = @UserId
                ORDER BY r.CreatedAt DESC
            `);
            
        res.json(result.recordset);
        
    } catch (error) {
        console.error("Error al obtener mis reservas:", error);
        res.status(500).json({ msg: 'Error al obtener el historial de reservas.' });
    }
};