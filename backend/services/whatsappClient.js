const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal');
const qrcode = require('qrcode'); 

let qrCodeBase64 = null;
let isConnected = false;

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

client.on('qr', async (qr) => {
    console.log('✨ ¡QR GENERADO! Esperando escaneo...');
    qrcodeTerminal.generate(qr, { small: true }); 
    try {
        qrCodeBase64 = await qrcode.toDataURL(qr); 
        isConnected = false;
    } catch (err) {
        console.error('Error generando imagen QR', err);
    }
});

client.on('ready', () => {
    console.log('✅ WhatsApp Conectado exitosamente!');
    isConnected = true;
    qrCodeBase64 = null; 
});

client.on('disconnected', (reason) => {
    console.log('❌ WhatsApp Desconectado:', reason);
    isConnected = false;
    qrCodeBase64 = null;
    client.initialize(); 
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

const getAuthStatus = () => {
    const deVerdadEstaConectado = isConnected || (client.info && client.info.wid);

    return {
        status: deVerdadEstaConectado ? 'conectado' : 'desconectado',
        qr: qrCodeBase64
    };
};

const logoutWhatsApp = async () => {
    if (isConnected) {
        await client.logout();
        isConnected = false;
        qrCodeBase64 = null;
    }
};

client.initialize();

module.exports = { enviarMensaje, getAuthStatus, logoutWhatsApp };