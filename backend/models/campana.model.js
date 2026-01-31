const db = require('../config/db');

const Campana = {};

Campana.create = async (nombre, descripcion, fecha_inicio, fecha_fin, tipo, latitud, longitud, inventario_id, stock_total, estado, connection) => {
    const query = 'INSERT INTO campanas (nombre, descripcion, fecha_inicio, fecha_fin, tipo, latitud, longitud, inventario_id, stock_asignado, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const params = [nombre, descripcion, fecha_inicio, fecha_fin, tipo, latitud, longitud, inventario_id, stock_total, estado];
    
    const dbConn = connection || db; 
    const [result] = await dbConn.query(query, params);
    
    return { id: result.insertId };
};

Campana.asignarVeterinario = async (campana_id, veterinario_id, stock, connection) => {
    const query = 'INSERT INTO campana_veterinarios (campana_id, veterinario_id, stock_inicial, stock_actual) VALUES (?, ?, ?, ?)';
    const dbConn = connection || db;
    await dbConn.query(query, [campana_id, veterinario_id, stock, stock]);
};

Campana.getAll = async (usuario_id = null) => {

    
    let query = `
        SELECT 
            c.*, 
            i.nombre as nombre_insumo, 
            i.unidad,
            
            -- A: Calculamos el TOTAL REAL que se repartió (Suma de stock_inicial de todos los veterinarios)
            COALESCE((SELECT SUM(stock_inicial) 
                      FROM campana_veterinarios cv 
                      WHERE cv.campana_id = c.id), 0) as stock_total_historico,

            -- B: Contamos cuántas vacunas se aplicaron realmente
            (SELECT COUNT(*) FROM animal_vacunas av WHERE av.campana_id = c.id) as total_aplicadas,

            -- C: Calculamos el sobrante usando el Histórico (A - B)
            -- Esto evita que salga 0 cuando la campaña finaliza y se borra el stock principal
            (
                COALESCE((SELECT SUM(stock_inicial) 
                          FROM campana_veterinarios cv 
                          WHERE cv.campana_id = c.id), 0) 
                - 
                (SELECT COUNT(*) FROM animal_vacunas av WHERE av.campana_id = c.id)
            ) as stock_restante_calculado

        FROM campanas c
        LEFT JOIN inventario i ON c.inventario_id = i.id
    `;

    if (usuario_id) {
        query = `
            SELECT 
                c.*, 
                i.nombre as nombre_insumo, 
                i.unidad,
                
                COALESCE((SELECT SUM(stock_inicial) FROM campana_veterinarios cv WHERE cv.campana_id = c.id), 0) as stock_total_historico,
                (SELECT COUNT(*) FROM animal_vacunas av WHERE av.campana_id = c.id) as total_aplicadas,
                (
                    COALESCE((SELECT SUM(stock_inicial) FROM campana_veterinarios cv WHERE cv.campana_id = c.id), 0) 
                    - 
                    (SELECT COUNT(*) FROM animal_vacunas av WHERE av.campana_id = c.id)
                ) as stock_restante_calculado,

                (SELECT COUNT(*) FROM campana_inscripciones ci 
                 JOIN propietarios p ON ci.propietario_id = p.id 
                 WHERE ci.campana_id = c.id AND p.usuario_id = ?) as ya_inscrito
            FROM campanas c
            LEFT JOIN inventario i ON c.inventario_id = i.id
        `;
    }

    query += ' ORDER BY c.fecha_inicio DESC';

    const params = usuario_id ? [usuario_id] : [];
    const [rows] = await db.query(query, params);
    
    return rows.map(r => ({
        ...r,
        ya_inscrito: r.ya_inscrito > 0 
    }));
};

