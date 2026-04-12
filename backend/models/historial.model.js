const db = require('../config/db');
const bcrypt = require('bcryptjs');

class Historial {

    static async registrarConsultaCompleta(data) {
        const connection = await db.getConnection();
        await connection.beginTransaction(); 
        try {

            let finalPropietarioId = data.propietario_id;
            let credenciales = null;

            if (!finalPropietarioId) {
                const [existingUser] = await connection.query("SELECT id FROM usuarios WHERE email = ?", [data.emailPropietario]);
                if (existingUser.length > 0) throw new Error("El correo ya está registrado.");

                const rawPassword = data.telefonoPropietario ? data.telefonoPropietario.toString() : '123456';
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(rawPassword, salt);

                const [userResult] = await connection.query("INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, 'Propietario')", [data.nombrePropietario, data.emailPropietario, hashedPassword]);
                const newUserId = userResult.insertId;

                const latFinal = data.latitudPropietario === '' ? null : data.latitudPropietario;
                const lngFinal = data.longitudPropietario === '' ? null : data.longitudPropietario;

                const [propResult] = await connection.query("INSERT INTO propietarios (usuario_id, telefono, direccion, latitud, longitud) VALUES (?, ?, ?, ?, ?)", [newUserId, data.telefonoPropietario, data.direccionPropietario, latFinal, lngFinal]);
                finalPropietarioId = propResult.insertId;
                credenciales = { email: data.emailPropietario, password_temporal: rawPassword };
            }

            let finalAnimalId = data.animal_id;
            if (!finalAnimalId) {
                const [animalResult] = await connection.query("INSERT INTO animales (propietario_id, nombre, especie, raza, sexo, fecha_nacimiento, peso) VALUES (?, ?, ?, ?, ?, ?, ?)", [finalPropietarioId, data.nombreMascota, data.especie, data.raza, data.sexo, data.fechaNacimiento, data.peso]);
                finalAnimalId = animalResult.insertId;
            } else {
                if (data.peso) await connection.query("UPDATE animales SET peso = ? WHERE id = ?", [data.peso, finalAnimalId]);
            }

            const [resHistorial] = await connection.query(
                'INSERT INTO historiales_medicos (animal_id, veterinario_id, fecha_consulta, diagnostico, tratamiento, notas, peso) VALUES (?, ?, NOW(), ?, ?, ?, ?)',
                [finalAnimalId, data.veterinario_id, data.diagnostico, data.tratamiento, data.notas, data.peso || null]
            );
            const historialId = resHistorial.insertId;

            let vacunaInventarioId = null; 
            if (data.insumosUtilizados && data.insumosUtilizados.length > 0) {
                for (const insumo of data.insumosUtilizados) {
                    await connection.query('UPDATE inventario SET stock = stock - ? WHERE id = ?', [insumo.cantidad, insumo.id]);
                    
                    await connection.query('INSERT INTO historial_insumos (historial_id, inventario_id, cantidad) VALUES (?, ?, ?)', [historialId, insumo.id, insumo.cantidad]);

                    if (!vacunaInventarioId) vacunaInventarioId = insumo.id;
                }
            }


            if (data.esVacuna && data.fechaProxima) {
                await connection.query(
                    `INSERT INTO animal_vacunas (animal_id, inventario_id, fecha_aplicacion, fecha_proxima_dosis, notificado, veterinario_id) VALUES (?, ?, NOW(), ?, 0, ?)`,
                    [finalAnimalId, vacunaInventarioId || null, data.fechaProxima, data.veterinario_id]
                );
            }
          
            if (data.cita_id) {
                await connection.query("UPDATE citas SET estado = 'Completada' WHERE id = ?", [data.cita_id]);
            }

            await connection.commit();
            return { id: historialId, animal_id: finalAnimalId, propietario_id: finalPropietarioId, credenciales: credenciales };

        } catch (error) {
            await connection.rollback(); 
            console.error("Error en transacción:", error);
            throw error;
        } finally {
            connection.release(); 
        }
    }
static async registrarAtencionCampana(data) {
        const connection = await db.getConnection();
        await connection.beginTransaction();
        try {
            const [vacunaData] = await connection.query("SELECT stock, nombre, unidad FROM inventario WHERE id = ?", [data.vacuna_id]);
            if (vacunaData.length === 0) throw new Error("Vacuna no encontrada en inventario");
            
            const vacuna = vacunaData[0];
            if (parseFloat(vacuna.stock) < 1) throw new Error(`Stock insuficiente de ${vacuna.nombre}`);

            await connection.query("UPDATE inventario SET stock = stock - 1 WHERE id = ?", [data.vacuna_id]);

            const tratamientoTexto = `Aplicación de: ${vacuna.nombre} (Campaña: ${data.nombre_campana})`;
            
            const [resHistorial] = await connection.query(
                'INSERT INTO historiales_medicos (animal_id, veterinario_id, fecha_consulta, diagnostico, tratamiento, notas, peso) VALUES (?, ?, NOW(), ?, ?, ?, ?)',
                [
                    data.animal_id, 
                    data.veterinario_id, 
                    `Atención en Campaña: ${data.tipo_campana}`, 
                    tratamientoTexto,
                    "Registro automático desde módulo de campañas.",
                    data.peso || null
                ]
            );
            const historialId = resHistorial.insertId;

            await connection.query(
                'INSERT INTO historial_insumos (historial_id, inventario_id, cantidad) VALUES (?, ?, ?)',
                [historialId, data.vacuna_id, 1]
            );

            let fechaProxima = new Date();
            fechaProxima.setFullYear(fechaProxima.getFullYear() + 1);  
            
            await connection.query(
                `INSERT INTO animal_vacunas 
                (animal_id, inventario_id, fecha_aplicacion, fecha_proxima_dosis, notificado, veterinario_id) 
                VALUES (?, ?, NOW(), ?, 0, ?)`,
                [data.animal_id, data.vacuna_id, fechaProxima, data.veterinario_id]
            );

            await connection.commit();
            return { id: historialId };

        } catch (error) {
            await connection.rollback();
            console.error("Error en registrarAtencionCampana:", error);
            throw error;
        } finally {
            connection.release();
        }
    }

