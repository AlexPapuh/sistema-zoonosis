const Historial = require('../models/historial.model');

exports.getAllHistoriales = async (req, res) => {
    try {
        const historiales = await Historial.getAll();
        res.status(200).json(historiales);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

exports.registrarConsultaCompleta = async (req, res) => {
    try {
        const dataConVeterinario = {
            ...req.body,
            veterinario_id: req.user.id
        };

        const resultado = await Historial.registrarConsultaCompleta(dataConVeterinario);

        res.status(201).json({
            message: 'Consulta registrada correctamente.',
            animal_id: resultado.animal_id,
            propietario_id: resultado.propietario_id,
            credenciales: resultado.credenciales 
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Error al registrar consulta' });
    }
};

exports.getHistorialByAnimalId = async (req, res) => {
    try {
        const historiales = await Historial.getByAnimalId(req.params.id);
        res.status(200).json(historiales);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

exports.getHistorialById = async (req, res) => {
    try {
        const historial = await Historial.getById(req.params.id);
        if (!historial) return res.status(404).json({ message: 'No encontrado' });
        res.status(200).json(historial);
    } catch (error) {
        res.status(500).json({ message: 'Error interno' });
    }
};

exports.deleteHistorial = async (req, res) => {
    try {
       const success = await Historial.delete(req.params.id);
       if(!success) return res.status(404).json({message: 'No encontrado'});
       res.status(200).json({message: 'Eliminado'});
   } catch(e) { res.status(500).json({message: e.message}); }
};

exports.createHistorial = async (req, res) => {
    try {
        const { animal_id, veterinario_id, fecha_consulta, diagnostico, tratamiento, notas } = req.body;
        const newId = await Historial.create(animal_id, veterinario_id, fecha_consulta, diagnostico, tratamiento, notas);
        res.status(201).json({ message: 'Historial creado', id: newId.id });
    } catch(e) { res.status(500).json({message: e.message}); }
};

exports.updateHistorial = async (req, res) => {
    try {
        const success = await Historial.update(req.params.id, req.body.diagnostico, req.body.tratamiento, req.body.notas);
        if(!success) return res.status(404).json({message: 'No encontrado'});
        res.status(200).json({message: 'Actualizado'});
    } catch(e) { res.status(500).json({message: e.message}); }
};