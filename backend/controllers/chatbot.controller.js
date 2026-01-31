'use strict';
const dialogflow = require('@google-cloud/dialogflow');
const uuid = require('uuid');


const projectId = process.env.DIALOGFLOW_PROJECT_ID;


const sessionClient = new dialogflow.SessionsClient();


exports.detectIntent = async (req, res) => {
  const { text } = req.body;
  
  
  const sessionId = uuid.v4(); 
  
  
  const sessionPath = sessionClient.projectAgentSessionPath(
    projectId,
    sessionId
  );

  
  const request = {
    session: sessionPath,
    queryInput: {
      text: {
      
        text: text,
        
        languageCode: 'es-ES', 
      },
    },
  };

  try {
    
    const responses = await sessionClient.detectIntent(request);
    
    const result = responses[0].queryResult;
    
    res.status(200).json({
        fulfillmentText: result.fulfillmentText
    });

  } catch (error) {
    console.error('ERROR (Dialogflow):', error);
    res.status(500).json({ message: 'Error al contactar al chatbot', error: error.message });
  }
};