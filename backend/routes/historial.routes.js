const express = require('express');
const router = express.Router();
const historialController = require('../controllers/historial.controller');
const { verifyToken, isAdminOrVeterinario, isAdmin } = require('../middleware/auth.middleware');

router.use(verifyToken);


router.post('/consulta-completa', isAdminOrVeterinario, historialController.registrarConsultaCompleta);

router.get('/', isAdminOrVeterinario, historialController.getAllHistoriales);


router.get('/animal/:id', historialController.getHistorialByAnimalId);

router.post('/', isAdminOrVeterinario, historialController.createHistorial);


router.get('/:id', historialController.getHistorialById);

router.put('/:id', isAdminOrVeterinario, historialController.updateHistorial);
router.delete('/:id', isAdmin, historialController.deleteHistorial);

module.exports = router;