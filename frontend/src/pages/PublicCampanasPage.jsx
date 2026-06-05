import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import campanaService from '../services/campana.service.js';
import socket from '../services/socket.service.js'; 
import { Megaphone, MapPin, Eye, Navigation, Home, Edit, ArrowLeft, Save, MousePointerClick, Footprints } from 'lucide-react';
import MapaCampana from '../components/MapaCampana.jsx'; 
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

// NUEVO COMPONENTE: Permite volar el mapa al cambiar de distrito
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

const formatFechaSimple = (isoString) => {
    if (!isoString) return 'N/A';
    const fecha = new Date(isoString);
    return fecha.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
};

const PanelInscripcionInvitado = ({ campana, onCancel, onConfirm }) => {
    const [formData, setFormData] = useState({
        nombre: '', ci: '', celular: '', direccion: '', distrito: '', cantidad: 1, detalles_animal: '' 
    });
    
    const [position, setPosition] = useState(
        campana.latitud 
        ? { lat: campana.latitud, lng: campana.longitud }
        : { lat: -19.5894, lng: -65.7541 }
    );
    
    const [mapCenter, setMapCenter] = useState([position.lat, position.lng]);

    // FUNCION CLAVE: Cambia el distrito, mueve el pin y vuela el mapa
    const handleDistritoChange = (e) => {
        const val = e.target.value;
        setFormData({...formData, distrito: val});
        const dist = [...DISTRITOS_POTOSI.urbanos, ...DISTRITOS_POTOSI.rurales].find(d => d.id === val);
        if (dist) {
            setMapCenter([dist.lat, dist.lng]);
            setPosition({ lat: dist.lat, lng: dist.lng });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.nombre || !formData.ci || !formData.celular || !formData.distrito) {
            return Swal.fire('Atención', 'Nombre, Carnet, Celular y Distrito son campos obligatorios.', 'warning');
        }
        onConfirm({ ...formData, latitud: position.lat, longitud: position.lng });
    };

    return (
        <div className="bg-white rounded-2xl md:rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col h-full animate-in fade-in duration-300">
            <div className="bg-blue-600 p-4 text-white flex items-center justify-between flex-shrink-0">
                <h2 className="text-lg md:text-xl font-bold flex items-center">
                    <Home className="mr-2 w-5 h-5 md:w-6 md:h-6" /> Inscribir Domicilio
                </h2>
                <button onClick={onCancel} className="text-blue-100 hover:text-white text-xs md:text-sm font-semibold flex items-center bg-blue-700 px-3 py-1.5 rounded-lg transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-1"/> <span className="hidden sm:inline">Cancelar</span>
                </button>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden">
                {/* MAPA MÓVIL: Ocupa h-64 (unos 250px) en celular y todo el alto en PC */}
                <div className="w-full lg:w-2/3 h-64 lg:h-auto relative bg-gray-100 border-b lg:border-b-0 lg:border-r border-gray-200 flex-shrink-0">
                    <MapContainer center={mapCenter} zoom={15} style={{ height: "100%", width: "100%", zIndex: 0 }}>
                        <TileLayer
                            attribution='&copy; OpenStreetMap'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <MapFix /> 
                        <ChangeMapView center={mapCenter} />
                        <LocationMarker position={position} setPosition={setPosition} />
                    </MapContainer>

                    <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur px-3 py-1.5 rounded-full shadow-lg text-[10px] md:text-xs font-bold text-blue-700 z-[400] flex items-center gap-1 border border-blue-100 pointer-events-none">
                        <MousePointerClick size={14} className="text-blue-500 animate-bounce"/> Haz CLICK en tu casa
                    </div>
                </div>

                {/* FORMULARIO MÓVIL: Paddin ajustado y 1 columna en celulares */}
                <div className="w-full lg:w-1/3 p-4 md:p-6 flex flex-col justify-start bg-gray-50 overflow-y-auto custom-scrollbar">
                    <div className="mb-4 md:mb-6 flex-shrink-0">
                        <h3 className="text-base md:text-lg font-bold text-gray-800 mb-1 leading-tight">{campana.nombre}</h3>
                        <p className="text-xs md:text-sm text-gray-500">Llena tus datos para la visita.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4 pb-4">
                        <div>
                            <label className="block text-[10px] md:text-xs font-bold text-gray-700 uppercase mb-1 text-blue-600">📍 Distrito (Obligatorio)</label>
                            <select 
                                required 
                                className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white cursor-pointer shadow-sm"
                                value={formData.distrito} 
                                onChange={handleDistritoChange}
                            >
                                <option value="" disabled>-- Selecciona tu distrito --</option>
                                <optgroup label="🏢 Distritos Urbanos">
                                    {DISTRITOS_POTOSI.urbanos.map(dist => (
                                        <option key={dist.id} value={dist.id}>{dist.nombre}</option>
                                    ))}
                                </optgroup>
                                <optgroup label="🌲 Distritos Rurales">
                                    {DISTRITOS_POTOSI.rurales.map(dist => (
                                        <option key={dist.id} value={dist.id}>{dist.nombre}</option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] md:text-xs font-bold text-gray-700 uppercase mb-1">Nombre Completo</label>
                            <input required type="text" className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm" 
                                value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                             <div>
                                <label className="block text-[10px] md:text-xs font-bold text-gray-700 uppercase mb-1">C.I.</label>
                                <input required type="text" className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm" 
                                    value={formData.ci} onChange={e => setFormData({...formData, ci: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] md:text-xs font-bold text-gray-700 uppercase mb-1">Celular</label>
                                <input required type="tel" className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm" 
                                    value={formData.celular} onChange={e => setFormData({...formData, celular: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-1 gap-3">
                            <div className="col-span-1">
                                <label className="block text-[10px] md:text-xs font-bold text-gray-700 uppercase mb-1">Mascota(s)</label>
                                <input required type="text" placeholder="Ej: 2 perros" className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm" 
                                    value={formData.detalles_animal} onChange={e => setFormData({...formData, detalles_animal: e.target.value})}
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-[10px] md:text-xs font-bold text-gray-700 uppercase mb-1">Cantidad</label>
                                <input type="number" min="1" max="20" className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm" 
                                    value={formData.cantidad} onChange={e => setFormData({...formData, cantidad: e.target.value})}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] md:text-xs font-bold text-gray-700 uppercase mb-1">Dirección Exacta</label>
                            <textarea className="w-full border border-gray-300 rounded-xl p-3 text-sm h-16 md:h-20 resize-none focus:ring-2 focus:ring-blue-500 outline-none shadow-sm" 
                                placeholder="Ej: Av. Murillo, puerta verde..."
                                value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})}
                            />
                        </div>

                        <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 md:py-4 rounded-xl shadow-lg shadow-green-500/30 transition-all hover:scale-[1.02] flex items-center justify-center mt-2">
                            <Save className="w-5 h-5 mr-2" /> Confirmar
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

const PublicCampanasPage = () => {
  const navigate = useNavigate(); 
  const [campanas, setCampanas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [modoInscripcion, setModoInscripcion] = useState(null);
  const [mapaPuntos, setMapaPuntos] = useState([]);
  const [mapaCentro, setMapaCentro] = useState([-19.5894, -65.7541]); 
  const [campanaVisualizada, setCampanaVisualizada] = useState(null); 

  useEffect(() => { 
      const cargar = async () => {
          try {
            setLoading(true);
            const data = await campanaService.getPublicas();
            setCampanas(data);
          } catch (error) { console.error("Error", error); } finally { setLoading(false); }
      };
      cargar();
  }, []);

  useEffect(() => {
    if (!campanaVisualizada) return;
    socket.connect();
    socket.emit('unirse_campana', campanaVisualizada.id);
    const handleUbicacion = (data) => {
        setMapaPuntos(prev => {
            const otros = prev.filter(p => p.id !== `vet_${data.veterinarioId}`);
            return [...otros, { id: `vet_${data.veterinarioId}`, lat: data.lat, lng: data.lng, titulo: data.nombre, descripcion: "Veterinario en camino", tipo: 'veterinario' }];
        });
    };
    socket.on('actualizar_ubicacion', handleUbicacion);
    return () => { socket.emit('salir_campana', campanaVisualizada.id); socket.off('actualizar_ubicacion', handleUbicacion); };
  }, [campanaVisualizada]);

  const handleVerRastreo = (campana) => {
      setModoInscripcion(null);
      setCampanaVisualizada(campana);
      
      const puntos = [];
      if (campana.latitud) {
          puntos.push({ id: 'punto_fijo', lat: campana.latitud, lng: campana.longitud, titulo: "Punto de Vacunación", descripcion: campana.nombre, tipo: 'fijo' });
          setMapaCentro([campana.latitud, campana.longitud]);
      } else {
          setMapaCentro([-19.5894, -65.7541]);
      }
      setMapaPuntos(puntos);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirmarRegistro = async (datos) => {
      try {
          await campanaService.inscribirInvitado({ campana_id: modoInscripcion.id, ...datos });
          Swal.fire({ 
              icon: 'success', 
              title: '¡Ubicación Registrada!', 
              text: 'Tu registro ha sido enviado. Espera a la brigada en tu domicilio.',
              confirmButtonColor: '#3b82f6', 
              timer: 5000 
          });
          setModoInscripcion(null);
      } catch (error) {
          Swal.fire('Atención', error.response?.data?.message || 'Error al inscribirse', 'error');
      }
  };

  return (
    // ELIMINADA la altura rígida para que no se trabe en móvil: min-h-screen y padding flexible
    <div className="container mx-auto min-h-[calc(100vh-80px)] lg:h-[calc(100vh-80px)] flex flex-col p-4">
      
      <div className="mb-4 flex-shrink-0 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
            <h1 className="text-2xl md:text-4xl font-extrabold text-gray-800 mb-1">Campañas Disponibles</h1>
            <p className="text-sm md:text-base text-gray-600">Consulta los puntos de vacunación o rastrea a los brigadistas.</p>
        </div>
        
        <button 
            onClick={() => navigate('/')} 
            className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl shadow-sm hover:bg-gray-50 hover:text-blue-600 transition-all active:scale-95 w-full sm:w-auto"
        >
            <ArrowLeft size={18} /> <span className="sm:hidden">Volver</span> <span className="hidden sm:inline">Volver al Inicio</span>
        </button>
      </div>

      {modoInscripcion ? (
          <div className="flex-1 min-h-0 relative pb-10">
              <PanelInscripcionInvitado 
                  campana={modoInscripcion} 
                  onCancel={() => setModoInscripcion(null)} 
                  onConfirm={handleConfirmarRegistro}
              />
          </div>
      ) : (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0 pb-10">
              
              {/* MAPA PRINCIPAL: h-[50vh] en móvil para que el usuario pueda scrollear hacia abajo y ver la lista */}
              <div className="lg:col-span-2 flex flex-col bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden h-[50vh] lg:h-full relative z-0">
                  <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 flex flex-col sm:flex-row justify-between sm:items-center gap-2 flex-shrink-0">
                        <h2 className="text-sm md:text-lg font-semibold text-gray-700 truncate">
                            Rastreo: <span className="text-blue-600">{campanaVisualizada ? campanaVisualizada.nombre : "Selecciona una campaña"}</span>
                        </h2>
                        <div className="flex items-center space-x-2 self-start sm:self-auto">
                            {campanaVisualizada && (
                                <span className="text-[10px] md:text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-bold animate-pulse">En Vivo</span>
                            )}
                            <span className="text-[10px] md:text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded font-bold">Mapa Activo</span>
                        </div>
                  </div>
                  <div className="flex-1 w-full relative z-0">
                        <MapaCampana key={campanaVisualizada ? campanaVisualizada.id : 'default'} centro={mapaCentro} puntos={mapaPuntos}>
                            <MapFix /> 
                        </MapaCampana>
                  </div>
              </div>

              {/* LISTA DE CAMPAÑAS */}
              <div className="lg:col-span-1 overflow-y-auto pr-0 lg:pr-2 custom-scrollbar flex flex-col gap-4">
                  {loading && <div className="text-center py-10 text-gray-400 font-bold">Cargando campañas...</div>}

                  {!loading && (
                      <>
                          {campanas.length === 0 ? <div className="p-6 bg-gray-50 border border-dashed border-gray-300 text-gray-500 text-center rounded-2xl">No hay campañas activas en este momento.</div> : (
                              campanas.map(campana => (
                                <div key={campana.id} className={`bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all flex flex-col ${campana.id === campanaVisualizada?.id ? 'ring-2 ring-blue-500 scale-[1.01]' : ''}`}>
                                    <div className="p-4 md:p-5 flex-1">
                                            <div className="flex items-start space-x-3 mb-3">
                                                <div className={`flex-shrink-0 p-2 rounded-xl ${campana.tipo === 'Vacunacion' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                                                    <Megaphone className="h-5 w-5 md:h-6 md:w-6" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="text-sm md:text-base font-bold text-gray-800 leading-tight mb-1.5 break-words">{campana.nombre}</h3>
                                                    <span className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider ${campana.estado === 'Ejecucion' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                                        {campana.estado === 'Ejecucion' ? 'En Curso' : 'Próximamente'}
                                                    </span>
                                                </div>
                                            </div>

                                            <p className="text-xs md:text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed">{campana.descripcion}</p>

                                            <div className="text-xs text-gray-500 space-y-1.5 border-t border-gray-100 pt-3">
                                                <p className="flex items-center"><strong className="w-10">Fin:</strong> {formatFechaSimple(campana.fecha_fin)}</p>
                                                {campana.latitud ? <p className="text-blue-600 flex items-center font-bold"><MapPin className="h-3.5 w-3.5 mr-1.5"/> Punto Fijo</p> : <p className="text-green-600 flex items-center font-bold"><Footprints className="h-3.5 w-3.5 mr-1.5"/> Puerta a Puerta</p>}
                                            </div>
                                    </div>

                                    <div className="bg-gray-50 p-3 md:p-4 border-t border-gray-100 space-y-2.5">
                                            <button 
                                                onClick={() => handleVerRastreo(campana)}
                                                className="w-full py-2.5 px-3 bg-white text-blue-600 border-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center transition-all shadow-sm"
                                            >
                                                {campana.latitud ? <Eye className="h-4 w-4 mr-2"/> : <Navigation className="h-4 w-4 mr-2"/>}
                                                {campana.latitud ? "Ver Ubicación" : "Rastrear Veterinarios"}
                                            </button>

                                            {!campana.latitud ? (
                                                <button 
                                                    onClick={() => { setCampanaVisualizada(null); setModoInscripcion(campana); }}
                                                    className="w-full py-2.5 px-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs md:text-sm font-bold transition-all shadow-md shadow-green-600/20 flex items-center justify-center hover:-translate-y-0.5"
                                                >
                                                    <Edit className="h-4 w-4 mr-2" /> Inscribir mi Casa
                                                </button>
                                            ) : (
                                                <button 
                                                    disabled
                                                    className="w-full py-2.5 px-3 bg-gray-100 text-gray-400 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center cursor-not-allowed border border-gray-200"
                                                >
                                                    <Footprints size={14} className="mr-2" /> Asistencia Presencial
                                                </button>
                                            )}
                                    </div>
                                </div>
                              ))
                          )}
                      </>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

export default PublicCampanasPage;