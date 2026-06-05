'use strict';
const dialogflow = require('@google-cloud/dialogflow');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path'); 

const projectId = process.env.DIALOGFLOW_PROJECT_ID;

const sessionClient = new dialogflow.SessionsClient();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

let sesionesActivas = {};


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

    const sessionId = req.user?.id?.toString() || 'anonimo-' + req.ip; 
    const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);

    const request = {
      session: sessionPath,
      queryInput: { text: { text, languageCode: 'es-ES' } },
    };

    const [responses] = await sessionClient.detectIntent(request);
    const result = responses.queryResult;
    const intentName = result.intent?.displayName || '';

    if (intentName === 'Default Fallback Intent') {
        
        if (!sesionesActivas[sessionId]) {
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
            
            sesionesActivas[sessionId] = {
                chat: model.startChat({
                    history: [
                        {
                            role: "user",
                            parts: [{ text: "Eres el asistente de Zoonosis Potosí. Responde sobre salud, nutrición y cuidado animal de forma breve y amable. No respondas temas no animales." }]
                        },
                        {
                            role: "model",
                            parts: [{ text: "Entendido, soy el asistente veterinario de Zoonosis Potosí." }]
                        }
                    ]
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
            console.error("Error de Cuota/Saturación:", iaError.status);
            if (iaError.status === 503 || iaError.status === 429) {
                return res.status(200).json({
                    respuesta: "Estamos recibiendo muchas consultas. 🐾 Por favor, reintenta en un momento.",
                    intencion: 'Saturación Temporal'
                });
            }
            throw iaError; 
        }
    }

    res.status(200).json({
        respuesta: result.fulfillmentText,
        intencion: intentName
    });

  } catch (error) {
    console.error('ERROR (Chatbot):', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};