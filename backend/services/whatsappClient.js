const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

console.log('🔄 Iniciando servicio de WhatsApp (Versión GitHub)...');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    },
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
    }
});

client.on('qr', (qr) => {
    console.log('✨ ¡QR GENERADO! Escanéalo ahora:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ WhatsApp Conectado exitosamente!');
});

const enviarMensaje = async (numero, texto) => {
    try {
        let numeroLimpio = numero.replace(/\D/g, ''); 
        if (numeroLimpio.length === 8 && (numeroLimpio.startsWith('6') || numeroLimpio.startsWith('7'))) {
            numeroLimpio = `591${numeroLimpio}`;
        }
        const chatId = `${numeroLimpio}@c.us`;
        
        console.log(`📤 Enviando a ID: ${chatId}`);
        await client.sendMessage(chatId, texto);
        return true;

    } catch (error) {
        console.error('❌ Error enviando WhatsApp:', error.message);
        return false;
    }
};

client.initialize();

module.exports = { enviarMensaje };