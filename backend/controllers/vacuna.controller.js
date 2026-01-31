const Vacuna = require('../models/vacuna.model');
const db = require('../config/db');

exports.createVacunaMaster = async (req, res) => {
  try {
    const { nombre, descripcion, especie_objetivo } = req.body;
    if (!nombre || !especie_objetivo) return res.status(400).json({ message: 'Datos incompletos' });
    const newVacuna = await Vacuna.createMaster(nombre, descripcion, especie_objetivo);
    res.status(201).json({ message: 'Vacuna creada', vacuna: newVacuna });
  } catch (error) {
    res.status(500).json({ message: 'Error interno' });
  }
};

exports.getAllVacunasMaster = async (req, res) => {
  try {
    const vacunas = await Vacuna.getAllMaster();
    res.status(200).json(vacunas);
  } catch (error) {
    res.status(500).json({ message: 'Error interno' });
  }
};

exports.applyVacunaToAnimal = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { 
      animal_id, 
      vacuna_id, 
      fecha_aplicacion, 
      fecha_proxima_dosis, lote, 
      campana_id 
    } = req.body;
    
    const inventario_id = vacuna_id;
    const veterinario_id = req.user.id; 

    if (!animal_id || !inventario_id || !fecha_aplicacion) {
      return res.status(400).json({ message: 'Faltan datos requeridos' });
    }

    await connection.beginTransaction();

    if (campana_id) {
      const [campanaRows] = await connection.query(
        'SELECT stock_asignado, inventario_id FROM campanas WHERE id = ? FOR UPDATE', 
        [campana_id]
      );
      if (campanaRows.length === 0) throw new Error('La campaña no existe.');
      
      if (Number(campanaRows[0].inventario_id) !== Number(inventario_id)) {
        throw new Error('La vacuna seleccionada no coincide con la asignada a esta campaña.');
      }
      if (campanaRows[0].stock_asignado < 1) throw new Error('Stock de campaña agotado.');
      
      await connection.query(
        'UPDATE campanas SET stock_asignado = stock_asignado - 1 WHERE id = ?',
        [campana_id]
      );
      
    } else {
      const [invRows] = await connection.query('SELECT stock FROM inventario WHERE id = ? FOR UPDATE', [inventario_id]);
      if (invRows.length === 0) throw new Error('El producto no existe en inventario.');
      if (invRows[0].stock < 1) throw new Error('Stock principal agotado.');

      await connection.query(
        'UPDATE inventario SET stock = stock - 1 WHERE id = ?',
        [inventario_id]
      );
    }
    
    const newAplicacion = await Vacuna.applyToAnimal(
      animal_id, inventario_id, veterinario_id, fecha_aplicacion, 
      fecha_proxima_dosis, lote, campana_id, 
      connection
    );

    await connection.commit();
    res.status(201).json({ message: 'Vacunación registrada exitosamente', aplicacion: newAplicacion });
  
  } catch (error) {
    await connection.rollback();
    console.error('Error en applyVacunaToAnimal:', error);
    res.status(500).json({ message: 'Error al registrar vacunación', error: error.message });
  } finally {
    connection.release();
  }
};

exports.getVacunasByAnimalId = async (req, res) => {
  try {
    const vacunas = await Vacuna.getByAnimalId(req.params.animal_id);
    res.status(200).json(vacunas);
  } catch (error) {
    res.status(500).json({ message: 'Error interno' });
  }
};

exports.deleteAppliedVacuna = async (req, res) => {
    try {
      const success = await Vacuna.deleteApplied(req.params.id);
      if (!success) return res.status(404).json({ message: 'No encontrado' });
      res.status(200).json({ message: 'Eliminado' });
    } catch (error) {
      res.status(500).json({ message: 'Error interno' });
    }
};