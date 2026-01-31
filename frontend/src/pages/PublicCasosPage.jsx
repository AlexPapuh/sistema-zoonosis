import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import casoService from '../services/caso.service.js';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import { AlertTriangle, Plus, X, Camera, MapPin, List, User, Phone, ArrowLeft, Search } from 'lucide-react'; 
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

const FlyToLocation = ({ center }) => {
    const map = useMap();
    useEffect(() => { if (center) map.flyTo(center, 16, { duration: 1.5 }); }, [center, map]);
    return null;
};

const LocationPicker = ({ onLocationSelected, position }) => {
    useMapEvents({ click(e) { onLocationSelected(e.latlng); } });
    return position ? <Marker position={position} /> : null;
};

const PublicCasosPage = () => {
  const navigate = useNavigate();
  const [casos, setCasos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState([-19.5894, -65.7541]); 
  const [filtro, setFiltro] = useState('Todos');

  const [showModal, setShowModal] = useState(false);
  
  // Formulario incluye contacto (Nombre y Teléfono)
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
      }
  };

  const casosFiltrados = filtro === 'Todos' ? casos : casos.filter(c => c.tipo === filtro);
  
  const getCardStyle = (tipo) => {
      if (tipo === 'Mascota Perdida') return 'border-red-200 bg-red-50';
      if (tipo === 'Mascota Encontrada') return 'border-green-200 bg-green-50';
      return 'border-orange-200 bg-orange-50';
  };

  return (
    <div className="container mx-auto h-[calc(100vh-80px)] flex flex-col pb-4">
      
      <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0 px-2 pt-2">
        <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                <AlertTriangle className="mr-3 text-red-500 h-8 w-8" />
                Mapa de Alertas Públicas
            </h1>
        </div>
        <div className="flex gap-3">
             <button onClick={() => navigate('/')} className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg shadow-sm hover:bg-gray-50 transition-all">
                <ArrowLeft className="w-5 h-5 mr-2"/> Volver
             </button>

             <select className="border rounded-lg p-2 text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
                 <option value="Todos">Todos</option>
                 <option value="Mascota Perdida">🔴 Perdidos</option>
                 <option value="Mascota Encontrada">🟢 Encontrados</option>
                 <option value="Caso Zoonosis">🟠 Zoonosis</option>
             </select>
             
             <button onClick={() => setShowModal(true)} className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-700 shadow-md transition-all">
                 <Plus className="w-5 h-5 mr-2"/> Reportar
             </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden rounded-xl border border-gray-300 shadow-xl bg-white">
          
          <div className="flex-1 relative h-[50vh] md:h-full z-0 bg-gray-100">
              <MapContainer center={[-19.5894, -65.7541]} zoom={14} style={{ height: '100%', width: '100%' }}>
                <MapFix /> 
                <TileLayer attribution='&copy; OSM' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
                <FlyToLocation center={mapCenter} />

                {casosFiltrados.map(caso => (
                    <Marker key={caso.id} position={[caso.latitud, caso.longitud]} icon={getIcon(caso.tipo)}>
                        <Popup>
                            <div className="w-52">
                                <div className="flex items-center text-xs text-blue-600 font-bold mb-2 bg-blue-50 p-1.5 rounded border border-blue-100">
                                    <User className="w-3 h-3 mr-1"/> {caso.reportado_por || 'Anónimo'}
                                </div>
                                <h3 className="font-bold text-sm text-gray-800">{caso.titulo}</h3>
                                <p className="text-xs text-gray-600 mt-1 mb-2">{caso.descripcion}</p>
                                {caso.foto && <img src={caso.foto} alt="caso" className="w-full h-24 object-cover rounded mb-2 bg-gray-200"/>}
                                
                                {caso.telefono_reporte && (
                                    <div className="flex items-center text-xs text-green-700 font-bold mt-2 bg-green-50 p-1 rounded border border-green-100">
                                        <Phone className="w-3 h-3 mr-1"/> {caso.telefono_reporte}
                                    </div>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                ))}
             </MapContainer>
         </div>

         <div className="w-full md:w-96 bg-gray-50 flex flex-col border-l border-gray-200">
             <div className="p-3 bg-white border-b flex items-center justify-between">
                 <h2 className="font-bold text-gray-700 flex items-center"><List className="w-4 h-4 mr-2"/> Lista de Alertas</h2>
                 <span className="text-xs bg-gray-200 px-2 py-1 rounded-full text-gray-600">{casosFiltrados.length}</span>
             </div>
             
             <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                 {casosFiltrados.length === 0 ? (
                     <div className="text-center py-10 text-gray-400 text-sm">No hay reportes activos.</div>
                 ) : (
                     casosFiltrados.map(caso => (
                         <div key={caso.id} onClick={() => setMapCenter([caso.latitud, caso.longitud])} className={`p-3 rounded-lg border shadow-sm cursor-pointer transition-all hover:shadow-md bg-white ${getCardStyle(caso.tipo)}`}>
                             <div className="flex gap-3">
                                 {caso.foto ? (
                                     <div className="w-16 h-16 bg-white border border-gray-200 rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                                         <img src={caso.foto} alt="mini" className="w-full h-full object-contain" />
                                     </div>
                                 ) : (
                                     <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                                         <Camera className="w-6 h-6 text-gray-400"/>
                                     </div>
                                 )}
                                 
                                 <div className="flex-1 min-w-0">
                                     <div className="flex justify-between items-start">
                                         <h3 className="text-sm font-bold text-gray-800 truncate">{caso.titulo}</h3>
                                         <span className="text-[10px] text-gray-500">{new Date(caso.fecha_reporte).toLocaleDateString()}</span>
                                     </div>
                                     <p className="text-xs text-gray-600 line-clamp-1 mt-0.5">{caso.descripcion}</p>
                                     <div className="mt-2 flex justify-between items-center">
                                         <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                            caso.tipo === 'Mascota Perdida' ? 'text-red-700 border-red-200 bg-white' : 
                                            caso.tipo === 'Mascota Encontrada' ? 'text-green-700 border-green-200 bg-white' : 
                                            'text-orange-700 border-orange-200 bg-white'
                                         }`}>
                                            {caso.tipo}
                                         </span>
                                         <div className="flex items-center text-[10px] font-bold text-gray-500">
                                            <User size={10} className="mr-1"/> {caso.reportado_por}
                                         </div>
                                     </div>
                                 </div>
                             </div>
                         </div>
                     ))
                 )}
             </div>
         </div>
      </div>

      {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"><X className="h-6 w-6" /></button>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Nuevo Reporte Público</h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                    
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <h3 className="text-sm font-bold text-blue-800 mb-3 flex items-center"><User className="w-4 h-4 mr-2"/> Tus Datos de Contacto</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Tu Nombre</label>
                                <input required name="nombre_contacto" className="w-full border rounded-lg p-2.5 text-sm bg-white" placeholder="Ej: Juan Perez" value={formData.nombre_contacto} onChange={handleInputChange}/>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Tu Celular / WhatsApp</label>
                                <input required name="telefono_contacto" type="tel" className="w-full border rounded-lg p-2.5 text-sm bg-white" placeholder="Ej: 70000000" value={formData.telefono_contacto} onChange={handleInputChange}/>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Reporte</label>
                            <select name="tipo" className="w-full border rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500 outline-none" value={formData.tipo} onChange={handleInputChange}>
                                <option value="Mascota Perdida">🔴 Mascota Perdida</option>
                                <option value="Mascota Encontrada">🟢 Mascota Encontrada</option>
                                <option value="Caso Zoonosis">🟠 Alerta Zoonosis (Peligro)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Título Breve</label>
                            <input type="text" name="titulo" placeholder="Ej: Perro Golden visto..." required className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.titulo} onChange={handleInputChange} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción / Detalles</label>
                        <textarea name="descripcion" rows="2" placeholder="Detalles de color, raza, estado..." className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.descripcion} onChange={handleInputChange} />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center"><Camera className="w-4 h-4 mr-1"/> Foto (Opcional)</label>
                        <input type="file" accept="image/*" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" onChange={handleFileChange} />
                        {previewImage && (
                            <div className="mt-2 bg-gray-50 border rounded p-1 inline-block">
                                <img src={previewImage} alt="Preview" className="h-48 object-contain rounded" />
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center"><MapPin className="w-4 h-4 mr-1"/> Ubicación del Suceso (Haz clic en el mapa)</label>
                        <div className="h-64 w-full rounded-lg overflow-hidden border border-gray-300 relative z-0">
                            <MapContainer center={[-19.5894, -65.7541]} zoom={14} style={{ height: '100%', width: '100%' }}>
                                <MapFix /> 
                                <TileLayer attribution='&copy; OSM' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
                                <LocationPicker onLocationSelected={handleMapClick} position={formData.latitud ? [formData.latitud, formData.longitud] : null} />
                            </MapContainer>
                        </div>
                        {formData.latitud && <p className="text-xs text-green-600 mt-1 font-semibold">Ubicación marcada.</p>}
                    </div>
                    <button type="submit" className="w-full bg-red-600 text-white py-3 rounded font-bold hover:bg-red-700 shadow-lg">Publicar Alerta</button>
                </form>
            </div>
          </div>
      )}
    </div>
  );
};

export default PublicCasosPage;