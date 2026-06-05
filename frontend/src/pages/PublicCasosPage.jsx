import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import casoService from '../services/caso.service.js';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import { AlertTriangle, Plus, X, Camera, MapPin, List, User, Phone, ArrowLeft, Search, ChevronDown, Loader2 } from 'lucide-react'; 
import L from 'leaflet';
import Swal from 'sweetalert2';
import 'leaflet/dist/leaflet.css';

import iconMarker from 'leaflet/dist/images/marker-icon.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetina,
  iconUrl: iconMarker,
  shadowUrl: iconShadow,
});

const getIcon = (tipo) => {
    const color = tipo === 'Mascota Perdida' ? 'red' : 
                  tipo === 'Mascota Encontrada' ? 'green' : 
                  'orange'; 
    return new L.Icon({
        iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
    });
};

const MapFix = () => {
    const map = useMap();
    useEffect(() => {
        map.invalidateSize();
        const resizeObserver = new ResizeObserver(() => { map.invalidateSize(); });
        resizeObserver.observe(map.getContainer());
        return () => resizeObserver.disconnect();
    }, [map]);
    return null;
};

// 🛡️ ESCUDO ANTI-CRASH PARA EL MAPA 🛡️
const FlyToLocation = ({ center }) => {
    const map = useMap();
    useEffect(() => { 
        if (!center || !Array.isArray(center)) return;
        
        const lat = parseFloat(center[0]);
        const lng = parseFloat(center[1]);
        
        if (!isNaN(lat) && !isNaN(lng)) {
            const mapSize = map.getSize();
            if (mapSize.x === 0 || mapSize.y === 0) {
                map.setView([lat, lng], 16);
                return;
            }
            try {
                map.flyTo([lat, lng], 16, { duration: 1.5 }); 
            } catch (error) {
                console.warn("Error en animación Leaflet. Usando fallback setView.");
                map.setView([lat, lng], 16);
            }
        }
    }, [center, map]);
    return null;
};

const LocationPicker = ({ onLocationSelected, position }) => {
    useMapEvents({ click(e) { onLocationSelected(e.latlng); } });
    if (!position || !Array.isArray(position)) return null;
    const lat = parseFloat(position[0]);
    const lng = parseFloat(position[1]);
    if (isNaN(lat) || isNaN(lng)) return null;
    return <Marker position={[lat, lng]} />;
};

const ExpandableText = ({ text }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    if (!text) return null;

    const isLong = text.length > 55; 

    return (
        <div className="mb-2">
            <p className={`text-[11px] md:text-xs text-gray-600 leading-relaxed transition-all ${isExpanded ? '' : 'line-clamp-1'}`}>
                {text}
            </p>
            {isLong && (
                <button 
                    onClick={(e) => { 
                        e.stopPropagation(); 
                        setIsExpanded(!isExpanded); 
                    }}
                    className="text-[10px] text-blue-600 font-bold hover:underline mt-0.5"
                >
                    {isExpanded ? 'Ver menos' : 'Ver más'}
                </button>
            )}
        </div>
    );
};

