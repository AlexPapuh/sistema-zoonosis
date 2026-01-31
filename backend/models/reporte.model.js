const db = require('../config/db');

const Reporte = {};

Reporte.getResumenGeneral = async () => {
    const [totalAnimales] = await db.query("SELECT COUNT(*) as total FROM animales");
    const [totalCitas] = await db.query("SELECT COUNT(*) as total FROM citas");
    const [totalVacunas] = await db.query("SELECT COUNT(*) as total FROM animal_vacunas");

    return {
        animales: totalAnimales[0].total,
        citas: totalCitas[0].total,
        vacunas: totalVacunas[0].total
    };
};

Reporte.estadisticasCampanas = async () => {
    const [rows] = await db.query(`
        SELECT 
            c.nombre AS nombre_campana,
            COUNT(ci.id) AS total_inscritos,
            SUM(CASE WHEN ci.estado = 'Visitado' THEN 1 ELSE 0 END) AS total_atendidos,
            SUM(CASE WHEN ci.estado = 'Visitado' THEN ci.cantidad_mascotas ELSE 0 END) AS total_animales_vacunados
        FROM campanas c
        LEFT JOIN campana_inscripciones ci ON c.id = ci.campana_id
        GROUP BY c.id
        ORDER BY c.fecha_inicio DESC
        LIMIT 5
    `);
    return rows;
};

Reporte.citasPorMes = async () => {
    const [rows] = await db.query(`
        SELECT 
            DATE_FORMAT(fecha_cita, '%Y-%m') AS mes,
            COUNT(*) AS total
        FROM citas
        WHERE estado != 'Cancelada'
        GROUP BY mes
        ORDER BY mes ASC
        LIMIT 12
    `);
    return rows;
};
Reporte.diagnosticosComunes = async () => {
    const [rows] = await db.query(`
        SELECT 
            diagnostico, 
            COUNT(*) AS total
        FROM historiales_medicos
        WHERE diagnostico IS NOT NULL AND diagnostico != ''
        GROUP BY diagnostico
        ORDER BY total DESC
        LIMIT 5
    `);
    return rows;
};

