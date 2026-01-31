const db = require('../config/db');

const Vacuna = {};

Vacuna.createMaster = async (nombre, descripcion, especie_objetivo) => {
  const [result] = await db.query(
    'INSERT INTO vacunas (nombre, descripcion, especie_objetivo) VALUES (?, ?, ?)',
    [nombre, descripcion, especie_objetivo]
  );
  return { id: result.insertId, nombre, especie_objetivo };
};

Vacuna.getAllMaster = async () => {
  const [rows] = await db.query('SELECT * FROM vacunas');
  return rows;
};

Vacuna.applyToAnimal = async (animal_id, inventario_id, veterinario_id, fecha_aplicacion, fecha_proxima_dosis, lote, campana_id, connection) => {
  
  const queryRunner = connection || db;
  
  const [result] = await queryRunner.query(
    'INSERT INTO animal_vacunas (animal_id, inventario_id, veterinario_id, fecha_aplicacion, fecha_proxima_dosis, lote, campana_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [animal_id, inventario_id, veterinario_id, fecha_aplicacion, fecha_proxima_dosis, lote, campana_id]
  );
  return { id: result.insertId };
};

Vacuna.getByAnimalId = async (animal_id) => {
  const [rows] = await db.query(`
    SELECT 
      av.id, av.fecha_aplicacion, av.fecha_proxima_dosis, av.lote,
      i.nombre AS vacuna_nombre,  -- Nombre viene de la tabla inventario
      u.nombre AS veterinario_nombre
    FROM animal_vacunas av
    JOIN inventario i ON av.inventario_id = i.id
    JOIN usuarios u ON av.veterinario_id = u.id
    WHERE av.animal_id = ?
    ORDER BY av.fecha_aplicacion DESC
  `, [animal_id]);
  return rows;
};

Vacuna.deleteApplied = async (id) => {
    const [result] = await db.query('DELETE FROM animal_vacunas WHERE id = ?', [id]);
    return result.affectedRows > 0;
};

module.exports = Vacuna;