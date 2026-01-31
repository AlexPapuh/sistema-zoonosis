import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import campanaService from '../services/campana.service.js';
import socket from '../services/socket.service.js'; 
import { Megaphone, MapPin, Eye, Navigation, Home, Edit, ArrowLeft, Save, User, Phone, FileText, CheckCircle, Footprints, MousePointerClick } from 'lucide-react';
import MapaCampana from '../components/MapaCampana.jsx'; 
import Swal from 'sweetalert2';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';

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
        nombre: '', ci: '', celular: '', direccion: '', cantidad: 1, detalles_animal: '' 
    });
    
    const [position, setPosition] = useState(
        campana.latitud 
        ? { lat: campana.latitud, lng: campana.longitud }
        : { lat: -19.5894, lng: -65.7541 }
    );

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.nombre || !formData.ci || !formData.celular) {
            return Swal.fire('Atención', 'Nombre, Carnet y Celular son obligatorios.', 'warning');
        }
        onConfirm({ ...formData, latitud: position.lat, longitud: position.lng });
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col h-full animate-in fade-in duration-300">
            <div className="bg-blue-600 p-4 text-white flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center">
                    <Home className="mr-2" /> Inscribir Domicilio
                </h2>
                <button onClick={onCancel} className="text-blue-100 hover:text-white text-sm font-semibold flex items-center bg-blue-700 px-3 py-1 rounded">
                    <ArrowLeft className="w-4 h-4 mr-1"/> Cancelar
                </button>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden">
                <div className="lg:w-2/3 h-64 lg:h-auto relative bg-gray-100 border-r border-gray-200">
                    
                    <MapContainer center={[position.lat, position.lng]} zoom={15} style={{ height: "100%", width: "100%" }}>
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <MapFix /> 
                        <LocationMarker position={position} setPosition={setPosition} />
                    </MapContainer>

                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur px-4 py-2 rounded-full shadow-lg text-xs font-bold text-blue-700 z-[400] flex items-center gap-2 border border-blue-100 pointer-events-none">
                        <MousePointerClick size={16} className="text-blue-500 animate-bounce"/> Haz CLICK en tu casa
                    </div>
                </div>

                <div className="lg:w-1/3 p-6 flex flex-col justify-center bg-gray-50 overflow-y-auto">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-1">{campana.nombre}</h3>
                        <p className="text-sm text-gray-500">Llena tus datos para la visita.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nombre Completo</label>
                            <input required type="text" className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                                placeholder="Ej: Juan Perez"
                                value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                             <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">C.I.</label>
                                <input required type="text" className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                                    value={formData.ci} onChange={e => setFormData({...formData, ci: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Celular</label>
                                <input required type="tel" className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                                    value={formData.celular} onChange={e => setFormData({...formData, celular: e.target.value})}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Detalle Mascotas</label>
                            <input required type="text" className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                                placeholder="Ej: 2 Perros, 1 Gato"
                                value={formData.detalles_animal} onChange={e => setFormData({...formData, detalles_animal: e.target.value})}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Cantidad Total</label>
                            <input type="number" min="1" max="20" className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                                value={formData.cantidad} onChange={e => setFormData({...formData, cantidad: e.target.value})}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Dirección / Referencia</label>
                            <textarea className="w-full border border-gray-300 rounded-lg p-3 text-sm h-20 resize-none focus:ring-2 focus:ring-blue-500 outline-none" 
                                placeholder="Color de puerta, calle, etc."
                                value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})}
                            />
                        </div>

                        <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg shadow-md transition-colors flex items-center justify-center mt-4">
                            <Save className="w-5 h-5 mr-2" /> Confirmar Registro
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

  // Socket
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
          Swal.fire('Error', error.response?.data?.message || 'Error', 'error');
      }
  };

  return (
    <div className="container mx-auto h-[calc(100vh-100px)] flex flex-col pb-4">
      
      <div className="mb-4 flex-shrink-0 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-1">Campañas Disponibles</h1>
            <p className="text-gray-600">Consulta los puntos de vacunación o rastrea a los veterinarios.</p>
        </div>
        
        <button 
            onClick={() => navigate('/')} 
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg shadow-sm hover:bg-gray-50 hover:text-blue-600 transition-all active:scale-95"
        >
            <ArrowLeft size={18} /> Volver al Inicio
        </button>
      </div>

      {modoInscripcion ? (
          <div className="flex-1 min-h-0 relative">
              <PanelInscripcionInvitado 
                  campana={modoInscripcion} 
                  onCancel={() => setModoInscripcion(null)} 
                  onConfirm={handleConfirmarRegistro}
              />
          </div>
      ) : (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
              
              <div className="lg:col-span-2 flex flex-col bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden h-full min-h-[400px]">
                  <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 flex justify-between items-center flex-shrink-0">
                        <h2 className="text-lg font-semibold text-gray-700 truncate">
                            Rastreo: <span className="text-blue-600">{campanaVisualizada ? campanaVisualizada.nombre : "Selecciona una campaña"}</span>
                        </h2>
                        <div className="flex items-center space-x-2">
                            {campanaVisualizada && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded animate-pulse">En Vivo</span>
                            )}
                            <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">Mapa Activo</span>
                        </div>
                  </div>
                  <div className="flex-1 w-full relative z-0">
                       <MapaCampana key={campanaVisualizada ? campanaVisualizada.id : 'default'} centro={mapaCentro} puntos={mapaPuntos}>
                           <MapFix /> 
                       </MapaCampana>
                  </div>
              </div>

              <div className="lg:col-span-1 overflow-y-auto pr-2 custom-scrollbar">
                  {loading && <div className="text-center py-10 text-gray-400">Cargando...</div>}

                  {!loading && (
                      <div className="flex flex-col gap-4">
                          {campanas.length === 0 ? <div className="p-4 bg-gray-50 text-gray-500 text-center rounded">No hay campañas activas.</div> : (
                              campanas.map(campana => (
                                <div key={campana.id} className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col ${campana.id === campanaVisualizada?.id ? 'ring-2 ring-blue-400' : ''}`}>
                                    <div className="p-4 flex-1">
                                            <div className="flex items-start space-x-3 mb-3">
                                                <div className={`flex-shrink-0 p-2 rounded-full ${campana.tipo === 'Vacunacion' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                                                    <Megaphone className="h-5 w-5" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="text-base font-bold text-gray-800 leading-tight mb-1 break-words">{campana.nombre}</h3>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${campana.estado === 'Ejecucion' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                                        {campana.estado === 'Ejecucion' ? 'En Curso' : 'Próximamente'}
                                                    </span>
                                                </div>
                                            </div>

                                            <p className="text-xs text-gray-600 mb-3 line-clamp-3">{campana.descripcion}</p>

                                            <div className="text-xs text-gray-500 space-y-1 border-t border-gray-100 pt-2">
                                                <p><strong>Fin:</strong> {formatFechaSimple(campana.fecha_fin)}</p>
                                                {campana.latitud ? <p className="text-blue-600 flex items-center font-semibold"><MapPin className="h-3 w-3 mr-1"/> Punto Fijo</p> : <p className="text-green-600 flex items-center font-semibold"><MapPin className="h-3 w-3 mr-1"/> Puerta a Puerta</p>}
                                            </div>
                                    </div>

                                    <div className="bg-gray-50 p-3 border-t border-gray-100 space-y-2">
                                        <button 
                                            onClick={() => handleVerRastreo(campana)}
                                            className="w-full py-1.5 px-3 bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 rounded text-sm font-bold flex items-center justify-center transition-colors"
                                        >
                                            {campana.latitud ? <Eye className="h-4 w-4 mr-2"/> : <Navigation className="h-4 w-4 mr-2"/>}
                                            {campana.latitud ? "Ver Ubicación" : "Rastrear Veterinarios"}
                                        </button>

                                        {!campana.latitud ? (
                                            <button 
                                                onClick={() => { setCampanaVisualizada(null); setModoInscripcion(campana); }}
                                                className="w-full py-1.5 px-3 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors flex items-center justify-center shadow-sm"
                                            >
                                                <Edit className="h-4 w-4 mr-2" /> Inscribirse
                                            </button>
                                        ) : (
                                            <button 
                                                disabled
                                                className="w-full py-1.5 px-3 bg-gray-100 text-gray-400 rounded text-sm font-bold flex items-center justify-center cursor-default border border-gray-200"
                                            >
                                                <Footprints size={14} className="mr-2" /> Asistencia Presencial
                                            </button>
                                        )}
                                    </div>
                                </div>
                              ))
                          )}
                      </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

export default PublicCampanasPage;