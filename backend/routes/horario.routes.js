const express = require('express');
const router = express.Router();
const controller = require('../controllers/horario.controller');
const authJwt = require('../middleware/auth.middleware');

router.get('/config', controller.getHorarioNormal);
router.get('/especiales', controller.getDiasEspeciales);

router.put('/config', [authJwt.verifyToken], controller.updateHorarioNormal);
router.post('/especiales', [authJwt.verifyToken], controller.addDiaEspecial);
router.delete('/especiales/:id', [authJwt.verifyToken], controller.deleteDiaEspecial);

module.exports = router;