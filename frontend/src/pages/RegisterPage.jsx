import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, Mail, Lock, Phone, FileText, MapPin, 
  ArrowLeft, CheckCircle2, X 
} from 'lucide-react';
import Swal from 'sweetalert2';
import authService from '../services/auth.service';

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

const RegisterPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const [form, setForm] = useState({
    nombre: '', 
    ci: '',
    email: '',
    password: '',
    telefono: '',
    direccion: '',
    latitud: -19.5894,
    longitud: -65.7541,
    rol: 'Propietario' 
  });

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (showMap && mapRef.current && !mapInstance.current) {
        mapInstance.current = L.map(mapRef.current).setView([form.latitud, form.longitud], 15);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(mapInstance.current);

        markerRef.current = L.marker([form.latitud, form.longitud], { draggable: true }).addTo(mapInstance.current);

        const updatePosition = (lat, lng) => {
            setForm(prev => ({ ...prev, latitud: lat, longitud: lng }));
        };

        markerRef.current.on('dragend', (e) => {
            const { lat, lng } = e.target.getLatLng();
            updatePosition(lat, lng);
        });

        mapInstance.current.on('click', (e) => {
            const { lat, lng } = e.latlng;
            markerRef.current.setLatLng([lat, lng]);
            updatePosition(lat, lng);
        });

        setTimeout(() => mapInstance.current.invalidateSize(), 100);
    }

    return () => {
      if (!showMap && mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [showMap]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authService.register(form);
      Swal.fire({
        icon: 'success',
        title: '¡Bienvenido!',
        text: 'Cuenta creada exitosamente. Inicia sesión para continuar.',
        confirmButtonColor: '#2563eb'
      }).then(() => {
        navigate('/login');
      });
    } catch (error) {
      const msg = error.response?.data?.message || "Error al registrarse";
      Swal.fire('Error', msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden p-8 border border-gray-100">
          

          <div className="flex justify-between items-center mb-6">
            <Link to="/" className="inline-flex items-center text-gray-400 hover:text-blue-600 transition-colors text-sm font-semibold group">
               <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
               Volver
            </Link>
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Crear Cuenta</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            <div className="group">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Nombre Completo</label>
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all shadow-sm">
                  <User className="text-gray-400 w-5 h-5 mr-3" />
                  <input type="text" name="nombre" required className="w-full bg-transparent outline-none text-gray-700 font-medium" onChange={handleChange} />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
             
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Cédula de Identidad</label>
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all shadow-sm">
                  <FileText className="text-gray-400 w-5 h-5 mr-3" />
                  <input type="text" name="ci" required className="w-full bg-transparent outline-none text-gray-700 font-medium" onChange={handleChange} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Celular</label>
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all shadow-sm">
                  <Phone className="text-gray-400 w-5 h-5 mr-3" />
                  <input type="text" name="telefono" required className="w-full bg-transparent outline-none text-gray-700 font-medium" onChange={handleChange} />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Correo Electrónico</label>
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all shadow-sm">
                <Mail className="text-gray-400 w-5 h-5 mr-3" />
                <input type="email" name="email" required className="w-full bg-transparent outline-none text-gray-700 font-medium" onChange={handleChange} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Contraseña</label>
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all shadow-sm">
                <Lock className="text-gray-400 w-5 h-5 mr-3" />
                <input type="password" name="password" required className="w-full bg-transparent outline-none text-gray-700 font-medium" onChange={handleChange} />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
               <div className="flex items-center justify-between mb-2">
                 <h3 className="text-sm font-bold text-gray-800 flex items-center"><MapPin className="w-4 h-4 mr-2 text-blue-600"/> Domicilio</h3>
                 
                 <button 
                    type="button"
                    onClick={() => setShowMap(!showMap)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${showMap ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                 >
                    {showMap ? <><X size={14}/> Cerrar Mapa</> : <><MapPin size={14}/> Ubicar en Mapa</>}
                 </button>
               </div>
               
               <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Dirección Escrita</label>
               <input 
                  type="text" 
                  name="direccion" 
                  required 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all mb-3" 
                  onChange={handleChange} 
               />

               {showMap && (
                 <div className="relative animate-in fade-in slide-in-from-top-4 duration-300">
                   <div className="h-64 w-full rounded-2xl overflow-hidden border-2 border-blue-500 shadow-lg relative">
                      <div ref={mapRef} className="w-full h-full z-0 cursor-crosshair" />
                      
                      <div className="absolute top-2 left-2 z-[400] bg-white/90 backdrop-blur px-2 py-1 rounded-md shadow-sm border border-gray-200">
                        <p className="text-[10px] text-blue-700 font-mono font-bold">
                           {form.latitud.toFixed(4)}, {form.longitud.toFixed(4)}
                        </p>
                      </div>
                   </div>
                   <p className="text-center text-xs text-blue-600 mt-2 font-medium">📍 Haz clic en el mapa para marcar tu casa exacta</p>
                 </div>
               )}
            </div>

            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.01] flex justify-center items-center mt-4">
              {loading ? 'Procesando...' : <>Registrarme <CheckCircle2 className="w-5 h-5 ml-2"/></>}
            </button>

            <div className="text-center mt-6">
               <p className="text-sm text-gray-500">¿Ya tienes una cuenta?</p>
               <Link to="/login" className="text-blue-600 font-bold hover:underline text-sm">Iniciar Sesión aquí</Link>
            </div>
          </form>

      </div>
    </div>
  );
};

export default RegisterPage;