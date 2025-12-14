const { getConnection, sql } = require('../config/db');

// --- 1. OBTENER TERRENOS (PÚBLICO) ---
const obtenerTerrenos = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query('SELECT * FROM Lands');
        
        // Parseamos el GeoJSON para que el front lo entienda
        const terrenos = result.recordset.map(t => ({
            ...t,
            LocationData: JSON.parse(t.LocationData || "{}") 
        }));
        
        res.json(terrenos);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// --- 2. APARTAR TERRENO (CON TRANSACCIÓN SQL - REQUISITO DEL PDF) ---
const apartarTerreno = async (req, res) => {
    const { landId, userId } = req.body; // Necesitamos saber QUÉ terreno y QUIÉN lo aparta

    const pool = await getConnection();
    const transaction = new sql.Transaction(pool);

    try {
        // Iniciar la transacción (Como pide el PDF: BEGIN TRAN)
        await transaction.begin();

        const request = new sql.Request(transaction);

        // A. Verificar estado actual
        const check = await request.input('Id', sql.Int, landId)
                                   .query("SELECT Status FROM Lands WHERE LandId = @Id");

        if (check.recordset.length === 0 || check.recordset[0].Status !== 'Disponible') {
            // Si falla, deshacemos todo (ROLLBACK)
            await transaction.rollback();
            return res.status(400).json({ mensaje: 'Error: El terreno ya está apartado o vendido' });
        }

        // B. Actualizar estado a 'Apartado'
        await request.query("UPDATE Lands SET Status = 'Apartado', UpdatedAt = GETDATE() WHERE LandId = @Id");

        // C. Crear registro en tabla Reservations
        // Calculamos expiración (ej. 24 horas)
        await request.input('UId', sql.Int, userId)
                     .query(`INSERT INTO Reservations (LandId, UserId, CreatedAt, ExpiryDate) 
                             VALUES (@Id, @UId, GETDATE(), DATEADD(hour, 24, GETDATE()))`);

        // D. Confirmar transacción (COMMIT TRAN)
        await transaction.commit();

        // TODO: Aquí iría la llamada a Nodemailer para enviar el correo

        res.json({ success: true, mensaje: 'Terreno apartado exitosamente. Revisa tu correo.' });

    } catch (error) {
        // En caso de error técnico, rollback
        if(transaction._begun) await transaction.rollback();
        res.status(500).json({ success: false, mensaje: error.message });
    }
};

// --- 3. DASHBOARD API (REQUISITO PDF) ---
const obtenerDashboard = async (req, res) => {
    try {
        const pool = await getConnection();
        
        // Consultas para contar estados
        const qDisp = await pool.request().query("SELECT COUNT(*) as c FROM Lands WHERE Status = 'Disponible'");
        const qApart = await pool.request().query("SELECT COUNT(*) as c FROM Lands WHERE Status = 'Apartado'");
        const qVend = await pool.request().query("SELECT COUNT(*) as c FROM Lands WHERE Status = 'Vendido'");
        const qTotal = await pool.request().query("SELECT COUNT(*) as c FROM Lands");

        res.json({
            disponible: qDisp.recordset[0].c,
            apartado: qApart.recordset[0].c,
            vendido: qVend.recordset[0].c,
            total: qTotal.recordset[0].c
        });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// --- 4. CRUD ADMIN (CREAR TERRENO) ---
const crearTerreno = async (req, res) => {
    const { code, size, price, geojson } = req.body;
    try {
        const pool = await getConnection();
        await pool.request()
            .input('Code', sql.VarChar, code)
            .input('Size', sql.Int, size)
            .input('Price', sql.Decimal, price)
            .input('Location', sql.NVarChar, JSON.stringify(geojson))
            .query("INSERT INTO Lands (Code, Size, Price, Status, LocationData) VALUES (@Code, @Size, @Price, 'Disponible', @Location)");
            
        res.json({ success: true, mensaje: 'Terreno creado' });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

module.exports = { obtenerTerrenos, apartarTerreno, obtenerDashboard, crearTerreno };