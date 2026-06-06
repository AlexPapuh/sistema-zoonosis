const db = require('../config/db');

exports.getHorarioNormal = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM configuracion_horario LIMIT 1");
        res.json(rows[0] || {});
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al obtener horario" });
    }
};

exports.updateHorarioNormal = async (req, res) => {
    try {
        const { 
            apertura_manana, 
            cierre_manana, 
            apertura_tarde, 
            cierre_tarde, 
            dias_atencion 
        } = req.body;

        await db.query(
            `INSERT INTO configuracion_horario 
             (id, apertura_manana, cierre_manana, apertura_tarde, cierre_tarde, dias_atencion) 
             VALUES (1, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
             apertura_manana = VALUES(apertura_manana),
             cierre_manana = VALUES(cierre_manana),
             apertura_tarde = VALUES(apertura_tarde),
             cierre_tarde = VALUES(cierre_tarde),
             dias_atencion = VALUES(dias_atencion)`,
            [
                apertura_manana, 
                cierre_manana, 
                apertura_tarde, 
                cierre_tarde, 
                dias_atencion
            ]
        );

        res.json({ message: "Horario y días de atención actualizados correctamente" });

    } catch (error) {
        console.error("Error en updateHorarioNormal:", error);
        res.status(500).json({ message: "Error al actualizar horario" });
    }
};

exports.getDiasEspeciales = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM dias_especiales ORDER BY fecha ASC");
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener días especiales" });
    }
};

exports.addDiaEspecial = async (req, res) => {
    try {
        const { fecha, tipo, descripcion, hora_apertura, hora_cierre } = req.body;
        
        await db.query(
            "INSERT INTO dias_especiales (fecha, tipo, descripcion, hora_apertura, hora_cierre) VALUES (?, ?, ?, ?, ?)",
            [fecha, tipo, descripcion, hora_apertura || null, hora_cierre || null]
        );
        res.status(201).json({ message: "Día especial agregado" });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: "Ya existe una configuración para esta fecha" });
        }
        res.status(500).json({ message: "Error al agregar día" });
    }
};

exports.deleteDiaEspecial = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query("DELETE FROM dias_especiales WHERE id = ?", [id]);
        res.json({ message: "Día especial eliminado" });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar" });
    }
};