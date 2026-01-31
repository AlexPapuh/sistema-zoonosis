const Inventario = require('../models/inventario.model');

exports.createProducto = async (req, res) => {
  try {
    const { nombre, tipo, stock = 0, stock_minimo = 10, lote, fecha_vencimiento, ubicacion, unidad, contenido_por_envase } = req.body;
    
    if (!nombre || !tipo) {
      return res.status(400).json({ message: 'Nombre y tipo son requeridos' });
    }
    
    const fechaFinal = fecha_vencimiento === '' ? null : fecha_vencimiento;
    const contenidoFinal = contenido_por_envase > 0 ? contenido_por_envase : 1;

    const nuevoProducto = await Inventario.create(nombre, tipo, stock, stock_minimo, lote, fechaFinal, ubicacion, unidad || 'unidades', contenidoFinal);
    res.status(201).json({ message: 'Producto de inventario creado', id: nuevoProducto.id });
  } catch (error) {
    console.error('Error en createProducto:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

exports.getAllProductos = async (req, res) => {
  try {
    const productos = await Inventario.getAll();
    res.status(200).json(productos);
  } catch (error) {
    res.status(500).json({ message: 'Error interno' });
  }
};

exports.getInventarioStats = async (req, res) => {
    try {
      const stats = await Inventario.getStats();
      res.status(200).json(stats);
    } catch (error) {
      res.status(500).json({ message: 'Error interno' });
    }
};

exports.getProductoById = async (req, res) => {
  try {
    const producto = await Inventario.getById(req.params.id);
    if (!producto) return res.status(404).json({ message: 'Producto no encontrado' });
    res.status(200).json(producto);
  } catch (error) {
    res.status(500).json({ message: 'Error interno' });
  }
};

exports.updateProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, tipo, stock, stock_minimo, lote, fecha_vencimiento, ubicacion, unidad, contenido_por_envase } = req.body;
    
    if (!nombre || !tipo || stock === undefined || stock_minimo === undefined) {
        return res.status(400).json({ message: 'Datos incompletos.' });
    }

    const fechaFinal = fecha_vencimiento === '' ? null : fecha_vencimiento;
    const contenidoFinal = contenido_por_envase > 0 ? contenido_por_envase : 1;

    const success = await Inventario.update(id, nombre, tipo, stock, stock_minimo, lote, fechaFinal, ubicacion, unidad, contenidoFinal);
    
    if (!success) return res.status(404).json({ message: 'Producto no encontrado' });
    
    res.status(200).json({ message: 'Producto actualizado' });
  } catch (error) {
    console.error('Error en updateProducto:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

exports.deleteProducto = async (req, res) => {
  try {
    const success = await Inventario.delete(req.params.id);
    if (!success) return res.status(404).json({ message: 'Producto no encontrado' });
    res.status(200).json({ message: 'Producto eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error interno' });
  }
};