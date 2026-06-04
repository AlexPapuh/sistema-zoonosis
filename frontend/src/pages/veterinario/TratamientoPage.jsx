import React, { useState, useEffect } from 'react';
import propietarioService from '../../services/propietario.service.js';
import animalService from '../../services/animal.service.js';
import historialService from '../../services/historial.service.js';
import inventarioService from '../../services/inventario.service.js';
import { User, Search, Dog, Save, FileText, Stethoscope, ArrowLeft, Box, Syringe, Lock, AlertTriangle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import Swal from 'sweetalert2'; 
import jsPDF from 'jspdf';

import iconMarker from 'leaflet/dist/images/marker-icon.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// --- LISTA DE DISTRITOS DE POTOSÍ CON COORDENADAS ---
const DISTRITOS_POTOSI = {
    urbanos: [
        { id: 'Distrito 1', nombre: 'Distrito 1: San Gerardo', lat: -19.585254, lng: -65.745972 },
        { id: 'Distrito 2', nombre: 'Distrito 2: San Martín', lat: -19.587633, lng: -65.746918 },
        { id: 'Distrito 3', nombre: 'Distrito 3: San Juan', lat: -19.590314, lng: -65.747041 },
        { id: 'Distrito 4', nombre: 'Distrito 4: San Cristóbal', lat: -19.598222, lng: -65.742608 },
        { id: 'Distrito 5', nombre: 'Distrito 5: San Roque', lat: -19.582477, lng: -65.752344 },
        { id: 'Distrito 6', nombre: 'Distrito 6: Zona Central', lat: -19.587537, lng: -65.754547 },
        { id: 'Distrito 7', nombre: 'Distrito 7: San Pedro', lat: -19.595141, lng: -65.752905 },
        { id: 'Distrito 8', nombre: 'Distrito 8: San Benito', lat: -19.591430, lng: -65.757487 },
        { id: 'Distrito 9', nombre: 'Distrito 9: Las Delicias', lat: -19.571709, lng: -65.759418 },
        { id: 'Distrito 10', nombre: 'Distrito 10: Ciudad Satélite', lat: -19.572161, lng: -65.765592 },
        { id: 'Distrito 11', nombre: 'Distrito 11: San Clemente', lat: -19.577416, lng: -65.763750 },
        { id: 'Distrito 12', nombre: 'Distrito 12: Villa Copacabana', lat: -19.574175, lng: -65.772255 },
        { id: 'Distrito 17', nombre: 'Distrito 17: Lecherías', lat: -19.557750, lng: -65.759351 },
        { id: 'Distrito 19', nombre: 'Distrito 19: Universidad', lat: -19.556577, lng: -65.763539 },
        { id: 'Distrito 20', nombre: 'Distrito 20: Cantumarca', lat: -19.585788, lng: -65.780453 },
    ],
    rurales: [
        { id: 'Distrito 13', nombre: 'Distrito 13: Tarapaya', lat: -19.476637, lng: -65.798994 },
        { id: 'Distrito 14', nombre: 'Distrito 14: Chullchucani', lat: -19.463732, lng: -65.637103 },
        { id: 'Distrito 15', nombre: 'Distrito 15: Huari Huari', lat: -19.449177, lng: -65.595153 },
        { id: 'Distrito 16', nombre: 'Distrito 16: Concepción (Rural)', lat: -19.639575, lng: -65.740161 },
        { id: 'Distrito 18', nombre: 'Distrito 18: Manquiri', lat: -19.429259, lng: -65.718727 },
    ]
};

const MapFix = () => {
    const map = useMap();
    useEffect(() => {
        map.invalidateSize(); 
        const timer = setTimeout(() => map.invalidateSize(), 400);
        return () => clearTimeout(timer);
    }, [map]);
    return null;
};

// --- ANIMADOR DE LA CÁMARA DEL MAPA ---
const ChangeMapView = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, 16, { duration: 1.2 });
        }
    }, [center, map]);
    return null;
};

const LocationPicker = ({ onLocationSelected, position }) => {
    useMapEvents({ click(e) { onLocationSelected(e.latlng); }, });
    return position ? <Marker position={position} /> : null;
};

const razasPerro = ["Mestizo", "Labrador", "Pastor Alemán", "Husky", "Golden Retriever", "Chihuahua", "Bulldog", "Poodle", "Otro"];
const razasGato = ["Mestizo", "Persa", "Siamés", "Angora", "Maine Coon", "Sphynx", "Otro"];

const calcularEdad = (fechaNac) => {
    if (!fechaNac) return "Sin fecha";
    const hoy = new Date();
    const nacimiento = new Date(fechaNac);
    let edadAnios = hoy.getFullYear() - nacimiento.getFullYear();
    let edadMeses = hoy.getMonth() - nacimiento.getMonth();
    
    if (edadMeses < 0 || (edadMeses === 0 && hoy.getDate() < nacimiento.getDate())) {
        edadAnios--;
        edadMeses += 12;
    }
    
    if (edadAnios > 0) return `${edadAnios} años`;
    if (edadMeses > 0) return `${edadMeses} meses`;
    return "Menos de 1 mes";
};

const determinarEstadoVencimiento = (fechaString) => {
    if (!fechaString) return { estado: 'ok', dias: 999 };
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const [year, month, day] = fechaString.split('T')[0].split('-');
    const fechaVenc = new Date(year, month - 1, day);
    fechaVenc.setHours(0, 0, 0, 0);

    const diffTime = fechaVenc - hoy;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { estado: 'vencido', dias: diffDays };
    if (diffDays <= 30) return { estado: 'por_vencer', dias: diffDays }; // Alerta de 30 días
    return { estado: 'ok', dias: diffDays };
};

const TratamientoPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [citaId, setCitaId] = useState(null);
    
    const hoy = new Date();
    const offset = hoy.getTimezoneOffset();
    const localDate = new Date(hoy.getTime() - (offset * 60 * 1000));
    const fechaMaximaNacimiento = localDate.toISOString().split('T')[0];

    const [todosPropietarios, setTodosPropietarios] = useState([]);
    const [inventario, setInventario] = useState([]); 
    
    const [busqueda, setBusqueda] = useState('');
    const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
    const [propietarioSeleccionado, setPropietarioSeleccionado] = useState(null);
    
    const [mascotasDelPropietario, setMascotasDelPropietario] = useState([]);
    const [pacienteSeleccionadoId, setPacienteSeleccionadoId] = useState(''); 
    
    const [busquedaInsumo, setBusquedaInsumo] = useState('');
    const [insumosSeleccionados, setInsumosSeleccionados] = useState({}); 

    const [mapaCentro, setMapaCentro] = useState([-19.5894, -65.7541]); 

    const [formMascota, setFormMascota] = useState({
        nombre: '', especie: 'Perro', raza: '', sexo: 'Macho', fechaNacimiento: '', 
        peso: '', otraEspecie: ''
    });
    
    const [formPropietario, setFormPropietario] = useState({
        nombre: '', ci: '', telefono: '', email: '', direccion: '', distrito: '', latitud: '', longitud: ''
    });
    
    const [formTratamiento, setFormTratamiento] = useState({
        diagnostico: '', tratamiento: '', notas: ''
    });

    const [esVacuna, setEsVacuna] = useState(false);
    const [tipoVacuna, setTipoVacuna] = useState('Antirrábica');
    const [diasRefuerzo, setDiasRefuerzo] = useState('365'); 
    const [fechaRefuerzo, setFechaRefuerzo] = useState('');
    const [esFechaManual, setEsFechaManual] = useState(false); 

    
    useEffect(() => {
        if (esVacuna) {
            if (diasRefuerzo === 'manual') {
                setEsFechaManual(true);
            } else {
                setEsFechaManual(false);
                const fechaCalc = new Date();
                fechaCalc.setDate(fechaCalc.getDate() + parseInt(diasRefuerzo));
                setFechaRefuerzo(fechaCalc.toISOString().split('T')[0]);
            }
        }
    }, [esVacuna, diasRefuerzo]);

    const generarCertificadoPDF = () => {
        const doc = new jsPDF('l', 'mm', 'a5'); 
        
        const colorFondoHeader = [50, 100, 100]; 
        const colorTextoHeader = [255, 255, 255]; 
        const colorLineas = [100, 100, 100]; 

        doc.setFillColor(...colorFondoHeader);
        doc.rect(10, 8, 190, 8, 'F');
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(...colorTextoHeader);
        doc.text("DATOS DE LA MASCOTA", 105, 13.5, null, null, "center");

        doc.setFillColor(245, 245, 245);
        doc.rect(10, 16, 190, 25, 'F');
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        
        let fechaNacTexto = "-";
        if (formMascota.fechaNacimiento) {
            let soloFecha = formMascota.fechaNacimiento.toString().split('T')[0];
            const partes = soloFecha.split('-');
            if (partes.length === 3) {
                fechaNacTexto = `${partes[2]}/${partes[1]}/${partes[0]}`;
            } else {
                fechaNacTexto = soloFecha;
            }
        }
   
        doc.text("ESPECIE:", 15, 23);
        doc.setFont("helvetica", "normal"); doc.text(formMascota.especie.toUpperCase(), 32, 23);
        
        doc.setFont("helvetica", "bold"); doc.text("RAZA:", 70, 23);
        doc.setFont("helvetica", "normal"); doc.text(formMascota.raza.toUpperCase(), 82, 23);

        doc.setFont("helvetica", "bold"); doc.text("SEXO:", 130, 23);
        doc.setFont("helvetica", "normal"); doc.text(formMascota.sexo.toUpperCase(), 142, 23);

        doc.setFont("helvetica", "bold"); doc.text("NOMBRE:", 15, 30);
        doc.setFont("helvetica", "normal"); doc.text(formMascota.nombre.toUpperCase(), 32, 30);

        doc.setFont("helvetica", "bold"); doc.text("PESO:", 70, 30);
        doc.setFont("helvetica", "normal"); doc.text(`${formMascota.peso || '-'} Kg`, 82, 30);

        doc.setFont("helvetica", "bold"); doc.text("F. NACIM:", 130, 30);
        doc.setFont("helvetica", "normal"); 
        
        doc.text(fechaNacTexto, 148, 30); 
        
        doc.setFont("helvetica", "bold"); doc.text("PROPIETARIO:", 15, 37);
        doc.setFont("helvetica", "normal"); doc.text(formPropietario.nombre.toUpperCase(), 40, 37);

        const bloqueAncho = 92;
        const bloqueAlto = 45;
        const col1X = 10;
        const col2X = 108;
        const fila1Y = 44; 
        const fila2Y = 91; 

        const dibujarHeaderSeccion = (x, y, titulo, cols) => {
            doc.setFillColor(...colorFondoHeader);
            doc.rect(x, y, bloqueAncho, 6, 'F');
            doc.setTextColor(...colorTextoHeader);
            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            doc.text(titulo, x + (bloqueAncho / 2), y + 4, null, null, "center");

            doc.setFillColor(230, 230, 230);
            doc.rect(x, y + 6, bloqueAncho, 5, 'F');
            doc.setTextColor(0);
            doc.setFontSize(7);
            
            let currentX = x;
            cols.forEach(col => {
                doc.text(col.name, currentX + (col.width / 2), y + 9.5, null, null, "center");
                currentX += col.width;
            });

            doc.setDrawColor(...colorLineas);
            doc.rect(x, y, bloqueAncho, bloqueAlto); 
            
            currentX = x;
            cols.forEach((col, index) => {
                if(index < cols.length - 1) {
                    doc.line(currentX + col.width, y + 6, currentX + col.width, y + bloqueAlto);
                }
                currentX += col.width;
            });
            
            for(let i=1; i<=4; i++) {
                doc.line(x, y + 11 + (i * 8), x + bloqueAncho, y + 11 + (i * 8));
            }
        };

        dibujarHeaderSeccion(col1X, fila1Y, "CONTROL DE VACUNAS", [
            { name: "FECHA", width: 20 },
            { name: "VACUNA / PRODUCTO", width: 47 },
            { name: "REFUERZO", width: 25 }
        ]);
        dibujarHeaderSeccion(col2X, fila1Y, "DESPARASITACIONES", [
            { name: "FECHA", width: 20 },
            { name: "PRODUCTO / PESO", width: 47 },
            { name: "PRÓXIMO", width: 25 }
        ]);
        dibujarHeaderSeccion(col1X, fila2Y, "VACUNA ANTIRRÁBICA", [
            { name: "FECHA", width: 20 },
            { name: "VACUNA / LOTE", width: 47 },
            { name: "REFUERZO", width: 25 }
        ]);
        dibujarHeaderSeccion(col2X, fila2Y, "CONTROL REPRODUCTIVO", [
            { name: "FECHA", width: 20 },
            { name: "PROCEDIMIENTO", width: 47 },
            { name: "PRÓXIMO", width: 25 }
        ]);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 139); 

        const fechaHoy = new Date().toLocaleDateString();
        let fechaProx = "---";
        if (fechaRefuerzo) {
            const [y, m, d] = fechaRefuerzo.split('-');
            fechaProx = `${d}/${m}/${y}`;
        }

        if (tipoVacuna.toLowerCase().includes('antirrábica')) {
            const yBase = fila2Y + 15;
            doc.text(fechaHoy, col1X + 10, yBase, null, null, "center");
            doc.setTextColor(220, 0, 0); 
            doc.text(fechaProx, col1X + 79.5, yBase, null, null, "center");
        } else {
            const yBase = fila1Y + 15;
            doc.setTextColor(0, 0, 139);
            doc.text(fechaHoy, col1X + 10, yBase, null, null, "center");
            doc.setTextColor(220, 0, 0); 
            doc.text(fechaProx, col1X + 79.5, yBase, null, null, "center");
        }

        doc.setTextColor(0);
        doc.setFont("helvetica", "normal");
        
        doc.line(40, 140, 90, 140);
        doc.text("Firma Veterinario", 65, 144, null, null, "center");
        
        doc.line(120, 140, 170, 140);
        doc.text("Sello Zoonosis Potosí", 145, 144, null, null, "center");

        doc.save(`Libreta_${formMascota.nombre}.pdf`);
    };

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const [props, inv] = await Promise.all([
                    propietarioService.getAllPropietarios(),
                    inventarioService.getAllProductos()
                ]);
                setTodosPropietarios(props);
                setInventario(inv);

                if (location.state && location.state.prefill) {
                    const { propietarioId, animalId, citaId: cId} = location.state.prefill;
                    const propEncontrado = props.find(p => p.id == propietarioId);
                    if (cId) setCitaId(cId);
                    if (propEncontrado) {
                        setPropietarioSeleccionado(propEncontrado);
                        const mascotas = await animalService.getAnimalsByPropietarioId(propietarioId);
                        setMascotasDelPropietario(mascotas);
                        if (animalId) {
                            const mascotaExiste = mascotas.find(m => m.id == animalId);
                            if (mascotaExiste) {
                                setPacienteSeleccionadoId(mascotaExiste.id);
                                setFormMascota({
                                    nombre: mascotaExiste.nombre,
                                    especie: mascotaExiste.especie,
                                    raza: mascotaExiste.raza,
                                    sexo: mascotaExiste.sexo,
                                    fechaNacimiento: mascotaExiste.fecha_nacimiento || '',
                                    peso: mascotaExiste.peso || '',
                                    otraEspecie: ''
                                });
                            }
                        }
                    }
                }
                setLoading(false);
            } catch (error) {
                console.error(error);
                setLoading(false);
            }
        };
        cargarDatos();
    }, [location.state]);

    useEffect(() => {
        if (busqueda.length > 2) {
            const results = todosPropietarios.filter(p => 
                p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
                (p.telefono && p.telefono.includes(busqueda))
            );
            setResultadosBusqueda(results);
        } else {
            setResultadosBusqueda([]);
        }
    }, [busqueda, todosPropietarios]);

    // --- PROCESAMIENTO Y FILTRADO DEL INVENTARIO (CON VENCIMIENTOS Y ORDENAMIENTO) ---
    const inventarioProcesado = inventario.map(prod => {
        const { estado, dias } = determinarEstadoVencimiento(prod.fecha_vencimiento);
        return { ...prod, estadoVencimiento: estado, diasVencimiento: dias };
    });

    const inventarioFiltrado = inventarioProcesado
        .filter(prod => prod.nombre.toLowerCase().includes(busquedaInsumo.toLowerCase()))
        .sort((a, b) => {
            // Prioridad 1: Los que están 'por_vencer' van arriba de la lista
            if (a.estadoVencimiento === 'por_vencer' && b.estadoVencimiento !== 'por_vencer') return -1;
            if (b.estadoVencimiento === 'por_vencer' && a.estadoVencimiento !== 'por_vencer') return 1;
            
            // Prioridad 2: Los 'vencidos' van hasta el fondo
            if (a.estadoVencimiento === 'vencido' && b.estadoVencimiento !== 'vencido') return 1;
            if (b.estadoVencimiento === 'vencido' && a.estadoVencimiento !== 'vencido') return -1;
            
            return 0; 
        });

    const seleccionarPropietario = async (prop) => {
        setPropietarioSeleccionado(prop);
        setBusqueda('');
        setResultadosBusqueda([]);
        setFormPropietario({
            nombre: prop.nombre,
            ci: prop.ci || '',
            telefono: prop.telefono || '',
            email: prop.email,
            direccion: prop.direccion || '',
            distrito: prop.distrito || '', 
            latitud: prop.latitud,
            longitud: prop.longitud
        });
        try {
            const mascotas = await animalService.getAnimalsByPropietarioId(prop.id);
            setMascotasDelPropietario(mascotas);
            setPacienteSeleccionadoId('');
        } catch (error) { console.error(error); }
    };

    const limpiarSeleccion = () => {
        setPropietarioSeleccionado(null);
        setMascotasDelPropietario([]);
        setPacienteSeleccionadoId('');
        setFormMascota({ nombre: '', especie: 'Perro', raza: '', sexo: 'Macho', fechaNacimiento: '', peso: '', otraEspecie: '' });
        setFormPropietario({ nombre: '', ci: '' , telefono: '', email: '', direccion: '', distrito: '', latitud: '', longitud: '' });
    };

    const handlePacienteSelect = (e) => {
        const val = e.target.value;
        
        if (val === 'nuevo') {
            setPacienteSeleccionadoId('nuevo');
            setFormMascota({ nombre: '', especie: 'Perro', raza: '', sexo: 'Macho', fechaNacimiento: '', peso: '', otraEspecie: '' });
        } else if (val === '') {
            setPacienteSeleccionadoId('');
            setFormMascota({ nombre: '', especie: 'Perro', raza: '', sexo: 'Macho', fechaNacimiento: '', peso: '', otraEspecie: '' });
        } else {
            const idMascota = Number(val);
            setPacienteSeleccionadoId(idMascota);
            const m = mascotasDelPropietario.find(mas => mas.id === idMascota);
            if (m) {
                setFormMascota({
                    nombre: m.nombre,
                    especie: m.especie,
                    raza: m.raza,
                    sexo: m.sexo,
                    fechaNacimiento: m.fecha_nacimiento || '',
                    peso: m.peso || '',
                    otraEspecie: ''
                });
            }
        }
    };

    const toggleInsumo = (producto) => {
        setInsumosSeleccionados(prev => {
            const newState = { ...prev };
            if (newState[producto.id]) delete newState[producto.id];
            else newState[producto.id] = 1; 
            return newState;
        });
    };

    const handleCantidadChange = (id, valor) => {
        const cantidad = parseFloat(valor);
        if (isNaN(cantidad) || cantidad < 0) return;

        const producto = inventario.find(p => p.id === id);
        if (producto && cantidad > producto.stock) {
            Swal.fire({
                icon: 'warning', title: 'Stock insuficiente',
                text: `Solo tienes ${producto.stock} ${producto.unidad || 'unidades'} disponibles.`,
                toast: true, position: 'top-end', showConfirmButton: false, timer: 3000
            });
            return;
        }
        setInsumosSeleccionados(prev => ({ ...prev, [id]: cantidad }));
    };
    
    const handleMascotaChange = (e) => {
        const { name, value } = e.target;
        if (name === 'fechaNacimiento' && value > fechaMaximaNacimiento) {
            return Swal.fire({ icon: 'error', title: 'Fecha incorrecta', text: 'La fecha no puede ser futura.', confirmButtonColor: '#d33' });
        }
        if (name === 'peso' && parseFloat(value) < 0) {
            return Swal.fire({ icon: 'error', title: 'Error', text: 'El peso no puede ser negativo.', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
        }
        setFormMascota({ ...formMascota, [name]: value });
        if (name === 'especie') setFormMascota(prev => ({ ...prev, especie: value, raza: '', otraEspecie: '' }));
    };

    const handleTratamientoChange = (e) => setFormTratamiento({ ...formTratamiento, [e.target.name]: e.target.value });
    
    const handlePropietarioChange = (e) => {
        const { name, value } = e.target;
        
        setFormPropietario(prev => ({ ...prev, [name]: value }));

        if (name === 'distrito') {
            const distritoEncontrado = [...DISTRITOS_POTOSI.urbanos, ...DISTRITOS_POTOSI.rurales].find(d => d.id === value);
            if (distritoEncontrado) {
                setMapaCentro([distritoEncontrado.lat, distritoEncontrado.lng]);
            }
        }
    };

    const handleMapClick = (latlng) => setFormPropietario({ ...formPropietario, latitud: latlng.lat, longitud: latlng.lng });

    const handleRegistrarConsulta = async (e) => {
        e.preventDefault();
        
        const esNuevoProp = !propietarioSeleccionado;
        if (esNuevoProp && (!formPropietario.nombre || !formPropietario.distrito)) {
             return Swal.fire({ icon: 'warning', title: 'Faltan datos', text: 'Ingrese el nombre y seleccione el distrito del propietario' });
        }
        
        const esNuevaMascota = pacienteSeleccionadoId === 'nuevo' || esNuevoProp;
        if (!esNuevaMascota && !pacienteSeleccionadoId) {
             return Swal.fire({ icon: 'warning', title: 'Faltan datos', text: 'Seleccione un paciente' });
        }

        if (!formMascota.peso) {
            const result = await Swal.fire({
                title: '¿Falta el Peso?',
                text: "No has ingresado el peso del paciente. ¿Deseas continuar?",
                icon: 'question', showCancelButton: true, confirmButtonText: 'Sí, continuar', cancelButtonText: 'Volver'
            });
            if (!result.isConfirmed) return;
        }

        const insumosParaEnviar = Object.keys(insumosSeleccionados)
            .map(id => ({ id: parseInt(id), cantidad: insumosSeleccionados[id] }));

        const confirmacionFinal = await Swal.fire({
            title: '¿Registrar Consulta?',
            text: "Se guardará el historial y se descontará el stock utilizado.",
            icon: 'info', showCancelButton: true, confirmButtonColor: '#10B981', cancelButtonColor: '#EF4444', confirmButtonText: 'Sí, Guardar'
        });

        if (!confirmacionFinal.isConfirmed) return;

        let especieFinal = formMascota.especie;
        let razaFinal = formMascota.raza;
        if (formMascota.especie === 'Otro') {
            especieFinal = formMascota.otraEspecie;
            razaFinal = 'Desconocida';
        }

        const datosEnviar = {
            propietario_id: propietarioSeleccionado ? propietarioSeleccionado.id : null,
            animal_id: (!esNuevaMascota) ? pacienteSeleccionadoId : null,
            
            nombrePropietario: formPropietario.nombre,
            ciPropietario: formPropietario.ci,
            telefonoPropietario: formPropietario.telefono,
            emailPropietario: formPropietario.email,
            direccionPropietario: formPropietario.direccion,
            distritoPropietario: formPropietario.distrito, 
            latitudPropietario: formPropietario.latitud,
            longitudPropietario: formPropietario.longitud,
            
            nombreMascota: formMascota.nombre,
            especie: especieFinal,
            raza: razaFinal,
            sexo: formMascota.sexo,
            fechaNacimiento: formMascota.fechaNacimiento,
            peso: formMascota.peso,

            diagnostico: formTratamiento.diagnostico,
            tratamiento: formTratamiento.tratamiento,
            notas: formTratamiento.notas,
            cita_id: citaId,    
            insumosUtilizados: insumosParaEnviar,

            esVacuna: esVacuna,
            tipoVacuna: esVacuna ? tipoVacuna : null,
            fechaProxima: esVacuna ? fechaRefuerzo : null
        };

        try {
            const res = await historialService.registrarConsultaCompleta(datosEnviar);
            
            if (res.credenciales) {
                await Swal.fire({
                    title: '¡Usuario Creado!',
                    html: `Se creó una cuenta para el propietario.<br/><b>Usuario:</b> ${res.credenciales.email}<br/><b>Contraseña:</b> ${res.credenciales.password_temporal}`,
                    icon: 'success',
                    confirmButtonColor: '#3B82F6',
                    confirmButtonText: 'Entendido'
                });
            } 
            
            if (esVacuna) {
                const result = await Swal.fire({
                    title: '¡Vacunación Registrada!',
                    text: 'Los datos se guardaron y el recordatorio de WhatsApp se programó. ¿Deseas imprimir la hoja de la libreta sanitaria?',
                    icon: 'success',
                    showCancelButton: true,
                    confirmButtonColor: '#2563EB', 
                    cancelButtonColor: '#6B7280', 
                    confirmButtonText: '🖨️ Sí, Imprimir Libreta',
                    cancelButtonText: 'No, solo salir'
                });

                if (result.isConfirmed) {
                    generarCertificadoPDF();
                }
            } 
            
            else if (!res.credenciales) {
                await Swal.fire({
                    icon: 'success', title: '¡Consulta Registrada!',
                    text: 'Los datos se han guardado correctamente.',
                    timer: 2000, showConfirmButton: false
                });
            }

            navigate(`/gestion/animal/${res.animal_id}/historial`, {
                state: { fromPropietarioId: res.propietario_id }
            });

        } catch (error) {
            console.error(error);
            Swal.fire({
                icon: 'error', title: 'Error al guardar',
                text: error.message || "Ocurrió un problema en el servidor"
            });
        }
    };

    if (loading) return <div className="p-8 text-center">Cargando...</div>;

    const mascotaSeleccionadaObj = pacienteSeleccionadoId && pacienteSeleccionadoId !== 'nuevo' 
        ? mascotasDelPropietario.find(m => m.id === pacienteSeleccionadoId) 
        : null;

    const estaInhabilitado = mascotaSeleccionadaObj?.estado && 
        (mascotaSeleccionadaObj.estado.toLowerCase().includes('deceso') || 
         mascotaSeleccionadaObj.estado.toLowerCase().includes('perdid'));

    return (
        <div className="container mx-auto pb-20">
            <div className="mb-6 flex items-center">
                <button onClick={() => navigate('/dashboard')} className="mr-4 text-gray-500 hover:text-blue-600">
                    <ArrowLeft className="h-6 w-6" />
                </button>
                <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                    <Stethoscope className="w-8 h-8 mr-3 text-blue-600" />
                    Nueva Consulta Médica
                </h1>
            </div>

            <form onSubmit={handleRegistrarConsulta} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-gray-700 flex items-center"><User className="w-5 h-5 mr-2 text-blue-500"/> Propietario</h2>
                            {propietarioSeleccionado && <button type="button" onClick={limpiarSeleccion} className="text-xs text-red-500 underline">Cambiar</button>}
                        </div>
                        
                        {!propietarioSeleccionado ? (
                            <div className="relative">
                                <input type="text" className="w-full border rounded-lg p-2 pl-8" placeholder="Buscar..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400"/>
                                {resultadosBusqueda.length > 0 && (
                                    <div className="absolute z-10 w-full bg-white mt-1 rounded shadow-lg border max-h-40 overflow-auto">
                                        {resultadosBusqueda.map(p => (
                                            <div key={p.id} onClick={() => seleccionarPropietario(p)} className="p-2 hover:bg-blue-50 cursor-pointer text-sm border-b">
                                                {p.nombre} <span className="text-gray-400 text-xs">({p.telefono})</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                <div className="mt-4 pt-4 border-t bg-yellow-50 p-3 rounded">
                                    <p className="text-sm font-bold text-yellow-800 mb-2">Registrar Nuevo Dueño</p>
                                    <input type="text" name="nombre" placeholder="Nombre Completo" required className="w-full border rounded p-2 mb-2 text-sm" value={formPropietario.nombre} onChange={handlePropietarioChange}/>
                                    <input type="text" name="ci" placeholder="C.I." className="w-full border rounded p-2 mb-2 text-sm bg-white" value={formPropietario.ci} onChange={handlePropietarioChange}/>
                                    <input type="text" name="telefono" placeholder="Teléfono" className="w-full border rounded p-2 mb-2 text-sm" value={formPropietario.telefono} onChange={handlePropietarioChange}/>
                                    <input type="email" name="email" placeholder="Email" required className="w-full border rounded p-2 mb-2 text-sm" value={formPropietario.email} onChange={handlePropietarioChange}/>
                                    
                                    <select 
                                        name="distrito" 
                                        className="w-full border border-gray-300 rounded p-2 mb-2 text-sm bg-white cursor-pointer" 
                                        value={formPropietario.distrito} 
                                        onChange={handlePropietarioChange} 
                                        required
                                    >
                                        <option value="" disabled>-- Selecciona un Distrito --</option>
                                        <optgroup label="🏢 Urbanos">
                                            {DISTRITOS_POTOSI.urbanos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                                        </optgroup>
                                        <optgroup label="🌲 Rurales">
                                            {DISTRITOS_POTOSI.rurales.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                                        </optgroup>
                                    </select>
                                    
                                    <input type="text" name="direccion" placeholder="Dirección Escrita" className="w-full border rounded p-2 mb-2 text-sm" value={formPropietario.direccion} onChange={handlePropietarioChange}/>
                                    
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Marcar Casa en Mapa:</label>
                                    <div className="h-32 w-full rounded overflow-hidden border relative z-0">
                                            <MapContainer center={mapaCentro} zoom={13} style={{ height: '100%', width: '100%' }}>
                                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                                <MapFix /> 
                                                <ChangeMapView center={mapaCentro} /> 
                                                <LocationPicker onLocationSelected={handleMapClick} position={formPropietario.latitud ? [formPropietario.latitud, formPropietario.longitud] : null} />
                                            </MapContainer>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-blue-50 p-3 rounded border border-blue-100">
                                <p className="font-bold text-blue-900">{propietarioSeleccionado.nombre}</p>
                                <p className="text-xs text-blue-600">{propietarioSeleccionado.direccion}</p>
                                {propietarioSeleccionado.distrito && (
                                    <p className="text-xs font-semibold text-blue-800 mt-1">📍 {propietarioSeleccionado.distrito}</p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center"><Dog className="w-5 h-5 mr-2 text-purple-500"/> Paciente</h2>
                        
                        {propietarioSeleccionado && (
                            <select 
                                className="w-full border rounded-lg p-2 mb-4 bg-white" 
                                value={pacienteSeleccionadoId} 
                                onChange={handlePacienteSelect} 
                            >
                                <option value="">-- Seleccionar Paciente --</option>
                                {mascotasDelPropietario.map(m => {
                                    const estadoEspecial = (m.estado && (m.estado.toLowerCase().includes('deceso') || m.estado.toLowerCase().includes('perdid'))) 
                                        ? ` - [${m.estado.toUpperCase()}]` 
                                        : '';
                                    return (
                                        <option key={m.id} value={m.id}>
                                            {m.nombre} ({m.especie}{estadoEspecial})
                                        </option>
                                    );
                                })}
                                <option value="nuevo">+ Registrar Nueva Mascota</option>
                            </select>
                        )}
                        
                        {(!propietarioSeleccionado || pacienteSeleccionadoId === 'nuevo') && (
                            <div className="space-y-3 bg-purple-50 p-3 rounded border border-purple-100 text-sm animate-fade-in">
                                <input type="text" name="nombre" placeholder="Nombre Mascota" required className="w-full border rounded p-2" value={formMascota.nombre} onChange={handleMascotaChange} />
                                <div className="grid grid-cols-2 gap-2">
                                    <select name="especie" className="border rounded p-2" value={formMascota.especie} onChange={handleMascotaChange}><option>Perro</option><option>Gato</option><option>Otro</option></select>
                                    <select name="sexo" className="border rounded p-2" value={formMascota.sexo} onChange={handleMascotaChange}><option>Macho</option><option>Hembra</option></select>
                                </div>
                                {formMascota.especie === 'Otro' ? (
                                    <input type="text" name="otraEspecie" placeholder="Especifique..." className="w-full border rounded p-2" value={formMascota.otraEspecie} onChange={handleMascotaChange} />
                                ) : (
                                    <select name="raza" className="w-full border rounded p-2 bg-white" value={formMascota.raza} onChange={handleMascotaChange}><option value="">Raza...</option>{formMascota.especie === 'Perro' ? razasPerro.map(r=><option key={r}>{r}</option>) : razasGato.map(r=><option key={r}>{r}</option>)}</select>
                                )}
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">F. Nacimiento</label>
                                        <input type="date" name="fechaNacimiento" max={fechaMaximaNacimiento} className="w-full border rounded p-2" value={formMascota.fechaNacimiento} onChange={handleMascotaChange} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Peso (kg)</label>
                                        <input type="number" step="0.1" min="0" name="peso" placeholder="0.0" className="w-full border rounded p-2" value={formMascota.peso} onChange={handleMascotaChange} />
                                    </div>
                                </div>
                                {formMascota.fechaNacimiento && (
                                    <p className="text-xs text-purple-600 text-right font-medium">Edad: {calcularEdad(formMascota.fechaNacimiento)}</p>
                                )}
                            </div>
                        )}

                        {propietarioSeleccionado && pacienteSeleccionadoId && pacienteSeleccionadoId !== 'nuevo' && (
                            <div className="bg-purple-50 p-4 rounded border border-purple-100 mt-2 text-center animate-fade-in">
                                <div className="flex justify-between items-start">
                                    <div className="text-left">
                                        <div className="flex items-center gap-2">
                                            <p className="text-purple-900 font-bold text-lg">{mascotasDelPropietario.find(m => m.id === pacienteSeleccionadoId)?.nombre}</p>
                                            
                                            {(() => {
                                                const mascota = mascotasDelPropietario.find(m => m.id === pacienteSeleccionadoId);
                                                if (mascota?.estado && (mascota.estado.toLowerCase().includes('deceso') || mascota.estado.toLowerCase().includes('perdid'))) {
                                                    return (
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${mascota.estado.toLowerCase().includes('deceso') ? 'bg-gray-800 text-gray-100' : 'bg-red-500 text-white'}`}>
                                                            {mascota.estado}
                                                        </span>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </div>
                                        
                                        <p className="text-xs text-purple-600 mt-1">
                                            {mascotasDelPropietario.find(m => m.id === pacienteSeleccionadoId)?.raza} | {calcularEdad(mascotasDelPropietario.find(m => m.id === pacienteSeleccionadoId)?.fecha_nacimiento)}
                                        </p>
                                    </div>
                                    <span className="bg-purple-200 text-purple-800 text-xs px-2 py-1 rounded-full font-bold">Registrado</span>
                                </div>
                                
                                <div className="mt-3 pt-3 border-t border-purple-200">
                                    {estaInhabilitado ? (
                                        <div className="bg-red-50 text-red-700 p-2 rounded-lg text-sm font-bold border border-red-200 flex items-center justify-center">
                                            ⚠️ Atención bloqueada: Paciente {mascotaSeleccionadaObj.estado}
                                        </div>
                                    ) : (
                                        <>
                                            <label className="block text-xs font-bold text-gray-700 mb-1 text-left">Peso Actual (kg):</label>
                                            <div className="flex items-center">
                                                <input type="number" step="0.1" min="0" name="peso" placeholder="" className="w-full border border-purple-300 rounded p-2 text-sm focus:ring-2 focus:ring-purple-500 bg-white" value={formMascota.peso} onChange={handleMascotaChange} />
                                                <span className="ml-2 text-sm text-gray-500 font-medium">kg</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white p-8 rounded-xl shadow-md border border-gray-100 h-fit">
                    <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center border-b pb-4">
                        <FileText className="w-6 h-6 mr-2 text-green-600"/> Detalles Clínicos
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-4">
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Diagnóstico</label><input type="text" name="diagnostico" required className="w-full rounded-lg border-gray-300 p-3" placeholder="" value={formTratamiento.diagnostico} onChange={handleTratamientoChange} /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Tratamiento</label><textarea name="tratamiento" rows="3" className="w-full rounded-lg border-gray-300 p-3" placeholder="Descripción..." value={formTratamiento.tratamiento} onChange={handleTratamientoChange} /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Notas</label><textarea name="notas" rows="2" className="w-full rounded-lg border-gray-300 p-3 bg-gray-50" placeholder="Observaciones..." value={formTratamiento.notas} onChange={handleTratamientoChange} /></div>
                            
                            <div className="mt-4 pt-4 border-t border-dashed border-gray-300">
                                <label className="flex items-center gap-2 font-bold text-blue-700 cursor-pointer select-none">
                                    <input 
                                        type="checkbox" 
                                        checked={esVacuna} 
                                        onChange={(e) => setEsVacuna(e.target.checked)}
                                        className="w-5 h-5 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <Syringe className="w-5 h-5"/>
                                    ¿Es Vacunación? (Generar Recordatorio)
                                </label>

                                {esVacuna && (
                                    <div className="mt-3 bg-blue-50 p-4 rounded-lg border border-blue-100 animate-fade-in">
                                        <div className="grid grid-cols-1 gap-3">
                                            <div>
                                                <label className="block text-xs font-semibold text-blue-800 mb-1">Tipo de Vacuna</label>
                                                <select className="w-full p-2 border border-blue-200 rounded text-sm" value={tipoVacuna} onChange={(e) => setTipoVacuna(e.target.value)}>
                                                    <option>Antirrábica</option>
                                                    <option>Triple Felina</option>
                                                    <option>Polivalente</option>
                                                    <option>Parvovirus</option>
                                                    <option>Séptuple</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-blue-800 mb-1">Próximo Refuerzo</label>
                                                <div className="flex gap-2">
                                                    <select 
                                                        className="w-1/2 p-2 border border-blue-200 rounded text-sm focus:ring-2 focus:ring-blue-500"
                                                        value={diasRefuerzo}
                                                        onChange={(e) => setDiasRefuerzo(e.target.value)}
                                                    >
                                                        <option value="15">En 15 días</option>
                                                        <option value="21">En 21 días</option>
                                                        <option value="30">En 1 mes</option>
                                                        <option value="180">En 6 meses</option>
                                                        <option value="365">En 1 año</option>
                                                        <option value="manual" className="font-bold text-blue-600">📅 Seleccionar manualmente...</option>
                                                    </select>

                                                    <input 
                                                        type="date" 
                                                        className={`w-1/2 p-2 border rounded text-sm text-center font-bold transition-colors
                                                            ${esFechaManual 
                                                                ? 'bg-white border-blue-400 text-blue-700 cursor-text shadow-sm' 
                                                                : 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed'
                                                            }`}
                                                        value={fechaRefuerzo}
                                                        readOnly={!esFechaManual}
                                                        onChange={(e) => setFechaRefuerzo(e.target.value)}
                                                        min={new Date().toISOString().split('T')[0]} 
                                                    />
                                                </div>
                                                {esFechaManual && (
                                                    <p className="text-[10px] text-blue-500 mt-1 ml-1 animate-pulse">
                                                        👆 Selecciona la fecha en el calendario
                                                    </p>
                                                )}
                                            </div>
                                            <p className="text-xs text-blue-600 italic mt-2 text-center">
                                                * La libreta sanitaria se podrá imprimir al guardar la consulta.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 h-full flex flex-col">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-bold text-gray-700 flex items-center">
                                    <Box className="w-5 h-5 mr-2 text-orange-500"/> Insumos
                                </h3>
                                {formMascota.peso && (
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-bold border border-blue-200">
                                        Peso Paciente: {formMascota.peso} kg
                                    </span>
                                )}
                            </div>

                            <div className="relative mb-2">
                                <input type="text" className="w-full border border-gray-300 rounded-lg p-2 pl-8 text-sm" placeholder="Buscar medicamento..." value={busquedaInsumo} onChange={(e) => setBusquedaInsumo(e.target.value)} />
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400"/>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar" style={{maxHeight: '320px'}}>
                                {inventarioFiltrado.map(prod => {
                                    const permiteDecimales = ['ml', 'lt', 'kg', 'g', 'mg'].includes(prod.unidad?.toLowerCase());
                                    const isVencido = prod.estadoVencimiento === 'vencido';
                                    const isPorVencer = prod.estadoVencimiento === 'por_vencer';
                                    const isDisabled = prod.stock <= 0 || isVencido;

                                    return (
                                        <label key={prod.id} className={`flex flex-col p-2 rounded border transition-colors ${insumosSeleccionados[prod.id] ? 'bg-white border-blue-300 shadow-sm' : 'border-transparent hover:bg-gray-100'} ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} ${isPorVencer && !insumosSeleccionados[prod.id] ? 'bg-yellow-50/50 border-yellow-200' : ''}`}>
                                            <div className="flex items-center justify-between w-full">
                                                <div className="flex items-center overflow-hidden flex-1">
                                                    <input 
                                                        type="checkbox" 
                                                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mr-3 flex-shrink-0 disabled:opacity-50" 
                                                        checked={!!insumosSeleccionados[prod.id]} 
                                                        onChange={() => {
                                                            if (isDisabled) return;
                                                            if (insumosSeleccionados[prod.id]) toggleInsumo(prod);
                                                            else handleCantidadChange(prod.id, 1);
                                                        }} 
                                                        disabled={isDisabled} 
                                                    />
                                                    <div className="truncate pr-2 w-full">
                                                        <p className={`text-sm font-medium ${isDisabled ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{prod.nombre}</p>
                                                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                            <span className="text-xs text-gray-500">{prod.tipo} | Stock: {prod.stock}</span>
                                                            
                                                            {isVencido && (
                                                                <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold border border-red-200">
                                                                    Vencido
                                                                </span>
                                                            )}
                                                            
                                                            {isPorVencer && (
                                                                <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-bold border border-yellow-200 flex items-center shadow-sm" title="Priorizar uso de este medicamento">
                                                                    <AlertTriangle className="w-3 h-3 mr-1" /> Por vencer ({prod.diasVencimiento}d)
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {insumosSeleccionados[prod.id] && (
                                                <div className="mt-2 ml-7 flex items-center animate-fade-in">
                                                    <label className="text-xs text-gray-600 mr-2">Dosis/Cant:</label>
                                                    <input 
                                                        type="number" 
                                                        step={permiteDecimales ? "0.1" : "1"} 
                                                        min={permiteDecimales ? "0.1" : "1"}
                                                        max={prod.stock}
                                                        className="w-20 border border-gray-300 rounded p-1 text-sm text-center focus:ring-2 focus:ring-blue-500"
                                                        value={insumosSeleccionados[prod.id]}
                                                        onChange={(e) => handleCantidadChange(prod.id, e.target.value)}
                                                        onClick={(e) => e.stopPropagation()} 
                                                        disabled={isVencido}
                                                    />
                                                    <span className="text-xs text-gray-500 ml-1 font-medium">{prod.unidad || 'uds'}</span>
                                                </div>
                                            )}
                                        </label>
                                    );
                                })}
                            </div>
                            
                            {Object.keys(insumosSeleccionados).length > 0 && (
                                <div className="mt-2 pt-2 border-t text-right">
                                    <p className="text-xs text-blue-600 font-medium">{Object.keys(insumosSeleccionados).length} productos seleccionados</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button 
                            type="submit" 
                            disabled={estaInhabilitado}
                            className={`${estaInhabilitado ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} text-white font-bold py-3 px-8 rounded-xl shadow-lg flex items-center transition-all`}
                        >
                            {estaInhabilitado ? <Lock className="w-5 h-5 mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                            {estaInhabilitado ? 'Acción Bloqueada' : 'Guardar Consulta'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default TratamientoPage;