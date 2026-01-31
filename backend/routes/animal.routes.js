const express = require('express');
const router = express.Router();
const animalController = require('../controllers/animal.controller');
const { verifyToken, isAdminOrVeterinario, isAdmin, isPropietario } = require('../middleware/auth.middleware');

router.use(verifyToken);


router.post('/', isAdminOrVeterinario, animalController.createAnimal);

router.get('/mis-animales', isPropietario, animalController.getMisAnimales);

router.get('/propietario/:id', isAdminOrVeterinario, animalController.getAnimalsByPropietario);

router.get('/', isAdminOrVeterinario, animalController.getAllAnimals);

router.get('/:id/qr', animalController.getAnimalQR);

router.get('/:id', animalController.getAnimalById);

router.put('/:id', animalController.updateAnimal);

router.delete('/:id', isAdmin, animalController.deleteAnimal);

module.exports = router;