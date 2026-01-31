const db = require('../config/db');
const bcrypt = require('bcryptjs');

const User = {};

User.comparePassword = async (candidatePassword, hashedPassword) => {
  return await bcrypt.compare(candidatePassword, hashedPassword);
};

User.findByEmail = async (email) => {
  const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
  return rows[0];
};

User.create = async (nombre, email, password, rol, telefono, ci) => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  
  const [result] = await db.query(
    'INSERT INTO usuarios (nombre, email, password, rol, telefono, ci, estado, creado_en) VALUES (?, ?, ?, ?, ?, ?, "Activo", NOW())',
    [nombre, email, hashedPassword, rol, telefono, ci]
  );
  return { id: result.insertId, email, nombre, rol };
};

User.getAll = async () => {
  const [rows] = await db.query(`
    SELECT id, nombre, email, rol, estado, telefono, ci, creado_en 
    FROM usuarios
    ORDER BY CASE WHEN estado = 'Activo' THEN 0 ELSE 1 END, id DESC
  `);
  return rows;
};

User.getById = async (id) => {
  const [rows] = await db.query('SELECT id, nombre, email, rol, estado, telefono, ci FROM usuarios WHERE id = ?', [id]);
  return rows[0];
};

User.update = async (id, nombre, email, rol, telefono, ci) => {
  const [result] = await db.query(
    'UPDATE usuarios SET nombre = ?, email = ?, rol = ?, telefono = ?, ci = ? WHERE id = ?',
    [nombre, email, rol, telefono, ci, id]
  );
  return result.affectedRows > 0;
};

User.delete = async (id) => {
  const [result] = await db.query("UPDATE usuarios SET estado = 'Inactivo' WHERE id = ?", [id]);
  return result.affectedRows > 0;
};

User.createPropietarioProfile = async (usuario_id, direccion, latitud, longitud, telefono = '') => {
    const [result] = await db.query(
        `INSERT INTO propietarios 
        (usuario_id, apellido, direccion, latitud, longitud, telefono, creado_en) 
        VALUES (?, '', ?, ?, ?, ?, NOW())`, 
        [usuario_id, direccion, latitud, longitud, telefono]
    );
    return result;
};

module.exports = User;