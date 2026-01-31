const db = require('../config/db');

const Historial = {};

Historial.registrarConsultaCompleta = async (data) => {
    const connection = await db.getConnection();
    await connection.beginTransaction(); 
    try {
        
        const [resHistorial] = await connection.query(
            'INSERT INTO historiales_medicos (animal_id, veterinario_id, fecha_consulta, diagnostico, tratamiento, notas, cita_id) VALUES (?, ?, NOW(), ?, ?, ?, ?)',
            [data.animal_id, data.veterinario_id, data.diagnostico, data.tratamiento, data.notas, data.cita_id || null]
        );
        const historialId = resHistorial.insertId;

        let vacunaInventarioId = null; 

        if (data.insumosUtilizados && data.insumosUtilizados.length > 0) {
            for (const insumo of data.insumosUtilizados) {
                await connection.query(
                    'UPDATE inventario SET stock = stock - ? WHERE id = ?',
                    [insumo.cantidad, insumo.id]
                );

                
                 await connection.query(
                     'INSERT INTO historial_insumos (historial_id, inventario_id, cantidad) VALUES (?, ?, ?)',
                     [historialId, insumo.id, insumo.cantidad]
                 );

                if (!vacunaInventarioId) vacunaInventarioId = insumo.id;
            }
        }

        if (data.esVacuna && data.fechaProxima) {
            
            await connection.query(
                `INSERT INTO animal_vacunas 
                (animal_id, inventario_id, fecha_aplicacion, fecha_proxima_dosis, notificado) 
                VALUES (?, ?, NOW(), ?, 0)`,
                [
                    data.animal_id, 
                    vacunaInventarioId || null, 
                    data.fechaProxima 
                ]
            );
        }

      
        if (data.cita_id) {
            await connection.query(
                "UPDATE citas SET estado = 'Completada' WHERE id = ?", 
                [data.cita_id]
            );
        }

        await connection.commit();
        return { 
            id: historialId, 
            animal_id: data.animal_id, 
            propietario_id: data.propietario_id 
        };

    } catch (error) {
        await connection.rollback(); 
        console.error("Error en transacción:", error);
        throw error;
    } finally {
        connection.release(); 
    }
};


Historial.getByAnimalId = async (animal_id) => {
    const [rows] = await db.query(`
        SELECT 
            h.*,
            u.nombre AS veterinario_nombre
        FROM historiales_medicos h
        JOIN usuarios u ON h.veterinario_id = u.id
        WHERE h.animal_id = ?
        ORDER BY h.fecha_consulta DESC
    `, [animal_id]);
    return rows;
};

Historial.getById = async (id) => {
    const [rows] = await db.query(`
        SELECT 
            h.*,
            u.nombre AS veterinario_nombre
        FROM historiales_medicos h
        JOIN usuarios u ON h.veterinario_id = u.id
        WHERE h.id = ?
    `, [id]);
    return rows[0];
};

module.exports = Historial;