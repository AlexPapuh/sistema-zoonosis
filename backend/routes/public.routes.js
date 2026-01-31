const express = require('express');
const router = express.Router();
const publicController = require('../controllers/public.controller');

router.get('/servicios', publicController.obtenerServicios);

router.post('/servicios', publicController.crearServicio);
router.put('/servicios/:id', publicController.actualizarServicio);
router.delete('/servicios/:id', publicController.eliminarServicio);

module.exports = router;