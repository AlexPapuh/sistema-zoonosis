const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'correo@gmail.com',
        pass: 'contraseña_app'    
    }
});

transporter.verify().then(() => {
    console.log('✅ Servicio de Correo listo');
}).catch(err => {
    console.warn('⚠️ Advertencia: El servicio de correo no está configurado correctamente aún (pero el servidor iniciará).');
});

module.exports = transporter;