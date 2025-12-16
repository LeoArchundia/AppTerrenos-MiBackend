const { sql, connectDB } = require('../config/db');

// C1. CORRECCIÓN: Usaremos 'sendEmail' como nombre, ya que 'confirmarVenta' lo usa.
const sendEmail = require('../services/emailService'); 
const { generarPlantillaApartado, generarPlantillaVenta } = require('../services/templates'); // Asegúrate de importar generarPlantillaVenta
const pdf = require('html-pdf');
const util = require('util');
const pdfCreatePromise = util.promisify(pdf.create); 
// Nota: La configuración de la BD (dbConfig) DEBE ser accesible aquí, si 'sql.connect(dbConfig)' falla.
// Si usas connectDB(), asegúrate de que sql.connect(dbConfig) sea reemplazado por await connectDB();


// 1. FUNCIÓN CREAR APARTADO
exports.crearApartado = async (req, res) => {
    console.log("📥 --- INICIANDO PROCESO DE APARTADO ---");
    
    const userId = req.user ? req.user.id : req.body.userId;
    const { landId } = req.body;
    
    try {
        const pool = await connectDB();

        // 🟢 RESTAURADO Y CORREGIDO: A. Obtener datos del usuario y terreno
        const datos = await pool.request()
            .input('UserId', sql.Int, userId)
            .input('LandId', sql.Int, landId)
            .query(`SELECT u.Email, u.FullName, l.Code, l.Price AS Price_Total, l.Size AS Size_Sqm, 1000.00 AS Reservation_Amount, GETDATE() AS Created_At FROM Users u, Lands l WHERE u.UserId = @UserId AND l.LandId = @LandId`);
        
        const info = datos.recordset[0];
        if (!info) throw new Error("Usuario o Terreno no encontrado");
        
        // 🔍 1. Log de depuración: Muestra el Email recibido de la BD
        console.log("Datos obtenidos de la BD:", info); 
        console.log("Email del usuario para apartado:", info.Email);


        // B. Ejecutar Apartado en BD
        await pool.request()
            .input('LandId', sql.Int, landId)
            .input('UserId', sql.Int, userId) 
            .input('DurationHours', sql.Int, 24)
            .execute('sp_ApartarTerreno');

        console.log("✅ BD Actualizada.");


        // 🛑 2. Lógica Condicional: Intentar enviar correo SÓLO si info.Email existe
        if (info.Email) {
            // C. GENERACIÓN DEL PDF Y ENVÍO DEL CORREO
            const { fullHtml, bodyHtml } = generarPlantillaApartado(info); 
            
            const pdfResult = await pdfCreatePromise(fullHtml, { 
                format: 'Letter', orientation: 'portrait', border: '1in', timeout: 10000
            });

            const attachments = [{
                filename: `Confirmacion_Apartado_${info.Code}.pdf`,
                content: pdfResult.buffer, 
                contentType: 'application/pdf'
            }];
            
            // Aquí usamos la función importada 'sendEmail'
            await sendEmail({
                to: info.Email, // Usamos el Email
                subject: `Confirmación de Apartado - Terreno ${info.Code} [PDF Adjunto]`, 
                html: bodyHtml, 
                attachments: attachments 
            });
            console.log("✅ Correo de apartado enviado exitosamente.");
        } else {
            console.warn("⚠️ Advertencia: No se pudo enviar el correo de apartado porque el campo 'Email' del usuario es nulo o vacío.");
        }

        // D. OBTENER EL ID DE RESERVA
        const newReservation = await pool.request()
            .input('LandId', sql.Int, landId)
            .input('UserId', sql.Int, userId)
            .query(`
                SELECT TOP 1 
                    ReservationId, 
                    LandId, 
                    Status, 
                    1000.00 AS ReservationAmount
                FROM Reservations 
                WHERE LandId = @LandId AND UserId = @UserId 
                ORDER BY CreatedAt DESC
            `);

        const resId = newReservation.recordset[0]?.ReservationId;
        const amount = newReservation.recordset[0]?.ReservationAmount;

        // E. ENVIAR LA RESPUESTA FINAL AL CLIENTE
        res.json({ 
            msg: 'Apartado exitoso y correo enviado con PDF adjunto.',
            reservationId: resId, 
            amount: amount 
        });

    } catch (error) {
        console.error("❌ Error en Apartado:", error);
        if (error.number === 51001) { 
            return res.status(409).json({ msg: 'El terreno ya no está disponible.' });
        }
        res.status(500).json({ msg: 'Error al procesar el apartado' });
    }
};
// ... (El resto del código de getMisApartados y confirmarVenta es correcto)

// 2. FUNCIÓN OBTENER HISTORIAL (getMisApartados)
exports.getMisApartados = async (req, res) => {
    const userId = req.user.id; 
    // ... (El código de esta función es correcto)
    try {
        const pool = await connectDB();
        // ... (resto de la lógica de la consulta)
        const result = await pool.request()
            .input('UserId', sql.Int, userId)
            .query(`
                SELECT 
                    r.ReservationId, r.CreatedAt, r.ExpiresAt,
                    r.Status AS ReservaStatus, 
                    l.Code AS Code, l.Price AS Price, l.Size AS Size 
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


// 3. FUNCIÓN CONFIRMAR VENTA (Ajustamos solo el punto C3)
const confirmarVenta = async (req, res) => {
    // Desestructuramos el landId como 'landIdString' para evitar colisión con la variable parseada
    const { landId: landIdString, buyerEmail, buyerFullName, finalPrice, dateSold, notes } = req.body;
    const userId = req.userId; 

    // CORRECCIÓN CRÍTICA: Convertir landId a entero
    const landId = parseInt(landIdString);

    if (isNaN(landId) || !landId || !buyerEmail || !buyerFullName || !finalPrice) {
        return res.status(400).json({ msg: 'ID de terreno inválido o faltan datos obligatorios para confirmar la venta.' });
    }

    try {
        // Asumiendo que connectDB es la función correcta para la conexión, lo reemplazamos
        const pool = await connectDB(); 

        // 1. Actualizar el estado del terreno a 'Vendido'
        const updateResult = await pool.request()
            .input('landId', sql.Int, landId) // Usamos landId (entero)
            .input('status', sql.NVarChar, 'Vendido')
            .query('UPDATE Lands SET Status = @status WHERE LandId = @landId'); // Corregir a 'Lands' si 'Terrenos' no es el nombre correcto de la tabla

        if (updateResult.rowsAffected[0] === 0) {
            return res.status(404).json({ msg: 'Terreno no encontrado o ya vendido.' });
        }

        // 2. Obtener la información completa del terreno (para el correo/PDF)
        const landResult = await pool.request()
            .input('landId', sql.Int, landId) // Usamos landId (entero)
            .query('SELECT Code, Size, Price FROM Lands WHERE LandId = @landId'); // Corregir a 'Lands'

        if (landResult.recordset.length === 0) {
            return res.status(404).json({ msg: 'Terreno actualizado, pero no se encontraron sus datos para el correo.' });
        }
        const landData = landResult.recordset[0];

        // 3. Compilar datos para la plantilla y el PDF
        const pdfData = {
            BuyerFullName: buyerFullName, Email: buyerEmail, Code: landData.Code, Size: landData.Size,
            Final_Price: finalPrice, Date_Sold: dateSold,
        };
        
        // 4. Generar la plantilla y el PDF
        const { fullHtml, bodyHtml } = generarPlantillaVenta(pdfData);
        
        const pdfResult = await pdfCreatePromise(fullHtml, { 
            format: 'Letter', orientation: 'portrait', border: '1in', timeout: 10000 
        });

        // 5. Enviar el correo al comprador
        await sendEmail({ // Usamos sendEmail
            to: buyerEmail,
            subject: `🎉 Confirmación de Venta Finalizada - Terreno ${landData.Code}`,
            html: bodyHtml,
            attachments: [{
                filename: `Certificado_Venta_${landData.Code}.pdf`,
                content: pdfResult.buffer, // <--- C3. CORRECCIÓN: Usar .buffer
                contentType: 'application/pdf'
            }]
        });

        res.status(200).json({ msg: 'Venta confirmada, estado actualizado y correo enviado.' });

    } catch (error) {
        console.error('Error en confirmarVenta:', error);
        // Si el error es de base de datos, lo mostramos, si no, mostramos un error genérico
        if (error.originalError && error.originalError.info) {
             return res.status(500).json({ msg: 'Error de BD al procesar la venta.', details: error.originalError.info.message });
        }
        res.status(500).json({ msg: 'Error interno del servidor al procesar la venta.', error: error.message });
    }
};
exports.confirmarVenta = confirmarVenta; // Exportamos la función

// C2. CORRECCIÓN: Exportar TODAS las funciones necesarias
module.exports = {
    crearApartado: exports.crearApartado, 
    getMisApartados: exports.getMisApartados,
    confirmarVenta: exports.confirmarVenta
};