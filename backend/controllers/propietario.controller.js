 const Propietario = require('../models/propietario.model');



exports.createFullPropietario = async (req, res) => {

    try {

        const {

            nombre, ci, email, password,

            direccion, telefono, latitud, longitud,

            mascotas                        

        } = req.body;



        if (!nombre || !email || !password || !telefono) {

            return res.status(400).json({ message: 'Faltan datos obligatorios del propietario' });

        }



        const petsArray = Array.isArray(mascotas) ? mascotas : [];



        const result = await Propietario.createFullProfile(

            { nombre, ci, email, password },

            { direccion, telefono, latitud, longitud },

            petsArray

        );



        res.status(201).json({ message: 'Propietario y mascotas registrados exitosamente', data: result });



    } catch (error) {

        console.error('Error en createFullPropietario:', error);

        if (error.code === 'ER_DUP_ENTRY') {

             return res.status(400).json({ message: 'El correo electrónico ya está registrado.' });

        }

        res.status(500).json({ message: 'Error interno al crear el registro completo.' });

    }

};



exports.getAllPropietarios = async (req, res) => {

    try { const propietarios = await Propietario.getAll(); res.status(200).json(propietarios); }

    catch (error) { res.status(500).json({ message: 'Error interno' }); }

};



exports.getPropietarioById = async (req, res) => {

    try { const propietario = await Propietario.getById(req.params.id); if(!propietario) return res.status(404).json({message:'No encontrado'}); res.status(200).json(propietario); }

    catch (error) { res.status(500).json({ message: 'Error interno' }); }

};



exports.updatePropietario = async (req, res) => {

    try { const success = await Propietario.update(req.params.id, req.body.direccion, req.body.telefono, req.body.latitud, req.body.longitud); if(!success) return res.status(404).json({message:'No encontrado'}); res.json({message:'Actualizado'}); }

    catch (error) { res.status(500).json({ message: 'Error interno' }); }

};



exports.deletePropietario = async (req, res) => {

    try { const success = await Propietario.delete(req.params.id); if(!success) return res.status(404).json({message:'No encontrado'}); res.json({message:'Desactivado exitosamente'}); }

    catch (error) { res.status(500).json({ message: 'Error interno' }); }

};

exports.createPropietario = async (req, res) => { /* Legacy code */ };