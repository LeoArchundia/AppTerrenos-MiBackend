const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// ACEPTA UN CUARTO PARÁMETRO: attachments. Por defecto, es un array vacío.
const enviarCorreo = async (destinatario, asunto, htmlContent, attachments = []) => { 
    try {
        await transporter.sendMail({
            from: '"Vista Azure Inmobiliaria" <no-reply@vistaazure.com>',
            to: destinatario,
            subject: asunto,
            html: htmlContent,
            attachments: attachments // <-- 1. NUEVO: Se añade el array de adjuntos a la configuración
        });
        
        console.log(`📧 Correo enviado a ${destinatario} con ${attachments.length} adjuntos.`); // 2. Modificación para loguear los adjuntos
        
        return true;
    } catch (error) {
        console.error("❌ Error enviando correo:", error);
        return false;
    }
};

module.exports = enviarCorreo;