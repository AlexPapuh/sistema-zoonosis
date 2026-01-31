const db = require('../config/db');

exports.obtenerServicios = async (req, res) => {
    try {
        const [servicios] = await db.query("SELECT * FROM servicios_publicos");
        res.json(servicios);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener servicios" });
    }
};

exports.crearServicio = async (req, res) => {
    const { titulo, descripcion, icono, color } = req.body;
    try {
        await db.query(
            "INSERT INTO servicios_publicos (titulo, descripcion, icono, color) VALUES (?, ?, ?, ?)",
            [titulo, descripcion, icono, color]
        );
        res.json({ message: "Servicio creado" });
    } catch (error) {
        res.status(500).json({ message: "Error al crear" });
    }
};

exports.actualizarServicio = async (req, res) => {
    const { id } = req.params;
    const { titulo, descripcion, icono, color, activo } = req.body;
    try {
        await db.query(
            "UPDATE servicios_publicos SET titulo=?, descripcion=?, icono=?, color=?, activo=? WHERE id=?",
            [titulo, descripcion, icono, color, activo, id]
        );
        res.json({ message: "Servicio actualizado" });
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar" });
    }
};

exports.eliminarServicio = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("DELETE FROM servicios_publicos WHERE id = ?", [id]);
        res.json({ message: "Servicio eliminado" });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar" });
    }
};