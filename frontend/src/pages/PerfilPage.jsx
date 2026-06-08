import React, { useState, useEffect } from 'react';
import authService from '../services/auth.service.js';
import { User, Mail, Phone, MapPin, Save, Lock, Eye, EyeOff, ShieldAlert, CheckCircle, CreditCard, Smartphone, QrCode, LogOut } from 'lucide-react';
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
    useMapEvents({
        click(e) { onLocationSelected(e.latlng); },
    });
    return position ? <Marker position={position} /> : null;
};

// --- EL CAZADOR DE TOKENS ---
const getAuthToken = () => {
    let t = localStorage.getItem('token');
    
    // Si no lo encuentra suelto, lo busca adentro de 'user'
    if (!t) {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const userObj = JSON.parse(userStr);
                t = userObj.token;
            } catch(e) {}
        }
    }
    // Le quita cualquier comilla extraña que rompa el backend
    return t ? t.replace(/['"]+/g, '') : '';
};

const PerfilPage = () => {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false); 
  const [rol, setRol] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [mapaCentro, setMapaCentro] = useState([-19.5894, -65.7541]); 

  // --- ESTADOS PARA WHATSAPP ---
  const [waStatus, setWaStatus] = useState('desconectado'); 
  const [qrCode, setQrCode] = useState(null); 

  const [form, setForm] = useState({
      nombre: '', email: '', password: '', ci: '',
      telefono: '', direccion: '', distrito: '', latitud: '', longitud: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
        try {
            const data = await authService.getProfile();
            setRol(data.rol); 
            
            if (data.latitud && data.longitud) {
                setMapaCentro([parseFloat(data.latitud), parseFloat(data.longitud)]);
            } else if (data.distrito) {
                const distritoEncontrado = [...DISTRITOS_POTOSI.urbanos, ...DISTRITOS_POTOSI.rurales].find(d => d.id === data.distrito);
                if (distritoEncontrado) setMapaCentro([distritoEncontrado.lat, distritoEncontrado.lng]);
            }

            setForm({
                nombre: data.nombre,
                email: data.email,
                password: '', 
                ci: data.ci || '', 
                telefono: data.telefono || '', 
                direccion: data.direccion || '',
                distrito: data.distrito || '', 
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

  // --- LOOP DE MONITOREO (POLLING) DE WHATSAPP ---
  useEffect(() => {
      let interval;
      
      if (rol === 'Admin') {
          const checkWhatsAppStatus = async () => {
              try {
                  const timestamp = new Date().getTime();
                    const response = await fetch(`/api/whatsapp/status?t=${timestamp}`, {
                      method: 'GET',
                      cache: 'no-store', 
                      headers: {
                          'Pragma': 'no-cache',
                          'Cache-Control': 'no-cache'
                      }
                  });
                  if (response.ok) {
                      const data = await response.json();
                      setWaStatus(data.status);
                      setQrCode(data.qr);
                  }
              } catch (err) {
                  // Silencio
              }
          };

          checkWhatsAppStatus(); 
          interval = setInterval(checkWhatsAppStatus, 3000); 
      }

      return () => clearInterval(interval); 
  }, [rol]);

  const handleChange = (e) => {
      const { name, value } = e.target;
      setForm({ ...form, [name]: value });

      if (name === 'distrito') {
          const distritoEncontrado = [...DISTRITOS_POTOSI.urbanos, ...DISTRITOS_POTOSI.rurales].find(d => d.id === value);
          if (distritoEncontrado) {
              setMapaCentro([distritoEncontrado.lat, distritoEncontrado.lng]);
          }
      }
  };

  const handleMapClick = (latlng) => setForm({ ...form, latitud: latlng.lat, longitud: latlng.lng });

  const handleSubmit = async (e) => {
      e.preventDefault();
      if (isSaving) return; 
      
      if (rol === 'Propietario' && !form.distrito) {
          return Swal.fire('Atención', 'Por favor, selecciona tu distrito antes de guardar.', 'warning');
      }

      setIsSaving(true); 

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
      } finally {
          setIsSaving(false); 
      }
  };

  const handleDesvincularWA = () => {
      Swal.fire({
          title: '¿Desvincular WhatsApp?',
          text: "El sistema dejará de enviar recordatorios automáticamente hasta que escanees un nuevo código QR.",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
          confirmButtonText: 'Sí, desvincular'
      }).then(async (result) => {
          if (result.isConfirmed) {
              try {
                  setWaStatus('cargando');
                  const tokenFinal = getAuthToken();
                  
                  const response = await fetch('/api/whatsapp/logout', {
                      method: 'POST',
                      headers: {
                          'Authorization': `Bearer ${tokenFinal}`,
                          'x-access-token': tokenFinal,
                          'Content-Type': 'application/json'
                      }
                  });

                  if (response.ok) {
                      setWaStatus('desconectado');
                      setQrCode(null);
                      Swal.fire('Sesión Cerrada', 'WhatsApp se ha desvinculado. Espera unos segundos a que el bot genere el nuevo código QR.', 'success');
                  } else {
                      throw new Error('Error de servidor');
                  }
              } catch (error) {
                  setWaStatus('conectado');
                  Swal.fire('Error', 'No se pudo cerrar la sesión en el servidor.', 'error');
              }
          }
      });
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
                
                <div>
                    <h3 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">Información de la Cuenta</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {rol === 'Propietario' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Carnet de Identidad (Opcional)</label>
                                <div className="relative">
                                    <CreditCard className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                    <input 
                                        type="text" 
                                        name="ci" 
                                        className="pl-10 w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" 
                                        placeholder="Ej: 1234567"
                                        value={form.ci} 
                                        onChange={handleChange} 
                                    />
                                </div>
                            </div>
                        )}

                        <div>
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
                                <label className="block text-sm font-medium text-gray-700 mb-1 text-blue-600">Distrito al que perteneces</label>
                                <select
                                    name="distrito"
                                    value={form.distrito}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 outline-none bg-white cursor-pointer"
                                    required
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

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección Escrita (Calle/Zona)</label>
                                <input type="text" name="direccion" className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 outline-none" value={form.direccion} onChange={handleChange} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Ubicación de Domicilio (Haz clic para actualizar)</label>
                            
                            <div className="h-72 w-full rounded-lg overflow-hidden border border-gray-300 relative z-0 shadow-sm bg-gray-100">
                                <MapContainer center={mapaCentro} zoom={15} style={{ height: '100%', width: '100%' }}>
                                    <TileLayer 
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
                                    />
                                    <MapFix /> 
                                    <ChangeMapView center={mapaCentro} />
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
                    <button 
                        type="submit" 
                        disabled={isSaving}
                        className={`font-bold py-3 px-8 rounded-xl shadow-lg flex items-center transition-all transform ${
                            isSaving 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5 text-white'
                        }`}
                    >
                        {isSaving ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5 mr-2" /> Guardar Cambios
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* ========================================================================= */}
            {/* --- SECCIÓN EXCLUSIVA DEL ADMINISTRADOR: CONTROL CENTRAL DE WHATSAPP --- */}
            {/* ========================================================================= */}
            {rol === 'Admin' && (
                <div className="p-8 bg-gray-50 border-t border-gray-200 animate-in fade-in duration-300">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center">
                            <Smartphone className="w-5 h-5 mr-2 text-green-600"/> Vinculación del Servidor de WhatsApp
                        </h3>
                        <span className={`w-fit px-3 py-1 rounded-full text-xs font-bold border ${
                            waStatus === 'conectado' 
                            ? 'bg-green-100 text-green-700 border-green-200' 
                            : waStatus === 'cargando'
                            ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                            : 'bg-red-100 text-red-700 border-red-200'
                        }`}>
                            {waStatus === 'conectado' ? '🟢 Servidor Conectado' : waStatus === 'cargando' ? '⏳ Procesando...' : '🔴 Servidor Desconectado'}
                        </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-6">
                        Gestiona el teléfono oficial de la institución. El número enlazado enviará de manera automatizada las alertas de vacunaciones a los propietarios.
                    </p>

                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center min-h-[320px]">
                        
                        {waStatus === 'conectado' ? (
                            <div className="text-center w-full max-w-sm animate-in zoom-in-95 duration-200">
                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-200 shadow-sm">
                                    <CheckCircle size={32} />
                                </div>
                                <h4 className="font-bold text-gray-800 text-lg mb-1">¡Sistema Activo!</h4>
                                <p className="text-sm text-gray-500 mb-6">El bot se encuentra enlazado de forma permanente y respondiendo correctamente.</p>
                                <button 
                                    type="button"
                                    onClick={handleDesvincularWA}
                                    className="bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2.5 px-6 rounded-lg border border-red-200 transition-all flex items-center justify-center mx-auto shadow-sm active:scale-95"
                                >
                                    <LogOut className="w-4 h-4 mr-2" /> Desvincular Número de Zoonosis
                                </button>
                            </div>
                        ) : waStatus === 'cargando' ? (
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                <p className="text-sm text-gray-500 font-medium">Comunicándose con el servidor móvil...</p>
                            </div>
                        ) : (
                            <div className="text-center w-full max-w-md animate-in zoom-in-95 duration-200">
                                <div className="bg-gray-50 w-64 h-64 mx-auto rounded-lg flex items-center justify-center mb-5 border-2 border-dashed border-gray-300 shadow-inner overflow-hidden">
                                    {qrCode ? (
                                        <img src={qrCode} alt="WhatsApp QR" className="w-full h-full object-contain p-3 animate-in fade-in duration-300" />
                                    ) : (
                                        <div className="flex flex-col items-center text-gray-400 p-4">
                                            <QrCode size={44} className="mb-2 opacity-40 animate-pulse" />
                                            <span className="text-xs font-semibold text-gray-400 text-center">Iniciando motor de WhatsApp<br/>(Puede tomar hasta 30 seg)</span>
                                        </div>
                                    )}
                                </div>
                                <h4 className="font-bold text-gray-800 text-base mb-1">Enlaza el dispositivo institucional</h4>
                                <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                                    Abre WhatsApp en el teléfono de la Unidad, dirígete a <b>Dispositivos vinculados</b> y escanea este código en pantalla.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default PerfilPage;