Reporte.conteoEspecies = async () => {
    const [rows] = await db.query(`
        SELECT 
            especie, 
            COUNT(*) AS total
        FROM animales
        GROUP BY especie
    `);
    return rows;
};
Reporte.getDatosMapaCalor = async () => {
    const [propietarios] = await db.query(`
        SELECT latitud, longitud 
        FROM propietarios 
        WHERE latitud IS NOT NULL AND longitud IS NOT NULL AND latitud != 0
    `);

    const [casos] = await db.query(`
        SELECT latitud, longitud, tipo 
        FROM casos_reportados 
        WHERE latitud IS NOT NULL AND longitud IS NOT NULL AND latitud != 0
    `);

    return { propietarios, casos };
};
Reporte.getNuevosPropietarios = async () => {
    const [rows] = await db.query(`
        SELECT 
            DATE_FORMAT(creado_en, '%Y-%m') AS mes,
            COUNT(*) AS total
        FROM usuarios
        WHERE rol = 'Propietario'
        GROUP BY mes
        ORDER BY mes ASC
        LIMIT 12
    `);
    return rows;
};
Reporte.getCampanasDetalladas = async () => {
    const [rows] = await db.query(`
        SELECT 
            c.id, 
            c.nombre, 
            c.fecha_inicio, 
            c.fecha_fin,
            c.tipo,        -- <--- AGREGADO
            c.descripcion, -- <--- AGREGADO
            c.latitud,     -- <--- AGREGADO (Para detectar si es Punto Fijo)
            COUNT(ci.id) as total_inscritos,
            SUM(CASE WHEN ci.estado = 'Visitado' THEN 1 ELSE 0 END) as total_atendidos,
            SUM(CASE WHEN u.creado_en >= c.fecha_inicio AND ci.estado = 'Visitado' THEN 1 ELSE 0 END) as prop_nuevos,
            SUM(CASE WHEN u.creado_en < c.fecha_inicio AND ci.estado = 'Visitado' THEN 1 ELSE 0 END) as prop_antiguos
        FROM campanas c
        LEFT JOIN campana_inscripciones ci ON c.id = ci.campana_id
        LEFT JOIN propietarios p ON ci.propietario_id = p.id
        LEFT JOIN usuarios u ON p.usuario_id = u.id
        GROUP BY c.id
        ORDER BY c.fecha_inicio DESC
    `);
    return rows;
};
Reporte.estadisticasCampanas = async () => {
    const [rows] = await db.query(`
        SELECT 
            c.id, 
            c.nombre AS nombre_campana,
            c.fecha_inicio, -- <--- AGREGADO PARA EL SELECTOR
            COUNT(ci.id) AS total_inscritos,
            SUM(CASE WHEN ci.estado = 'Visitado' THEN 1 ELSE 0 END) AS total_atendidos,
            SUM(CASE WHEN ci.estado = 'Visitado' THEN ci.cantidad_mascotas ELSE 0 END) AS total_animales_vacunados
        FROM campanas c
        LEFT JOIN campana_inscripciones ci ON c.id = ci.campana_id
        GROUP BY c.id
        ORDER BY c.fecha_inicio DESC
        LIMIT 10
    `);
    return rows;
};
Reporte.getAsignacionesDetalladas = async () => {
    const [rows] = await db.query(`
        SELECT 
            cv.campana_id,
            u.nombre as veterinario,
            cv.stock_inicial,
            cv.stock_actual, 
            (cv.stock_inicial - cv.stock_actual) as stock_usado
        FROM campana_veterinarios cv
        JOIN usuarios u ON cv.veterinario_id = u.id
    `);
    return rows;
};
Reporte.getConsultasDetalladas = async () => {
    const [rows] = await db.query(`
        SELECT 
            hm.id,
            hm.fecha_consulta AS fecha_cita, -- Alias para que el frontend lo lea igual
            hm.diagnostico,
            hm.tratamiento,
            hm.peso,
            hm.notas AS motivo, -- Usamos las notas como contexto/motivo
            'Completada' as estado,
            a.nombre AS mascota,
            a.especie,
            u_vet.nombre AS veterinario,
            u_prop.nombre AS propietario
        FROM historiales_medicos hm
        JOIN animales a ON hm.animal_id = a.id
        JOIN usuarios u_vet ON hm.veterinario_id = u_vet.id
        JOIN propietarios p ON a.propietario_id = p.id
        JOIN usuarios u_prop ON p.usuario_id = u_prop.id
        ORDER BY hm.fecha_consulta DESC
        LIMIT 100
    `);
    return rows;
};
Reporte.getDiagnosticosDetallados = async () => {
    const [rows] = await db.query(`
        SELECT 
            hm.diagnostico,
            COUNT(*) as total,
            -- Distribución por especie
            SUM(CASE WHEN a.especie = 'Perro' THEN 1 ELSE 0 END) as perros,
            SUM(CASE WHEN a.especie = 'Gato' THEN 1 ELSE 0 END) as gatos,
            
            -- AQUÍ ESTÁ LA MEJORA: Concatenamos "Mascota (Dueño)"
            -- Usamos DISTINCT para no repetir si el mismo perro vino 2 veces por lo mismo
            SUBSTRING_INDEX(
                GROUP_CONCAT(
                    DISTINCT CONCAT(a.nombre, ' (', u_prop.nombre, ')') 
                    ORDER BY hm.fecha_consulta DESC SEPARATOR ', '
                ), 
                ', ', 5
            ) as pacientes_recientes,

            MAX(hm.fecha_consulta) as ultima_fecha
        FROM historiales_medicos hm
        JOIN animales a ON hm.animal_id = a.id
        JOIN propietarios p ON a.propietario_id = p.id
        JOIN usuarios u_prop ON p.usuario_id = u_prop.id
        GROUP BY hm.diagnostico
        ORDER BY total DESC
        LIMIT 50
    `);
    return rows;
};
Reporte.getPoblacionDetallada = async () => {
    const [resumen] = await db.query(`
        SELECT 
            especie,
            COUNT(*) as total,
            SUM(CASE WHEN sexo = 'Macho' THEN 1 ELSE 0 END) as machos,
            SUM(CASE WHEN sexo = 'Hembra' THEN 1 ELSE 0 END) as hembras,
            ROUND(AVG(peso), 2) as peso_promedio
        FROM animales
        WHERE estado = 'Activo'
        GROUP BY especie
    `);

    const [razas] = await db.query(`
        SELECT especie, raza, COUNT(*) as total
        FROM animales
        WHERE estado = 'Activo' AND raza IS NOT NULL AND raza != ''
        GROUP BY especie, raza
        ORDER BY total DESC
        LIMIT 10
    `);

    return { resumen, razas };
};
Reporte.getPropietariosDetallados = async () => {
    const [rows] = await db.query(`
        SELECT 
            u.nombre,
            u.email,
            u.ci,
            u.telefono,
            u.creado_en,
            p.direccion,
            COUNT(a.id) as cantidad_mascotas
        FROM usuarios u
        JOIN propietarios p ON u.id = p.usuario_id
        LEFT JOIN animales a ON p.id = a.propietario_id AND a.estado = 'Activo'
        WHERE u.rol = 'Propietario'
        -- CAMBIO AQUÍ: Agregamos todas las columnas no agregadas al GROUP BY
        GROUP BY u.id, u.nombre, u.email, u.ci, u.telefono, u.creado_en, p.direccion
        ORDER BY u.creado_en DESC
    `);
    return rows;
};
Reporte.getCitasOperativas = async () => {
    const [rows] = await db.query(`
        SELECT 
            c.id,
            c.fecha_cita,
            c.estado,
            c.motivo,
            c.notas, -- Aquí suele ir la razón de cancelación o detalles extra
            a.nombre AS mascota,
            a.especie,
            u_prop.nombre AS propietario,
            u_vet.nombre AS veterinario
        FROM citas c
        LEFT JOIN animales a ON c.animal_id = a.id
        LEFT JOIN propietarios p ON c.propietario_id = p.id
        LEFT JOIN usuarios u_prop ON p.usuario_id = u_prop.id
        LEFT JOIN usuarios u_vet ON c.veterinario_id = u_vet.id
        ORDER BY c.fecha_cita DESC
    `);
    return rows;
};
module.exports = Reporte;