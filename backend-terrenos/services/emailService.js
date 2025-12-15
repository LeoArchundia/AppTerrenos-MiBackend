const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const enviarCorreo = async (destinatario, asunto, htmlContent) => {
    try {
        await transporter.sendMail({
            from: '"Vista Azure Inmobiliaria" <no-reply@vistaazure.com>',
            to: destinatario,
            subject: asunto,
            html: htmlContent
        });
        console.log(`📧 Correo enviado a ${destinatario}`);
        return true;
    } catch (error) {
        console.error("❌ Error enviando correo:", error);
        return false;
    }
};

module.exports = enviarCorreo;