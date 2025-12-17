const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const enviarCorreo = async ({ to, subject, html, attachments = [] }) => {
    if (!to) {
        throw new Error('No recipients defined (emailService)');
    }

    try {
        await transporter.sendMail({
            from: `"Vista Azure Inmobiliaria" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
            attachments
        });

        console.log(`📧 Correo enviado a ${to} con ${attachments.length} adjuntos.`);
        return true;

    } catch (error) {
        console.error("❌ Error enviando correo:", error);
        throw error;
    }
};

module.exports = enviarCorreo;
