const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbot.controller');
const { verifyToken } = require('../middleware/auth.middleware'); 

router.post('/chat', verifyToken, chatbotController.detectIntent);

module.exports = router;