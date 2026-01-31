const express = require('express');
const router = express.Router();
const citasController = require('../controllers/citas.controller');
const { verifyToken, isAdminOrVeterinario, isPropietario } = require('../middleware/auth.middleware');

router.use(verifyToken);

// POST (Crear)
router.post('/', citasController.createCita);


router.get('/disponibilidad', verifyToken, citasController.getDisponibilidad);

// GET Mis Citas (Propietario)
router.get('/mis-citas', isPropietario, citasController.getCitasPropietario);

// GET Agenda (Vete/Admin)
router.get('/agenda', isAdminOrVeterinario, citasController.getCitasAgenda);

// PUT (Editar)
router.put('/:id', citasController.updateCita);

// DELETE (Eliminar)
router.delete('/:id', citasController.deleteCita);

router.post('/configurar-horario', isAdminOrVeterinario, citasController.crearHorarioEspecial);
router.get('/resumen-mensual', verifyToken, citasController.getResumenMensual);
module.exports = router;