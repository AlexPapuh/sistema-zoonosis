const Animal = require('../models/animal.model');
const Propietario = require('../models/propietario.model');
const qrcode = require('qrcode');

exports.createAnimal = async (req, res) => {
  try {
    let { propietario_id, nombre, especie, raza, sexo, fecha_nacimiento, foto, estado } = req.body;
    
    if (!estado) estado = 'Activo'; 

    if (req.user.rol === 'Propietario') {
        const perfil = await Propietario.getByUserId(req.user.id);
        if (!perfil) {
            return res.status(403).json({ message: 'No tienes un perfil de propietario registrado. Contacta a un administrador.' });
        }
        propietario_id = perfil.id; 
    }
    
    if (!propietario_id || !nombre || !especie || !sexo) {
      return res.status(400).json({ message: 'Los campos propietario_id, nombre, especie y sexo son requeridos.' });
    }

    const newAnimal = await Animal.create(propietario_id, nombre, especie, raza, sexo, fecha_nacimiento, foto, estado);
    res.status(201).json({ message: 'Animal registrado exitosamente', animal: newAnimal });
  
  } catch (error) {
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(404).json({ message: 'Error: El propietario_id no existe.' });
    }
    console.error('Error en createAnimal:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

exports.getAllAnimals = async (req, res) => {
    try {
        const animales = await Animal.getAll();
        res.status(200).json(animales);
    } catch (error) {
        console.error('Error en getAllAnimals:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

exports.getAnimalById = async (req, res) => {
    try {
        const animal = await Animal.getById(req.params.id);
        if (!animal) return res.status(404).json({ message: 'Animal no encontrado' });
        res.status(200).json(animal);
    } catch (error) {
        console.error('Error en getAnimalById:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

exports.getAnimalsByPropietario = async (req, res) => {
    try {
      const animales = await Animal.getByPropietarioId(req.params.id);
      res.status(200).json(animales);
    } catch (error) {
      console.error('Error en getAnimalsByPropietario:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
};

exports.updateAnimal = async (req, res) => {
  try {
    const { nombre, especie, raza, sexo, fecha_nacimiento, foto, estado } = req.body;
    const { id } = req.params;

    const success = await Animal.update(id, nombre, especie, raza, sexo, fecha_nacimiento, foto, estado);
    
    if (!success) {
      return res.status(404).json({ message: 'Animal no encontrado o sin cambios' });
    }

    if (estado === 'Perdida') {
        console.log(`[ALERTA ZOONOSIS] La mascota ID ${id} ha sido reportada como PERDIDA.`);
    }

    const updatedAnimal = await Animal.getById(id);
    res.status(200).json({ message: 'Animal actualizado correctamente', animal: updatedAnimal });
  
  } catch (error) {
    console.error('Error en updateAnimal:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

exports.deleteAnimal = async (req, res) => {
    try {
        const success = await Animal.delete(req.params.id);
        if (!success) return res.status(404).json({ message: 'Animal no encontrado' });
        res.status(200).json({ message: 'Animal eliminado exitosamente' });
    } catch (error) {
        console.error('Error en deleteAnimal:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

exports.getPublicAnimalProfile = async (req, res) => {
    try {
      const animal = await Animal.getPublicProfileById(req.params.id);
      if (!animal) return res.status(404).json({ message: 'Perfil de animal no encontrado' });
      res.status(200).json(animal);
    } catch (error) {
      console.error('Error en getPublicAnimalProfile:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
};

exports.getAnimalQR = async (req, res) => {
    try {
        const { id } = req.params;
        const animal = await Animal.getById(id);
        if (!animal) return res.status(404).json({ message: 'Animal no encontrado' });
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const publicUrl = `${frontendUrl}/public/animal/${id}`;
        const qrDataUrl = await qrcode.toDataURL(publicUrl);
        res.status(200).json({ publicUrl: publicUrl, qrDataUrl: qrDataUrl });
    } catch (error) {
        console.error('Error en getAnimalQR:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

exports.getMisAnimales = async (req, res) => {
    try {
        const perfil = await Propietario.getByUserId(req.user.id);
        if (!perfil) return res.status(404).json({ message: 'No tienes un perfil de propietario registrado.' });
        const animales = await Animal.getByPropietarioId(perfil.id);
        res.status(200).json(animales);
    } catch (error) {
        console.error('Error en getMisAnimales:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};