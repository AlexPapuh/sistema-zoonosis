const cron = require('node-cron');
const db = require('../config/db');
const { enviarMensaje } = require('../services/whatsappClient');

const iniciarTareasProgramadas = () => {
    cron.schedule('0 8 * * *', async () => { 
        console.log('--- ⏰ EJECUTANDO RECORDATORIOS DIARIOS (8:00 AM) ---');
        
        try {
            const [vacunas] = await db.query(`
                SELECT 
                    av.id,
                    av.fecha_proxima_dosis,
                    p.telefono,
                    u.nombre as propietario,
                    a.nombre as mascota,
                    i.nombre as vacuna
                FROM animal_vacunas av
                JOIN animales a ON av.animal_id = a.id
                JOIN propietarios p ON a.propietario_id = p.id
                JOIN usuarios u ON p.usuario_id = u.id
                JOIN inventario i ON av.inventario_id = i.id
                WHERE 
                    -- 📅 AVISO: 1 día antes del vencimiento
                    DATEDIFF(av.fecha_proxima_dosis, CURDATE()) = 1
                    AND av.notificado = 0
            `);

            if (vacunas.length > 0) {
                console.log(`✅ Enviando ${vacunas.length} recordatorios...`);
                
                for (const registro of vacunas) {
                    if (registro.telefono) {
                        const mensaje = `🐶 *Recordatorio Zoonosis Potosí* 🐱\n\nHola ${registro.propietario}, le recordamos que mañana le toca el refuerzo de la vacuna *${registro.vacuna}* a su mascota *${registro.mascota}*.\n\n📅 Fecha: ${new Date(registro.fecha_proxima_dosis).toLocaleDateString()}\n\n¡Los esperamos!`;
                        
                        const enviado = await enviarMensaje(registro.telefono, mensaje);
                        
                        if (enviado) {
                            await db.query('UPDATE animal_vacunas SET notificado = 1 WHERE id = ?', [registro.id]);
                            console.log(`📨 Enviado a ${registro.propietario}`);
                        }
                    }
                }
            } else {
                console.log('💤 No hay vacunas para recordar hoy.');
            }

        } catch (error) {
            console.error('🔥 Error en el Cron Job diario:', error);
        }
    });
};

module.exports = iniciarTareasProgramadas;