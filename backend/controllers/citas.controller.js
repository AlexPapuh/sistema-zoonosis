const db = require('../config/db');
const Cita = require('../models/citas.model');
const Propietario = require('../models/propietario.model');

const generarSlots = (horaInicio, horaFin, intervaloMinutos = 30) => {
    const slots = [];
    if (!horaInicio || !horaFin) return slots;
    let actual = new Date(`2000-01-01T${horaInicio}`);
    const fin = new Date(`2000-01-01T${horaFin}`);
    while (actual < fin) {
        const timeString = actual.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        slots.push(timeString);
        actual.setMinutes(actual.getMinutes() + intervaloMinutos);
    }
    return slots;
};

exports.getDisponibilidad = async (req, res) => {
    try {
        const { fecha } = req.query; 
        if (!fecha) return res.status(400).json({ message: "Fecha requerida" });

        const [config] = await db.query("SELECT * FROM configuracion_horario LIMIT 1");
        
        let aperturaMañana = '08:30:00', cierreMañana = '12:30:00';
        let aperturaTarde = '14:30:00', cierreTarde = '18:30:00';
        let diasLaborales = [1, 2, 3, 4, 5];

        if (config.length > 0) {
            const h = config[0];
            aperturaMañana = h.apertura_manana; cierreMañana = h.cierre_manana;
            aperturaTarde = h.apertura_tarde; cierreTarde = h.cierre_tarde;
            
            if (h.dias_atencion) {
                diasLaborales = h.dias_atencion.split(',').map(Number);
            }
        }

        const fechaObj = new Date(fecha + 'T00:00:00');
        const diaSemana = fechaObj.getDay();

        if (!diasLaborales.includes(diaSemana)) {
            return res.json({ 
                horario: "Día No Laboral", 
                slots: [] 
            });
        }

        let mensajeEstado = "Horario Normal"; 

        const [diasEsp] = await db.query("SELECT * FROM dias_especiales WHERE fecha = ?", [fecha]);
        
        if (diasEsp.length > 0) {
            const especial = diasEsp[0];
            
            if (especial.tipo === 'Feriado') {
                const textoMostrar = especial.descripcion ? especial.descripcion : "Cerrado por Feriado";
                return res.json({ horario: textoMostrar, slots: [] });

            } else if (especial.tipo === 'Horario Continuo') {
                mensajeEstado = especial.descripcion ? especial.descripcion : "Horario Continuo";
                if (especial.hora_apertura && especial.hora_cierre) {
                    aperturaMañana = especial.hora_apertura; 
                    cierreMañana = especial.hora_cierre;
                    aperturaTarde = null; 
                    cierreTarde = null;
                }
            }
        }

        let slotsTotales = [];
        slotsTotales = slotsTotales.concat(generarSlots(aperturaMañana, cierreMañana));
        slotsTotales = slotsTotales.concat(generarSlots(aperturaTarde, cierreTarde));

        const [ocupadas] = await db.query("SELECT DATE_FORMAT(fecha_cita, '%H:%i') as hora FROM citas WHERE DATE(fecha_cita) = ? AND estado != 'Cancelada'", [fecha]);
        const horasOcupadas = ocupadas.map(c => c.hora);

        const disponibilidad = slotsTotales.map(slot => ({
            hora: slot,
            estado: horasOcupadas.includes(slot) ? 'ocupado' : 'libre'
        }));

        res.json({ horario: mensajeEstado, slots: disponibilidad });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al calcular disponibilidad" });
    }
};

exports.getResumenMensual = async (req, res) => {
    try {
        const { year, month } = req.query; 
        const [especiales] = await db.query("SELECT * FROM dias_especiales WHERE YEAR(fecha) = ? AND MONTH(fecha) = ?", [year, month]);
        
        const [concurridos] = await db.query(
            `SELECT DATE_FORMAT(fecha_cita, '%Y-%m-%d') as fecha, COUNT(*) as total 
             FROM citas 
             WHERE YEAR(fecha_cita) = ? AND MONTH(fecha_cita) = ? AND estado != 'Cancelada' 
             GROUP BY DATE_FORMAT(fecha_cita, '%Y-%m-%d') 
             HAVING total >= 3`,
            [year, month]
        );
        res.json({ especiales, concurridos });
    } catch (error) {
        console.error("Error resumen mensual:", error);
        res.status(500).json({ message: "Error al obtener datos del calendario" });
    }
};