const PublicCasosPage = () => {
  const navigate = useNavigate();
  const [casos, setCasos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [mapCenter, setMapCenter] = useState([-19.5894, -65.7541]); 
  const [filtro, setFiltro] = useState('Todos');

  const [showModal, setShowModal] = useState(false);
  const [showMobileList, setShowMobileList] = useState(false); 
  
  const [formData, setFormData] = useState({
      titulo: '', descripcion: '', tipo: 'Mascota Perdida', latitud: '', longitud: '', foto: '',
      nombre_contacto: '', telefono_contacto: ''
  });
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
      const load = async () => {
          try {
              setLoading(true);
              const data = await casoService.getPublicCasos();
              setCasos(data);
          } catch(e) { console.error(e); } finally { setLoading(false); }
      }
      load();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => { setFormData({ ...formData, foto: reader.result }); setPreviewImage(reader.result); };
        reader.readAsDataURL(file);
    }
  };

  const handleMapClick = (latlng) => setFormData({ ...formData, latitud: latlng.lat, longitud: latlng.lng });
  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
      e.preventDefault();
      if (!formData.latitud) return Swal.fire({ icon: 'warning', title: 'Falta Ubicación', text: 'Haz clic en el mapa para marcar el lugar.' });
      
      setIsSubmitting(true); 

      try {
          await casoService.createPublicCaso(formData);
          await Swal.fire({ icon: 'success', title: '¡Reporte Publicado!', text: 'Tu alerta es visible para toda la comunidad.', timer: 3000, showConfirmButton: false });
          setShowModal(false);
          setFormData({ titulo: '', descripcion: '', tipo: 'Mascota Perdida', latitud: '', longitud: '', foto: '', nombre_contacto: '', telefono_contacto: '' });
          setPreviewImage(null);
          const data = await casoService.getPublicCasos();
          setCasos(data);
      } catch (error) { 
          Swal.fire('Error', 'No se pudo crear el reporte.', 'error'); 
      } finally {
          setIsSubmitting(false); 
      }
  };

  const casosFiltrados = filtro === 'Todos' ? casos : casos.filter(c => c.tipo === filtro);
  
  const getCardStyle = (tipo) => {
      if (tipo === 'Mascota Perdida') return 'border-red-200 bg-red-50 hover:border-red-400';
      if (tipo === 'Mascota Encontrada') return 'border-green-200 bg-green-50 hover:border-green-400';
      return 'border-orange-200 bg-orange-50 hover:border-orange-400';
  };

  const handleVerEnMapa = (latitud, longitud) => {
      const lat = parseFloat(latitud);
      const lng = parseFloat(longitud);
      if (!isNaN(lat) && !isNaN(lng)) {
          setMapCenter([lat, lng]);
      } else {
          Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: 'Sin ubicación', showConfirmButton: false, timer: 3000 });
      }
      setShowMobileList(false);
  };

  return (
    <div className="container mx-auto h-[100dvh] md:h-[calc(100vh-80px)] flex flex-col p-2 sm:p-4 overflow-hidden relative">
      
      <div className="mb-3 flex flex-col sm:flex-row sm:items-end justify-between gap-3 flex-shrink-0 border-b border-gray-200 pb-3 px-2 sm:px-0">
        <div>
            <h1 className="text-xl md:text-3xl font-bold text-gray-800 flex items-center">
                <AlertTriangle className="mr-2 md:mr-3 text-red-500 h-6 w-6 md:h-8 md:w-8 shrink-0" />
                Mapa de Alertas
            </h1>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
             <button onClick={() => navigate('/')} className="flex-1 sm:flex-none flex justify-center items-center px-3 py-2 md:px-4 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg shadow-sm hover:bg-gray-50 transition-all text-sm">
                <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2"/> <span className="hidden sm:inline">Volver</span>
             </button>

             <select className="flex-[2] sm:flex-none border border-gray-300 rounded-lg p-2 text-xs md:text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
                 <option value="Todos">Todos</option>
                 <option value="Mascota Perdida">🔴 Perdidos</option>
                 <option value="Mascota Encontrada">🟢 Encontrados</option>
                 <option value="Caso Zoonosis">🟠 Zoonosis</option>
             </select>
             
             <button onClick={() => setShowModal(true)} className="flex-1 sm:flex-none flex justify-center items-center bg-red-600 text-white px-3 py-2 md:px-4 rounded-lg font-bold hover:bg-red-700 shadow-md transition-all text-sm">
                 <Plus className="w-4 h-4 mr-1 sm:mr-2"/> Reportar
             </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden rounded-xl sm:rounded-2xl border border-gray-300 shadow-xl bg-white min-h-0 relative z-0">
          
          <div className="flex-1 relative h-full w-full bg-gray-100 z-0">
              <div className="absolute inset-0">
                  <MapContainer center={[-19.5894, -65.7541]} zoom={14} style={{ height: '100%', width: '100%' }}>
                    <MapFix /> 
                    <TileLayer attribution='&copy; OSM' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
                    <FlyToLocation center={mapCenter} />

                    {casosFiltrados.map(caso => {
                        const lat = parseFloat(caso.latitud);
                        const lng = parseFloat(caso.longitud);
                        if (isNaN(lat) || isNaN(lng)) return null;

                        return (
                            <Marker key={caso.id} position={[lat, lng]} icon={getIcon(caso.tipo)}>
                                <Popup>
                                    <div className="min-w-[200px] max-w-[260px] pt-3 pr-2">
                                        <div className="inline-flex items-center text-[10px] text-blue-700 bg-blue-50 border border-blue-100 px-2 py-1 rounded-md mb-2 max-w-full">
                                            <User className="w-3 h-3 mr-1 shrink-0"/> 
                                            <span className="truncate">{caso.reportado_por || 'Anónimo'}</span>
                                        </div>
                                        
                                        <h3 className="font-bold text-sm text-gray-800 break-words leading-tight">{caso.titulo}</h3>
                                        <ExpandableText text={caso.descripcion} />
                                        
                                        {caso.foto && (
                                            <div className="w-full h-32 mb-2 bg-gray-100 rounded-md flex items-center justify-center border border-gray-200 overflow-hidden">
                                                <img src={caso.foto} alt="caso" className="max-w-full max-h-full object-contain" />
                                            </div>
                                        )}
                                        
                                        {caso.telefono_reporte && (
                                            <div className="inline-flex items-center text-xs text-green-700 font-bold mt-1 bg-green-50 px-2 py-1.5 rounded border border-green-100 w-full">
                                                <Phone className="w-3 h-3 mr-2 shrink-0"/> {caso.telefono_reporte}
                                            </div>
                                        )}
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}
                 </MapContainer>
              </div>
          </div>

         <button 
             onClick={() => setShowMobileList(true)}
             className="md:hidden absolute bottom-6 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 z-[400] hover:bg-blue-700 transition-transform active:scale-95"
         >
             <List className="w-5 h-5"/> Ver Lista de Alertas ({casosFiltrados.length})
         </button>

         <div className={`
             absolute md:relative bottom-0 left-0 w-full md:w-[350px] lg:w-96 bg-gray-50 flex flex-col border-t md:border-t-0 md:border-l border-gray-200 z-[500] md:z-auto transition-transform duration-300 ease-in-out
             ${showMobileList ? 'translate-y-0 h-[80%]' : 'translate-y-full md:translate-y-0 h-full'}
         `}>
             <div className="p-3 md:p-4 bg-white border-b border-gray-200 flex items-center justify-between shadow-sm flex-shrink-0 rounded-t-2xl md:rounded-none">
                 <div className="flex items-center">
                    <h2 className="font-bold text-gray-700 flex items-center text-sm md:text-base"><List className="w-4 h-4 md:w-5 md:h-5 mr-2 text-blue-600"/> Lista de Alertas</h2>
                    <span className="text-xs font-bold bg-gray-200 px-2 py-1 rounded-full text-gray-700 ml-2">{casosFiltrados.length}</span>
                 </div>
                 <button onClick={() => setShowMobileList(false)} className="md:hidden p-1.5 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200">
                     <ChevronDown className="w-5 h-5"/>
                 </button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar bg-gray-50">
                 {casosFiltrados.length === 0 ? (
                     <div className="text-center py-10 text-gray-400 text-sm font-medium border-2 border-dashed border-gray-200 rounded-xl m-2">No hay reportes activos.</div>
                 ) : (
                     casosFiltrados.map(caso => (
                         <div key={caso.id} onClick={() => handleVerEnMapa(caso.latitud, caso.longitud)} className={`p-3 md:p-4 rounded-xl border shadow-sm cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] bg-white ${getCardStyle(caso.tipo)}`}>
                             <div className="flex gap-3 md:gap-4">
                                 {caso.foto ? (
                                     <div className="w-16 h-16 md:w-20 md:h-20 bg-white border border-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                                         <img src={caso.foto} alt="mini" className="w-full h-full object-contain" />
                                     </div>
                                 ) : (
                                     <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                         <Camera className="w-6 h-6 md:w-8 md:h-8 text-gray-400"/>
                                     </div>
                                 )}
                                 
                                 <div className="flex-1 min-w-0 flex flex-col justify-center">
                                     <div className="flex justify-between items-start mb-1">
                                         <h3 className="text-xs md:text-sm font-bold text-gray-800 truncate pr-2">{caso.titulo}</h3>
                                         <span className="text-[9px] md:text-[10px] text-gray-500 font-medium shrink-0">{new Date(caso.fecha_reporte).toLocaleDateString()}</span>
                                     </div>
                                     <ExpandableText text={caso.descripcion} />
                                     <div className="flex justify-between items-center mt-auto">
                                         <span className={`text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded-md border ${
                                            caso.tipo === 'Mascota Perdida' ? 'text-red-700 border-red-200 bg-white' : 
                                            caso.tipo === 'Mascota Encontrada' ? 'text-green-700 border-green-200 bg-white' : 
                                            'text-orange-700 border-orange-200 bg-white'
                                         }`}>
                                            {caso.tipo}
                                         </span>
                                     </div>
                                 </div>
                             </div>
                         </div>
                     ))
                 )}
             </div>
         </div>
         
         {showMobileList && (
             <div 
                className="md:hidden absolute inset-0 bg-black/40 z-[400] transition-opacity"
                onClick={() => setShowMobileList(false)}
             />
         )}
      </div>

      {/* MODAL DE NUEVO REPORTE MÁS COMPACTO PARA MÓVIL */}
      {showModal && (
          // CORRECCIÓN Z-INDEX: Reducido a z-[1000] para que los mensajes de SweetAlert (z-1060) se vean por encima.
          <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black bg-opacity-60 sm:p-4 backdrop-blur-sm transition-all">
            <div className="relative w-full max-w-2xl bg-white sm:rounded-2xl rounded-t-2xl flex flex-col shadow-2xl max-h-[90vh] sm:max-h-[95vh] animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95">
                
                <div className="flex-shrink-0 p-3 sm:p-4 border-b border-gray-100 flex justify-between items-center bg-white rounded-t-2xl sm:rounded-t-2xl">
                    <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800">Nuevo Reporte Público</h2>
                    <button onClick={() => setShowModal(false)} className="bg-gray-100 p-1.5 rounded-full text-gray-500 hover:bg-gray-200 transition-colors">
                        <X className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                </div>

                {/* Padding y márgenes más compactos para celular */}
                <div className="overflow-y-auto p-3 sm:p-4 md:p-6 space-y-3 md:space-y-4 custom-scrollbar">
                    <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4 pb-2">
                        
                        <div className="bg-blue-50 p-2.5 sm:p-4 rounded-xl border border-blue-100">
                            <h3 className="text-[11px] sm:text-xs md:text-sm font-bold text-blue-800 mb-2 sm:mb-3 flex items-center"><User className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2"/> Tus Datos</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                                <div>
                                    <label className="block text-[10px] md:text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Tu Nombre</label>
                                    <input required name="nombre_contacto" className="w-full border border-gray-300 rounded-lg p-2 sm:p-2.5 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none" value={formData.nombre_contacto} onChange={handleInputChange}/>
                                </div>
                                <div>
                                    <label className="block text-[10px] md:text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Celular / WhatsApp</label>
                                    <input required name="telefono_contacto" type="tel" className="w-full border border-gray-300 rounded-lg p-2 sm:p-2.5 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none" value={formData.telefono_contacto} onChange={handleInputChange}/>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                            <div>
                                <label className="block text-[10px] md:text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Tipo de Reporte</label>
                                <select name="tipo" className="w-full border border-gray-300 rounded-lg p-2 sm:p-2.5 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer" value={formData.tipo} onChange={handleInputChange}>
                                    <option value="Mascota Perdida">🔴 Mascota Perdida</option>
                                    <option value="Mascota Encontrada">🟢 Mascota Encontrada</option>
                                    <option value="Caso Zoonosis">🟠 Alerta Zoonosis</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] md:text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Título Breve</label>
                                <input type="text" name="titulo" required className="w-full border border-gray-300 rounded-lg p-2 sm:p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={formData.titulo} onChange={handleInputChange} />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-[10px] md:text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Descripción / Detalles</label>
                            <textarea name="descripcion" rows="2" className="w-full border border-gray-300 rounded-lg p-2 sm:p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" value={formData.descripcion} onChange={handleInputChange} />
                        </div>
                        
                        <div>
                            <label className="block text-[10px] md:text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider flex items-center"><Camera className="w-3 h-3 md:w-4 md:h-4 mr-1 text-gray-400"/> Subir Foto (Opcional)</label>
                            <input type="file" accept="image/*" className="block w-full text-xs md:text-sm text-gray-500 file:mr-3 file:py-1.5 sm:file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors cursor-pointer border border-gray-200 rounded-lg p-1" onChange={handleFileChange} />
                            {previewImage && (
                                <div className="mt-2 bg-gray-50 border border-gray-200 rounded-lg p-1.5 sm:p-2 inline-flex justify-center w-full sm:w-auto">
                                    <img src={previewImage} alt="Preview" className="h-24 sm:h-32 object-contain rounded" />
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-[10px] md:text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider flex items-center"><MapPin className="w-3 h-3 md:w-4 md:h-4 mr-1 text-red-500"/> Ubicación del Suceso</label>
                            <p className="text-[10px] text-blue-600 font-semibold mb-1.5">Toca el mapa para dejar caer el marcador rojo 📍</p>
                            {/* Altura del mapa súper reducida (h-28) en celular */}
                            <div className="h-28 sm:h-40 w-full rounded-xl overflow-hidden border-2 border-blue-400 shadow-sm relative z-0">
                                <div className="absolute inset-0">
                                    <MapContainer center={[-19.5894, -65.7541]} zoom={14} style={{ height: '100%', width: '100%' }}>
                                        <MapFix /> 
                                        <TileLayer attribution='&copy; OSM' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
                                        <LocationPicker onLocationSelected={handleMapClick} position={formData.latitud ? [formData.latitud, formData.longitud] : null} />
                                    </MapContainer>
                                </div>
                            </div>
                            {formData.latitud && <p className="text-[10px] text-green-600 mt-1 font-bold flex items-center"><Plus className="w-3 h-3 mr-1"/> Ubicación registrada.</p>}
                        </div>
                        
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className={`w-full text-white py-2.5 sm:py-3.5 rounded-xl text-sm sm:text-base font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center mt-2 ${
                                isSubmitting ? 'bg-gray-400 cursor-not-allowed shadow-none' : 'bg-red-600 hover:bg-red-700 shadow-red-500/30'
                            }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                                    Publicando...
                                </>
                            ) : (
                                'Publicar Alerta'
                            )}
                        </button>
                    </form>
                </div>
            </div>
          </div>
      )}
    </div>
  );
};

export default PublicCasosPage;