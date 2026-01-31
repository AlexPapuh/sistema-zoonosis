const Reporte = require('../models/reporte.model');
exports.getReporteCampanasFull = async (req, res) => {
    try {
        const campanas = await Reporte.getCampanasDetalladas();
        const asignaciones = await Reporte.getAsignacionesDetalladas();

        const reporteFinal = campanas.map(c => {
            const vets = asignaciones.filter(a => a.campana_id === c.id);
            const totalDosisAsignadas = vets.reduce((acc, v) => acc + parseFloat(v.stock_inicial || 0), 0);
            const totalDosisUsadas = vets.reduce((acc, v) => acc + parseFloat(v.stock_usado || 0), 0);
            const totalDosisSobrantes = vets.reduce((acc, v) => acc + parseFloat(v.stock_actual || 0), 0);

            return {
                ...c,
                veterinarios: vets, 
                resumen_stock: {
                    asignadas: totalDosisAsignadas,
                    usadas: totalDosisUsadas,
                    sobrantes: totalDosisSobrantes
                }
            };
        });

        res.status(200).json(reporteFinal);

    } catch (error) {
        console.error('Error en getReporteCampanasFull:', error);
        res.status(500).json({ message: 'Error generando reporte detallado' });
    }
};
exports.getReporteConsultas = async (req, res) => {
    try {
        const consultas = await Reporte.getConsultasDetalladas();
        res.status(200).json(consultas);
    } catch (error) {
        console.error('Error en getReporteConsultas:', error);
        res.status(500).json({ message: 'Error al obtener historial de consultas' });
    }
};
exports.getReporteDiagnosticosFull = async (req, res) => {
    try {
        const data = await Reporte.getDiagnosticosDetallados();
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error obteniendo reporte de diagnósticos' });
    }
};
exports.getReportePoblacionFull = async (req, res) => {
    try {
        const data = await Reporte.getPoblacionDetallada();
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error obteniendo reporte de población' });
    }
};
exports.getReportePropietariosFull = async (req, res) => {
    try {
        const data = await Reporte.getPropietariosDetallados();
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error obteniendo reporte de propietarios' });
    }
};
exports.getReporteCitasFull = async (req, res) => {
    try {
        const data = await Reporte.getCitasOperativas();
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error obteniendo reporte operativo de citas' });
    }
};
exports.getDashboardStats = async (req, res) => {
    try {
        const [resumen, campanas, citasMes, diagnosticos, especies, nuevosUsuarios] = await Promise.all([
            Reporte.getResumenGeneral(),
            Reporte.estadisticasCampanas(),
            Reporte.citasPorMes(),
            Reporte.diagnosticosComunes(),
            Reporte.conteoEspecies(),
            Reporte.getNuevosPropietarios() 
        ]);

        res.status(200).json({
            resumen,
            campanas,
            citasMes,
            diagnosticos,
            especies,
            nuevosUsuarios 
        });

    } catch (error) {
        console.error('Error en getDashboardStats:', error);
        res.status(500).json({ message: 'Error al obtener reportes del sistema' });
    }
};
exports.getMapaCalor = async (req, res) => {
    try {
        const datos = await Reporte.getDatosMapaCalor();
        
       
        const heatMascotas = datos.propietarios.map(p => [
            parseFloat(p.latitud), 
            parseFloat(p.longitud), 
            0.6 
        ]);

        const rawCasos = datos.casos.map(c => ({
            lat: parseFloat(c.latitud),
            lng: parseFloat(c.longitud),
            tipo: c.tipo 
        }));

        res.status(200).json({ heatMascotas, rawCasos });

    } catch (error) {
        console.error('Error en getMapaCalor:', error);
        res.status(500).json({ message: 'Error al obtener datos del mapa' });
    }
};