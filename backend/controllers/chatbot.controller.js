'use strict';
const dialogflow = require('@google-cloud/dialogflow');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Verifica que el ID del proyecto exista
const projectId = process.env.DIALOGFLOW_PROJECT_ID;

// Cliente de Dialogflow (asume que la variable GOOGLE_APPLICATION_CREDENTIALS está en el .env)
const sessionClient = new dialogflow.SessionsClient();

// Instancia de Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

let sesionesActivas = {};

// Limpiador de memoria (RAM) - Se ejecuta cada 15 min
setInterval(() => {
    const ahora = Date.now();
    const TIEMPO_EXPIRACION = 30 * 60 * 1000; 
    let sesionesBorradas = 0;

    for (const id in sesionesActivas) {
        if (ahora - sesionesActivas[id].ultimaActividad > TIEMPO_EXPIRACION) {
            delete sesionesActivas[id];
            sesionesBorradas++;
        }
    }
    if (sesionesBorradas > 0) {
        console.log(`[LIMPIEZA RAM] Se eliminaron ${sesionesBorradas} sesiones inactivas.`);
    }
}, 15 * 60 * 1000);

exports.detectIntent = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: "Texto requerido" });

    // ID de sesión
    const sessionId = req.user?.id?.toString() || 'anonimo-' + req.ip; 
    const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);

    // Consulta a Dialogflow
    const request = {
      session: sessionPath,
      queryInput: { text: { text, languageCode: 'es-ES' } },
    };

    const [responses] = await sessionClient.detectIntent(request);
    const result = responses.queryResult;
    const intentName = result.intent?.displayName || '';

    // Si Dialogflow NO entiende, activamos a Gemini
    if (intentName === 'Default Fallback Intent') {
        
        if (!sesionesActivas[sessionId]) {
            // OPTIMIZACIÓN: systemInstruction es la forma moderna de darle un rol sin romper el historial
            const model = genAI.getGenerativeModel({ 
                model: "gemini-1.5-flash", // Cambiado a 1.5-flash por máxima compatibilidad en el server
                systemInstruction: "Eres el asistente de Zoonosis Potosí. Responde sobre salud, nutrición y cuidado animal de forma breve y amable. No respondas temas que no sean de animales."
            });
            
            sesionesActivas[sessionId] = {
                chat: model.startChat({
                    history: [] // El historial empieza limpio
                }),
                ultimaActividad: Date.now()
            };
        }

        try {
            sesionesActivas[sessionId].ultimaActividad = Date.now();

            const geminiResult = await sesionesActivas[sessionId].chat.sendMessage(text);
            const respuestaIA = geminiResult.response.text();

            return res.status(200).json({
                respuesta: respuestaIA,
                intencion: 'IA Híbrida con Gestión de RAM'
            });
            
        } catch (iaError) {
            console.error("ERROR GEMINI:", iaError.message || iaError); // Esto te dirá exactamente qué falla en los logs
            
            if (iaError.status === 503 || iaError.status === 429) {
                return res.status(200).json({
                    respuesta: "Estamos recibiendo muchas consultas. 🐾 Por favor, reintenta en un momento.",
                    intencion: 'Saturación Temporal'
                });
            }
            
            return res.status(200).json({
                respuesta: "Mi sistema de consultas veterinarias (IA) está descansando un momento. ¿Podrías intentar de nuevo? 🐱",
                intencion: 'Error IA'
            });
        }
    }

    // Si Dialogflow SÍ entendió, devuelve su respuesta
    res.status(200).json({
        respuesta: result.fulfillmentText,
        intencion: intentName
    });

  } catch (error) {
    console.error('ERROR (Chatbot General):', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};