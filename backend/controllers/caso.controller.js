const Caso = require('../models/caso.model');

exports.createCaso = async (req, res) => {
  try {
    const { titulo, descripcion, latitud, longitud, tipo, foto } = req.body;
    const usuario_id = req.user.id; 

    if (!titulo || !latitud || !longitud || !tipo) {
      return res.status(400).json({ message: 'Faltan datos requeridos (título, ubicación, tipo).' });
    }

    const newCaso = await Caso.create(titulo, descripcion, latitud, longitud, tipo, usuario_id, foto);
    res.status(201).json({ message: 'Reporte creado exitosamente', caso: newCaso });

  } catch (error) {
    console.error('Error createCaso:', error);
    res.status(500).json({ message: 'Error interno' });
  }
};

exports.getAllCasos = async (req, res) => {
  try {
    await Caso.archivarVencidos();

    const estadoSolicitado = req.query.estado || 'Abierto';

    const casos = await Caso.getAll(estadoSolicitado);
    
    res.status(200).json(casos);
  } catch (error) {
    console.error('Error getAllCasos:', error);
    res.status(500).json({ message: 'Error interno' });
  }
};

exports.resolverCaso = async (req, res) => {
    try {
        const { id } = req.params;

        const success = await Caso.resolver(id);
        
        if (!success) return res.status(404).json({ message: 'Caso no encontrado' });
        
        res.status(200).json({ message: 'Caso marcado como resuelto/encontrado' });
    } catch (error) {
        console.error('Error resolverCaso:', error);
        res.status(500).json({ message: 'Error interno' });
    }
};

exports.deleteCaso = async (req, res) => {
    try {
        await Caso.delete(req.params.id);
        res.status(200).json({ message: 'Caso eliminado' });
    } catch (error) {
        res.status(500).json({ message: 'Error interno' });
    }
};

exports.createPublicCaso = async (req, res) => {
  try {
    const { titulo, descripcion, latitud, longitud, tipo, foto, nombre_contacto, telefono_contacto } = req.body;

    if (!titulo || !latitud || !longitud || !tipo || !nombre_contacto || !telefono_contacto) {
      return res.status(400).json({ message: 'Faltan datos obligatorios (título, ubicación, nombre, celular).' });
    }

    const result = await Caso.createPublic(
        titulo, 
        descripcion, 
        latitud, 
        longitud, 
        tipo, 
        nombre_contacto, 
        telefono_contacto, 
        foto
    );

    res.status(201).json({ message: 'Reporte público creado exitosamente', id: result.id });

  } catch (error) {
    console.error('Error createPublicCaso:', error);
    res.status(500).json({ message: 'Error interno al crear el reporte' });
  }
};

exports.getPublicCasos = async (req, res) => {
  try {
    const casos = await Caso.getAllPublic();
    
    res.status(200).json(casos);
  } catch (error) {
    console.error('Error getPublicCasos:', error);
    res.status(500).json({ message: 'Error interno al obtener casos' });
  }
};