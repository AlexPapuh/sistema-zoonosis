const Historial = require('../models/historial.model');
const Propietario = require('../models/propietario.model');
const User = require('../models/user.model');
const Animal = require('../models/animal.model');
const db = require('../config/db');
const bcrypt = require('bcryptjs')
const crypto = require('crypto');

exports.getAllHistoriales = async (req, res) => {
    try {
      const historiales = await Historial.getAll();
      res.status(200).json(historiales);
    } catch (error) {
      console.error('Error en getAllHistoriales:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
};

exports.createHistorial = async (req, res) => {
    try {
        const { animal_id, veterinario_id, fecha_consulta, diagnostico, tratamiento, notas } = req.body;
        const newId = await Historial.create(animal_id, veterinario_id, fecha_consulta, diagnostico, tratamiento, notas);
        res.status(201).json({ message: 'Historial creado', id: newId.id });
    } catch(e) { res.status(500).json({message: e.message}); }
};

exports.getHistorialByAnimalId = async (req, res) => {
    try {
      const historiales = await Historial.getByAnimalId(req.params.id);
      if (historiales.length === 0) {
        return res.status(404).json({ message: 'No se encontraron entradas de historial.' });
      }
      res.status(200).json(historiales);
    } catch (error) {
      console.error('Error en getHistorialByAnimalId:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
};

exports.getHistorialById = async (req, res) => {
  try {
    const historial = await Historial.getById(req.params.id);
    if (!historial) return res.status(404).json({ message: 'No encontrado' });
    res.status(200).json(historial);
  } catch (error) { res.status(500).json({ message: 'Error interno' }); }
};

exports.updateHistorial = async (req, res) => {
    try {
        const success = await Historial.update(req.params.id, req.body.diagnostico, req.body.tratamiento, req.body.notas);
        if(!success) return res.status(404).json({message: 'No encontrado'});
        res.status(200).json({message: 'Actualizado'});
    } catch(e) { res.status(500).json({message: e.message}); }
};

exports.deleteHistorial = async (req, res) => {
     try {
        const success = await Historial.delete(req.params.id);
        if(!success) return res.status(404).json({message: 'No encontrado'});
        res.status(200).json({message: 'Eliminado'});
    } catch(e) { res.status(500).json({message: e.message}); }
};

exports.registrarConsultaCompleta = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { 
            propietario_id, 
            nombrePropietario, telefonoPropietario, emailPropietario, direccionPropietario, latitudPropietario, longitudPropietario,
            animal_id, 
            nombreMascota, especie, raza, sexo, fechaNacimiento, peso, 
            diagnostico, tratamiento, notas, cita_id,
            insumosUtilizados,
            esVacuna, fechaProxima 
        } = req.body;

        const latFinal = latitudPropietario === '' ? null : latitudPropietario;
        const lngFinal = longitudPropietario === '' ? null : longitudPropietario;

        let finalPropietarioId = propietario_id;
        let credenciales = null;

        if (!finalPropietarioId) {
            const [existingUser] = await connection.query("SELECT id FROM usuarios WHERE email = ?", [emailPropietario]);
            if (existingUser.length > 0) throw new Error("El correo ya está registrado.");

            const rawPassword = telefonoPropietario ? telefonoPropietario.toString() : '123456';
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(rawPassword, salt);

            const [userResult] = await connection.query(
                "INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, 'Propietario')",
                [nombrePropietario, emailPropietario, hashedPassword]
            );
            const newUserId = userResult.insertId;

            const [propResult] = await connection.query(
                "INSERT INTO propietarios (usuario_id, telefono, direccion, latitud, longitud) VALUES (?, ?, ?, ?, ?)",
                [newUserId, telefonoPropietario, direccionPropietario, latFinal, lngFinal]
            );
            finalPropietarioId = propResult.insertId;
            credenciales = { email: emailPropietario, password_temporal: rawPassword };
        }

        let finalAnimalId = animal_id;
        if (!finalAnimalId) {
            const [animalResult] = await connection.query(
                "INSERT INTO animales (propietario_id, nombre, especie, raza, sexo, fecha_nacimiento, peso) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [finalPropietarioId, nombreMascota, especie, raza, sexo, fechaNacimiento, peso]
            );
            finalAnimalId = animalResult.insertId;
        } else {
            if (peso) {
                await connection.query("UPDATE animales SET peso = ? WHERE id = ?", [peso, finalAnimalId]);
            }
        }

        await connection.query(
            "INSERT INTO historiales_medicos (animal_id, fecha_consulta, diagnostico, tratamiento, notas, veterinario_id, peso) VALUES (?, NOW(), ?, ?, ?, ?, ?)",
            [finalAnimalId, diagnostico, tratamiento, notas, req.user.id, peso || null] 
        );

        let vacunaInventarioId = null; 

        if (insumosUtilizados && insumosUtilizados.length > 0) {
            for (const item of insumosUtilizados) {
                const [prodRows] = await connection.query("SELECT stock, nombre FROM inventario WHERE id = ?", [item.id]);
                if (prodRows.length === 0) throw new Error(`Producto ID ${item.id} no encontrado`);
                
                const stockActual = parseFloat(prodRows[0].stock);
                if (stockActual < item.cantidad) {
                    throw new Error(`Stock insuficiente para ${prodRows[0].nombre}`);
                }
                await connection.query("UPDATE inventario SET stock = stock - ? WHERE id = ?", [item.cantidad, item.id]);

                if (!vacunaInventarioId) vacunaInventarioId = item.id;
            }
        }

        if (esVacuna && fechaProxima) {
            await connection.query(
                `INSERT INTO animal_vacunas 
                (animal_id, inventario_id, fecha_aplicacion, fecha_proxima_dosis, notificado, veterinario_id) 
                VALUES (?, ?, NOW(), ?, 0, ?)`,
                [
                    finalAnimalId, 
                    vacunaInventarioId || null, 
                    fechaProxima ,
                    req.user.id
                ]
            );
        }

        if (cita_id) {
            await connection.query("UPDATE citas SET estado = 'Completada' WHERE id = ?", [cita_id]);
        }

        await connection.commit();

        res.status(201).json({
            message: 'Consulta registrada correctamente.',
            animal_id: finalAnimalId,
            propietario_id: finalPropietarioId,
            credenciales: credenciales 
        });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: error.message || 'Error al registrar consulta' });
    } finally {
        connection.release();
    }
};