Campana.getById = async (id) => {
    const query = `
        SELECT c.*, i.nombre as nombre_insumo, i.unidad
        FROM campanas c
        LEFT JOIN inventario i ON c.inventario_id = i.id
        WHERE c.id = ?
    `;
    const [rows] = await db.query(query, [id]);
    
    if (!rows[0]) return null;
    
    const campana = rows[0];

    const queryAsignaciones = `
        SELECT cv.veterinario_id, cv.stock_inicial, cv.stock_actual, u.nombre as nombre_veterinario
        FROM campana_veterinarios cv
        JOIN usuarios u ON cv.veterinario_id = u.id
        WHERE cv.campana_id = ?
    `;
    const [asignaciones] = await db.query(queryAsignaciones, [id]);
    
    return { ...campana, asignaciones };
};

Campana.getByVeterinarioId = async (veterinario_id) => {
    const query = `
        SELECT 
            c.id, c.nombre, c.descripcion, c.fecha_inicio, c.fecha_fin, c.tipo, c.estado, c.latitud, c.longitud,
            cv.stock_actual AS stock_asignado, -- El stock que ve el vete es SU stock personal
            cv.stock_inicial AS mi_stock_inicial,
            i.nombre AS nombre_insumo, i.unidad
        FROM campanas c
        JOIN campana_veterinarios cv ON c.id = cv.campana_id
        LEFT JOIN inventario i ON c.inventario_id = i.id
        WHERE cv.veterinario_id = ?
        ORDER BY c.fecha_inicio DESC
    `;
    const [rows] = await db.query(query, [veterinario_id]);
    return rows;
};

Campana.update = async (id, nombre, descripcion, fecha_inicio, fecha_fin, tipo, latitud, longitud) => {
    const [result] = await db.query(
        'UPDATE campanas SET nombre = ?, descripcion = ?, fecha_inicio = ?, fecha_fin = ?, tipo = ?, latitud = ?, longitud = ? WHERE id = ?',
        [nombre, descripcion, fecha_inicio, fecha_fin, tipo, latitud, longitud, id]
    );
    return result.affectedRows > 0;
};

Campana.updateEstado = async (id, nuevoEstado) => {
    const [result] = await db.query('UPDATE campanas SET estado = ? WHERE id = ?', [nuevoEstado, id]);
    return result.affectedRows > 0;
};

Campana.delete = async (id) => {
    const [result] = await db.query('DELETE FROM campanas WHERE id = ?', [id]);
    return result.affectedRows > 0;
};

Campana.inscribir = async (campana_id, propietario_id, direccion_contacto, cantidad_mascotas, latitud, longitud) => {
    const [result] = await db.query(
        'INSERT INTO campana_inscripciones (campana_id, propietario_id, direccion_contacto, cantidad_mascotas, latitud, longitud, fecha_inscripcion) VALUES (?, ?, ?, ?, ?, ?, NOW())',
        [campana_id, propietario_id, direccion_contacto, cantidad_mascotas, latitud, longitud]
    );
    return result.insertId;
};

Campana.getInscripcionesConGeo = async (campana_id) => {
    const [rows] = await db.query(`
        SELECT 
            i.id, i.direccion_contacto, i.estado, i.cantidad_mascotas, -- <--- AGREGADO
            p.latitud, p.longitud, 
            u.nombre as propietario_nombre 
        FROM campana_inscripciones i
        JOIN propietarios p ON i.propietario_id = p.id
        JOIN usuarios u ON p.usuario_id = u.id
        WHERE i.campana_id = ?
    `, [campana_id]);
    return rows;
};
Campana.getByIdAndVeterinario = async (campanaId, veterinarioId) => {
    const query = `
        SELECT 
            c.id, c.nombre, c.descripcion, c.fecha_inicio, c.fecha_fin, c.tipo, c.estado, c.latitud, c.longitud,
            cv.stock_actual AS stock_asignado, -- Muestra SU mochila, no el global
            i.nombre AS nombre_insumo, i.unidad
        FROM campanas c
        JOIN campana_veterinarios cv ON c.id = cv.campana_id
        LEFT JOIN inventario i ON c.inventario_id = i.id
        WHERE c.id = ? AND cv.veterinario_id = ?
    `;
    const [rows] = await db.query(query, [campanaId, veterinarioId]);
    return rows[0];
};

module.exports = Campana;