// Contiene la plantilla HTML completa para la confirmación de apartado.
const APARTADO_TEMPLATE = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmación de Apartado de Terreno</title>
        <style>
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
            .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .header { background-color: #007bff; color: white; padding: 15px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { padding: 20px; }
            .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .details-table th, .details-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            .cta { text-align: center; margin: 30px 0; }
            .cta a { background-color: #28a745; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; }
            .footer { font-size: 0.9em; color: #777; text-align: center; margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px; }
            .important-note { background-color: #fff3cd; color: #856404; border: 1px solid #ffeeba; padding: 15px; border-radius: 5px; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>🎉 Apartado de Terreno Confirmado</h2>
            </div>
            <div class="content">
                <p>Estimado/a Cliente <strong>{{client_name}}</strong>,</p>
                <p>Confirmamos que ha realizado el apartado del siguiente terreno. Su selección ha sido reservada con éxito. Para formalizar la compra y evitar la expiración de la reserva, debe continuar con el proceso.</p>

                <h3>Detalles de su Reserva</h3>
                <table class="details-table">
                    <tr>
                        <th>Código de Terreno:</th>
                        <td><strong>{{land_code}}</strong></td> 
                    </tr>
                    <tr>
                        <th>Tamaño:</th>
                        <td><strong>{{size_sqm}} m²</strong></td> 
                    </tr>
                    <tr>
                        <th>Precio Total:</th>
                        <td><strong>{{price_total}}</strong></td> 
                    </tr>
                    <tr>
                        <th>Monto de Apartado (si aplica):</th>
                        <td><strong>{{reservation_amount}}</strong></td> 
                    </tr>
                </table>
                
                <div class="important-note">
                    <h3>⏰ Tiempo Límite para Continuar</h3>
                    <p>Su apartado tiene una duración de <strong>{{duration_time}}</strong> (ej. 48 horas).</p>
                    <p>La fecha y hora de expiración es: <strong>{{expiration_date_time}}</strong></p>
                    <p>Si no completa la acción requerida antes de esta hora, el apartado expirará y el terreno volverá a estar disponible.</p>
                </div>

                <p>Para completar el pago restante o iniciar la formalización:</p>

                <div class="cta">
                    <a href="{{payment_link}}">Continuar con el Pago / Proceso</a>
                </div>
                
                <p><strong>Políticas de Seguimiento:</strong></p>
                <ul>
                    <li>Este correo sirve como notificación de apartado a ambas partes para continuar el proceso.</li>
                    <li>Recuerde que debe seguir las políticas de seguimiento que le serán enviadas en el siguiente paso.</li>
                </ul>

            </div>
            <div class="footer">
                <p>Este es un correo de notificación automática. Por favor, no responda a este mensaje.</p>
                <p>Administrador del Desarrollo Inmobiliario.</p>
            </div>
        </div>
    </body>
    </html>
`;

/**
 * Función que toma los datos de la BD y los inyecta en la plantilla HTML.
 * @param {object} data - Los datos del usuario y del terreno obtenidos de la BD.
 * @returns {object} Un objeto con el HTML completo para el PDF y un HTML simple para el cuerpo del correo.
 */
const generarPlantillaApartado = (data) => {
    // Formatear números
    const formattedPrice = `$${(data.Price_Total || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
    const formattedReservation = `$${(data.Reservation_Amount || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
    
    // CORRECCIÓN CLAVE: Manejo de la Fecha de Creación
    let createdDate = new Date(data.Created_At);

    // Si la fecha de la BD no es un formato válido para Node.js (Invalid Date), 
    // usamos la fecha actual como fallback.
    if (isNaN(createdDate.getTime())) {
        console.error("DEBUG: La fecha de BD Created_At es inválida. Usando fecha actual.");
        createdDate = new Date(); 
    }

    // Calcular la fecha de expiración (24 horas después de la creación/fallback)
    const expirationDate = new Date(createdDate);
    expirationDate.setHours(expirationDate.getHours() + 24);
    
    // Formatear la fecha de expiración
    const formattedExpiration = expirationDate.toLocaleString('es-MX', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
    });

    let fullHtml = APARTADO_TEMPLATE;

    // 1. Reemplazar Placeholders en el HTML completo (para el PDF)
    fullHtml = fullHtml.replace(/{{client_name}}/g, data.FullName || 'Cliente');
    fullHtml = fullHtml.replace(/{{land_code}}/g, data.Code || 'N/A');
    fullHtml = fullHtml.replace(/{{size_sqm}}/g, data.Size_Sqm || 'N/A');
    fullHtml = fullHtml.replace(/{{price_total}}/g, formattedPrice);
    fullHtml = fullHtml.replace(/{{reservation_amount}}/g, formattedReservation);
    fullHtml = fullHtml.replace(/{{duration_time}}/g, '24 Horas'); 
    fullHtml = fullHtml.replace(/{{expiration_date_time}}/g, formattedExpiration);
    fullHtml = fullHtml.replace(/{{payment_link}}/g, 'SU_URL_DE_PAGO_AQUI'); // **AJUSTAR ESTA URL**

    // 2. Crear un cuerpo simple para el correo electrónico
    const bodyHtml = `
        <div style="font-family: Arial, sans-serif;">
            <h2>¡Hola ${data.FullName || 'Cliente'}!</h2>
            <p>Tu solicitud de apartado para el terreno <strong>${data.Code || 'N/A'}</strong> ha sido confirmada.</p>
            <p><strong>El detalle completo de su reserva, precio y tiempo límite está adjunto en el documento PDF.</strong></p>
            <p>Por favor, revise el adjunto y complete la acción requerida antes de que expire la reserva.</p>
            <br>
            <p>Atentamente,<br>Equipo Vista Azure Inmobiliaria.</p>
        </div>
    `;

    return {
        fullHtml: fullHtml, // Usado para generar el PDF
        bodyHtml: bodyHtml // Usado para el cuerpo del email
    };
};

// --- NUEVA CONSTANTE DE PLANTILLA DE VENTA ---
const VENTA_FINALIZADA_TEMPLATE = `
    <!DOCTYPE html>
    <html lang="es">
    </html>
`;

/**
 * Función que toma los datos de la venta final y los inyecta en la plantilla HTML.
 * @param {object} data - Los datos del usuario y del terreno para la venta final.
 * @returns {object} Un objeto con el HTML completo para el PDF y un HTML simple para el cuerpo del correo.
 */
const generarPlantillaVenta = (data) => {
    // Formatear el precio
    const formattedPrice = `$${(data.Final_Price || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
    
    // Formatear la fecha
    const finalizationDate = new Date(data.Date_Sold || Date.now());
    const formattedDate = finalizationDate.toLocaleDateString('es-MX', {
        day: '2-digit', month: 'long', year: 'numeric'
    });

    let fullHtml = VENTA_FINALIZADA_TEMPLATE;

    // 1. Reemplazar Placeholders en el HTML completo (para el PDF)
    fullHtml = fullHtml.replace(/{{client_name}}/g, data.BuyerFullName || 'Cliente');
    fullHtml = fullHtml.replace(/{{land_code}}/g, data.Code || 'N/A');
    fullHtml = fullHtml.replace(/{{finalization_date}}/g, formattedDate);
    // Nota: El número de contrato es un placeholder que debes llenar si tienes esa lógica.
    fullHtml = fullHtml.replace(/{{contract_number}}/g, data.ContractNumber || 'N/A'); 
    fullHtml = fullHtml.replace(/{{final_price}}/g, formattedPrice);

    // 2. Crear un cuerpo simple para el correo electrónico
    const bodyHtml = `
        <div style="font-family: Arial, sans-serif;">
            <h2>¡Felicidades, ${data.BuyerFullName || 'Cliente'}!</h2>
            <p>La venta del terreno <strong>${data.Code || 'N/A'}</strong> ha sido finalizada con éxito.</p>
            <p><strong>El PDF adjunto contiene el certificado de venta y todos los detalles formales de la transacción.</strong></p>
            <p>Nuestro equipo legal se pondrá en contacto para iniciar los trámites de escrituración.</p>
            <br>
            <p>Atentamente,<br>Administración.</p>
        </div>
    `;

    return {
        fullHtml: fullHtml, // Usado para generar el PDF
        bodyHtml: bodyHtml // Usado para el cuerpo del email
    };
};

module.exports = { generarPlantillaApartado, generarPlantillaVenta }; // Asegúrate de exportar ambas