const express = require('express');
const router = express.Router();
const whatsappService = require('../services/whatsappClient'); 
const { verifyToken } = require('../middleware/auth.middleware'); 

router.get('/status', (req, res) => {
    const status = whatsappService.getAuthStatus();
    res.json(status);
});

router.post('/logout', verifyToken, async (req, res) => {
    try {
        await whatsappService.logoutWhatsApp();
        res.json({ message: 'Sesión de WhatsApp cerrada exitosamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al desconectar' });
    }
});

module.exports = router;