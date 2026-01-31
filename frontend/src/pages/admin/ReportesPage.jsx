import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import Swal from 'sweetalert2';
import reporteService from '../../services/reporte.service';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, ComposedChart, Line
} from 'recharts';
import { 
  Syringe, Activity, Calendar, Dog, Flame, Printer, UserPlus, FileText, Filter , Stethoscope
} from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const ReportesPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingPdf, setLoadingPdf] = useState(false);
  
  const [filtroCampana, setFiltroCampana] = useState('');

  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true);
        const stats = await reporteService.getDashboardStats();
        setData(stats);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);
useEffect(() => {
    if (data && data.campanas && data.campanas.length > 0) {
        setFiltroCampana(data.campanas[0].id);
    }
  }, [data]);
  // --- LÓGICA ESPECIES ---
  const procesarDatosEspecies = () => {
    if (!data || !data.especies) return [];
    const principales = ['Perro', 'Gato'];
    const resultado = [];
    let otrosCount = 0;
    let otrosNombres = [];

    data.especies.forEach(item => {
      const nombreNormalizado = item.especie.charAt(0).toUpperCase() + item.especie.slice(1).toLowerCase();
      if (principales.includes(nombreNormalizado)) {
        resultado.push({ name: nombreNormalizado, value: item.total });
      } else {
        otrosCount += item.total;
        otrosNombres.push(nombreNormalizado);
      }
    });

    if (otrosCount > 0) {
      const nombresUnicos = [...new Set(otrosNombres)];
      const etiqueta = `Otros (${nombresUnicos.join(', ')})`;
      resultado.push({ name: etiqueta, value: otrosCount });
    }
    return resultado;
  };
  const datosGraficoEspecies = procesarDatosEspecies();

  // --- PDF SIMPLE ---
  const generarPDFSimple = async (elementId, titulo, tipoDatos, datosRaw) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const fecha = new Date().toLocaleDateString();
    doc.setFontSize(18); doc.text("Sistema de Gestión Zoonosis", 14, 20);
    doc.setFontSize(12); doc.text(`Reporte: ${titulo}`, 14, 28);
    doc.text(`Fecha: ${fecha}`, 14, 34); doc.line(14, 38, 196, 38);

    let startY = 45;
    if (elementId) {
        const chartElement = document.getElementById(elementId);
        if (chartElement) {
            try {
                const canvas = await html2canvas(chartElement, { scale: 2, backgroundColor: '#ffffff' });
                const imgData = canvas.toDataURL('image/png');
                const imgWidth = 180; const imgHeight = (canvas.height * imgWidth) / canvas.width;
                doc.addImage(imgData, 'PNG', 15, 45, imgWidth, imgHeight); startY = 45 + imgHeight + 10;
            } catch (error) { console.error(error); }
        }
    }

    let head = [], body = [];
    if (tipoDatos === 'citas') {
        head = [['Mes', 'Total Citas']]; body = datosRaw.map(d => [d.mes, d.total]);
    } else if (tipoDatos === 'nuevos_usuarios') {
        head = [['Mes Registro', 'Nuevos Propietarios']]; body = datosRaw.map(d => [d.mes, d.total]);
    } else if (tipoDatos === 'diagnosticos') {
        head = [['Diagnóstico', 'Total Casos']]; body = datosRaw.map(d => [d.diagnostico, d.total]);
    } else if (tipoDatos === 'especies_agrupadas') {
        head = [['Categoría', 'Cantidad']]; body = datosRaw.map(d => [d.name, d.value]);
    }

    autoTable(doc, { startY, head, body, theme: 'striped', styles: { fontSize: 10 } });
    doc.save(`Reporte_${titulo}.pdf`);
  };

  // --- REPORTE DETALLADO CAMPAÑAS ---
  const generarReporteDetalladoCampanas = async () => {
    const opcionesCampanas = {};
    opcionesCampanas['todas'] = '📄 Todas las Campañas (Completo)';
    
    if (data && data.campanas) {
        data.campanas.forEach(c => {
            const fechaStr = c.fecha_inicio ? new Date(c.fecha_inicio).toLocaleDateString() : '';
            opcionesCampanas[c.id] = `📌 ${c.nombre_campana} ${fechaStr ? '('+fechaStr+')' : ''}`;
        });
    }

    // Pre-seleccionar la campaña que está activa en el filtro visual
    const preSeleccion = filtroCampana !== 'todas' ? filtroCampana : 'todas';

    const { value: seleccion } = await Swal.fire({
        title: 'Descargar Reporte Detallado',
        text: "Incluye asistencia, nuevos usuarios y gestión de stock.",
        input: 'select',
        inputOptions: opcionesCampanas,
        inputValue: preSeleccion, 
        showCancelButton: true,
        confirmButtonText: 'Descargar PDF',
        confirmButtonColor: '#10B981'
    });

    if (!seleccion) return;

    setLoadingPdf(true);
    try {
        const datosFull = await reporteService.getReporteCampanasFull();
        let datosAImprimir = seleccion === 'todas' ? datosFull : datosFull.filter(c => c.id == seleccion);

        if (datosAImprimir.length === 0) {
            Swal.fire('Vacío', 'No hay datos detallados para esta selección.', 'info');
            setLoadingPdf(false); return;
        }

        const doc = new jsPDF();
        doc.setFontSize(20); doc.text("Reporte Detallado de Campañas", 14, 20);
        doc.setFontSize(10); doc.text(`Generado: ${new Date().toLocaleDateString()}`, 14, 26);
        doc.line(14, 30, 196, 30);

        let yPos = 40;
        datosAImprimir.forEach((campana, index) => {
            if (yPos > 230) { doc.addPage(); yPos = 20; }
            const esPuntoFijo = (campana.latitud && parseFloat(campana.latitud) !== 0);
            const modalidad = esPuntoFijo ? 'PUNTO FIJO' : 'PUERTA A PUERTA';
            const colorModalidad = esPuntoFijo ? [41, 128, 185] : [39, 174, 96];

            doc.setFillColor(245, 245, 245); doc.roundedRect(14, yPos - 5, 182, 30, 2, 2, 'F');
            doc.setFontSize(14); doc.setTextColor(0); doc.setFont("helvetica", "bold");
            doc.text(`${index + 1}. ${campana.nombre}`, 18, yPos + 5);
            doc.setFontSize(10); doc.setTextColor(...colorModalidad);
            doc.text(`[ ${modalidad} ]`, 18, yPos + 12);
            doc.setTextColor(80); doc.setFont("helvetica", "normal");
            doc.text(`Tipo: ${campana.tipo || 'General'}`, 18, yPos + 18);

            yPos += 35;
            const textoInscritos = esPuntoFijo ? 'Asistencia Directa' : 'Pre-registros';
            const valInscritos = esPuntoFijo ? 'N/A' : campana.total_inscritos;

            autoTable(doc, {
                startY: yPos,
                head: [['Métrica', 'Cantidad', 'Nota']],
                body: [
                    ['Total Inscritos', valInscritos, textoInscritos],
                    ['Total Atendidos', campana.total_atendidos, 'Mascotas atendidas'],
                    ['Nuevos Usuarios', campana.prop_nuevos, 'Registrados en evento'],
                    ['Usuarios Antiguos', campana.prop_antiguos, 'Ya existían'],
                ],
                theme: 'grid',
                headStyles: { fillColor: [80, 80, 80] },
                styles: { fontSize: 9 }
            });
            yPos = doc.lastAutoTable.finalY + 10;

            const cuerpoTablaVets = campana.veterinarios.map(v => [v.veterinario, v.stock_inicial, v.stock_usado, v.stock_actual]);
            cuerpoTablaVets.push([
                { content: 'TOTALES', styles: { fontStyle: 'bold', fillColor: [220, 230, 240] } },
                { content: campana.resumen_stock.asignadas, styles: { fontStyle: 'bold', fillColor: [220, 230, 240] } },
                { content: campana.resumen_stock.usadas, styles: { fontStyle: 'bold', textColor: [0, 150, 0], fillColor: [220, 230, 240] } },
                { content: campana.resumen_stock.sobrantes, styles: { fontStyle: 'bold', textColor: [200, 0, 0], fillColor: [220, 230, 240] } }
            ]);

            doc.text("Gestión de Insumos", 14, yPos - 2);
            autoTable(doc, {
                startY: yPos,
                head: [['Veterinario', 'Asignado', 'Usado', 'Sobrante']],
                body: cuerpoTablaVets,
                theme: 'striped',
                headStyles: { fillColor: [41, 128, 185] },
                styles: { fontSize: 9, halign: 'center' }
            });
            yPos = doc.lastAutoTable.finalY + 20;
        });
        doc.save('Reporte_Campanas_Detalle.pdf');
    } catch (e) { console.error(e); Swal.fire('Error', 'Error al generar PDF', 'error'); } finally { setLoadingPdf(false); }
  };

  // --- 4. REPORTE DE CONSULTAS MÉDICAS (MEJORADO: Todos + Bloqueo Futuro) ---
  const generarReporteConsultas = async () => {
    // Obtenemos el mes actual en formato YYYY-MM para el límite
    const fechaActual = new Date();
    const mesActualStr = fechaActual.toISOString().slice(0, 7); 

    const { value: seleccion } = await Swal.fire({
        title: 'Reporte Clínico',
        html: `
            <div style="text-align: left; padding: 0 20px;">
                <div style="margin-bottom: 15px;">
                    <label style="cursor:pointer; font-weight:600; display:flex; align-items:center; gap:8px;">
                        <input type="radio" name="tipo-reporte" value="mes" checked 
                            onchange="document.getElementById('mes-picker').disabled = false; document.getElementById('mes-picker').focus();">
                        Por Mes Específico:
                    </label>
                    <input 
                        type="month" 
                        id="mes-picker" 
                        class="swal2-input" 
                        style="margin-top: 5px; width: 100%;"
                        value="${mesActualStr}"
                        max="${mesActualStr}" 
                    >
                   
                </div>

                <div>
                    <label style="cursor:pointer; font-weight:600; display:flex; align-items:center; gap:8px;">
                        <input type="radio" name="tipo-reporte" value="todos"
                            onchange="document.getElementById('mes-picker').disabled = true;">
                        Todo el Historial
                    </label>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Generar PDF',
        confirmButtonColor: '#3B82F6',
        cancelButtonText: 'Cancelar',
        focusConfirm: false,
        preConfirm: () => {
            const tipo = document.querySelector('input[name="tipo-reporte"]:checked').value;
            const mes = document.getElementById('mes-picker').value;
            if (tipo === 'mes' && !mes) {
                Swal.showValidationMessage('Por favor selecciona un mes válido');
            }
            return { tipo, mes };
        }
    });

    if (!seleccion) return;

    setLoadingPdf(true);
    try {
        const consultas = await reporteService.getReporteConsultas();
        let datosFiltrados = consultas;
        let textoPeriodo = "Historial Completo";

        // Lógica de Filtrado
        if (seleccion.tipo === 'mes') {
            const [yearSel, monthSel] = seleccion.mes.split('-'); 
            
            datosFiltrados = consultas.filter(c => {
                const fechaCita = new Date(c.fecha_cita);
                const mesCita = fechaCita.getMonth() + 1;
                const yearCita = fechaCita.getFullYear();
                return yearCita === parseInt(yearSel) && mesCita === parseInt(monthSel);
            });
            
            textoPeriodo = `Mes: ${seleccion.mes}`;
        }

        if (datosFiltrados.length === 0) {
            Swal.fire('Sin datos', `No se encontraron consultas para: ${textoPeriodo}.`, 'info');
            setLoadingPdf(false);
            return;
        }

        // --- Generación del PDF ---
        const doc = new jsPDF('l', 'mm', 'a4'); 
        const fechaEmision = new Date().toLocaleDateString();

        // Encabezado
        doc.setFontSize(22); doc.setTextColor(40, 40, 40);
        doc.text("Reporte de Atención Clínica", 14, 20);
        
        doc.setFontSize(10); doc.setTextColor(100);
        doc.text(`Fecha de Emisión: ${fechaEmision}`, 14, 28);
        doc.text(`Período Consultado: ${textoPeriodo}`, 14, 33);
        doc.line(14, 36, 280, 36);

        const body = datosFiltrados.map(c => [
            new Date(c.fecha_cita).toLocaleDateString() + ' ' + new Date(c.fecha_cita).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            c.veterinario,
            c.propietario,
            `${c.mascota} (${c.especie})`,
            c.diagnostico || 'Sin diagnóstico',
            c.tratamiento || 'Sin tratamiento registrado'
        ]);

        autoTable(doc, {
            startY: 40,
            head: [['Fecha/Hora', 'Veterinario', 'Dueño', 'Paciente', 'Diagnóstico', 'Tratamiento / Medicamentos']],
            body: body,
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246] },
            styles: { fontSize: 8, cellPadding: 2 },
            columnStyles: {
                0: { cellWidth: 25 }, 
                1: { cellWidth: 35 }, 
                2: { cellWidth: 35 },
                3: { cellWidth: 30 },
                4: { cellWidth: 50 },
                5: { cellWidth: 'auto' }
            }
        });

        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(10); doc.setTextColor(0);
        doc.text(`Total de Atenciones: ${datosFiltrados.length}`, 14, finalY);

        const nombreArchivo = seleccion.tipo === 'mes' 
            ? `Reporte_Clinico_${seleccion.mes}.pdf` 
            : `Reporte_Clinico_General.pdf`;
            
        doc.save(nombreArchivo);

    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se pudo generar el reporte clínico.', 'error');
    } finally {
        setLoadingPdf(false);
    }
  };
const generarReporteDiagnosticos = async () => {
    setLoadingPdf(true);
    try {
        const datos = await reporteService.getReporteDiagnosticosFull();

        if (datos.length === 0) {
            Swal.fire('Info', 'No hay registros de diagnósticos aún.', 'info');
            setLoadingPdf(false); return;
        }

        const doc = new jsPDF('l', 'mm', 'a4'); 
        const fechaEmision = new Date().toLocaleDateString();

        doc.setFontSize(22); doc.setTextColor(40, 40, 40);
        doc.text("Reporte Epidemiológico y Patologías", 14, 20);
        doc.setFontSize(10); doc.setTextColor(100);
        doc.text(`Generado el: ${fechaEmision}`, 14, 28);
        doc.line(14, 32, 280, 32); 

        const body = datos.map(item => {
            const total = item.total;
            const pctPerros = Math.round((item.perros / total) * 100);
            const pctGatos = Math.round((item.gatos / total) * 100);
            
            return [
                item.diagnostico,
                item.total,
                `Perros: ${item.perros} (${pctPerros}%)\nGatos: ${item.gatos} (${pctGatos}%)`,
                new Date(item.ultima_fecha).toLocaleDateString(),
                item.pacientes_recientes || 'N/A' 
            ];
        });

        autoTable(doc, {
            startY: 40,
            head: [['Diagnóstico', 'Casos', 'Distribución', 'Último Caso', 'Pacientes Recientes (Mascota - Dueño)']],
            body: body,
            theme: 'grid',
            headStyles: { fillColor: [220, 53, 69], halign: 'center' },
            styles: { fontSize: 9, cellPadding: 3, valign: 'middle' },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 50 }, 
                1: { halign: 'center', fontStyle: 'bold', cellWidth: 20 },
                2: { cellWidth: 40, fontSize: 8 }, 
                3: { halign: 'center', cellWidth: 30 },
                4: { fontStyle: 'italic', cellWidth: 'auto' } // Ocupa todo el espacio restante horizontal
            }
        });

        // Gráfico Top 3 Visual
        let finalY = doc.lastAutoTable.finalY + 15;
        if (finalY < 180) { // Ajuste de altura para Landscape
            doc.setFontSize(12); doc.setTextColor(0);
            doc.text("Top 3 Patologías más Frecuentes", 14, finalY);
            finalY += 10;
            
            const top3 = datos.slice(0, 3);
            top3.forEach((d, i) => {
                doc.setFontSize(10); doc.text(`${d.diagnostico} (${d.total})`, 14, finalY);
                const largoBarra = Math.min((d.total * 5), 150); 
                doc.setFillColor(220, 53, 69);
                doc.rect(80, finalY - 4, largoBarra, 4, 'F');
                finalY += 10;
            });
        }

        doc.save(`Reporte_Epidemiologico.pdf`);

    } catch (e) {
        console.error(e);
        Swal.fire('Error', 'No se pudo generar el reporte.', 'error');
    } finally {
        setLoadingPdf(false);
    }
  };
  const generarReportePoblacion = async () => {
    setLoadingPdf(true);
    try {
        const { resumen, razas } = await reporteService.getReportePoblacionFull();

        const doc = new jsPDF('p', 'mm', 'a4');
        const fechaEmision = new Date().toLocaleDateString();

        // Encabezado
        doc.setFontSize(22); doc.setTextColor(40, 40, 40);
        doc.text("Reporte Demográfico de Población", 14, 20);
        doc.setFontSize(10); doc.setTextColor(100);
        doc.text(`Generado el: ${fechaEmision}`, 14, 28);
        doc.line(14, 32, 196, 32);

        // --- TABLA 1: RESUMEN POR ESPECIE Y SEXO ---
        doc.setFontSize(14); doc.setTextColor(0);
        doc.text("1. Distribución por Sexo y Peso", 14, 42);

        const bodyResumen = resumen.map(r => [
            r.especie,
            r.total,
            `${r.machos} Machos / ${r.hembras} Hembras`,
            `${((r.machos / r.total) * 100).toFixed(1)}% M - ${((r.hembras / r.total) * 100).toFixed(1)}% H`,
            r.peso_promedio ? `${r.peso_promedio} kg` : 'N/A'
        ]);

        autoTable(doc, {
            startY: 48,
            head: [['Especie', 'Total', 'Desglose Sexo', 'Porcentaje', 'Peso Promedio']],
            body: bodyResumen,
            theme: 'striped',
            headStyles: { fillColor: [147, 51, 234] }, // Morado
            styles: { fontSize: 10, halign: 'center' },
            columnStyles: { 0: { fontStyle: 'bold', halign: 'left' } }
        });

        // --- TABLA 2: RAZAS PREDOMINANTES ---
        let yPos = doc.lastAutoTable.finalY + 15;
        doc.setFontSize(14); doc.setTextColor(0);
        doc.text("2. Razas Predominantes (Top 10)", 14, yPos);

        const bodyRazas = razas.map(r => [r.especie, r.raza, r.total]);

        autoTable(doc, {
            startY: yPos + 6,
            head: [['Especie', 'Raza', 'Cantidad Registrada']],
            body: bodyRazas,
            theme: 'grid',
            headStyles: { fillColor: [75, 85, 99] }, // Gris oscuro
            styles: { fontSize: 10 },
        });

       
        yPos = doc.lastAutoTable.finalY + 20;
        
        if (yPos < 230) {
            doc.setFontSize(12); doc.text("Resumen Visual (Machos vs Hembras)", 14, yPos);
            yPos += 10;

            resumen.forEach((r) => {
                const anchoTotal = 100; 
                const anchoMachos = (r.machos / r.total) * anchoTotal;
                const anchoHembras = (r.hembras / r.total) * anchoTotal;

                // Etiqueta Especie
                doc.setFontSize(10); doc.text(r.especie, 14, yPos + 4);

                // Barra Machos (Azul)
                doc.setFillColor(59, 130, 246);
                doc.rect(40, yPos, anchoMachos, 6, 'F');
                
                // Barra Hembras (Rosa)
                doc.setFillColor(236, 72, 153);
                doc.rect(40 + anchoMachos, yPos, anchoHembras, 6, 'F');

                // Leyenda de números
                doc.setFontSize(8); doc.setTextColor(50);
                doc.text(`${r.machos} M`, 40 + (anchoMachos/2) - 2, yPos + 4.5);
                doc.text(`${r.hembras} H`, 40 + anchoMachos + (anchoHembras/2) - 2, yPos + 4.5);
                
                // Reset Color
                doc.setTextColor(0);
                yPos += 12;
            });

            // Leyenda pequeña
            doc.setFillColor(59, 130, 246); doc.rect(120, yPos, 4, 4, 'F');
            doc.text("Machos", 126, yPos+3);
            doc.setFillColor(236, 72, 153); doc.rect(150, yPos, 4, 4, 'F');
            doc.text("Hembras", 156, yPos+3);
        }

        doc.save('Reporte_Demografico.pdf');

    } catch (e) {
        console.error(e);
        Swal.fire('Error', 'No se pudo generar el reporte demográfico.', 'error');
    } finally {
        setLoadingPdf(false);
    }
  };
  const generarReportePropietarios = async () => {
    const fechaActual = new Date();
    const mesActualStr = fechaActual.toISOString().slice(0, 7); 

    const { value: seleccion } = await Swal.fire({
        title: 'Reporte de Propietarios',
        html: `
            <div style="text-align: left; padding: 0 20px;">
                <div style="margin-bottom: 15px;">
                    <label style="cursor:pointer; font-weight:600; display:flex; align-items:center; gap:8px;">
                        <input type="radio" name="tipo-prop" value="mes" checked 
                            onchange="document.getElementById('mes-picker-prop').disabled = false;">
                        Nuevos Registros por Mes:
                    </label>
                    <input type="month" id="mes-picker-prop" class="swal2-input" style="margin-top: 5px; width: 100%;" value="${mesActualStr}" max="${mesActualStr}">
                </div>
                <div>
                    <label style="cursor:pointer; font-weight:600; display:flex; align-items:center; gap:8px;">
                        <input type="radio" name="tipo-prop" value="todos"
                            onchange="document.getElementById('mes-picker-prop').disabled = true;">
                        Reporte Completo
                    </label>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Generar PDF',
        confirmButtonColor: '#10B981', // Verde
        preConfirm: () => {
            const tipo = document.querySelector('input[name="tipo-prop"]:checked').value;
            const mes = document.getElementById('mes-picker-prop').value;
            return { tipo, mes };
        }
    });

    if (!seleccion) return;

    setLoadingPdf(true);
    try {
        const usuarios = await reporteService.getReportePropietariosFull();
        let datosFiltrados = usuarios;
        let textoPeriodo = "Base de Datos Completa";

        // Lógica de Filtrado
        if (seleccion.tipo === 'mes') {
            const [yearSel, monthSel] = seleccion.mes.split('-');
            datosFiltrados = usuarios.filter(u => {
                const fecha = new Date(u.creado_en);
                return fecha.getFullYear() === parseInt(yearSel) && (fecha.getMonth() + 1) === parseInt(monthSel);
            });
            textoPeriodo = `Registrados en: ${seleccion.mes}`;
        }

        if (datosFiltrados.length === 0) {
            Swal.fire('Sin datos', `No hubo registros nuevos en ${seleccion.mes}.`, 'info');
            setLoadingPdf(false); return;
        }

        // --- Generación PDF ---
        const doc = new jsPDF('l', 'mm', 'a4'); 
        const fechaEmision = new Date().toLocaleDateString();

        doc.setFontSize(22); doc.setTextColor(40, 40, 40);
        doc.text("Padrón de Propietarios Registrados", 14, 20);
        doc.setFontSize(10); doc.setTextColor(100);
        doc.text(`Fecha Emisión: ${fechaEmision}`, 14, 28);
        doc.text(`Filtro: ${textoPeriodo}`, 14, 33);
        doc.line(14, 36, 280, 36);

        const body = datosFiltrados.map(u => [
            new Date(u.creado_en).toLocaleDateString(),
            u.nombre,
            u.ci || 'S/N',
            u.telefono || 'S/N',
            u.direccion || 'No registrada',
            u.cantidad_mascotas + ' Mascotas' 
        ]);

        autoTable(doc, {
            startY: 40,
            head: [['Fecha Reg.', 'Nombre Completo', 'CI / DNI', 'Teléfono', 'Dirección / Zona', 'Tenencia']],
            body: body,
            theme: 'striped',
            headStyles: { fillColor: [16, 185, 129] }, // Verde Esmeralda
            styles: { fontSize: 9, cellPadding: 3 },
            columnStyles: {
                0: { cellWidth: 25 },
                1: { cellWidth: 50, fontStyle: 'bold' },
                2: { cellWidth: 25 },
                3: { cellWidth: 30 },
                4: { cellWidth: 'auto' }, 
                5: { cellWidth: 25, halign: 'center' }
            }
        });

        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(10); doc.setTextColor(0);
        doc.text(`Total Propietarios Listados: ${datosFiltrados.length}`, 14, finalY);

        doc.save(`Reporte_Propietarios_${seleccion.tipo === 'mes' ? seleccion.mes : 'Completo'}.pdf`);

    } catch (e) {
        console.error(e);
        Swal.fire('Error', 'No se pudo generar el reporte.', 'error');
    } finally {
        setLoadingPdf(false);
    }
  };
  const generarReporteCitasOperativo = async () => {
    const fechaActual = new Date();
    const mesActualStr = fechaActual.toISOString().slice(0, 7);

    // 1. Selector de Mes
    const { value: seleccion } = await Swal.fire({
        title: 'Reporte Operativo de Citas',
        html: `
            <div style="text-align: left; padding: 0 20px;">
                <p style="font-size: 13px; color: #666; margin-bottom: 10px;">
                    Analiza el cumplimiento de agenda, ausentismo y cancelaciones.
                </p>
                <div style="margin-bottom: 15px;">
                    <label style="cursor:pointer; font-weight:600; display:flex; align-items:center; gap:8px;">
                        <input type="radio" name="tipo-cita" value="mes" checked 
                            onchange="document.getElementById('mes-picker-cita').disabled = false;">
                        Por Mes Específico:
                    </label>
                    <input type="month" id="mes-picker-cita" class="swal2-input" style="margin-top: 5px; width: 100%;" value="${mesActualStr}">
                </div>
                <div>
                    <label style="cursor:pointer; font-weight:600; display:flex; align-items:center; gap:8px;">
                        <input type="radio" name="tipo-cita" value="todos"
                            onchange="document.getElementById('mes-picker-cita').disabled = true;">
                        Todo el Historial
                    </label>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Generar PDF',
        confirmButtonColor: '#8B5CF6', // Violeta
        preConfirm: () => {
            const tipo = document.querySelector('input[name="tipo-cita"]:checked').value;
            const mes = document.getElementById('mes-picker-cita').value;
            return { tipo, mes };
        }
    });

    if (!seleccion) return;

    setLoadingPdf(true);
    try {
        const citas = await reporteService.getReporteCitasFull();
        let datosFiltrados = citas;
        let textoPeriodo = "Historial Completo";

        // Filtrado
        if (seleccion.tipo === 'mes') {
            const [yearSel, monthSel] = seleccion.mes.split('-');
            datosFiltrados = citas.filter(c => {
                const fecha = new Date(c.fecha_cita);
                return fecha.getFullYear() === parseInt(yearSel) && (fecha.getMonth() + 1) === parseInt(monthSel);
            });
            textoPeriodo = `Período: ${seleccion.mes}`;
        }

        if (datosFiltrados.length === 0) {
            Swal.fire('Sin datos', `No hay citas registradas en ${textoPeriodo}.`, 'info');
            setLoadingPdf(false); return;
        }

        // --- CÁLCULO DE KPIs ---
        const total = datosFiltrados.length;
        const completadas = datosFiltrados.filter(c => c.estado === 'Completada').length;
        const canceladas = datosFiltrados.filter(c => c.estado === 'Cancelada').length;
        const pendientes = datosFiltrados.filter(c => c.estado === 'Pendiente' || c.estado === 'Confirmada').length;
        const tasaCancelacion = ((canceladas / total) * 100).toFixed(1);

        // --- PDF ---
        const doc = new jsPDF('l', 'mm', 'a4'); // Horizontal
        const fechaEmision = new Date().toLocaleDateString();

        doc.setFontSize(22); doc.setTextColor(40, 40, 40);
        doc.text("Reporte Operativo de Agenda", 14, 20);
        
        doc.setFontSize(10); doc.setTextColor(100);
        doc.text(`Emisión: ${fechaEmision}`, 14, 28);
        doc.text(textoPeriodo, 14, 33);
        doc.line(14, 36, 280, 36);

        // --- CAJAS DE RESUMEN (KPIs) ---
        let kpiY = 42;
        // Total
        doc.setFillColor(243, 244, 246); doc.rect(14, kpiY, 60, 15, 'F');
        doc.setFontSize(10); doc.setTextColor(0); doc.text("Total Citas Agendadas", 18, kpiY + 6);
        doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.text(String(total), 18, kpiY + 12);

        // Canceladas (Rojo)
        doc.setFillColor(254, 226, 226); doc.rect(80, kpiY, 60, 15, 'F');
        doc.setTextColor(185, 28, 28); doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.text("Canceladas / No Asistió", 84, kpiY + 6);
        doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.text(`${canceladas} (${tasaCancelacion}%)`, 84, kpiY + 12);

        // Completadas (Verde)
        doc.setFillColor(209, 250, 229); doc.rect(146, kpiY, 60, 15, 'F');
        doc.setTextColor(6, 95, 70); doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.text("Atendidas Exitosamente", 150, kpiY + 6);
        doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.text(String(completadas), 150, kpiY + 12);

        // --- TABLA DETALLADA ---
        const body = datosFiltrados.map(c => [
            new Date(c.fecha_cita).toLocaleDateString() + ' ' + new Date(c.fecha_cita).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            c.estado.toUpperCase(),
            c.propietario,
            `${c.mascota} (${c.especie})`,
            c.veterinario || 'Sin asignar',
            c.motivo,
            c.notas || '-' 
        ]);

        autoTable(doc, {
            startY: kpiY + 25,
            head: [['Fecha/Hora', 'Estado', 'Propietario', 'Paciente', 'Veterinario', 'Motivo Consulta', 'Notas / Obs.']],
            body: body,
            theme: 'grid',
            headStyles: { fillColor: [139, 92, 246] }, // Violeta
            styles: { fontSize: 8, cellPadding: 3 },
            columnStyles: {
                0: { cellWidth: 25 },
                1: { cellWidth: 22, fontStyle: 'bold', halign: 'center' },
                6: { cellWidth: 'auto', fontStyle: 'italic' } 
            },
            didParseCell: function(data) {
                if (data.section === 'body' && data.column.index === 1) {
                    const estado = data.cell.raw;
                    if (estado === 'CANCELADA') {
                        data.cell.styles.textColor = [220, 38, 38]; // Rojo
                    } else if (estado === 'COMPLETADA') {
                        data.cell.styles.textColor = [5, 150, 105]; // Verde
                    } else {
                        data.cell.styles.textColor = [217, 119, 6]; // Naranja (Pendiente)
                    }
                }
            }
        });

        doc.save(`Reporte_Agenda_${seleccion.tipo === 'mes' ? seleccion.mes : 'Full'}.pdf`);

    } catch (e) {
        console.error(e);
        Swal.fire('Error', 'No se pudo generar el reporte.', 'error');
    } finally {
        setLoadingPdf(false);
    }
  };
const getDatosCampanasFiltrados = () => {
    if (!data || !data.campanas) return [];
   
    return data.campanas
        .filter(c => c.id == filtroCampana)
        .map(c => ({
            ...c,
            eficiencia: c.total_inscritos > 0 ? Math.round((c.total_atendidos / c.total_inscritos) * 100) : 0
        }));
  };

  const datosCampanasGrafico = getDatosCampanasFiltrados();

  if (loading) return <div className="p-10 text-center text-gray-500">Cargando estadísticas...</div>;
  if (!data) return null;

  return (
    <div className="container mx-auto pb-10 px-4">
      {/* HEADER */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-gray-800">Reportes y Estadísticas</h1>
            <p className="text-gray-600">Visión general del rendimiento del sistema</p>
        </div>
        <button onClick={() => navigate('/admin/mapa-calor')} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center shadow-md font-semibold">
            <Flame className="mr-2 h-5 w-5" /> Ver Mapa de Calor
        </button>
      </div>

      {/* GRÁFICOS TIEMPO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-md relative">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-700">Evolución de Citas</h3>
                <button 
                    onClick={generarReporteCitasOperativo} 
                    disabled={loadingPdf}
                    className="text-gray-500 hover:text-purple-600 p-2 hover:bg-purple-50 rounded-lg border border-gray-200 transition-colors flex items-center gap-1"
                >
                    {loadingPdf ? <span className="animate-spin text-xs">⌛</span> : <Printer className="w-4 h-4" />}
                    <span className="text-xs font-bold">PDF Operativo</span>
                </button>
            </div>
            <div id="chart-citas" className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.citasMes}><defs><linearGradient id="colorCitas" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/><stop offset="95%" stopColor="#8884d8" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="mes"/><YAxis/><Tooltip/><Area type="monotone" dataKey="total" stroke="#8884d8" fill="url(#colorCitas)"/></AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md relative">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-700 flex items-center"><UserPlus className="w-5 h-5 mr-2 text-green-600"/> Nuevos Propietarios</h3>
                <button 
                    onClick={generarReportePropietarios}
                    disabled={loadingPdf} 
                    className="text-gray-500 hover:text-green-600 p-2 hover:bg-green-50 rounded-lg border border-gray-200 transition-colors flex items-center gap-1"
                >
                    {loadingPdf ? <span className="animate-spin text-xs">⌛</span> : <Printer className="w-4 h-4" />} 
                    <span className="text-xs font-bold">PDF Detallado</span>
                </button>
            </div>
            <div id="chart-usuarios" className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.nuevosUsuarios}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="mes"/><YAxis/><Tooltip/><Bar dataKey="total" fill="#10B981" radius={[4, 4, 0, 0]} barSize={40}/></BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      {/* --- SECCIÓN CAMPAÑAS CON FILTRO VISUAL --- */}
      <div className="mb-8 bg-white p-6 rounded-xl shadow-md relative">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h3 className="text-lg font-bold text-gray-700">Eficiencia de Campañas</h3>
                
                <div className="flex items-center gap-3">
                    {/* SELECTOR DE FILTRO */}
                    <div className="relative">
                        <select 
                            value={filtroCampana}
                            onChange={(e) => setFiltroCampana(e.target.value)}
                            className="appearance-none bg-gray-50 border border-gray-300 text-gray-700 py-2 pl-3 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        >
                            
                            {data.campanas.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.nombre_campana}
                                </option>
                            ))}
                        </select>
                        <Filter className="w-4 h-4 text-gray-400 absolute right-2 top-2.5 pointer-events-none"/>
                    </div>

                    {/* BOTÓN REPORTE DETALLADO */}
                    <button onClick={generarReporteDetalladoCampanas} disabled={loadingPdf} className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-bold shadow-sm">
                        {loadingPdf ? <span className="animate-spin">⌛</span> : <FileText className="w-4 h-4" />}
                        {loadingPdf ? 'Generando...' : 'Detalle PDF'}
                    </button>
                </div>
            </div>

            <div id="chart-campanas" className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={datosCampanasGrafico}
                        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    >
                        <CartesianGrid stroke="#f5f5f5" strokeDasharray="3 3" />
                        <XAxis dataKey="nombre_campana" scale="band" />
                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                        <YAxis yAxisId="right" orientation="right" stroke="#ff7300" unit="%" domain={[0, 100]} />
                        <Tooltip />
                        <Legend />
                        
                        <Bar yAxisId="left" dataKey="total_inscritos" name="Inscritos" maxBarSize={60} fill="#94a3b8" radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="left" dataKey="total_atendidos" name="Atendidos" maxBarSize={60} fill="#10B981" radius={[4, 4, 0, 0]} />
                        <Line yAxisId="right" type="monotone" dataKey="eficiencia" name="Eficiencia %" stroke="#ff7300" strokeWidth={3} dot={{ r: 5 }} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
      </div>
<div className="mb-8 bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                  <Stethoscope className="mr-2 h-6 w-6 text-blue-600"/> 
                  Registro de Consultas y Tratamientos
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                  Genera reportes detallados de la atención médica, diagnósticos y medicamentos suministrados por los veterinarios.
              </p>
          </div>
          
          <button 
              onClick={generarReporteConsultas}
              disabled={loadingPdf}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all font-bold flex items-center gap-2 whitespace-nowrap"
          >
              {loadingPdf ? <span className="animate-spin">⌛</span> : <FileText className="w-5 h-5" />}
              Descargar Historial Clínico
          </button>
      </div>
      {/* DIAGNOSTICOS Y POBLACIÓN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-md lg:col-span-2 relative">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-700 flex items-center"><Activity className="mr-2 w-5 h-5"/> Diagnósticos</h3>
                 <button 
                    onClick={generarReporteDiagnosticos} 
                    disabled={loadingPdf}
                    className="text-gray-500 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg border border-gray-200 transition-colors flex items-center gap-1"
                >
                   {loadingPdf ? <span className="animate-spin text-xs">⌛</span> : <Printer className="w-4 h-4" />}
                   <span className="text-xs font-bold">PDF Detallado</span>
                </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.diagnosticos.map((diag, idx) => (
                    <div key={idx} className="flex justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="font-medium text-gray-700 truncate">{diag.diagnostico}</span>
                        <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">{diag.total}</span>
                    </div>
                ))}
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md relative">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-bold text-gray-700">Población</h3>
                <button 
                    onClick={generarReportePoblacion}
                    disabled={loadingPdf}
                    className="text-gray-500 hover:text-purple-600 p-2 hover:bg-purple-50 rounded-lg border border-gray-200 transition-colors flex items-center gap-1"
                >
                    {loadingPdf ? <span className="animate-spin text-xs">⌛</span> : <Printer className="w-4 h-4" />}
                    <span className="text-xs font-bold">PDF Detallado</span>
                </button>
            </div>
            <div id="chart-especies" className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={datosGraficoEspecies} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value" nameKey="name">
                            {datosGraficoEspecies.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                        </Pie>
                        <Tooltip />
                        <Legend wrapperStyle={{fontSize: '11px'}}/>
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ReportesPage;