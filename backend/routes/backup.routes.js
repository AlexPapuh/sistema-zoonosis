const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backup.controller');

const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

router.get('/backup', verifyToken, isAdmin, backupController.descargarBackup);
module.exports = router;