const Campana = require('../models/campana.model');
const Propietario = require('../models/propietario.model');
const db = require('../config/db');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

exports.createCampana = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { 
      nombre, descripcion, fecha_inicio, fecha_fin, tipo, 
      latitud, longitud, 
      inventario_id, 
      asignaciones 
    } = req.body;
    
    if (!nombre || !tipo) {
      return res.status(400).json({ message: 'Nombre y tipo son requeridos.' });
    }

    await connection.beginTransaction();

    let stockTotalRequerido = 0;
    let tieneAsignaciones = false;

    if (asignaciones && Array.isArray(asignaciones) && asignaciones.length > 0) {
        tieneAsignaciones = true;
        asignaciones.forEach(a => stockTotalRequerido += parseFloat(a.stock || 0));
    }

    if (inventario_id && stockTotalRequerido > 0) {
      const [rows] = await connection.query('SELECT stock FROM inventario WHERE id = ? FOR UPDATE', [inventario_id]);
      
      if (rows.length === 0) throw new Error('El producto de inventario no existe.');
      
      if (parseFloat(rows[0].stock) < stockTotalRequerido) {
        throw new Error(`Stock insuficiente en almacén. Tienes ${rows[0].stock}, necesitas repartir ${stockTotalRequerido}.`);
      }
      
      await connection.query('UPDATE inventario SET stock = stock - ? WHERE id = ?', [stockTotalRequerido, inventario_id]);
    }
    
    const [campRes] = await connection.query(
      'INSERT INTO campanas (nombre, descripcion, fecha_inicio, fecha_fin, tipo, latitud, longitud, inventario_id, stock_asignado, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [nombre, descripcion, fecha_inicio, fecha_fin, tipo, latitud, longitud, inventario_id, stockTotalRequerido, 'Planificada']
    );
    const campanaId = campRes.insertId;

    if (tieneAsignaciones) {
        for (const asig of asignaciones) {
            if (asig.veterinario_id && asig.stock > 0) {
                await connection.query(
                    'INSERT INTO campana_veterinarios (campana_id, veterinario_id, stock_inicial, stock_actual) VALUES (?, ?, ?, ?)',
                    [campanaId, asig.veterinario_id, asig.stock, asig.stock]
                );
            }
        }
    }

    await connection.commit();
    res.status(201).json({ message: 'Campaña creada y equipos asignados correctamente', id: campanaId });

  } catch (error) {
    await connection.rollback();
    console.error('Error en createCampana:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  } finally {
    connection.release();
  }
};

