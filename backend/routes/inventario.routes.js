const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventario.controller');
const { verifyToken, isAdminOrVeterinario, isAdmin } = require('../middleware/auth.middleware');

router.use(verifyToken);


router.get('/stats', isAdminOrVeterinario, inventarioController.getInventarioStats);
router.get('/', isAdminOrVeterinario, inventarioController.getAllProductos);
router.get('/:id', isAdminOrVeterinario, inventarioController.getProductoById);

router.post('/', isAdmin, inventarioController.createProducto);
router.put('/:id', isAdmin, inventarioController.updateProducto);
router.delete('/:id', isAdmin, inventarioController.deleteProducto);

module.exports = router;