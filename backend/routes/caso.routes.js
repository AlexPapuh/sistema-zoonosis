const express = require('express');
const router = express.Router();
const casoController = require('../controllers/caso.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');


router.get('/public', casoController.getPublicCasos);
router.post('/public', casoController.createPublicCaso);
router.use(verifyToken);

router.post('/', casoController.createCaso);


router.get('/', casoController.getAllCasos);

router.put('/:id/resolver', casoController.resolverCaso);

router.delete('/:id', isAdmin, casoController.deleteCaso);

module.exports = router;