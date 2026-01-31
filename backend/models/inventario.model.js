const db = require('../config/db');

const Inventario = {};

Inventario.create = async (nombre, tipo, stock, stock_minimo, lote, fecha_vencimiento, ubicacion, unidad, contenido_por_envase) => {
  const [result] = await db.query(
    'INSERT INTO inventario (nombre, tipo, stock, stock_minimo, lote, fecha_vencimiento, ubicacion, unidad, contenido_por_envase) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [nombre, tipo, stock, stock_minimo, lote, fecha_vencimiento, ubicacion, unidad, contenido_por_envase]
  );
  return { id: result.insertId };
};

Inventario.getAll = async () => {
  const [rows] = await db.query('SELECT * FROM inventario ORDER BY nombre ASC');
  return rows;
};

Inventario.getById = async (id) => {
  const [rows] = await db.query('SELECT * FROM inventario WHERE id = ?', [id]);
  return rows[0];
};

Inventario.update = async (id, nombre, tipo, stock, stock_minimo, lote, fecha_vencimiento, ubicacion, unidad, contenido_por_envase) => {
  const [result] = await db.query(
    'UPDATE inventario SET nombre = ?, tipo = ?, stock = ?, stock_minimo = ?, lote = ?, fecha_vencimiento = ?, ubicacion = ?, unidad = ?, contenido_por_envase = ? WHERE id = ?',
    [nombre, tipo, stock, stock_minimo, lote, fecha_vencimiento, ubicacion, unidad, contenido_por_envase, id]
  );
  return result.affectedRows > 0;
};

Inventario.delete = async (id) => {
  const [result] = await db.query('DELETE FROM inventario WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

Inventario.getStats = async () => {
  const [totalProductosRes, stockVacunasRes, bajoStockRes] = await Promise.all([
    db.query('SELECT COUNT(id) AS total_productos FROM inventario'),
    db.query("SELECT SUM(stock) AS stock_total_vacunas FROM inventario WHERE tipo = 'Vacuna'"),
    db.query('SELECT COUNT(id) AS productos_bajo_stock FROM inventario WHERE stock < stock_minimo')
  ]);

  return {
    total_productos: totalProductosRes[0][0].total_productos || 0,
    stock_total_vacunas: stockVacunasRes[0][0].stock_total_vacunas || 0,
    productos_bajo_stock: bajoStockRes[0][0].productos_bajo_stock || 0
  };
};

module.exports = Inventario;