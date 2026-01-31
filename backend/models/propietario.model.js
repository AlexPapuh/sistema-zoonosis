const db = require('../config/db');
const bcrypt = require('bcryptjs');

const Propietario = {};

Propietario.createFullProfile = async (userData, ownerData, petsArray) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    
    const [userRes] = await connection.query(
      `INSERT INTO usuarios (nombre, email, password, rol, ci, telefono, estado, creado_en) 
       VALUES (?, ?, ?, "Propietario", ?, ?, "Activo", NOW())`,
      [
          userData.nombre, 
          userData.email, 
          hashedPassword, 
          userData.ci || null,
          ownerData.telefono || null
      ]
    );
    const userId = userRes.insertId;

    const [ownerRes] = await connection.query(
      `INSERT INTO propietarios (usuario_id, apellido, direccion, telefono, latitud, longitud, creado_en) 
       VALUES (?, '', ?, ?, ?, ?, NOW())`, // <-- Apellido vacío
      [
          userId, 
          ownerData.direccion, 
          ownerData.telefono, 
          ownerData.latitud, 
          ownerData.longitud
      ]
    );
    const ownerId = ownerRes.insertId;

    if (petsArray && petsArray.length > 0) {
        for (const pet of petsArray) {
            await connection.query(
                'INSERT INTO animales (propietario_id, nombre, especie, raza, sexo, fecha_nacimiento, foto, estado) VALUES (?, ?, ?, ?, ?, ?, ?, "Activo")',
                [ownerId, pet.nombre, pet.especie, pet.raza, pet.sexo, pet.fecha_nacimiento, pet.foto]
            );
        }
    }

    await connection.commit();
    return { userId, ownerId, totalPets: petsArray.length };

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

Propietario.getAll = async () => {
    const [rows] = await db.query(`
      SELECT 
        p.id, p.usuario_id, u.nombre, u.email, u.estado, u.ci,
        p.direccion, p.telefono, 
        p.latitud, p.longitud, p.creado_en,
        (SELECT COUNT(*) FROM animales a WHERE a.propietario_id = p.id AND a.estado != 'Deceso') as total_mascotas
      FROM propietarios p
      JOIN usuarios u ON p.usuario_id = u.id
      WHERE u.rol = 'Propietario'
      ORDER BY CASE WHEN u.estado = 'Activo' THEN 0 ELSE 1 END, p.id DESC
    `);
    return rows;
};

Propietario.getById = async (id) => {
    const [rows] = await db.query(`
      SELECT p.id, p.usuario_id, u.nombre, u.email, p.direccion, p.telefono, p.latitud, p.longitud, p.creado_en
      FROM propietarios p JOIN usuarios u ON p.usuario_id = u.id WHERE p.id = ?
    `, [id]);
    return rows[0];
};

Propietario.getByUserId = async (usuario_id) => {
    const [rows] = await db.query(`
      SELECT p.*, u.nombre, u.email FROM propietarios p JOIN usuarios u ON p.usuario_id = u.id WHERE p.usuario_id = ?
    `, [usuario_id]);
    return rows[0];
};

Propietario.update = async (id, direccion, telefono, latitud, longitud) => {
    const fields = []; const params = [];
    if (direccion !== undefined) { fields.push('direccion = ?'); params.push(direccion); }
    if (telefono !== undefined) { fields.push('telefono = ?'); params.push(telefono); }
    if (latitud !== undefined) { fields.push('latitud = ?'); params.push(latitud); }
    if (longitud !== undefined) { fields.push('longitud = ?'); params.push(longitud); }
    if (fields.length === 0) return 0;
    params.push(id);
    const [result] = await db.query(`UPDATE propietarios SET ${fields.join(', ')} WHERE id = ?`, params);
    return result.affectedRows > 0;
};

Propietario.delete = async (id) => {
    const [result] = await db.query(`
      UPDATE usuarios u JOIN propietarios p ON p.usuario_id = u.id SET u.estado = 'Inactivo' WHERE p.id = ?
    `, [id]);
    return result.affectedRows > 0;
};

module.exports = Propietario;