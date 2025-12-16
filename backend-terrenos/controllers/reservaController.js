const { sql, connectDB } = require('../config/db');


// ❌ PDF DESACTIVADO TEMPORALMENTE
// const pdf = require('html-pdf');
// const util = require('util');
// const pdfCreatePromise = util.promisify(pdf.create);
// Nota: La configuración de la BD (dbConfig) DEBE ser accesible aquí, si 'sql.connect(dbConfig)' falla.
// Si usas connectDB(), asegúrate de que sql.connect(dbConfig) sea reemplazado por await connectDB();


// 1. FUNCIÓN CREAR APARTADO
exports.crearApartado = async (req, res) => {
    console.log("📥 --- INICIANDO PROCESO DE APARTADO ---");

    const userId = req.user ? req.user.id : req.body.userId;
    const { landId } = req.body;

    try {
        const pool = await connectDB();

        // Ejecutar Apartado
        await pool.request()
            .input('LandId', sql.Int, landId)
            .input('UserId', sql.Int, userId)
            .input('DurationHours', sql.Int, 24)
            .execute('sp_ApartarTerreno');

        console.log("✅ Terreno apartado correctamente.");

        // Obtener reserva creada
        const newReservation = await pool.request()
            .input('LandId', sql.Int, landId)
            .input('UserId', sql.Int, userId)
            .query(`
                SELECT TOP 1 
                    ReservationId, 
                    LandId, 
                    Status, 
                    CreatedAt, 
                    ExpiresAt
                FROM Reservations 
                WHERE LandId = @LandId AND UserId = @UserId 
                ORDER BY CreatedAt DESC
            `);

        res.json({
            msg: 'Apartado exitoso.',
            reservation: newReservation.recordset[0]
        });

    } catch (error) {
        console.error("❌ Error en Apartado:", error);

        if (error.number === 51001) {
            return res.status(409).json({ msg: 'El terreno ya no está disponible.' });
        }

        res.status(500).json({ msg: 'Error al procesar el apartado.' });
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


        res.status(200).json({ msg: 'Venta confirmada, estado del terreno actualizado.' });

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