    static async getByAnimalId(animal_id) {
        const query = `
            SELECT 
                h.*,
                u.nombre AS veterinario_nombre,
                COALESCE(
                    (
                        SELECT JSON_ARRAYAGG(
                            JSON_OBJECT('nombre', inv.nombre, 'cantidad', hi.cantidad, 'unidad', inv.unidad)
                        )
                        FROM historial_insumos hi
                        JOIN inventario inv ON hi.inventario_id = inv.id
                        WHERE hi.historial_id = h.id
                    ), 
                '[]') as insumos
            FROM historiales_medicos h
            LEFT JOIN usuarios u ON h.veterinario_id = u.id
            WHERE h.animal_id = ?
            ORDER BY h.fecha_consulta DESC
        `;
        const [rows] = await db.query(query, [animal_id]);
        return rows;
    }

    static async getById(id) {
        const query = `
            SELECT 
                h.*,
                u.nombre AS veterinario_nombre,
                COALESCE(
                    (
                        SELECT JSON_ARRAYAGG(
                            JSON_OBJECT('nombre', inv.nombre, 'cantidad', hi.cantidad, 'unidad', inv.unidad)
                        )
                        FROM historial_insumos hi
                        JOIN inventario inv ON hi.inventario_id = inv.id
                        WHERE hi.historial_id = h.id
                    ), 
                '[]') as insumos
            FROM historiales_medicos h
            LEFT JOIN usuarios u ON h.veterinario_id = u.id
            WHERE h.id = ?
        `;
        const [rows] = await db.query(query, [id]);
        return rows[0];
    }

    static async getAll() {
        const [rows] = await db.query('SELECT * FROM historiales_medicos');
        return rows;
    }

    static async delete(id) {
        const [result] = await db.query('DELETE FROM historiales_medicos WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = Historial;