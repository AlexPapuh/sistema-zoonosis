import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import campanaService from '../../services/campana.service.js';
import propietarioService from '../../services/propietario.service.js';
import animalService from '../../services/animal.service.js';
import { useAuth } from '../../context/AuthContext.jsx'; 
import { Syringe, User, Dog, Save, ArrowLeft, Search, CheckCircle, UserPlus, RefreshCcw, Lock, AlertOctagon, MapPin } from 'lucide-react';
import Swal from 'sweetalert2';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});
L.Marker.prototype.options.icon = DefaultIcon;

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

const MapFix = () => {
    const map = useMap();
    useEffect(() => {
        map.invalidateSize();
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 400);
        return () => clearTimeout(timer);
    }, [map]);
    return null;
};

const ChangeMapView = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, 16, { duration: 1.2 });
        }
    }, [center, map]);
    return null;
};

const LocationMarker = ({ position, setPosition }) => {
    useMapEvents({
        click(e) {
            setPosition(e.latlng);
        },
    });
    return position ? <Marker position={position} /> : null;
};

const EjecucionCampanaPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { user } = useAuth();
  const isAdmin = user?.rol === 'Admin';

  const [campana, setCampana] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const hoy = new Date();
  const offset = hoy.getTimezoneOffset();
  const localDate = new Date(hoy.getTime() - (offset * 60 * 1000));
  const fechaMaximaNacimiento = localDate.toISOString().split('T')[0];

  const [todosPropietarios, setTodosPropietarios] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  const [propietarioSeleccionado, setPropietarioSeleccionado] = useState(null);
  const [mascotasDelPropietario, setMascotasDelPropietario] = useState([]);
  const [pacienteSeleccionadoId, setPacienteSeleccionadoId] = useState('nuevo');
  
  const [inscripcionId, setInscripcionId] = useState(null);

  const [mapaCentro, setMapaCentro] = useState([-19.5894, -65.7541]); 

  const [form, setForm] = useState({
      nombrePropietario: '', telefonoPropietario: '', emailPropietario: '', direccionPropietario: '', 
      distritoPropietario: '', 
      latitudPropietario: '', longitudPropietario: '',
      nombreMascota: '', especie: 'Perro', sexo: 'Macho', raza: '', otraEspecie: '', fechaNacimiento: '',
      peso: '', cantidad: '1'
  });

  const isAntirrabica = campana?.nombre?.toLowerCase().includes('antirrábica') || campana?.nombre?.toLowerCase().includes('antirrabica');
  const stockActual = campana ? Number(campana.stock_asignado) : 0;
  const hayStock = stockActual > 0;

  useEffect(() => {
    const cargarDatos = async () => {
      try {
          const data = await campanaService.getCampanaById(id); 
          setCampana(data);
          const props = await propietarioService.getAllPropietarios();
          setTodosPropietarios(props);
      } catch (error) {
          console.error(error);
      } finally {
          setLoading(false);
      }
    };
    cargarDatos();
  }, [id]);

  useEffect(() => {
      if (busqueda.length > 2) {
          const results = todosPropietarios.filter(p => 
              p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
              (p.telefono && p.telefono.includes(busqueda))
          );
          setResultadosBusqueda(results);
      } else { setResultadosBusqueda([]); }
  }, [busqueda, todosPropietarios]);

  useEffect(() => {
      if (!loading && location.state && location.state.datosPrellenados) {
          const datos = location.state.datosPrellenados;
          
          setInscripcionId(datos.inscripcionId); 

          if (datos.esInvitado) {
              limpiarSeleccion(); 
              setForm(prev => ({
                  ...prev,
                  nombrePropietario: datos.nombre || '',
                  telefonoPropietario: datos.telefono || '',
                  direccionPropietario: datos.direccion || '',
                  distritoPropietario: datos.distrito || '', 
                  latitudPropietario: datos.latitud || '',
                  longitudPropietario: datos.longitud || '',
                  emailPropietario: '' 
              }));
              
              if (datos.latitud && datos.longitud) {
                  setMapaCentro([datos.latitud, datos.longitud]);
              }

              Swal.fire({
                  toast: true, position: 'top-end', icon: 'info', 
                  title: 'Datos de invitado cargados', showConfirmButton: false, timer: 3000 
              });

          } else {
              const propEncontrado = todosPropietarios.find(p => 
                  p.id === datos.propietarioId || p.usuario_id === datos.usuarioId
              );
              
              if (propEncontrado) {
                  seleccionarPropietario(propEncontrado);
                  Swal.fire({
                      toast: true, position: 'top-end', icon: 'success', 
                      title: 'Usuario registrado identificado', showConfirmButton: false, timer: 3000 
                  });
              }
          }
          window.history.replaceState({}, document.title);
      }
  }, [location, loading, todosPropietarios]);

  const seleccionarPropietario = async (prop) => {
      setPropietarioSeleccionado(prop);
      setBusqueda('');
      setResultadosBusqueda([]);
      try {
          const mascotas = await animalService.getAnimalsByPropietarioId(prop.id);
          setMascotasDelPropietario(mascotas);
          setPacienteSeleccionadoId('nuevo');
          setForm(prev => ({
              ...prev, 
              nombrePropietario: '', telefonoPropietario: '', emailPropietario: '', direccionPropietario: '', distritoPropietario: '',
              latitudPropietario: '', longitudPropietario: ''
          }));
      } catch (error) { console.error(error); }
  };

  const limpiarSeleccion = () => {
      setPropietarioSeleccionado(null);
      setMascotasDelPropietario([]);
      setPacienteSeleccionadoId('nuevo');
      setForm({ 
          ...form,
          nombrePropietario: '', telefonoPropietario: '', emailPropietario: '', direccionPropietario: '', distritoPropietario: '',
          latitudPropietario: '', longitudPropietario: ''
      });
  };

  const handleInputChange = (e) => {
      const { name, value } = e.target;
      if (name === 'fechaNacimiento' && value > fechaMaximaNacimiento) {
          return Swal.fire({ icon: 'error', title: 'Fecha incorrecta', text: 'No puede ser futura.', confirmButtonColor: '#d33' });
      }
      if ((name === 'peso' || name === 'cantidad') && parseFloat(value) < 0) {
          return Swal.fire({ icon: 'error', title: 'Valor incorrecto', text: 'No negativos.', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
      }
      
      setForm(prev => ({ ...prev, [name]: value }));
      
      if (name === 'especie') setForm(prev => ({ ...prev, especie: value, raza: '', otraEspecie: '' }));

      if (name === 'distritoPropietario') {
          const distritoEncontrado = [...DISTRITOS_POTOSI.urbanos, ...DISTRITOS_POTOSI.rurales].find(d => d.id === value);
          if (distritoEncontrado) {
              setMapaCentro([distritoEncontrado.lat, distritoEncontrado.lng]);
          }
      }
  };

  const handlePacienteSelect = (e) => {
      const val = e.target.value;
      if (val === 'nuevo') {
          setPacienteSeleccionadoId('nuevo');
          setForm(prev => ({...prev, peso: ''})); 
      } else {
          const idMascota = Number(val);
          setPacienteSeleccionadoId(idMascota);
          const m = mascotasDelPropietario.find(mas => mas.id === idMascota);
          if (m && m.peso) {
              setForm(prev => ({...prev, peso: m.peso}));
          } else {
              setForm(prev => ({...prev, peso: ''}));
          }
      }
  };

const handleRegistrarAtencion = async (e) => {
      e.preventDefault();
      
      if (!hayStock) return Swal.fire('Sin Stock', 'No tienes dosis disponibles.', 'error');

      const esNuevaMascota = pacienteSeleccionadoId === 'nuevo';
      
      if (!propietarioSeleccionado && !form.distritoPropietario) {
          return Swal.fire('Falta Distrito', 'Debes seleccionar el distrito del nuevo propietario.', 'warning');
      }

      if (!form.peso) {
        const result = await Swal.fire({ title: '¿Falta el Peso?', text: "Deseas continuar?", icon: 'question', showCancelButton: true, confirmButtonText: 'Sí' });
        if (!result.isConfirmed) return;
      }

      const cantidadUsar = isAntirrabica ? 1 : (form.cantidad || 1);
      if (cantidadUsar > stockActual) return Swal.fire('Stock Insuficiente', '', 'warning');

      const confirmacion = await Swal.fire({
          title: `¿Registrar Atención?`,
          text: `Se descontarán ${cantidadUsar} dosis.`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#10B981',
          confirmButtonText: 'Sí, Registrar'
      });

      if (!confirmacion.isConfirmed) return;

      let especieFinal = form.especie === 'Otro' ? form.otraEspecie : form.especie;
      let razaFinal = form.especie === 'Otro' ? 'Desconocida' : form.raza;

      const datosParaEnviar = {
          propietario_id: propietarioSeleccionado ? propietarioSeleccionado.id : null,
          animal_id: (!esNuevaMascota) ? pacienteSeleccionadoId : null,
          ...form,
          especie: especieFinal, raza: razaFinal, peso: form.peso, cantidad: cantidadUsar,
          inscripcion_id: inscripcionId 
      };

      try {
          const respuesta = await campanaService.registrarAtencionRapida(id, datosParaEnviar);
          
          setCampana(prev => ({...prev, stock_asignado: respuesta.nuevo_stock}));

          if (respuesta.credenciales) {
            await Swal.fire({
                title: '¡Usuario Creado!',
                html: `Se creó una cuenta para el propietario.<br/><b>Usuario:</b> ${respuesta.credenciales.email}<br/><b>Contraseña:</b> ${respuesta.credenciales.password_temporal}`,
                icon: 'success',
                confirmButtonColor: '#4F46E5',
                confirmButtonText: 'OK'
            });
          }

          const preguntaOtra = await Swal.fire({
              title: '¡Vacunación Exitosa!',
              text: '¿Deseas registrar otra mascota para este mismo domicilio?',
              icon: 'success',
              showCancelButton: true,
              confirmButtonColor: '#3B82F6',
              cancelButtonColor: '#6B7280',
              confirmButtonText: 'Sí, otra mascota',
              cancelButtonText: 'No, finalizar visita'
          });

          if (preguntaOtra.isConfirmed) {
              if (!propietarioSeleccionado && respuesta.propietario_id) {
                  const nuevoProp = {
                      id: respuesta.propietario_id,
                      nombre: form.nombrePropietario,
                      telefono: form.telefonoPropietario,
                      email: form.emailPropietario
                  };
                  setPropietarioSeleccionado(nuevoProp);
                  
                  const mascotasActualizadas = await animalService.getAnimalsByPropietarioId(respuesta.propietario_id);
                  setMascotasDelPropietario(mascotasActualizadas);
              } else if (propietarioSeleccionado) {
                    const mascotasActualizadas = await animalService.getAnimalsByPropietarioId(propietarioSeleccionado.id);
                    setMascotasDelPropietario(mascotasActualizadas);
              }

              setPacienteSeleccionadoId('nuevo');
              setForm(prev => ({
                  ...prev,
                  nombreMascota: '', especie: 'Perro', sexo: 'Macho', raza: '', otraEspecie: '', 
                  fechaNacimiento: '', peso: '', cantidad: '1'
              }));

          } else {
              navigate('/gestion/campanas');
          }

      } catch (error) {
          console.error(error);
          Swal.fire({ icon: 'error', title: 'Error', text: error.message || "Error al registrar" });
      }
  };
  const handleDevolverStock = async () => {
    const result = await Swal.fire({ title: '¿Finalizar Campaña?', text: `Se devolverán ${Number(campana.stock_asignado).toFixed(2)} unidades al inventario principal.`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Sí, Finalizar' });
    if (result.isConfirmed) {
        try {
            const res = await campanaService.finalizarCampana(id);
            await Swal.fire('Finalizada', `${res.message}`, 'success');
            navigate('/dashboard'); 
        } catch (error) { Swal.fire('Error', error.message, 'error'); }
    }
  };

  if (loading) return <div className="p-8 text-center">Cargando...</div>;

  // --- LÓGICA DE BLOQUEO DE ATENCIÓN PARA PACIENTES CON DECESO/PÉRDIDA ---
  const mascotaSeleccionadaObj = pacienteSeleccionadoId && pacienteSeleccionadoId !== 'nuevo' 
      ? mascotasDelPropietario.find(m => m.id === pacienteSeleccionadoId) 
      : null;

  const estaInhabilitado = mascotaSeleccionadaObj?.estado && 
      (mascotaSeleccionadaObj.estado.toLowerCase().includes('deceso') || 
       mascotaSeleccionadaObj.estado.toLowerCase().includes('perdid'));

  return (
    <div className="container mx-auto p-4 pb-20">
        <button onClick={() => navigate('/gestion/campanas')} className="flex items-center text-gray-500 mb-4 hover:text-gray-700">
            <ArrowLeft className="w-4 h-4 mr-1"/> Volver a Gestión
        </button>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            <div className={`p-6 text-white flex justify-between items-center shadow-inner transition-colors duration-500 ${hayStock ? 'bg-blue-600' : 'bg-gray-600'}`}>
                <div>
                    <h1 className="text-3xl font-bold">{campana.nombre}</h1>
                    <p className="opacity-90 mt-1 flex items-center text-blue-100"><Syringe className="w-4 h-4 mr-2"/> Ejecución de Campaña</p>
                </div>
                <div className={`text-right p-4 rounded-xl backdrop-blur-md border border-white/20 shadow-lg ${hayStock ? 'bg-white/10' : 'bg-red-500/20 border-red-400'}`}>
                    <p className="text-xs font-bold uppercase tracking-wider text-white mb-1">Dosis Disponibles</p>
                    <p className="text-6xl font-extrabold leading-none">{stockActual.toFixed(1)}</p>
                </div>
            </div>

            {!hayStock && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 m-6 rounded shadow-sm flex items-center animate-pulse">
                    <AlertOctagon className="w-10 h-10 mr-4 text-red-600" />
                    <div>
                        <p className="font-bold text-lg">¡Stock Agotado!</p>
                        <p className="text-sm">Se han terminado tus dosis asignadas. Tu trabajo se pausa hasta recibir una recarga.</p>
                        <p className="text-xs mt-1 font-semibold text-red-800">Contacta al Administrador para continuar.</p>
                    </div>
                </div>
            )}

            <div className={`p-8 ${!hayStock ? 'opacity-50 pointer-events-none filter blur-[1px]' : ''}`}>
                {!propietarioSeleccionado && (
                    <div className="mb-8 relative">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Buscar Propietario Existente</label>
                        <div className="flex"><div className="relative flex-1"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-5 w-5 text-gray-400"/></div><input type="text" className="block w-full pl-10 border-gray-300 rounded-lg p-3 bg-gray-50" placeholder="Buscar por nombre o teléfono..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} disabled={!hayStock} /></div></div>
                        {resultadosBusqueda.length > 0 && (<div className="absolute z-10 w-full bg-white mt-1 rounded-md shadow-lg border border-gray-200 max-h-60 overflow-auto">{resultadosBusqueda.map(prop => (<div key={prop.id} onClick={() => seleccionarPropietario(prop)} className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 flex justify-between"><span className="font-medium text-gray-800">{prop.nombre}</span><span className="text-sm text-gray-500">{prop.telefono}</span></div>))}</div>)}
                    </div>
                )}

                <form onSubmit={handleRegistrarAtencion} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    <div className="space-y-5 border-r md:pr-6 border-gray-100">
                        <div className="flex items-center text-blue-600 font-semibold mb-2 justify-between">
                            <div className="flex items-center"><div className="bg-blue-100 p-2 rounded-full mr-3"><User className="h-5 w-5"/></div><h3>Datos del Propietario</h3></div>
                            {propietarioSeleccionado && <button type="button" onClick={limpiarSeleccion} className="text-xs text-red-500 underline">Cambiar</button>}
                        </div>

                        {propietarioSeleccionado ? (
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <p className="font-bold text-lg text-blue-900">{propietarioSeleccionado.nombre}</p>
                                <p className="text-blue-700">{propietarioSeleccionado.email}</p>
                                <p className="text-sm text-blue-600 mt-1">{propietarioSeleccionado.telefono || 'Sin teléfono'}</p>
                                <div className="mt-2 flex items-center text-xs text-green-600 font-bold"><CheckCircle className="w-4 h-4 mr-1"/> Usuario Registrado</div>
                            </div>
                        ) : (
                            <>
                                <div className="bg-yellow-50 p-2 rounded text-xs text-yellow-700 mb-2 flex items-center"><UserPlus className="w-4 h-4 mr-1"/> Registrando Nuevo Usuario</div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label><input type="text" name="nombrePropietario" required className="block w-full border-gray-300 rounded-lg p-3 bg-white focus:ring-2 focus:ring-blue-500" placeholder="" value={form.nombrePropietario} onChange={handleInputChange} disabled={!hayStock} /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label><input type="text" name="telefonoPropietario" className="block w-full border-gray-300 rounded-lg p-3" value={form.telefonoPropietario} onChange={handleInputChange} disabled={!hayStock} /></div>
                                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" name="emailPropietario" className="block w-full border-gray-300 rounded-lg p-3" value={form.emailPropietario} onChange={handleInputChange} disabled={!hayStock} /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1 text-blue-600">Distrito</label>
                                        <select 
                                            name="distritoPropietario" 
                                            className="block w-full border-gray-300 rounded-lg p-3 bg-white cursor-pointer" 
                                            value={form.distritoPropietario || ""} 
                                            onChange={handleInputChange} 
                                            required
                                            disabled={!hayStock}
                                        >
                                            <option value="" disabled>-- Seleccionar --</option>
                                            <optgroup label="🏢 Urbanos">
                                                {DISTRITOS_POTOSI.urbanos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                                            </optgroup>
                                            <optgroup label="🌲 Rurales">
                                                {DISTRITOS_POTOSI.rurales.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                                            </optgroup>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Dirección/Zona</label>
                                        <input type="text" name="direccionPropietario" className="block w-full border-gray-300 rounded-lg p-3" value={form.direccionPropietario} onChange={handleInputChange} disabled={!hayStock} />
                                    </div>
                                </div>
                                
                                <div className="mt-2 h-48 w-full rounded-lg overflow-hidden border border-gray-300 relative z-0">
                                    <MapContainer center={mapaCentro} zoom={15} style={{ height: "100%", width: "100%" }}>
                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                                        <MapFix />
                                        <ChangeMapView center={mapaCentro} />
                                        <LocationMarker
                                            position={form.latitudPropietario ? { lat: form.latitudPropietario, lng: form.longitudPropietario } : null}
                                            setPosition={(pos) => setForm(prev => ({ ...prev, latitudPropietario: pos.lat, longitudPropietario: pos.lng }))}
                                        />
                                    </MapContainer>
                                    <div className="absolute bottom-1 left-1 bg-white/80 px-2 py-1 text-xs rounded z-[400] text-gray-600 flex items-center shadow-sm">
                                         <MapPin size={12} className="mr-1"/> Click para marcar casa
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="space-y-5">
                        <div className="flex items-center text-purple-600 font-semibold mb-2">
                            <div className="bg-purple-100 p-2 rounded-full mr-3"><Dog className="h-5 w-5"/></div>
                            <h3>Datos del Paciente</h3>
                        </div>

                        {propietarioSeleccionado && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar Paciente</label>
                                <select className="block w-full border-gray-300 rounded-lg p-3 bg-white focus:ring-2 focus:ring-purple-500 transition-all" value={pacienteSeleccionadoId} onChange={handlePacienteSelect} disabled={!hayStock}>
                                    <option value="nuevo">+ Registrar Nueva Mascota</option>
                                    {mascotasDelPropietario.map(m => {
                                        const estadoEspecial = (m.estado && (m.estado.toLowerCase().includes('deceso') || m.estado.toLowerCase().includes('perdid'))) 
                                            ? ` - [${m.estado.toUpperCase()}]` 
                                            : '';
                                        return (
                                            <option key={m.id} value={m.id}>
                                                {m.nombre} ({m.especie} - {m.raza}{estadoEspecial})
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        )}
                        
                        {(!propietarioSeleccionado || pacienteSeleccionadoId === 'nuevo') && (
                            <div className="animate-fade-in border-t border-gray-100 pt-4 mt-2">
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Nombre Mascota</label><input type="text" name="nombreMascota" required className="block w-full border-gray-300 rounded-lg p-3 bg-white focus:ring-2 focus:ring-purple-500" value={form.nombreMascota} onChange={handleInputChange} disabled={!hayStock} /></div>
                                <div className="grid grid-cols-2 gap-4 mt-3">
                                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Especie</label><select name="especie" className="block w-full border-gray-300 rounded-lg p-3 bg-white" value={form.especie} onChange={handleInputChange} disabled={!hayStock}><option value="Perro">Perro</option><option value="Gato">Gato</option><option value="Otro">Otro</option></select></div>
                                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label><select name="sexo" className="block w-full border-gray-300 rounded-lg p-3 bg-white" value={form.sexo} onChange={handleInputChange} disabled={!hayStock}><option value="Macho">Macho</option><option value="Hembra">Hembra</option></select></div>
                                </div>
                                <div className="mt-3"><label className="block text-sm font-medium text-gray-700 mb-1">{form.especie === 'Otro' ? 'Especifique Animal' : 'Raza'}</label>{form.especie === 'Otro' ? (<input type="text" name="otraEspecie" required className="block w-full border-gray-300 rounded-lg p-3" value={form.otraEspecie} onChange={handleInputChange} disabled={!hayStock} />) : (<select name="raza" className="block w-full border-gray-300 rounded-lg p-3 bg-white" value={form.raza} onChange={handleInputChange} disabled={!hayStock}><option value="">-- Seleccionar --</option>{form.especie === 'Perro' && razasPerro.map(r => <option key={r} value={r}>{r}</option>)}{form.especie === 'Gato' && razasGato.map(r => <option key={r} value={r}>{r}</option>)}</select>)}</div>
                                
                                <div className="grid grid-cols-3 gap-4 mt-3">
                                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Fecha Nac.</label><input type="date" name="fechaNacimiento" className="block w-full border-gray-300 rounded-lg p-3 bg-white" value={form.fechaNacimiento} onChange={handleInputChange} max={fechaMaximaNacimiento} disabled={!hayStock} /></div>
                                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label><input type="number" step="0.1" min="0" name="peso" placeholder="0.0" className="block w-full border-gray-300 rounded-lg p-3 bg-white" value={form.peso} onChange={handleInputChange} disabled={!hayStock} /></div>
                                    <div>
                                        <label className="block text-sm font-medium text-blue-700 mb-1 flex items-center">Dosis {isAntirrabica && <Lock className="w-3 h-3 ml-1 text-gray-400"/>}</label>
                                        <input type="number" step="0.1" min="0.1" name="cantidad" className={`block w-full border-blue-300 rounded-lg p-3 font-bold text-blue-900 ${isAntirrabica ? 'bg-gray-100 cursor-not-allowed' : 'bg-blue-50'}`} value={isAntirrabica ? '1' : form.cantidad} onChange={handleInputChange} readOnly={isAntirrabica} disabled={!hayStock} />
                                    </div>
                                </div>
                                {form.fechaNacimiento && (<p className="text-xs text-purple-600 text-right mt-1 font-medium">Edad: {calcularEdad(form.fechaNacimiento)}</p>)}
                            </div>
                        )}

                        {propietarioSeleccionado && pacienteSeleccionadoId !== 'nuevo' && (
                            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 text-center">
                                <p className="text-purple-800 font-bold">Paciente Seleccionado</p>
                                
                                <div className="flex items-center justify-center gap-2 mt-1">
                                    <p className="text-2xl font-bold text-purple-900">
                                        {mascotasDelPropietario.find(m => m.id === pacienteSeleccionadoId)?.nombre}
                                    </p>
                                    
                                    {(() => {
                                        const mascota = mascotasDelPropietario.find(m => m.id === pacienteSeleccionadoId);
                                        if (mascota?.estado && (mascota.estado.toLowerCase().includes('deceso') || mascota.estado.toLowerCase().includes('perdid'))) {
                                            return (
                                                <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase tracking-wider ${mascota.estado.toLowerCase().includes('deceso') ? 'bg-gray-800 text-gray-100' : 'bg-red-500 text-white'}`}>
                                                    {mascota.estado}
                                                </span>
                                            );
                                        }
                                        return null;
                                    })()}
                                </div>

                                <div className="mt-3 pt-3 border-t border-purple-200 text-left">
                                    {estaInhabilitado ? (
                                        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm font-bold border border-red-200 text-center flex justify-center items-center">
                                            <AlertOctagon className="w-5 h-5 mr-2" /> Atención bloqueada ({mascotaSeleccionadaObj.estado})
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-4">
                                             <div><label className="block text-xs font-bold text-gray-600 mb-1">Peso Actual (kg)</label><input type="number" step="0.1" min="0" name="peso" placeholder="Ej: 12" className="w-full border-gray-300 rounded p-2 text-sm" value={form.peso} onChange={handleInputChange} disabled={!hayStock} /></div>
                                             <div><label className="block text-xs font-bold text-blue-700 mb-1">Dosis</label><input type="number" step="0.1" min="0.1" name="cantidad" className={`w-full border-blue-300 rounded p-2 text-sm font-bold text-blue-900 ${isAntirrabica ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`} value={isAntirrabica ? '1' : form.cantidad} onChange={handleInputChange} readOnly={isAntirrabica} disabled={!hayStock} /></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-2 pt-6 border-t border-gray-100 mt-2 flex gap-4">
                        {isAdmin && (
                            <button type="button" onClick={handleDevolverStock} className="flex-1 flex justify-center items-center py-4 px-8 border border-gray-300 rounded-xl shadow-sm text-lg font-bold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all pointer-events-auto">
                                <RefreshCcw className="w-6 h-6 mr-2 text-orange-500" />
                                Devolver Stock
                            </button>
                        )}
                        <button 
                            type="submit" 
                            disabled={!hayStock || estaInhabilitado}
                            className={`flex-[2] flex justify-center items-center py-4 px-8 border border-transparent rounded-xl shadow-lg text-lg font-bold text-white transition-all focus:outline-none focus:ring-4 pointer-events-auto 
                            ${(!hayStock || estaInhabilitado) ? 'bg-gray-400 cursor-not-allowed opacity-100' : 'bg-green-600 hover:bg-green-700 hover:scale-105 focus:ring-green-300'}`}
                        >
                            {hayStock && !estaInhabilitado ? <Save className="w-6 h-6 mr-2" /> : <Lock className="w-6 h-6 mr-2" />}
                            {estaInhabilitado ? 'Paciente Inhabilitado' : (hayStock ? 'Registrar Vacunación' : 'Sin Stock')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
  );
};

export default EjecucionCampanaPage;