exports.createCita = async (req, res) => {
    try {
      const { animal_id, fecha_cita, motivo, notas, nombre_mascota_temp, propietario_id: propIdBody } = req.body;
      
      const fechaObj = new Date(fecha_cita);
      const diaSemana = fechaObj.getDay();

      const [config] = await db.query("SELECT dias_atencion FROM configuracion_horario LIMIT 1");
      
      let diasPermitidos = [1, 2, 3, 4, 5]; 
      if (config.length > 0 && config[0].dias_atencion) {
          diasPermitidos = config[0].dias_atencion.split(',').map(Number);
      }

      if (!diasPermitidos.includes(diaSemana)) {
          return res.status(400).json({ 
              message: 'El centro no atiende este día de la semana según la configuración actual.' 
          });
      }

      const [existe] = await db.query(
          "SELECT id FROM citas WHERE fecha_cita = ? AND estado != 'Cancelada'",
          [fecha_cita]
      );
      if (existe.length > 0) {
          return res.status(400).json({ message: 'Este horario ya fue reservado por otra persona.' });
      }
  
      let veterinario_id = null;
      let propietario_id = propIdBody;
      let estado = 'Pendiente'; 
  
      if (req.user.rol === 'Propietario') {
          const perfil = await Propietario.getByUserId(req.user.id);
          if (!perfil) return res.status(403).json({ message: 'No tienes perfil de propietario.' });
          propietario_id = perfil.id;
      } else {
          estado = 'Confirmada';
          if (req.user.rol === 'Veterinario') veterinario_id = req.user.id;
          if (req.body.veterinario_id) veterinario_id = req.body.veterinario_id;
      }
  
      if ((!animal_id && !nombre_mascota_temp) || !fecha_cita || !motivo || !propietario_id) {
          return res.status(400).json({ message: 'Faltan datos. Si la mascota no está registrada, escribe su nombre.' });
      }
  
      let finalAnimalId = animal_id || null;
      let finalNotas = notas || '';
      
      if (!finalAnimalId && nombre_mascota_temp) {
          finalNotas = `[PACIENTE NUEVO: ${nombre_mascota_temp}] - ${finalNotas}`;
      }
  
      const newCita = await Cita.create(finalAnimalId, propietario_id, veterinario_id, fecha_cita, motivo, finalNotas, estado);
      res.status(201).json({ message: 'Cita creada exitosamente', id: newCita.id, estado });
  
    } catch (error) {
      console.error('Error en createCita:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
};

exports.getCitasPropietario = async (req, res) => {
    try {
        const perfil = await Propietario.getByUserId(req.user.id);
        if (!perfil) return res.status(403).json({ message: 'Sin perfil.' });
        const citas = await Cita.getByPropietarioId(perfil.id);
        res.status(200).json(citas);
    } catch (error) { res.status(500).json({ message: 'Error interno' }); }
};

exports.getCitasAgenda = async (req, res) => {
    try {
        const { fecha, estado } = req.query; 
        let citas;
        if (req.user.rol === 'Veterinario') {
             citas = await Cita.getAll(req.user.id, req.user.rol); 
        } else {
             citas = await Cita.getAll(null, 'Admin');
        }
        
        if (fecha) {
            citas = citas.filter(c => {
                if (!c.fecha_cita) return false;
                const fechaCitaStr = new Date(c.fecha_cita).toISOString().split('T')[0];
                return fechaCitaStr === fecha;
            });
        }
        if (estado) {
            citas = citas.filter(c => c.estado === estado);
        }
        res.status(200).json(citas);
    } catch (error) {
        console.error("Error obteniendo agenda:", error);
        res.status(500).json({ message: 'Error interno' });
    }
};

exports.updateCita = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado, veterinario_id, notas, fecha_cita, motivo } = req.body;
        
        if (req.user.rol === 'Propietario') {
            if (estado || veterinario_id) return res.status(403).json({ message: 'No tienes permiso.' });
        }

        const success = await Cita.update(id, estado, veterinario_id, notas, fecha_cita, motivo);
        if (!success) return res.status(404).json({ message: 'Cita no encontrada.' });
        res.status(200).json({ message: 'Cita actualizada.' });

    } catch (error) { res.status(500).json({ message: 'Error interno' }); }
};

exports.deleteCita = async (req, res) => {
    try {
        const { id } = req.params;
        const success = await Cita.delete(id);
        if (!success) return res.status(404).json({ message: 'Cita no encontrada.' });
        res.status(200).json({ message: 'Cita eliminada.' });
    } catch (error) { res.status(500).json({ message: 'Error interno' }); }
};

exports.crearHorarioEspecial = async (req, res) => {
    try {
        const { fecha, hora_inicio, hora_fin, es_feriado, descanso_inicio, descanso_fin, nota } = req.body;

        const [existe] = await db.query('SELECT id FROM horarios_especiales WHERE fecha = ?', [fecha]);
        
        if (existe.length > 0) {
            await db.query(
                'UPDATE horarios_especiales SET hora_inicio=?, hora_fin=?, es_feriado=?, descanso_inicio=?, descanso_fin=?, nota=? WHERE fecha=?',
                [hora_inicio, hora_fin, es_feriado, descanso_inicio, descanso_fin, nota, fecha]
            );
            return res.json({ message: 'Horario especial actualizado correctamente.' });
        }

        await db.query(
            'INSERT INTO horarios_especiales (fecha, hora_inicio, hora_fin, es_feriado, descanso_inicio, descanso_fin, nota) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [fecha, hora_inicio, hora_fin, es_feriado, descanso_inicio, descanso_fin, nota]
        );

        res.status(201).json({ message: 'Horario especial configurado.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al guardar configuración.' });
    }
};