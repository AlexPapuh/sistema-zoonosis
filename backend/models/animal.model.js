const db = require('../config/db');

const Animal = {};

Animal.create = async (propietario_id, nombre, especie, raza, sexo, fecha_nacimiento, foto, estado) => {
  const [result] = await db.query(
    'INSERT INTO animales (propietario_id, nombre, especie, raza, sexo, fecha_nacimiento, foto, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [propietario_id, nombre, especie, raza, sexo, fecha_nacimiento, foto, estado]
  );
  return { id: result.insertId, propietario_id, nombre, especie, estado };
};

Animal.getAll = async () => {
  const [rows] = await db.query(`
    SELECT 
      a.id, a.nombre, a.especie, a.raza, a.sexo, a.fecha_nacimiento, a.foto, a.estado,
      p.id AS propietario_id,
      u.nombre AS propietario_nombre
    FROM animales a
    JOIN propietarios p ON a.propietario_id = p.id
    JOIN usuarios u ON p.usuario_id = u.id
  `);
  return rows;
};

Animal.getById = async (id) => {
  const [rows] = await db.query(`
    SELECT 
      a.id, a.nombre, a.especie, a.raza, a.sexo, a.fecha_nacimiento, a.foto, a.estado,
      p.id AS propietario_id,
      u.nombre AS propietario_nombre,
      p.telefono AS propietario_telefono
    FROM animales a
    JOIN propietarios p ON a.propietario_id = p.id
    JOIN usuarios u ON p.usuario_id = u.id
    WHERE a.id = ?
  `, [id]);
  return rows[0];
};

Animal.getByPropietarioId = async (propietario_id) => {
  const [rows] = await db.query(`
    SELECT 
      a.*, 
      p.telefono AS propietario_telefono,
      u.nombre AS propietario_nombre
    FROM animales a
    JOIN propietarios p ON a.propietario_id = p.id
    JOIN usuarios u ON p.usuario_id = u.id
    WHERE a.propietario_id = ?
  `, [propietario_id]);
  return rows;
};

Animal.update = async (id, nombre, especie, raza, sexo, fecha_nacimiento, foto, estado) => {
  
  
  let query = `
    UPDATE animales SET 
    nombre = COALESCE(?, nombre), 
    especie = COALESCE(?, especie), 
    raza = COALESCE(?, raza), 
    sexo = COALESCE(?, sexo), 
    fecha_nacimiento = COALESCE(?, fecha_nacimiento)
  `;
  
  let params = [nombre, especie, raza, sexo, fecha_nacimiento];

  if (foto) {
      query += ', foto = ?';
      params.push(foto);
  }

  if (estado) {
      query += ', estado = ?';
      params.push(estado);
  }

  query += ' WHERE id = ?';
  params.push(id);

  const [result] = await db.query(query, params);
  return result.affectedRows > 0;
};

Animal.delete = async (id) => {
  const [result] = await db.query('DELETE FROM animales WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

Animal.getPublicProfileById = async (id) => {
  const [rows] = await db.query(`
    SELECT 
      a.nombre AS animal_nombre, a.especie, a.raza, a.sexo, a.fecha_nacimiento, a.foto, a.estado,
      u.nombre AS propietario_nombre,
      p.telefono AS propietario_telefono
    FROM animales a
    JOIN propietarios p ON a.propietario_id = p.id
    JOIN usuarios u ON p.usuario_id = u.id
    WHERE a.id = ?
  `, [id]);
  return rows[0];
};

module.exports = Animal;