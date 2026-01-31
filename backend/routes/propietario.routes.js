const express = require('express');
const router = express.Router();
const propietarioController = require('../controllers/propietario.controller');
const { verifyToken, isAdminOrVeterinario, isAdmin } = require('../middleware/auth.middleware');

router.use(verifyToken);

// Crear un propietario (Admin o Vete)
router.post('/', isAdminOrVeterinario, propietarioController.createPropietario);

// Listar todos los propietarios (Admin o Vete)
router.get('/', isAdminOrVeterinario, propietarioController.getAllPropietarios);

// Ver un propietario (Admin o Vete)
router.get('/:id', isAdminOrVeterinario, propietarioController.getPropietarioById);

// Actualizar un propietario (Admin o Vete)
router.put('/:id', isAdminOrVeterinario, propietarioController.updatePropietario);

// Eliminar un propietario (¡Solo Admin!)
router.delete('/:id', isAdmin, propietarioController.deletePropietario);

module.exports = router;