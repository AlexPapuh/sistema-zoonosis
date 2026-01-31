const db = require('../config/db');

const Cita = {};

Cita.create = async (animal_id, propietario_id, veterinario_id, fecha_cita, motivo, notas, estado) => {
  const [result] = await db.query(
    'INSERT INTO citas (animal_id, propietario_id, veterinario_id, fecha_cita, motivo, notas, estado) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [animal_id, propietario_id, veterinario_id, fecha_cita, motivo, notas, estado]
  );
  return { id: result.insertId };
};

Cita.update = async (id, estado, veterinario_id, notas, fecha_cita, motivo) => {
    const fields = [];
    const params = [];
    
    if (estado) { fields.push('estado = ?'); params.push(estado); }
    if (veterinario_id) { fields.push('veterinario_id = ?'); params.push(veterinario_id); }
    if (notas) { fields.push('notas = ?'); params.push(notas); }
    if (fecha_cita) { fields.push('fecha_cita = ?'); params.push(fecha_cita); }
    if (motivo) { fields.push('motivo = ?'); params.push(motivo); }
    
    if (fields.length === 0) return 0;
    
    params.push(id);
    const [result] = await db.query(`UPDATE citas SET ${fields.join(', ')} WHERE id = ?`, params);
    return result.affectedRows > 0;
};

Cita.getByPropietarioId = async (propietario_id) => {
  const [rows] = await db.query(`
    SELECT c.*, 
           COALESCE(a.nombre, 'Sin Registro') AS animal_nombre, -- Si es null, muestra 'Sin Registro'
           COALESCE(a.especie, 'N/A') AS animal_especie,
           u.nombre AS veterinario_nombre
    FROM citas c
    LEFT JOIN animales a ON c.animal_id = a.id  -- CAMBIO IMPORTANTE: LEFT JOIN
    LEFT JOIN usuarios u ON c.veterinario_id = u.id
    WHERE c.propietario_id = ?
    ORDER BY c.fecha_cita DESC
  `, [propietario_id]);
  return rows;
};

Cita.getAll = async (veterinario_id, rol) => {
    let query = `
      SELECT 
        c.id, c.fecha_cita, c.motivo, c.estado, c.notas,
        c.animal_id,
        COALESCE(a.nombre, 'Paciente No Registrado') AS animal_nombre, -- Para que no salga vacío
        COALESCE(a.especie, 'General') AS especie,
        p.id AS propietario_id,
        u_prop.nombre AS propietario_nombre,
        u_prop.email AS propietario_email,
        u_vet.nombre AS veterinario_nombre
      FROM citas c
      LEFT JOIN animales a ON c.animal_id = a.id  -- CAMBIO IMPORTANTE: LEFT JOIN
      JOIN propietarios p ON c.propietario_id = p.id
      JOIN usuarios u_prop ON p.usuario_id = u_prop.id
      LEFT JOIN usuarios u_vet ON c.veterinario_id = u_vet.id
    `;

    if (rol === 'Veterinario') {
        query += ` WHERE (c.veterinario_id = ${veterinario_id} OR c.estado = 'Pendiente')`;
    }

    query += ' ORDER BY c.fecha_cita ASC';

    const [rows] = await db.query(query);
    return rows;
};

Cita.delete = async (id) => {
    const [result] = await db.query('DELETE FROM citas WHERE id = ?', [id]);
    return result.affectedRows > 0;
};

Cita.getHorarioEspecial = async (fecha) => {
    const [rows] = await db.query('SELECT * FROM horarios_especiales WHERE fecha = ?', [fecha]);
    return rows[0]; 
};

module.exports = Cita;