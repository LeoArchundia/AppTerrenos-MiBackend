const { sql, connectDB } = require('../config/db');

// 1. DASHBOARD: ESTADÍSTICAS (Gráfica original)
exports.getStats = async (req, res) => {
    try {
        const pool = await connectDB();
        const result = await pool.request().query(`
            SELECT 
                COUNT(*) as Total,
                SUM(CASE WHEN Status = 'Disponible' THEN 1 ELSE 0 END) as Disponibles,
                SUM(CASE WHEN Status = 'Apartado' THEN 1 ELSE 0 END) as Apartados,
                SUM(CASE WHEN Status = 'Vendido' THEN 1 ELSE 0 END) as Vendidos
            FROM Lands
            WHERE IsActive = 1
        `);
        const stats = result.recordset[0];
        res.json({
            total: stats.Total,
            breakdown: [
                { label: 'Disponibles', count: stats.Disponibles, color: '#2ecc71' },
                { label: 'Apartados', count: stats.Apartados, color: '#f1c40f' },
                { label: 'Vendidos', count: stats.Vendidos, color: '#e74c3c' }
            ]
        });
    } catch (error) {
        console.error("Error stats:", error);
        res.status(500).json({ msg: 'Error al obtener estadísticas' });
    }
};

// 2. DASHBOARD: RESERVAS PENDIENTES
exports.getPendingReservations = async (req, res) => {
    try {
        const pool = await connectDB();
        const result = await pool.request().query(`
            SELECT r.ReservationId, r.CreatedAt, r.ExpiresAt, 
                   u.FullName, u.Email, 
                   l.Code, l.Price, l.LandId
            FROM Reservations r
            JOIN Users u ON r.UserId = u.UserId
            JOIN Lands l ON r.LandId = l.LandId
            WHERE r.Status = 'Pending' AND l.Status = 'Apartado'
            ORDER BY r.CreatedAt ASC
        `);
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ msg: 'Error al obtener reservas' });
    }
};

// 3. DASHBOARD: CONFIRMAR VENTA
exports.confirmarVenta = async (req, res) => {
    const { reservationId, landId } = req.body;
    try {
        const pool = await connectDB();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        const request = new sql.Request(transaction);

        try {
            await request.query(`UPDATE Lands SET Status = 'Vendido' WHERE LandId = ${landId}`);
            await request.query(`UPDATE Reservations SET Status = 'Confirmed' WHERE ReservationId = ${reservationId}`);
            await transaction.commit();
            res.json({ msg: 'Venta confirmada exitosamente' });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al confirmar venta' });
    }
};

// 4. CRUD: OBTENER TODOS LOS TERRENOS
exports.getAllLandsAdmin = async (req, res) => {
    try {
        const pool = await connectDB();
        const result = await pool.request().query('SELECT * FROM Lands ORDER BY Code ASC');
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ msg: 'Error al obtener terrenos' });
    }
};

// 5. CRUD: CREAR NUEVO TERRENO
exports.createLand = async (req, res) => {
    const { code, size, price, geoJsonData } = req.body;
    try {
        const pool = await connectDB();
        await pool.request()
            .input('Code', sql.NVarChar, code)
            .input('Size', sql.Decimal(10,2), size)
            .input('Price', sql.Decimal(18,2), price)
            .input('GeoJsonData', sql.NVarChar, geoJsonData)
            .query(`INSERT INTO Lands (Code, Size, Price, GeoJsonData, Status, IsActive) 
                    VALUES (@Code, @Size, @Price, @GeoJsonData, 'Disponible', 1)`);
        res.json({ msg: 'Terreno creado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al crear terreno' });
    }
};

// 6. CRUD: EDITAR TERRENO
exports.updateLand = async (req, res) => {
    const { landId } = req.params;
    const { code, price, status, isActive } = req.body; 
    try {
        const pool = await connectDB();
        await pool.request()
            .input('LandId', sql.Int, landId)
            .input('Code', sql.NVarChar, code)
            .input('Price', sql.Decimal(18,2), price)
            .input('Status', sql.NVarChar, status)
            .input('IsActive', sql.Bit, isActive)
            .query(`UPDATE Lands 
                    SET Code=@Code, Price=@Price, Status=@Status, IsActive=@IsActive, UpdatedAt=GETDATE()
                    WHERE LandId=@LandId`);
        res.json({ msg: 'Terreno actualizado' });
    } catch (error) {
        res.status(500).json({ msg: 'Error al actualizar' });
    }
};

// 7. REPORTE: TODAS LAS RESERVAS
exports.getAllReservations = async (req, res) => {
    try {
        const pool = await connectDB();
        const result = await pool.request().query(`
            SELECT r.ReservationId, r.CreatedAt, r.Status as ReservaStatus,
                   u.FullName, u.Email,
                   l.Code, l.Price
            FROM Reservations r
            JOIN Users u ON r.UserId = u.UserId
            JOIN Lands l ON r.LandId = l.LandId
            ORDER BY r.CreatedAt DESC
        `);
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ msg: 'Error obteniendo reporte' });
    }
};

// 8. NUEVO REQUISITO: JSON PLANO PARA DASHBOARD API
// (Esta es la función que te faltaba y causaba el error)
exports.getLandsStatus = async (req, res) => {
    try {
        const pool = await connectDB();
        
        const result = await pool.request().query(`
            SELECT 
                COUNT(*) as Total,
                SUM(CASE WHEN Status = 'Disponible' THEN 1 ELSE 0 END) as Disponibles,
                SUM(CASE WHEN Status = 'Apartado' THEN 1 ELSE 0 END) as Apartados,
                SUM(CASE WHEN Status = 'Vendido' THEN 1 ELSE 0 END) as Vendidos
            FROM Lands
            WHERE IsActive = 1
        `);

        const stats = result.recordset[0];

        res.json({
            disponible: stats.Disponibles || 0,
            apartado: stats.Apartados || 0,
            vendido: stats.Vendidos || 0,
            total: stats.Total || 0
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al obtener status' });
    }
};