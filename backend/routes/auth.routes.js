const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware'); 

router.post('/register', authController.register);
router.post('/login', authController.login);

router.get('/profile', verifyToken, authController.getProfile);

router.put('/profile', verifyToken, authController.updateProfile);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
module.exports = router;