const cron = require('node-cron');
const { sql, connectDB } = require('../config/db');

// Tarea programada: Se ejecuta cada minuto (* * * * *)
const iniciarTareaLiberacion = () => {
    cron.schedule('* * * * *', async () => {
        console.log('⏳ Revisando apartados vencidos...');
        
        try {
            const pool = await connectDB();
            
            // Lógica: Si el tiempo actual > ExpiresAt y sigue 'Pending'
            // Pasamos el terreno a 'Disponible' y la reserva a 'Cancelled'
            const result = await pool.request().query(`
                UPDATE Lands 
                SET Status = 'Disponible', UpdatedAt = GETDATE()
                WHERE LandId IN (
                    SELECT LandId FROM Reservations 
                    WHERE Status = 'Pending' AND ExpiresAt < GETDATE()
                );

                UPDATE Reservations
                SET Status = 'Cancelled'
                WHERE Status = 'Pending' AND ExpiresAt < GETDATE();
            `);

            if (result.rowsAffected[0] > 0) {
                console.log(`♻️ Se liberaron ${result.rowsAffected[0]} terrenos vencidos automáticamente.`);
            }
        } catch (error) {
            console.error("Error en el cron job:", error);
        }
    });
};

module.exports = iniciarTareaLiberacion;