exports.getAllCampanas = async (req, res) => {
  try {
    const usuarioId = req.user.id; 
    const campanas = await Campana.getAll(usuarioId);
    res.status(200).json(campanas);
  } catch (error) {
    console.error('Error en getAllCampanas:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

exports.getCampanaById = async (req, res) => {
    try {
        const { id } = req.params;
        let campana;

        if (req.user.rol === 'Veterinario') {
            campana = await Campana.getByIdAndVeterinario(id, req.user.id);
            if (!campana) {
                return res.status(403).json({ message: 'No estás asignado a esta campaña.' });
            }
        } else {
            campana = await Campana.getById(id);
        }

        if (!campana) {
          return res.status(404).json({ message: 'Campaña no encontrada' });
        }
        
        res.status(200).json(campana);
      } catch (error) {
        console.error('Error en getCampanaById:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
      }
};

exports.getMisCampanasVete = async (req, res) => {
    try {
        const veterinarioId = req.user.id;
        const campanas = await Campana.getByVeterinarioId(veterinarioId);
        res.status(200).json(campanas);
    } catch (error) {
        console.error('Error en getMisCampanasVete:', error);
        res.status(500).json({ message: 'Error al obtener asignaciones' });
    }
};

exports.updateCampana = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;
    const { nombre, descripcion, fecha_inicio, fecha_fin, tipo, latitud, longitud, inventario_id, asignaciones } = req.body;
    
    await connection.beginTransaction();

    await connection.query(
        'UPDATE campanas SET nombre = ?, descripcion = ?, fecha_inicio = ?, fecha_fin = ?, tipo = ?, latitud = ?, longitud = ? WHERE id = ?',
        [nombre, descripcion, fecha_inicio, fecha_fin, tipo, latitud, longitud, id]
    );

    if (asignaciones && Array.isArray(asignaciones) && inventario_id) {
        const [rowsActuales] = await connection.query('SELECT * FROM campana_veterinarios WHERE campana_id = ?', [id]);

        for (const nuevaAsig of asignaciones) {
            const vetId = parseInt(nuevaAsig.veterinario_id);
            const nuevoStockAsignado = parseFloat(nuevaAsig.stock);
            
            const asignacionExistente = rowsActuales.find(r => r.veterinario_id === vetId);

            if (asignacionExistente) {
                const stockInicialAnterior = parseFloat(asignacionExistente.stock_inicial);
                const diferencia = nuevoStockAsignado - stockInicialAnterior;

                if (diferencia !== 0) {
                    if (diferencia > 0) {
                        const [invCheck] = await connection.query('SELECT stock FROM inventario WHERE id = ? FOR UPDATE', [inventario_id]);
                        if (parseFloat(invCheck[0].stock) < diferencia) {
                            throw new Error(`Stock insuficiente en almacén para recargar ${diferencia} unidades.`);
                        }
                        await connection.query('UPDATE inventario SET stock = stock - ? WHERE id = ?', [diferencia, inventario_id]);
                    } else {
                        await connection.query('UPDATE inventario SET stock = stock + ? WHERE id = ?', [Math.abs(diferencia), inventario_id]);
                    }

                    await connection.query(
                        'UPDATE campana_veterinarios SET stock_inicial = ?, stock_actual = stock_actual + ? WHERE campana_id = ? AND veterinario_id = ?',
                        [nuevoStockAsignado, diferencia, id, vetId]
                    );
                }

            } else {
                const [invCheck] = await connection.query('SELECT stock FROM inventario WHERE id = ? FOR UPDATE', [inventario_id]);
                if (parseFloat(invCheck[0].stock) < nuevoStockAsignado) {
                    throw new Error(`Stock insuficiente para agregar nuevo veterinario (${nuevoStockAsignado}).`);
                }
                
                await connection.query('UPDATE inventario SET stock = stock - ? WHERE id = ?', [nuevoStockAsignado, inventario_id]);

                await connection.query(
                    'INSERT INTO campana_veterinarios (campana_id, veterinario_id, stock_inicial, stock_actual) VALUES (?, ?, ?, ?)',
                    [id, vetId, nuevoStockAsignado, nuevoStockAsignado]
                );
            }
        }

        const [sumRows] = await connection.query('SELECT SUM(stock_inicial) as total FROM campana_veterinarios WHERE campana_id = ?', [id]);
        const nuevoTotalGlobal = sumRows[0].total || 0;
        
        await connection.query('UPDATE campanas SET stock_asignado = ? WHERE id = ?', [nuevoTotalGlobal, id]);
    }

    await connection.commit();
    res.status(200).json({ message: 'Campaña actualizada y stock recargado correctamente.' });

  } catch (error) {
    await connection.rollback();
    console.error('Error en updateCampana:', error);
    res.status(500).json({ message: 'Error al actualizar', error: error.message });
  } finally {
    connection.release();
  }
};

exports.deleteCampana = async (req, res) => {
  try {
    const success = await Campana.delete(req.params.id);
    if (!success) return res.status(404).json({ message: 'Campaña no encontrada' });
    res.status(200).json({ message: 'Campaña eliminada' });
  } catch (error) {
    console.error('Error en deleteCampana:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

exports.iniciarCampana = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { id } = req.params;
        
        const [rows] = await connection.query('SELECT estado FROM campanas WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Campaña no encontrada' });
        
        if (rows[0].estado !== 'Planificada') {
            return res.status(400).json({ message: 'Solo se pueden iniciar campañas planificadas.' });
        }

        await connection.query("UPDATE campanas SET estado = 'Ejecucion' WHERE id = ?", [id]);
        
        res.status(200).json({ message: '¡Campaña iniciada!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al iniciar campaña' });
    } finally {
        connection.release();
    }
};

exports.finalizarCampana = async (req, res) => {
    const connection = await db.getConnection();
    const { id: campana_id } = req.params;

    try {
        await connection.beginTransaction();
        
        const [campRows] = await connection.query('SELECT inventario_id, estado FROM campanas WHERE id = ? FOR UPDATE', [campana_id]);
        if (campRows.length === 0) throw new Error('Campaña no encontrada.');
        
        const { inventario_id, estado } = campRows[0];
        if (estado === 'Finalizada') throw new Error('La campaña ya está finalizada.');

        const [sumRows] = await connection.query('SELECT SUM(stock_actual) as total_remanente FROM campana_veterinarios WHERE campana_id = ?', [campana_id]);
        const stockDevolver = parseFloat(sumRows[0].total_remanente || 0);

        if (inventario_id && stockDevolver > 0) {
            await connection.query('UPDATE inventario SET stock = stock + ? WHERE id = ?', [stockDevolver, inventario_id]);
        }
        
        await connection.query("UPDATE campanas SET estado = 'Finalizada', stock_asignado = 0 WHERE id = ?", [campana_id]);
        await connection.query("UPDATE campana_veterinarios SET stock_actual = 0 WHERE campana_id = ?", [campana_id]);

        await connection.commit();
        res.status(200).json({ message: 'Campaña finalizada.', stock_devuelto: stockDevolver });
    } catch (error) {
        await connection.rollback();
        console.error('Error en finalizarCampana:', error);
        res.status(500).json({ message: 'Error interno', error: error.message });
    } finally {
        connection.release();
    }
};

exports.registrarAtencion = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params; 
        const id_campana = id; 
        const veterinario_id = req.user.id; 

        const { 
            propietario_id, 
            nombrePropietario, telefonoPropietario, emailPropietario, direccionPropietario, latitudPropietario, longitudPropietario,
            animal_id, 
            nombreMascota, especie, raza, sexo, fechaNacimiento, peso, 
            cantidad,
            inscripcion_id 
        } = req.body;

        const pesoFinal = (peso === '' || peso === undefined || peso === null) ? null : peso;
        const latFinal = latitudPropietario === '' ? null : latitudPropietario;
        const lngFinal = longitudPropietario === '' ? null : longitudPropietario;

        let finalPropietarioId = propietario_id; 
        let credenciales = null;

        if (!finalPropietarioId) {
            const [existingUser] = await connection.query("SELECT id FROM usuarios WHERE email = ?", [emailPropietario]);
            
            if (existingUser.length > 0) {
                 const [existingProp] = await connection.query("SELECT id FROM propietarios WHERE usuario_id = ?", [existingUser[0].id]);
                 
                 if (existingProp.length > 0) {
                     finalPropietarioId = existingProp[0].id;
                 } else {
                     const [propResult] = await connection.query(
                        "INSERT INTO propietarios (usuario_id, telefono, direccion, latitud, longitud) VALUES (?, ?, ?, ?, ?)",
                        [existingUser[0].id, telefonoPropietario, direccionPropietario, latFinal, lngFinal]
                    );
                    finalPropietarioId = propResult.insertId;
                 }
            } else {
                const rawPassword = telefonoPropietario ? telefonoPropietario.toString() : '123456';
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(rawPassword, salt);

                const [userResult] = await connection.query(
                    "INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, 'Propietario')",
                    [nombrePropietario, emailPropietario, hashedPassword]
                );
                const newUserId = userResult.insertId;

                const [propResult] = await connection.query(
                    "INSERT INTO propietarios (usuario_id, telefono, direccion, latitud, longitud) VALUES (?, ?, ?, ?, ?)",
                    [newUserId, telefonoPropietario, direccionPropietario, latFinal, lngFinal]
                );
                finalPropietarioId = propResult.insertId;
                credenciales = { email: emailPropietario, password_temporal: rawPassword };
            }
        } else {
            if (latFinal && lngFinal) {
                await connection.query("UPDATE propietarios SET latitud = ?, longitud = ? WHERE id = ?", [latFinal, lngFinal, finalPropietarioId]);
            }
        }

        let finalAnimalId = animal_id;
        
        if (!finalAnimalId) {
            const [animalResult] = await connection.query(
                "INSERT INTO animales (propietario_id, nombre, especie, raza, sexo, fecha_nacimiento, peso) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [finalPropietarioId, nombreMascota, especie, raza, sexo, fechaNacimiento, pesoFinal]
            );
            finalAnimalId = animalResult.insertId;
        } else {
            if (pesoFinal) {
                await connection.query("UPDATE animales SET peso = ? WHERE id = ?", [pesoFinal, finalAnimalId]);
            }
        }

        const dosisUsar = parseFloat(cantidad);

        const [vetStockRows] = await connection.query(
            "SELECT stock_actual FROM campana_veterinarios WHERE campana_id = ? AND veterinario_id = ? FOR UPDATE", 
            [id_campana, veterinario_id]
        );

        if (vetStockRows.length === 0) {
            throw new Error('No estás asignado a esta campaña o no tienes stock.');
        }

        const stockVetActual = parseFloat(vetStockRows[0].stock_actual);

        if (stockVetActual < dosisUsar) {
            throw new Error(`Tu stock personal es insuficiente. Tienes ${stockVetActual}, necesitas ${dosisUsar}.`);
        }

        if (inscripcion_id) {
             await connection.query(
                `UPDATE campana_inscripciones SET 
                    propietario_id = ?, 
                    cantidad_mascotas = cantidad_mascotas + 1, 
                    estado = 'Visitado', 
                    fecha_inscripcion = NOW() 
                WHERE id = ?`,
                [finalPropietarioId, inscripcion_id]
            );
        } else {
            await connection.query(
                `INSERT INTO campana_inscripciones 
                (campana_id, propietario_id, direccion_contacto, cantidad_mascotas, estado, fecha_inscripcion) 
                VALUES (?, ?, ?, 1, 'Visitado', NOW())
                ON DUPLICATE KEY UPDATE 
                estado = 'Visitado', 
                cantidad_mascotas = cantidad_mascotas + 1,
                fecha_inscripcion = NOW()`,
                [id_campana, finalPropietarioId, direccionPropietario || 'En punto fijo']
            );
        }

        const nuevoStockVet = stockVetActual - dosisUsar;
        
        await connection.query(
            "UPDATE campana_veterinarios SET stock_actual = ? WHERE campana_id = ? AND veterinario_id = ?",
            [nuevoStockVet, id_campana, veterinario_id]
        );

        await connection.commit();

        res.status(201).json({
            message: 'Atención registrada correctamente.',
            nuevo_stock: nuevoStockVet, 
            credenciales: credenciales,
            propietario_id: finalPropietarioId 
        });

    } catch (error) {
        await connection.rollback();
        console.error("Error en registrarAtencion:", error);
        res.status(500).json({ message: error.message || 'Error al registrar atención' });
    } finally {
        connection.release();
    }
};

