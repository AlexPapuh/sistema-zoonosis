import React, { useState, useEffect, useRef } from 'react';
import campanaService from '../../services/campana.service.js';
import { useAuth } from '../../context/AuthContext.jsx'; 
import socket from '../../services/socket.service.js'; 
import { Megaphone, MapPin, Eye, CheckCircle, Navigation, Home, Edit, ArrowLeft, Save, X } from 'lucide-react';
import MapaCampana from '../../components/MapaCampana.jsx';
import Swal from 'sweetalert2';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const formatFechaSimple = (isoString) => {
    if (!isoString) return 'N/A';
    const fecha = new Date(isoString);
    return fecha.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
};


const PanelInscripcion = ({ campana, user, onCancel, onConfirm }) => {
    const [paso, setPaso] = useState(1);

    const [direccion, setDireccion] = useState(user.direccion || '');
    const [cantidad, setCantidad] = useState(1);
    
    const [actualizarPerfil, setActualizarPerfil] = useState(!user.latitud);
    const [coords, setCoords] = useState({
        lat: user.latitud ? parseFloat(user.latitud) : -19.5894,
        lng: user.longitud ? parseFloat(user.longitud) : -65.7541
    });

    const mapRef = useRef(null);
    const mapInstance = useRef(null);

    
    useEffect(() => {
        if (paso === 2 && mapRef.current && !mapInstance.current) {
            setTimeout(() => {
                if (!mapRef.current) return;
                
                mapInstance.current = L.map(mapRef.current).setView([coords.lat, coords.lng], 16);

                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap'
                }).addTo(mapInstance.current);

                const marker = L.marker([coords.lat, coords.lng], { draggable: true }).addTo(mapInstance.current);

                marker.on('dragend', (e) => {
                    const { lat, lng } = e.target.getLatLng();
                    setCoords({ lat, lng });
                });
                
                mapInstance.current.invalidateSize();
            }, 100);
        }
        
        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, [paso]); 

   
    const handleUsarUbicacionActual = () => {
        onConfirm({
            campanaId: campana.id,
            direccion_contacto: user.direccion,
            cantidad_mascotas: cantidad,
            latitud: user.latitud,
            longitud: user.longitud,
            actualizar_perfil: false 
        });
    };

    const handleActualizarUbicacion = () => {
        setPaso(2); 
    };

    const handleSubmitForm = (e) => {
        e.preventDefault();
        if (!direccion.trim()) return Swal.fire('Error', 'La dirección es obligatoria', 'error');
        
        onConfirm({
            campanaId: campana.id,
            direccion_contacto: direccion,
            cantidad_mascotas: cantidad,
            latitud: coords.lat,
            longitud: coords.lng,
            actualizar_perfil: actualizarPerfil
        });
    };

    if (paso === 1) {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center relative">
                    <button onClick={onCancel} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>

                    <div className="mx-auto bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mb-4 text-blue-600">
                        <MapPin size={32} />
                    </div>

                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                        Confirmar Ubicación
                    </h3>
                    <p className="text-gray-600 mb-6 text-sm">
                        Elige cómo quieres registrar tu domicilio para la campaña.
                    </p>
                    
                    <div className="flex flex-col gap-4">
                        <button 
                            onClick={handleActualizarUbicacion}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all"
                        >
                            📍 Abrir mapa y editar ubicación
                        </button>
                        
                        <div className="flex items-center gap-2 text-gray-300 text-sm font-medium">
                            <div className="h-px bg-gray-200 flex-1"></div>
                            O USAR ACTUAL
                            <div className="h-px bg-gray-200 flex-1"></div>
                        </div>

                        <div className={`border-2 rounded-xl p-4 transition-colors text-left ${(!user.direccion && !user.latitud) ? 'border-gray-100 bg-gray-50' : 'border-green-100 bg-green-50'}`}>
                            
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <span className="block text-xs font-bold text-gray-500 uppercase">Tu Dirección Guardada:</span>
                                    <p className="text-sm font-semibold text-gray-800 line-clamp-2">
                                        {user.direccion || user.latitud ? (user.direccion || "Ubicación GPS registrada") : "(Sin datos)"}
                                    </p>
                                </div>
                                {user.direccion && <CheckCircle className="text-green-600 h-5 w-5" />}
                            </div>

                            <div className="flex items-center gap-3 mb-3">
                                <label className="text-sm font-medium text-gray-700">Mascotas:</label>
                                <input 
                                    type="number" 
                                    min="1" max="50"
                                    value={cantidad}
                                    onChange={(e) => setCantidad(e.target.value)}
                                    className="w-20 border border-gray-300 rounded px-2 py-1 text-center focus:ring-2 focus:ring-green-500 outline-none"
                                    disabled={!user.direccion && !user.latitud}
                                />
                            </div>

                            <button 
                                onClick={handleUsarUbicacionActual}
                                disabled={!user.direccion && !user.latitud}
                                className={`w-full font-bold py-2 px-4 rounded-lg transition-colors ${
                                    (!user.direccion && !user.latitud)
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'bg-green-600 hover:bg-green-700 text-white shadow-md'
                                }`}
                            >
                                Confirmar con esta dirección
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

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
                    <div ref={mapRef} className="w-full h-full z-0" />
                    <div className="absolute top-2 right-2 bg-white px-3 py-1 rounded shadow text-xs font-bold text-gray-600 z-[400]">
                        Arrastra el pin rojo para ajustar
                    </div>
                </div>

                <div className="lg:w-1/3 p-6 flex flex-col justify-center bg-gray-50 overflow-y-auto">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-1">{campana.nombre}</h3>
                        <p className="text-sm text-gray-500">Verifica los datos de inscripción.</p>
                    </div>

                    <form onSubmit={handleSubmitForm} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Dirección / Referencia</label>
                            <input 
                                type="text" 
                                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={direccion}
                                onChange={(e) => setDireccion(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Cantidad de Mascotas</label>
                            <input 
                                type="number" 
                                min="1" max="50"
                                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={cantidad}
                                onChange={(e) => setCantidad(e.target.value)}
                            />
                        </div>

                        <div className="flex items-start p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <input 
                                type="checkbox" 
                                id="chk_perfil"
                                className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                checked={actualizarPerfil}
                                onChange={(e) => setActualizarPerfil(e.target.checked)}
                            />
                            <label htmlFor="chk_perfil" className="ml-3 text-xs text-blue-800 font-medium cursor-pointer leading-tight">
                                Actualizar mi perfil con esta nueva ubicación
                            </label>
                        </div>

                        <button 
                            type="submit"
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg shadow-md transition-colors flex items-center justify-center mt-4"
                        >
                            <Save className="w-5 h-5 mr-2" /> Confirmar Inscripción
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

const CampanasPropietarioPage = () => {
  const { user } = useAuth(); 
  const [campanas, setCampanas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [modoInscripcion, setModoInscripcion] = useState(null); 
  
  const [mapaPuntos, setMapaPuntos] = useState([]);
  const [mapaCentro, setMapaCentro] = useState([-19.5894, -65.7541]); 
  const [campanaVisualizada, setCampanaVisualizada] = useState(null); 

  const cargarDatos = async () => {
      try {
        setLoading(true);
        const data = await campanaService.getAllCampanas();
        setCampanas(data.filter(c => c.estado !== 'Finalizada'));
      } catch (error) {
        console.error("Error", error);
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => { 
      cargarDatos(); 
      setTimeout(() => { window.dispatchEvent(new Event('resize')); }, 500);
  }, []);


  useEffect(() => {
    if (!campanaVisualizada) return;

    socket.connect();
    socket.emit('unirse_campana', campanaVisualizada.id);

    const handleUbicacion = (data) => {
        setMapaPuntos(prevPuntos => {
            const otrosPuntos = prevPuntos.filter(p => p.id !== `vet_${data.veterinarioId}`);
            const nuevoPunto = {
                id: `vet_${data.veterinarioId}`,
                lat: data.lat,
                lng: data.lng,
                titulo: data.nombre,
                descripcion: "Veterinario en la zona",
                tipo: 'veterinario'
            };
            return [...otrosPuntos, nuevoPunto];
        });
    };

    socket.on('actualizar_ubicacion', handleUbicacion);

    return () => {
        socket.emit('salir_campana', campanaVisualizada.id);
        socket.off('actualizar_ubicacion', handleUbicacion);
    };
  }, [campanaVisualizada]);

  const handleIniciarInscripcion = (campana) => {
      setCampanaVisualizada(null); 
      setModoInscripcion(campana); 
  };

  const handleConfirmarInscripcion = async (datos) => {
      try {
          await campanaService.inscribir(datos.campanaId, datos);
          
          Swal.fire({ 
              icon: 'success', 
              title: '¡Inscrito!', 
              text: datos.actualizar_perfil 
                  ? 'Ubicación actualizada e inscripción completada.'
                  : `Brigada en camino a: ${datos.direccion_contacto}`,
              timer: 3000
          });

          setModoInscripcion(null); 
          cargarDatos(); 
      } catch (error) {
          const mensaje = error.response?.data?.message || error.message || "Error";
          if (mensaje.includes("Ya estás inscrito")) {
              Swal.fire('Información', 'Ya estabas inscrito en esta campaña.', 'info');
              setModoInscripcion(null);
          } else {
              Swal.fire('Error', mensaje, 'error');
          }
      }
  };

  const handleVerMapaRastreo = (campana) => {
      setModoInscripcion(null);
      setCampanaVisualizada(campana);
      const puntosIniciales = [];

      if (campana.latitud && campana.longitud) {
          puntosIniciales.push({
              id: 'punto_fijo',
              lat: campana.latitud,
              lng: campana.longitud,
              titulo: "Punto de Vacunación",
              descripcion: campana.nombre,
              tipo: 'fijo'
          });
          setMapaCentro([campana.latitud, campana.longitud]);
      } else {
          setMapaCentro([-19.5894, -65.7541]); 
      }

      setMapaPuntos(puntosIniciales);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="container mx-auto h-[calc(100vh-100px)] flex flex-col pb-4">
      <div className="mb-4 flex-shrink-0">
        <h1 className="text-4xl font-bold text-gray-800 mb-1">Campañas Disponibles</h1>
        <p className="text-gray-600">Consulta los puntos de vacunación o rastrea a los veterinarios.</p>
      </div>

      {modoInscripcion ? (
          <div className="flex-1 min-h-0 relative">
              <PanelInscripcion 
                  campana={modoInscripcion} 
                  user={user} 
                  onCancel={() => setModoInscripcion(null)}
                  onConfirm={handleConfirmarInscripcion}
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
                      <MapaCampana centro={mapaCentro} puntos={mapaPuntos} />
                </div>
              </div>

              <div className="lg:col-span-1 overflow-y-auto pr-2 custom-scrollbar">
                  {loading && <div className="text-center text-lg py-10">Cargando...</div>}
                  
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
                                            onClick={() => handleVerMapaRastreo(campana)}
                                            className="w-full py-1.5 px-3 bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 rounded text-sm font-bold flex items-center justify-center transition-colors"
                                        >
                                            {campana.latitud ? <Eye className="h-4 w-4 mr-2"/> : <Navigation className="h-4 w-4 mr-2"/>}
                                            {campana.latitud ? "Ver Ubicación" : "Rastrear Veterinarios"}
                                        </button>

                                        {!campana.latitud && (
                                            campana.ya_inscrito ? (
                                                <button disabled className="w-full py-1.5 px-3 bg-gray-100 text-green-700 border border-green-200 rounded text-sm font-bold flex items-center justify-center cursor-default">
                                                    <CheckCircle className="h-4 w-4 mr-2" /> Inscrito
                                                </button>
                                            ) : (
                                                <button onClick={() => handleIniciarInscripcion(campana)} className="w-full py-1.5 px-3 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors flex items-center justify-center shadow-sm">
                                                    <Edit className="h-4 w-4 mr-2" /> Inscribirse
                                                </button>
                                            )
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

export default CampanasPropietarioPage;