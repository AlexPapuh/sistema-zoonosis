import React, { useState, useEffect } from 'react';
import authService from '../services/auth.service.js';
import { User, Mail, Phone, MapPin, Save, Lock, Eye, EyeOff, ShieldAlert, CheckCircle } from 'lucide-react';
import Swal from 'sweetalert2';

import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
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


const MapFix = () => {
    const map = useMap();
    useEffect(() => {
        map.invalidateSize(); 
        const timer = setTimeout(() => map.invalidateSize(), 400);
        return () => clearTimeout(timer);
    }, [map]);
    return null;
};

const LocationPicker = ({ onLocationSelected, position }) => {
    useMapEvents({
        click(e) { onLocationSelected(e.latlng); },
    });
    return position ? <Marker position={position} /> : null;
};

const PerfilPage = () => {
  const [loading, setLoading] = useState(true);
  const [rol, setRol] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [form, setForm] = useState({
      nombre: '', email: '', password: '', 
      telefono: '', direccion: '', latitud: '', longitud: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
        try {
            const data = await authService.getProfile();
            setRol(data.rol); 
            setForm({
                nombre: data.nombre,
                email: data.email,
                password: '', 
                telefono: data.telefono || '', 
                direccion: data.direccion || '',
                latitud: data.latitud,
                longitud: data.longitud
            });
        } catch (error) {
            console.error(error);
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cargar el perfil.' });
        } finally {
            setLoading(false);
        }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleMapClick = (latlng) => setForm({ ...form, latitud: latlng.lat, longitud: latlng.lng });

  const handleSubmit = async (e) => {
      e.preventDefault();
      try {
          await authService.updateProfile(form);
          await Swal.fire({
              icon: 'success',
              title: '¡Perfil Actualizado!',
              text: 'Tus datos se han guardado correctamente.',
              timer: 2000,
              showConfirmButton: false
          });
          window.location.reload(); 
      } catch (error) {
          Swal.fire({
              icon: 'error',
              title: 'Error',
              text: error.message || 'Error al actualizar perfil'
          });
      }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Cargando perfil...</div>;

  return (
    <div className="container mx-auto max-w-4xl pb-10 px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center mt-6">
            <User className="w-8 h-8 mr-3 text-blue-600"/> Mi Perfil
        </h1>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            
            <div className="bg-gray-50 p-8 border-b border-gray-200 flex flex-col md:flex-row items-center">
                <div className="h-20 w-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold md:mr-6 shadow-md mb-4 md:mb-0">
                    {form.nombre ? form.nombre.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="text-center md:text-left">
                    <h2 className="text-2xl font-bold text-gray-800">{form.nombre}</h2>
                    <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800 rounded-full mt-2">
                        {rol}
                    </span>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8" autoComplete="off">
                
                {/* 1. DATOS DE CUENTA */}
                <div>
                    <h3 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">Información de la Cuenta</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <input type="text" name="nombre" autoComplete="off" required className="pl-10 w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" value={form.nombre} onChange={handleChange} />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                                <input 
                                    type="email" 
                                    name="email" 
                                    readOnly 
                                    disabled
                                    className="pl-10 w-full border border-gray-200 rounded-lg p-2.5 bg-gray-100 text-gray-500 cursor-not-allowed select-none" 
                                    value={form.email} 
                                />
                                <Lock className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                            </div>
                            <p className="text-xs text-yellow-700 mt-2 flex items-center bg-yellow-50 p-2 rounded border border-yellow-100">
                                <ShieldAlert className="w-3 h-3 mr-1.5 flex-shrink-0" />
                                <span>No editable. Contacta al admin para cambiarlo.</span>
                            </p>
                        </div>
                    </div>

                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cambiar Contraseña</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <input 
                                type={showPassword ? "text" : "password"} 
                                name="password" 
                                autoComplete="new-password"
                                className="pl-10 w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" 
                                placeholder="Escribe para cambiar tu contraseña..." 
                                value={form.password} 
                                onChange={handleChange} 
                            />
                            <button 
                                type="button" 
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
                            </button>
                        </div>
                    </div>
                </div>

                {rol === 'Propietario' && (
                    <div>
                        <h3 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2 flex items-center">
                            <MapPin className="w-5 h-5 mr-2 text-green-600"/> Datos de Contacto y Ubicación
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                    <input type="text" name="telefono" className="pl-10 w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 outline-none" value={form.telefono} onChange={handleChange} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección Escrita</label>
                                <input type="text" name="direccion" className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 outline-none" value={form.direccion} onChange={handleChange} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Ubicación de Domicilio (Haz clic para actualizar)</label>
                            
                            <div className="h-72 w-full rounded-lg overflow-hidden border border-gray-300 relative z-0 shadow-sm bg-gray-100">
                                <MapContainer center={form.latitud ? [form.latitud, form.longitud] : [-19.5894, -65.7541]} zoom={15} style={{ height: '100%', width: '100%' }}>
                                    <TileLayer 
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
                                    />
                                    <MapFix /> 
                                    <LocationPicker onLocationSelected={handleMapClick} position={form.latitud ? [form.latitud, form.longitud] : null} />
                                </MapContainer>
                            </div>

                            {form.latitud && (
                                <div className="flex items-center gap-2 mt-2 text-green-700 text-xs font-bold bg-green-50 p-2 rounded border border-green-100">
                                    <CheckCircle size={14}/>
                                    Ubicación guardada: {Number(form.latitud).toFixed(5)}, {Number(form.longitud).toFixed(5)}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex justify-end pt-4">
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg flex items-center transition-all transform hover:-translate-y-0.5">
                        <Save className="w-5 h-5 mr-2" /> Guardar Cambios
                    </button>
                </div>

            </form>
        </div>
    </div>
  );
};

export default PerfilPage;