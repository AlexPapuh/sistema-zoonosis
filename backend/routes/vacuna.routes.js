const express = require('express');
const router = express.Router();
const vacunaController = require('../controllers/vacuna.controller');
const { verifyToken, isAdminOrVeterinario, isAdmin } = require('../middleware/auth.middleware');

router.use(verifyToken);


router.post('/vacunas', isAdmin, vacunaController.createVacunaMaster);

router.get('/vacunas', isAdminOrVeterinario, vacunaController.getAllVacunasMaster);

router.post('/animal-vacunas', isAdminOrVeterinario, vacunaController.applyVacunaToAnimal);

router.get('/animal-vacunas/:animal_id', isAdminOrVeterinario, vacunaController.getVacunasByAnimalId);

router.delete('/animal-vacunas/:id', isAdmin, vacunaController.deleteAppliedVacuna);


module.exports = router;