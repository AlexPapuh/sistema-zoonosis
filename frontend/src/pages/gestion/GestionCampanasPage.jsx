import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; 
import campanaService from '../../services/campana.service.js';
import inventarioService from '../../services/inventario.service.js';
import userService from '../../services/user.service.js';
import socket from '../../services/socket.service.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Megaphone, MapPin, Plus, Eye, X, CheckCircle, Play, Calculator, Users, Navigation, Edit, ChevronLeft, ChevronRight, Trash2, AlertTriangle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import Swal from 'sweetalert2';
import MapaCampana from '../../components/MapaCampana.jsx';

const MapFix = () => {
    const map = useMap();
    useEffect(() => {
        setTimeout(() => { map.invalidateSize(); }, 200); 
    }, [map]);
    return null;
};

const LocationPicker = ({ onLocationSelected, position, disabled }) => {
    useMapEvents({ 
        click(e) { 
            if (!disabled) onLocationSelected(e.latlng); 
        }, 
    });
    return position ? <Marker position={position} /> : null;
};

const formatFechaSimple = (isoString) => {
  if (!isoString) return 'N/A';
  const fecha = new Date(isoString);
  return fecha.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
};

const getEstadoBadge = (estado) => {
    switch(estado) {
        case 'Planificada': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'Ejecucion': return 'bg-green-100 text-green-800 border-green-200 animate-pulse';
        case 'Finalizada': return 'bg-gray-100 text-gray-600 border-gray-200';
        default: return 'bg-gray-100';
    }
};

const GestionCampanasPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate(); 
  
  const isAdmin = user?.rol === 'Admin';
  const isVete = user?.rol === 'Veterinario';

  const [campanas, setCampanas] = useState([]);
  const [todoElInventario, setTodoElInventario] = useState([]); 
  const [insumosFiltrados, setInsumosFiltrados] = useState([]); 
  const [veterinarios, setVeterinarios] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5); 

  const [mapaPuntos, setMapaPuntos] = useState([]);
  const [mapaCentro, setMapaCentro] = useState([-19.5894, -65.7541]); 
  const [campanaActiva, setCampanaActiva] = useState(null); 
  const [compartiendo, setCompartiendo] = useState(false);
  const watchIdRef = useRef(null);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false); 
  const [editingId, setEditingId] = useState(null);
  const [editingStatus, setEditingStatus] = useState(null); 
  const [tipoUbicacion, setTipoUbicacion] = useState('fijo'); 
  
  const [asignaciones, setAsignaciones] = useState([]); 
  const [tempAsignacion, setTempAsignacion] = useState({ veterinario_id: '', stock: '' }); 

  const [formData, setFormData] = useState({
      nombre: '', descripcion: '', fecha_inicio: '', fecha_fin: '', 
      tipo: 'Vacunacion', latitud: '', longitud: '', inventario_id: '' 
  });

  useEffect(() => { 
      cargarDatos(); 
      setTimeout(() => { window.dispatchEvent(new Event('resize')); }, 500);
  }, []);

  useEffect(() => {
    if (!campanaActiva) return;
    socket.connect();
    socket.emit('unirse_campana', campanaActiva.id);

    const handleUbicacionesIniciales = (usuariosActivos) => {
        if (!usuariosActivos || usuariosActivos.length === 0) return;
        setMapaPuntos(prevPuntos => {
            const puntosNoVets = prevPuntos.filter(p => p.tipo !== 'veterinario');
            const nuevosVets = usuariosActivos.map(u => ({
                id: `vet_${u.veterinarioId}`, lat: u.lat, lng: u.lng, titulo: u.nombre,
                descripcion: `Última ubicación: ${new Date(u.timestamp).toLocaleTimeString()}`, tipo: 'veterinario'
            }));
            return [...puntosNoVets, ...nuevosVets];
        });
    };

    const handleUbicacion = (data) => {
        setMapaPuntos(prevPuntos => {
            const otrosPuntos = prevPuntos.filter(p => p.id !== `vet_${data.veterinarioId}`);
            const nuevoPunto = {
                id: `vet_${data.veterinarioId}`, lat: data.lat, lng: data.lng, titulo: data.nombre,
                descripcion: "Veterinario en Campo (En Vivo)", tipo: 'veterinario' 
            };
            return [...otrosPuntos, nuevoPunto];
        });
    };

    socket.on('ubicaciones_iniciales', handleUbicacionesIniciales);
    socket.on('actualizar_ubicacion', handleUbicacion);

    return () => {
        socket.emit('salir_campana', campanaActiva.id);
        socket.off('ubicaciones_iniciales', handleUbicacionesIniciales);
        socket.off('actualizar_ubicacion', handleUbicacion);
        if (watchIdRef.current) {
             navigator.geolocation.clearWatch(watchIdRef.current);
             setCompartiendo(false);
        }
    };
  }, [campanaActiva]);

  const toggleCompartirUbicacion = () => {
    if (!campanaActiva) return;
    if (!compartiendo) {
        if (!navigator.geolocation) return Swal.fire('Error', 'Tu navegador no soporta geolocalización', 'error');
        navigator.geolocation.getCurrentPosition((position) => {
             const { latitude, longitude } = position.coords;
             socket.emit('enviar_ubicacion', { campanaId: campanaActiva.id, veterinarioId: user.id, nombre: user.nombre, lat: latitude, lng: longitude });
        });
        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                socket.emit('enviar_ubicacion', { campanaId: campanaActiva.id, veterinarioId: user.id, nombre: user.nombre, lat: latitude, lng: longitude });
            },
            (error) => console.error(error), { enableHighAccuracy: true }
        );
        watchIdRef.current = watchId;
        setCompartiendo(true);
        Swal.fire({ toast: true, icon: 'success', title: 'Compartiendo ubicación...', position: 'top-end', showConfirmButton: false, timer: 2000 });
    } else {
        if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
        setCompartiendo(false);
        Swal.fire({ toast: true, icon: 'info', title: 'Ubicación detenida.', position: 'top-end', showConfirmButton: false, timer: 2000 });
    }
  };

  const cargarDatos = async () => {
    try {
      setLoading(true);
      let data = await campanaService.getAllCampanas();
      const ordenEstados = { 'Ejecucion': 1, 'Planificada': 2, 'Finalizada': 3 };
      data.sort((a, b) => {
          const pesoA = ordenEstados[a.estado] || 99;
          const pesoB = ordenEstados[b.estado] || 99;
          if (pesoA !== pesoB) return pesoA - pesoB;
          return new Date(b.fecha_inicio) - new Date(a.fecha_inicio);
      });
      setCampanas(data);
      if (isAdmin) {
          const productos = await inventarioService.getAllProductos();
          setTodoElInventario(productos);
          setInsumosFiltrados(productos.filter(p => p.tipo === 'Vacuna'));
          const usuarios = await userService.getAllUsers();
          setVeterinarios(usuarios.filter(u => u.rol === 'Veterinario'));
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = campanas.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(campanas.length / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  useEffect(() => {
      if (!todoElInventario.length) return;
      let filtrados = [];
      switch (formData.tipo) {
          case 'Vacunacion': filtrados = todoElInventario.filter(p => p.tipo === 'Vacuna'); break;
          case 'Desparasitacion': filtrados = todoElInventario.filter(p => p.tipo === 'Medicamento'); break;
          case 'Esterilizacion': filtrados = todoElInventario.filter(p => p.tipo === 'Insumo' || p.tipo === 'Medicamento'); break;
          case 'Adopcion': filtrados = todoElInventario.filter(p => p.tipo === 'Otro' || p.unidad === 'kits'); break;
          default: filtrados = todoElInventario;
      }
      setInsumosFiltrados(filtrados);
  }, [formData.tipo, todoElInventario]);

  const handleAddVeterinario = () => {
      if (!tempAsignacion.veterinario_id || !tempAsignacion.stock || parseFloat(tempAsignacion.stock) <= 0) return Swal.fire({ toast: true, icon: 'warning', title: 'Datos inválidos', position: 'top-end', showConfirmButton: false, timer: 3000 });
      if (asignaciones.some(a => a.veterinario_id == tempAsignacion.veterinario_id)) {
           return Swal.fire({ toast: true, icon: 'info', title: 'Veterinario ya en lista', position: 'top-end', showConfirmButton: false, timer: 3000 });
      }
      const veteInfo = veterinarios.find(v => v.id == tempAsignacion.veterinario_id);
      setAsignaciones([...asignaciones, { ...tempAsignacion, nombre_vete: veteInfo.nombre }]);
      setTempAsignacion({ veterinario_id: '', stock: '' }); 
  };

  const handleRemoveVeterinario = (index) => {
      const nuevas = [...asignaciones];
      nuevas.splice(index, 1);
      setAsignaciones(nuevas);
  };

  const handleUpdateStock = (index, newVal) => {
    const nuevas = [...asignaciones];
    nuevas[index].stock = newVal; 
    setAsignaciones(nuevas);
  };

  const calcularStockTotalRequerido = () => {
      return asignaciones.reduce((acc, curr) => acc + parseFloat(curr.stock), 0);
  };

  const handleOpenCreate = () => {
      setIsEditing(false);
      setEditingId(null);
      setEditingStatus(null); 
      setFormData({ nombre: '', descripcion: '', fecha_inicio: '', fecha_fin: '', tipo: 'Vacunacion', latitud: '', longitud: '', inventario_id: '' });
      setAsignaciones([]);
      setTipoUbicacion('fijo');
      setShowModal(true);
  };

  const handleOpenEdit = async (campana) => {
      setIsEditing(true);
      setEditingId(campana.id);
      setEditingStatus(campana.estado); 
      setFormData({
          nombre: campana.nombre,
          descripcion: campana.descripcion,
          fecha_inicio: campana.fecha_inicio.split('T')[0],
          fecha_fin: campana.fecha_fin.split('T')[0],
          tipo: campana.tipo,
          latitud: campana.latitud || '',
          longitud: campana.longitud || '',
          inventario_id: campana.inventario_id || ''
      });
      setTipoUbicacion(campana.latitud ? 'fijo' : 'puerta');
      try {
          const detalleCompleto = await campanaService.getCampanaById(campana.id);
          if (detalleCompleto.asignaciones) {
              const asignacionesMapeadas = detalleCompleto.asignaciones.map(a => ({
                  veterinario_id: a.veterinario_id,
                  stock: a.stock_inicial, 
                  nombre_vete: a.nombre_veterinario
              }));
              setAsignaciones(asignacionesMapeadas);
          }
      } catch (error) { setAsignaciones([]); }
      setShowModal(true);
  };

  const handleVerMapa = async (campana) => {
    setCampanaActiva(campana);
    const nuevosPuntos = [];
    const isEnEjecucion = campana.estado === 'Ejecucion';

    if (campana.latitud && campana.longitud) {
        nuevosPuntos.push({ 
            id: 'centro', lat: campana.latitud, lng: campana.longitud, 
            titulo: "Punto de Vacunación", descripcion: campana.nombre, tipo: 'fijo' 
        });
        setMapaCentro([campana.latitud, campana.longitud]);
    }

    try {
        const inscripciones = await campanaService.getInscripcionesConGeo(campana.id);
        inscripciones.forEach(ins => {
            if (ins.latitud && ins.longitud) {
                const nombreMostrar = ins.nombre_final || ins.nombre_contacto || ins.propietario_nombre || "Invitado";
                const telefonoMostrar = ins.telefono_final || ins.celular_contacto || ins.telefono || "";
                const dirTexto = ins.direccion_contacto || ins.direccion || "Sin dirección";
                const isAtendido = ins.atendido === true || ins.estado === 'Visitado'; 

                nuevosPuntos.push({ 
                    id: `ins_${ins.id}`, 
                    id_inscripcion: ins.id, 
                    lat: ins.latitud, 
                    lng: ins.longitud, 
                    titulo: nombreMostrar, 
                    descripcion: `Domicilio: ${dirTexto} (Mascotas: ${ins.cantidad_mascotas || 1})`,
                    atendido: isAtendido,
                    tipo: 'domicilio',
                    editable: isEnEjecucion,
                    nombre_contacto: nombreMostrar, 
                    telefono_contacto: telefonoMostrar,
                    direccion_contacto: dirTexto,
                    usuario_id: ins.propietario_id ? ins.usuario_id : null,
                    propietario_id: ins.propietario_id,
                    ci_contacto: ins.ci_contacto
                });
            }
        });
        if (!campana.latitud && inscripciones.length > 0 && inscripciones[0].latitud) {
             setMapaCentro([inscripciones[0].latitud, inscripciones[0].longitud]);
        }
    } catch (error) { console.error(error); }
    setMapaPuntos(nuevosPuntos);
  };

  const handleAtenderDomicilio = (punto) => {
      navigate(`/gestion/campana/${campanaActiva.id}/ejecucion`, { 
          state: { 
              datosPrellenados: {
                  esInvitado: punto.usuario_id === null,
                  usuarioId: punto.usuario_id,
                  propietarioId: punto.propietario_id,
                  nombre: punto.nombre_contacto,
                  telefono: punto.telefono_contacto,
                  direccion: punto.direccion_contacto,
                  inscripcionId: punto.id_inscripcion, 
                  ci: punto.ci_contacto
              } 
          } 
      });
  };

  const handleMarcarAtendido = async (inscripcionId) => {
    try {
        await campanaService.marcarAtendido(inscripcionId); 
        setMapaPuntos(prevPuntos => prevPuntos.map(p => {
            if (p.id_inscripcion === inscripcionId) return { ...p, atendido: true }; 
            return p;
        }));
        Swal.fire({ toast: true, icon: 'success', title: '¡Domicilio marcado!', position: 'top-end', showConfirmButton: false, timer: 2000 });
    } catch (error) { Swal.fire('Error', 'No se pudo actualizar.', 'error'); }
  };

  const handleInputChange = (e) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleModalMapClick = (latlng) => {
      setFormData({ ...formData, latitud: latlng.lat, longitud: latlng.lng });
  };

  const handleSubmit = async (e) => {
      e.preventDefault();
      if (!isAdmin) return; 
      
      const dataToSubmit = { ...formData };
      
      if (tipoUbicacion === 'fijo') {
          if ((!dataToSubmit.latitud || !dataToSubmit.longitud) && editingStatus !== 'Ejecucion') return Swal.fire({ icon: 'warning', title: 'Falta Ubicación' });
      } else {
          dataToSubmit.latitud = null; dataToSubmit.longitud = null;
      }

      const payload = { ...dataToSubmit, asignaciones: asignaciones };

      try {
          if (isEditing) {
              await campanaService.updateCampana(editingId, payload);
              Swal.fire({ icon: 'success', title: 'Actualizada', timer: 2000, showConfirmButton: false });
          } else {
              await campanaService.createCampana(payload);
              Swal.fire({ icon: 'success', title: 'Creada', timer: 2000, showConfirmButton: false });
          }
          setShowModal(false);
          cargarDatos(); 
      } catch (error) { Swal.fire({ icon: 'error', title: 'Error', text: error.message }); }
  };

  const handleIniciar = async (id) => {
      const result = await Swal.fire({ title: '¿Iniciar?', icon: 'question', showCancelButton: true });
      if (result.isConfirmed) {
          try { await campanaService.iniciarCampana(id); cargarDatos(); } catch (error) { Swal.fire('Error', 'No se pudo iniciar.', 'error'); }
      }
  };

  const handleFinalizar = async (id) => {
      const result = await Swal.fire({ title: '¿Finalizar?', icon: 'warning', showCancelButton: true });
      if (result.isConfirmed) {
          try { await campanaService.finalizarCampana(id); cargarDatos(); } catch (error) { Swal.fire('Error', error.message, 'error'); }
      }
  };

  const productoSeleccionado = todoElInventario.find(p => p.id == formData.inventario_id);
  const stepInput = (['ml', 'lt', 'kg', 'g'].includes(productoSeleccionado?.unidad?.toLowerCase())) ? "0.01" : "1";

  return (
    <div className="container mx-auto h-[calc(100vh-100px)] flex flex-col px-4 py-4">
      <div className="mb-6 flex items-center justify-between flex-shrink-0">
        <h1 className="text-4xl font-bold text-gray-800">Gestión de Campañas</h1>
        {isAdmin && (
            <button onClick={handleOpenCreate} className="flex items-center rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white shadow-md hover:bg-blue-700 transition-colors">
                <Plus className="mr-2 h-5 w-5" /> Nueva Campaña
            </button>
        )}
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        <div className="lg:col-span-2 flex flex-col bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden h-full">
            <div className="border-b border-gray-200 bg-gray-50 px-5 py-4 flex justify-between items-center flex-shrink-0">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-gray-700 truncate">
                        Mapa: <span className="text-blue-600">{campanaActiva ? campanaActiva.nombre : "Selecciona una campaña"}</span>
                    </h2>
                    {isVete && campanaActiva?.estado === 'Ejecucion' && (
                        <button onClick={toggleCompartirUbicacion} className={`flex items-center px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${compartiendo ? 'bg-green-500 text-white animate-pulse' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}>
                            <Navigation className="w-3.5 h-3.5 mr-2" /> {compartiendo ? 'Compartiendo' : 'Compartir Ubicación'}
                        </button>
                    )}
                </div>
            </div>
            
            <div className="flex-1 w-full relative z-0">
                <MapaCampana 
                    centro={mapaCentro} 
                    puntos={mapaPuntos} 
                    onMarcarAtendido={handleMarcarAtendido} 
                    onAtenderDomicilio={handleAtenderDomicilio} 
                />
            </div>
        </div>

        <div className="lg:col-span-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                {loading ? <div className="text-center py-10">Cargando...</div> : (
                    campanas.length === 0 ? <div className="p-10 text-center text-gray-500 bg-white rounded-xl shadow-sm italic">Sin campañas registradas.</div> : (
                        currentItems.map((campana) => (
                        <div key={campana.id} className={`flex flex-col overflow-hidden rounded-xl bg-white shadow-md hover:shadow-lg transition-all border-l-8 ${campana.estado === 'Ejecucion' ? 'border-green-500' : campana.estado === 'Planificada' ? 'border-blue-500' : 'border-gray-300'}`}>
                            <div className="p-5">
                                <div className="mb-3 flex items-start justify-between">
                                    <h3 className="text-lg font-bold text-gray-800 leading-tight mr-2">{campana.nombre}</h3>
                                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border ${getEstadoBadge(campana.estado)}`}>
                                        {campana.estado === 'Ejecucion' ? 'En Curso' : campana.estado}
                                    </span>
                                </div>
                                <p className="mb-4 text-sm text-gray-600 line-clamp-2">{campana.descripcion}</p>
                                
                                <div className="mb-4 text-xs text-gray-500 flex items-center bg-gray-50 p-2 rounded-lg">
                                    <Calculator className="w-3.5 h-3.5 mr-2 text-blue-500" /> 
                                    <span>Stock Asignado: <strong className="text-gray-800">{campana.stock_asignado} {campana.unidad}</strong></span>
                                </div>

                                <div className="text-xs text-gray-500 space-y-2 border-t border-gray-100 pt-3">
                                    <div className="flex items-center"><Play className="w-3 h-3 mr-2 text-green-500" /> Inicio: {formatFechaSimple(campana.fecha_inicio)}</div>
                                    <div className={`flex items-center font-bold ${campana.latitud ? 'text-blue-600' : 'text-purple-600'}`}>
                                      <MapPin className="mr-2 h-3.5 w-3.5" /> {campana.latitud ? 'Punto Fijo' : 'Móvil / Puerta a Puerta'}
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 p-3 flex justify-between items-center border-t border-gray-100">
                                <button onClick={() => handleVerMapa(campana)} className={`flex-1 text-xs font-bold flex items-center justify-center py-2 rounded-lg transition-colors ${campana.id === campanaActiva?.id ? 'text-green-700 bg-green-100 shadow-inner' : 'text-blue-600 hover:bg-blue-50'}`}>
                                    <Eye className="mr-2 h-4 w-4" /> {campana.id === campanaActiva?.id ? 'Viendo Mapa' : 'Ver Mapa'}
                                </button>
                                {isAdmin && (
                                    <div className="flex space-x-2 pl-3">
                                        {campana.estado === 'Planificada' && <button onClick={() => handleIniciar(campana.id)} className="p-2 text-blue-600 bg-white border border-blue-200 rounded-lg shadow-sm hover:bg-blue-50" title="Iniciar"><Play className="h-4 w-4" /></button>}
                                        {(campana.estado === 'Planificada' || campana.estado === 'Ejecucion') && (
                                            <button onClick={() => handleOpenEdit(campana)} className="p-2 text-orange-600 bg-white border border-orange-200 rounded-lg shadow-sm hover:bg-orange-50" title="Editar"><Edit className="h-4 w-4" /></button>
                                        )}
                                        {campana.estado === 'Ejecucion' && <button onClick={() => handleFinalizar(campana.id)} className="p-2 text-green-600 bg-white border border-green-200 rounded-lg shadow-sm hover:bg-green-50" title="Finalizar"><CheckCircle className="h-4 w-4" /></button>}
                                    </div>
                                )}
                            </div>
                        </div>
                        ))
                    )
                )}
            </div>
            
            {campanas.length > itemsPerPage && (
                <div className="bg-white p-4 border-t border-gray-200 flex justify-between items-center mt-4 rounded-xl shadow-md">
                    <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className={`p-2 rounded-lg transition-colors ${currentPage === 1 ? 'text-gray-300' : 'text-blue-600 hover:bg-blue-50'}`}><ChevronLeft className="w-5 h-5" /></button>
                    <span className="text-sm font-bold text-gray-600">Página {currentPage} de {totalPages}</span>
                    <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className={`p-2 rounded-lg transition-colors ${currentPage === totalPages ? 'text-gray-300' : 'text-blue-600 hover:bg-blue-50'}`}><ChevronRight className="w-5 h-5" /></button>
                </div>
            )}
        </div>
      </div>

    {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl rounded-2xl bg-white p-8 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"><X className="h-7 w-7" /></button>
            <h2 className="text-3xl font-extrabold text-gray-800 mb-8 border-b-2 border-gray-100 pb-4">{isEditing ? 'Editar Campaña' : 'Nueva Campaña'}</h2>
            
            {editingStatus === 'Ejecucion' && (
                <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-8 text-orange-800 rounded-r-lg shadow-sm">
                    <p className="font-bold flex items-center mb-1"><AlertTriangle className="w-5 h-5 mr-2 text-orange-600"/> Campaña en Curso</p>
                    <p className="text-sm">Solo se permite la gestión del equipo de trabajo y recargas de stock.</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-1">Nombre</label>
                        <input type="text" name="nombre" required disabled={editingStatus === 'Ejecucion'} className="w-full rounded-xl border-gray-300 border p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow disabled:bg-gray-100" value={formData.nombre} onChange={handleInputChange} />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-1">Descripción</label>
                        <textarea name="descripcion" rows="3" required disabled={editingStatus === 'Ejecucion'} className="w-full rounded-xl border-gray-300 border p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow disabled:bg-gray-100" value={formData.descripcion} onChange={handleInputChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Fecha Inicio</label>
                        <input type="date" name="fecha_inicio" required disabled={editingStatus === 'Ejecucion'} className="w-full rounded-xl border-gray-300 border p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow disabled:bg-gray-100" value={formData.fecha_inicio} onChange={handleInputChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Fecha Fin</label>
                        <input type="date" name="fecha_fin" required disabled={editingStatus === 'Ejecucion'} className="w-full rounded-xl border-gray-300 border p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow disabled:bg-gray-100" value={formData.fecha_fin} onChange={handleInputChange} />
                    </div>
                </div>

                <div className="rounded-2xl bg-blue-50 p-6 border border-blue-100 shadow-inner">
                    <h3 className="font-bold text-blue-900 mb-5 flex items-center"><Users className="w-6 h-6 mr-3 text-blue-600"/> Equipo e Insumos</h3>
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Insumo a Repartir</label>
                        <select name="inventario_id" disabled={isEditing} className="w-full rounded-xl border-gray-300 border p-3 bg-white disabled:bg-gray-200" value={formData.inventario_id} onChange={handleInputChange}>
                            <option value="">-- Seleccionar producto del inventario --</option>
                            {insumosFiltrados.map(v => (<option key={v.id} value={v.id}>{v.nombre} (Disponibilidad: {v.stock} {v.unidad})</option>))}
                        </select>
                    </div>

                    {formData.inventario_id && (
                        <div className="bg-white p-5 rounded-xl shadow-md border border-gray-200">
                            <h4 className="text-sm font-bold text-gray-700 mb-4 border-b border-gray-100 pb-2">Asignación de Personal</h4>
                            <div className="flex gap-3 items-end mb-6">
                                <div className="flex-1"><select className="w-full border rounded-lg p-2.5 text-sm" value={tempAsignacion.veterinario_id} onChange={(e) => setTempAsignacion({...tempAsignacion, veterinario_id: e.target.value})}><option value="">Seleccionar Veterinario</option>{veterinarios.map(v => (!asignaciones.some(a => a.veterinario_id == v.id) && <option key={v.id} value={v.id}>{v.nombre}</option>))}</select></div>
                                <div className="w-36"><input type="number" min="0" step={stepInput} placeholder="Dosis" className="w-full border rounded-lg p-2.5 text-sm" value={tempAsignacion.stock} onChange={(e) => setTempAsignacion({...tempAsignacion, stock: e.target.value})}/></div>
                                <button type="button" onClick={handleAddVeterinario} className="bg-green-600 hover:bg-green-700 text-white p-2.5 rounded-lg transition-transform active:scale-95"><Plus className="w-6 h-6"/></button>
                            </div>
                            {asignaciones.length > 0 ? (
                                <table className="w-full text-sm border-separate border-spacing-y-2">
                                    <thead><tr className="text-gray-500 uppercase text-[10px] tracking-widest"><th className="pb-2 text-left px-3">Nombre</th><th className="pb-2 text-right">Cantidad</th><th className="pb-2 text-center w-10">Quitar</th></tr></thead>
                                    <tbody>
                                        {asignaciones.map((asig, idx) => (
                                            <tr key={idx} className="bg-gray-50 rounded-lg group"><td className="p-3 font-semibold text-gray-800 rounded-l-lg">{asig.nombre_vete}</td><td className="p-3 text-right">
                                              <input type="number" min="0" step={stepInput} value={asig.stock} onChange={(e) => handleUpdateStock(idx, e.target.value)} className="w-20 border border-gray-300 rounded-md px-2 py-1 text-right focus:ring-2 focus:ring-blue-500 outline-none" />
                                              <span className="ml-2 text-[10px] text-gray-400 font-bold">{productoSeleccionado?.unidad}</span>
                                            </td><td className="p-3 text-center rounded-r-lg"><button type="button" onClick={() => handleRemoveVeterinario(idx)} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4"/></button></td></tr>
                                        ))}
                                        <tr className="bg-blue-600 text-white font-bold"><td className="p-3 rounded-l-lg">TOTAL A DESCONTAR</td><td className="p-3 text-right">{calcularStockTotalRequerido()} {productoSeleccionado?.unidad}</td><td className="p-3 rounded-r-lg"></td></tr>
                                    </tbody>
                                </table>
                            ) : <p className="text-center py-4 text-gray-400 italic text-sm">Sin personal asignado a esta campaña.</p>}
                        </div>
                    )}
                </div>

                <div className="rounded-2xl bg-gray-50 p-6 border border-gray-200">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center"><MapPin className="w-6 h-6 mr-3 text-blue-600"/> Localización Estratégica</h3>
                    <div className="flex space-x-8 mb-6 bg-white p-3 rounded-xl border border-gray-200 w-fit">
                        <label className="flex items-center cursor-pointer group"><input type="radio" name="tipoUbicacion" value="fijo" checked={tipoUbicacion === 'fijo'} onChange={() => setTipoUbicacion('fijo')} disabled={editingStatus === 'Ejecucion'} className="h-5 w-5 text-blue-600 focus:ring-blue-500" /><span className="ml-3 font-bold text-gray-700 group-hover:text-blue-600 transition-colors">Punto Fijo / Carpa</span></label>
                        <label className="flex items-center cursor-pointer group"><input type="radio" name="tipoUbicacion" value="puerta" checked={tipoUbicacion === 'puerta'} onChange={() => setTipoUbicacion('puerta')} disabled={editingStatus === 'Ejecucion'} className="h-5 w-5 text-green-600 focus:ring-green-500" /><span className="ml-3 font-bold text-gray-700 group-hover:text-green-600 transition-colors">Ruta Móvil / Casa por Casa</span></label>
                    </div>
                    {tipoUbicacion === 'fijo' && (
                        <div className={`h-80 w-full rounded-2xl overflow-hidden border-2 border-gray-300 shadow-lg relative z-0 ${editingStatus === 'Ejecucion' ? 'grayscale opacity-60 pointer-events-none' : ''}`}>
                            <MapContainer center={[-19.5894, -65.7541]} zoom={14} style={{ height: '100%', width: '100%' }}>
                             <MapFix />   
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />    
                            <LocationPicker onLocationSelected={handleModalMapClick} position={formData.latitud ? [formData.latitud, formData.longitud] : null} disabled={editingStatus === 'Ejecucion'} />
                            </MapContainer>
                        </div>
                    )}
                </div>
                <div className="flex justify-end gap-4 pt-6">
                    <button type="button" onClick={() => setShowModal(false)} className="px-8 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-bold transition-colors">Cancelar</button>
                    <button type="submit" className="px-10 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-extrabold shadow-lg transition-transform active:scale-95">Finalizar Configuración</button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionCampanasPage;