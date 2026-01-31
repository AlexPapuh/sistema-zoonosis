const db = require('../config/db');

const Caso = {};

Caso.create = async (titulo, descripcion, latitud, longitud, tipo, usuario_id, foto) => {
  const [result] = await db.query(
    'INSERT INTO casos_reportados (titulo, descripcion, latitud, longitud, tipo, usuario_id, foto) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [titulo, descripcion, latitud, longitud, tipo, usuario_id, foto]
  );
  return { id: result.insertId };
};

Caso.archivarVencidos = async () => {
  const [result] = await db.query(`
    UPDATE casos_reportados 
    SET estado = 'Archivado' 
    WHERE estado = 'Abierto' 
    AND fecha_reporte < DATE_SUB(NOW(), INTERVAL 30 DAY)
  `);
  return result.affectedRows; 
};

Caso.getAll = async (estado = 'Abierto') => {
  const [rows] = await db.query(`
    SELECT c.*, 
           -- LOGICA HIBRIDA:
           -- Si u.nombre existe (es logueado), usalo. Si no, usa c.nombre_contacto (es invitado)
           COALESCE(u.nombre, c.nombre_contacto) as reportado_por,
           COALESCE(p.telefono, c.telefono_contacto) as telefono_reporte
    FROM casos_reportados c
    -- USAMOS LEFT JOIN PARA QUE NO DESAPAREZCAN LOS QUE TIENEN usuario_id NULL
    LEFT JOIN usuarios u ON c.usuario_id = u.id
    LEFT JOIN propietarios p ON p.usuario_id = u.id
    WHERE c.estado = ? 
    ORDER BY c.fecha_reporte DESC
  `, [estado]);
  
  return rows;
};

Caso.resolver = async (id) => {
    const [result] = await db.query("UPDATE casos_reportados SET estado = 'Resuelto' WHERE id = ?", [id]);
    return result.affectedRows > 0;
};

Caso.delete = async (id) => {
  const [result] = await db.query('DELETE FROM casos_reportados WHERE id = ?', [id]);
  return result.affectedRows > 0;
};
Caso.createPublic = async (titulo, descripcion, latitud, longitud, tipo, nombre_contacto, telefono_contacto, foto) => {
  const [result] = await db.query(
    'INSERT INTO casos_reportados (titulo, descripcion, latitud, longitud, tipo, usuario_id, nombre_contacto, telefono_contacto, foto) VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?)',
    [titulo, descripcion, latitud, longitud, tipo, nombre_contacto, telefono_contacto, foto]
  );
  return { id: result.insertId };
};
Caso.getAllPublic = async () => {
  await Caso.archivarVencidos();
  const [rows] = await db.query(`
    SELECT c.*, 
           COALESCE(u.nombre, c.nombre_contacto) as reportado_por,
           COALESCE(p.telefono, c.telefono_contacto) as telefono_reporte
    FROM casos_reportados c
    LEFT JOIN usuarios u ON c.usuario_id = u.id
    LEFT JOIN propietarios p ON p.usuario_id = u.id
    WHERE c.estado = 'Abierto'
    ORDER BY c.fecha_reporte DESC
  `);
  
  return rows;
};
module.exports = Caso;