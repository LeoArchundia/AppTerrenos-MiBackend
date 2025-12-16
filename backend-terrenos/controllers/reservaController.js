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
            .query(`
                SELECT 
                    u.Email, 
                    u.FullName, 
                    l.Code, 
                    l.Price as Price_Total, // Cambiado para mapear mejor a la plantilla
                    l.Size as Size_Sqm,       // Necesitas el tamaño (Size)
                    1000.00 as Reservation_Amount, // Usar valor real si existe
                    GETDATE() as Created_At
                FROM Users u, Lands l 
                WHERE u.UserId = @UserId AND l.LandId = @LandId
            `);
        
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
        
        // 2. Generar el buffer binario del PDF
        const pdfBuffer = await pdfCreatePromise(fullHtml, { 
            format: 'Letter',
            orientation: 'portrait',
            // Opciones recomendadas para producción, aunque pueden variar:
            border: '1in'
        });

        // 3. Crear el objeto de adjunto
        const attachments = [{
            filename: `Confirmacion_Apartado_${info.Code}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
        }];
        
        // 4. Enviar el correo con el adjunto
        await enviarCorreo(
            info.Email, 
            `Confirmación de Apartado - Terreno ${info.Code} [PDF Adjunto]`, 
            bodyHtml, // Usar el HTML simple para el cuerpo del email
            attachments // El array de adjuntos que contiene el PDF
        );

        res.json({ msg: 'Apartado exitoso y correo enviado con PDF adjunto.' });

    } catch (error) {
        console.error("❌ Error en Apartado:", error);
        if (error.number === 51001) { 
            return res.status(409).json({ msg: 'El terreno ya no está disponible.' });
        }
        res.status(500).json({ msg: 'Error al procesar el apartado' });
    }
};

// 2. FUNCIÓN OBTENER HISTORIAL (Se queda igual)
exports.getMisApartados = async (req, res) => {
// ... (Tu código de historial se queda intacto)
};