exports.inscribirACampana = async (req, res) => {
  const connection = await db.getConnection(); 
  try {
    await connection.beginTransaction();

    const { id: campana_id } = req.params;
    const usuario_id = req.user.id; 
    
    const { direccion_contacto, cantidad_mascotas, latitud, longitud, actualizar_perfil } = req.body;

    if (!direccion_contacto) {
        return res.status(400).json({ message: 'Se requiere una dirección.' });
    }

    const cantidadFinal = parseInt(cantidad_mascotas) || 1;

    const [propRows] = await connection.query('SELECT id, latitud, longitud FROM propietarios WHERE usuario_id = ?', [usuario_id]);
    if (propRows.length === 0) {
        return res.status(404).json({ message: 'Perfil no encontrado.' });
    }
    const propietario = propRows[0];
    const propietario_id = propietario.id;

    const debeActualizar = actualizar_perfil || (!propietario.latitud || !propietario.longitud);

    if (debeActualizar && latitud && longitud) {
        await connection.query(
            'UPDATE propietarios SET direccion = ?, latitud = ?, longitud = ? WHERE id = ?',
            [direccion_contacto, latitud, longitud, propietario_id]
        );
    }

    await connection.query(
        'INSERT INTO campana_inscripciones (campana_id, propietario_id, direccion_contacto, cantidad_mascotas, latitud, longitud, fecha_inscripcion) VALUES (?, ?, ?, ?, ?, ?, NOW())',
        [campana_id, propietario_id, direccion_contacto, cantidadFinal, latitud, longitud]
    );

    await connection.commit();
    
    const msg = debeActualizar 
        ? 'Inscripción exitosa y perfil actualizado.' 
        : 'Inscripción exitosa.';
        
    res.status(201).json({ message: msg });

  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
       return res.status(400).json({ message: 'Ya estás inscrito en esta campaña.' });
    }
    console.error('Error en inscribirACampana:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  } finally {
    connection.release();
  }
};

