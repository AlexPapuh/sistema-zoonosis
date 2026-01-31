const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbot.controller');


const { verifyToken } = require('../middleware/auth.middleware');

router.post('/detectIntent', verifyToken, chatbotController.detectIntent);


module.exports = router;