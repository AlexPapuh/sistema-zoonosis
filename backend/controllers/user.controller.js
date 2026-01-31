const User = require('../models/user.model');



exports.getAllUsers = async (req, res) => {

    try {

      const users = await User.getAll();

      res.status(200).json(users);

    } catch (error) {

      res.status(500).json({ message: 'Error al obtener usuarios', error: error.message });

    }

};

 

exports.getUserById = async (req, res) => {

    try {

      const user = await User.getById(req.params.id);

      if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

      res.status(200).json(user);

    } catch (error) {

      res.status(500).json({ message: 'Error al obtener usuario', error: error.message });

    }

};



exports.createUser = async (req, res) => {

    try {

      const { nombre, email, password, rol, telefono, ci, direccion, latitud, longitud } = req.body;

 

      if (!nombre || !email || !password || !rol) {

          return res.status(400).json({ message: 'Faltan datos obligatorios' });

      }

 

      const existingUser = await User.findByEmail(email);

      if (existingUser) {

        return res.status(400).json({ message: 'El correo ya está registrado' });

      }

 

      const newUser = await User.create(nombre, email, password, rol, telefono, ci);



      if (rol === 'Propietario') {

          await User.createPropietarioProfile(

              newUser.id,

              direccion,

              latitud,

              longitud,

              telefono || ''

             

          );

      }

 

      res.status(201).json({ message: 'Usuario creado exitosamente', user: newUser });

    } catch (error) {

      console.error(error);

      res.status(500).json({ message: 'Error al crear usuario', error: error.message });

    }

};



exports.updateUser = async (req, res) => {

    try {

      const { nombre, email, rol, telefono, ci } = req.body;

      const { id } = req.params;

      const success = await User.update(id, nombre, email, rol, telefono, ci);

      if (!success) return res.status(404).json({ message: 'Usuario no encontrado o sin cambios' });

      const updatedUser = await User.getById(id);

      res.status(200).json({ message: 'Usuario actualizado', user: updatedUser });

    } catch (error) {

      res.status(500).json({ message: 'Error al actualizar usuario', error: error.message });

    }

};

 

exports.deleteUser = async (req, res) => {

  try {

    const success = await User.delete(req.params.id);

    if (!success) return res.status(404).json({ message: 'Usuario no encontrado' });

    res.status(200).json({ message: 'Usuario desactivado exitosamente' });

  } catch (error) {

    res.status(500).json({ message: 'Error al desactivar usuario', error: error.message });

  }

};