exports.inscribirPublico = async (req, res) => {
    try {
        const { campana_id, nombre, ci, celular, direccion, cantidad, detalles_animal, latitud, longitud } = req.body;

        if (!campana_id || !nombre || !ci || !celular) {
            return res.status(400).json({ message: "Faltan datos obligatorios (Nombre, CI o Celular)." });
        }

        const query = `
            INSERT INTO campana_inscripciones 
            (campana_id, propietario_id, nombre_contacto, ci_contacto, celular_contacto, direccion_contacto, cantidad_mascotas, detalles_animal, latitud, longitud, fecha_inscripcion, estado)
            VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'Pendiente')
        `;

        await db.query(query, [
            campana_id, 
            nombre, 
            ci, 
            celular, 
            direccion || null,         
            cantidad || 1,              
            detalles_animal || 'Sin detalles', 
            latitud || null,            
            longitud || null
        ]);

        res.status(201).json({ message: "¡Inscripción exitosa! Te esperamos en la campaña." });

    } catch (error) {
        console.error("Error en inscripción pública:", error);
        res.status(500).json({ message: "Error al procesar la inscripción." });
    }
};

exports.getInscripcionesDeCampana = async (req, res) => {
    try {
        const { id } = req.params; 

        const sql = `
            SELECT 
                ci.id,
                ci.campana_id,
                ci.propietario_id,
                u.id as usuario_id,
                ci.latitud,
                ci.longitud,
                ci.direccion_contacto,
                ci.cantidad_mascotas,
                ci.detalles_animal,
                ci.estado,
                ci.fecha_inscripcion,
                COALESCE(ci.nombre_contacto, u.nombre) as nombre_final,
                COALESCE(ci.celular_contacto, p.telefono) as telefono_final,
                ci.ci_contacto
            FROM campana_inscripciones ci
            LEFT JOIN propietarios p ON ci.propietario_id = p.id
            LEFT JOIN usuarios u ON p.usuario_id = u.id
            WHERE ci.campana_id = ?
        `;

        const [rows] = await db.query(sql, [id]);
        
        if (rows.length === 0) return res.status(200).json([]);
        
        res.status(200).json(rows);

    } catch (error) {
        console.error('Error en getInscripcionesDeCampana:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

exports.marcarAtendido = async (req, res) => {
    try {
        const { id } = req.params;

        await db.query("UPDATE campana_inscripciones SET estado = 'Visitado' WHERE id = ?", [id]);

        res.status(200).json({ message: 'Domicilio marcado como visitado.' });
    } catch (error) {
        console.error("Error SQL:", error);
        res.status(500).json({ message: 'Error al actualizar estado en la BD.' });
    }
};

exports.getCampanasPublicas = async (req, res) => {
    try {
        const sql = `
            SELECT * FROM campanas 
            WHERE estado IN ('Planificada', 'Activa','Ejecucion') 
            AND fecha_fin >= CURDATE() 
            ORDER BY fecha_inicio ASC
        `;
        const [rows] = await db.query(sql);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al obtener campañas públicas" });
    }
};

exports.inscribirseCampana = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { campana_id, animal_id } = req.body;
        const usuario_id = req.user.id; 

        const [propRows] = await connection.query('SELECT id, direccion FROM propietarios WHERE usuario_id = ?', [usuario_id]);
        
        if (propRows.length === 0) {
            return res.status(404).json({ message: 'No tienes perfil de propietario.' });
        }
        
        const propietario = propRows[0];

        const [mascotaRows] = await connection.query('SELECT nombre, especie FROM animales WHERE id = ?', [animal_id]);
        let detalles = `Mascota ID: ${animal_id}`;
        if (mascotaRows.length > 0) {
            detalles = `${mascotaRows[0].nombre} (${mascotaRows[0].especie})`;
        }

        await connection.query(
            `INSERT INTO campana_inscripciones 
            (campana_id, propietario_id, direccion_contacto, cantidad_mascotas, detalles_animal, estado, fecha_inscripcion) 
            VALUES (?, ?, ?, 1, ?, 'Inscrito', NOW())`,
            [campana_id, propietario.id, propietario.direccion || 'Sin dirección', detalles]
        );

        res.status(200).json({ message: "Inscripción exitosa." });

    } catch (error) {
        console.error("Error en inscribirseCampana:", error);
        res.status(500).json({ message: "Error al procesar la inscripción." });
    } finally {
        connection.release();
    }
};