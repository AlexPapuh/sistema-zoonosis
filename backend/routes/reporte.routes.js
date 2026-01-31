const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporte.controller');
const { verifyToken, isAdminOrVeterinario } = require('../middleware/auth.middleware');

router.use(verifyToken);
router.use(isAdminOrVeterinario);

router.get('/dashboard-stats', reporteController.getDashboardStats);
router.get('/mapa-calor', reporteController.getMapaCalor);
router.get('/campanas-full', reporteController.getReporteCampanasFull);
router.get('/consultas-medicas', reporteController.getReporteConsultas); 
router.get('/diagnosticos-full', reporteController.getReporteDiagnosticosFull);
router.get('/poblacion-full', reporteController.getReportePoblacionFull); 
router.get('/propietarios-full', reporteController.getReportePropietariosFull); 
router.get('/citas-full', reporteController.getReporteCitasFull); 
module.exports = router;