const express = require('express');
const router = express.Router();
const campanaController = require('../controllers/campana.controller');
const { verifyToken, isAdmin, isAdminOrVeterinario, isPropietario } = require('../middleware/auth.middleware');


router.get('/publicas', campanaController.getCampanasPublicas); 
router.post('/publicas/inscribir', campanaController.inscribirPublico);
router.use(verifyToken); 

// --- Rutas de Inscripción (Propietarios) ---
router.post('/inscribirse', isPropietario, campanaController.inscribirseCampana); 

router.post('/:id/inscribir', isPropietario, campanaController.inscribirACampana);


// --- Rutas de Administración ---
router.post('/', isAdmin, campanaController.createCampana);
router.put('/:id', isAdmin, campanaController.updateCampana);
router.delete('/:id', isAdmin, campanaController.deleteCampana);
router.post('/:id/iniciar', isAdmin, campanaController.iniciarCampana); 
router.post('/:id/finalizar', isAdmin, campanaController.finalizarCampana);

// --- Rutas de Veterinario ---
router.get('/mis-asignaciones', isAdminOrVeterinario, campanaController.getMisCampanasVete);
router.post('/:id/atencion', isAdminOrVeterinario, campanaController.registrarAtencion);
router.put('/inscripciones/:id/atendido', campanaController.marcarAtendido);

// --- Rutas Generales (Protegidas para Admin/Vete) ---
router.get('/', campanaController.getAllCampanas);
router.get('/:id', campanaController.getCampanaById);
router.get('/:id/inscripciones', isAdminOrVeterinario, campanaController.getInscripcionesDeCampana);

module.exports = router;