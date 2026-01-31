const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.verifyToken = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]; 
  }

  if (!token) {
    return res.status(401).json({ message: 'No estás autorizado. Token no proporcionado.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_secreto_super_secreto');
    
    req.user = {
      id: decoded.id,
      rol: decoded.rol
    };

    next();

  } catch (error) {
    return res.status(401).json({ message: 'No estás autorizado. Token inválido.' });
  }
};

exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.rol === 'Admin') {
    next(); 
  } else {
    return res.status(403).json({ message: 'Acceso denegado. Se requiere rol de Administrador.' }); 
  }
};

exports.isAdminOrVeterinario = (req, res, next) => {
  if (req.user && (req.user.rol === 'Admin' || req.user.rol === 'Veterinario')) {
    next(); 
  } else {
    return res.status(403).json({ message: 'Acceso denegado. Se requiere rol de Administrador o Veterinario.' });
  }
};

exports.isPropietario = (req, res, next) => {
  if (req.user && req.user.rol === 'Propietario') {
    next(); 
  } else {
    return res.status(403).json({ message: 'Acceso denegado. Se requiere rol de Propietario.' });
  }
};