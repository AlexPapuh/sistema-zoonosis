import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx'; 
import citasService from '../../services/citas.service.js';
import campanaService from '../../services/campana.service.js'; 
import { Calendar, Clock, User, Syringe, Megaphone, Lock, Play, Activity, Stethoscope, ClipboardCheck } from 'lucide-react'; 
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2'; 

const getEstadoColor = (estado) => {
    switch(estado) {
        case 'Planificada': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'Ejecucion': return 'bg-emerald-100 text-emerald-800 border-emerald-200 animate-pulse';
        case 'Finalizada': return 'bg-gray-100 text-gray-600 border-gray-200';
        default: return 'bg-gray-100';
    }
};

const formatFecha = (isoString) => {
    if (!isoString) return 'Fecha pendiente';
    const fecha = new Date(isoString);
    return fecha.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

const VeteDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [citasHoy, setCitasHoy] = useState([]);
  const [misCampanas, setMisCampanas] = useState([]); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [citasData, campanasData] = await Promise.all([
            citasService.getAgendaHoy(),
            campanaService.getMisAsignaciones()
        ]);
        
        const rawCitas = Array.isArray(citasData) ? citasData : [];
        const hoy = new Date();
        
        const citasFiltradas = rawCitas.filter(cita => {
            const fechaCita = new Date(cita.fecha_cita); 
            
            const esMismoDia = fechaCita.getDate() === hoy.getDate() &&
                               fechaCita.getMonth() === hoy.getMonth() &&
                               fechaCita.getFullYear() === hoy.getFullYear();
            
            const esEstadoValido = ['Confirmada', 'Pendiente'].includes(cita.estado);

            return esMismoDia && esEstadoValido;
        });

        citasFiltradas.sort((a, b) => new Date(a.fecha_cita) - new Date(b.fecha_cita));
        
        setCitasHoy(citasFiltradas);
        
        const campanasSafe = Array.isArray(campanasData) ? campanasData : [];
        setMisCampanas(campanasSafe.filter(c => c.estado !== 'Finalizada'));

      } catch (error) {
        console.error("Error cargando dashboard vete:", error);
        setCitasHoy([]);
        setMisCampanas([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleEjecutar = (campana) => {
      if (campana.estado === 'Planificada') {
          Swal.fire({
              icon: 'info',
              title: 'Campaña en Espera',
              text: `Esta campaña está programada para iniciar el ${formatFecha(campana.fecha_inicio)}. Espera la orden de arranque del administrador.`,
              confirmButtonColor: '#3B82F6'
          });
      } else if (campana.estado === 'Ejecucion') {
          navigate(`/gestion/campana/${campana.id}/ejecucion`);
      }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 space-y-8 p-6">
      
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-4 bg-white rounded-2xl p-8 border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden">
             <div className="relative z-10">
                <h1 className="text-3xl font-bold text-gray-800">Panel Médico</h1>
                <p className="text-gray-500 mt-1">Bienvenido, Dr. <span className="font-semibold text-cyan-600">{user.nombre}</span></p>
             </div>
             <div className="hidden md:flex space-x-2 relative z-10">
                 <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center shadow-sm">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span> Sistema Online
                 </span>
             </div>
             <div className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-cyan-50 to-transparent"></div>
          </div>
          
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center transition-transform hover:-translate-y-1 duration-300">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl mr-4"><Calendar size={24} /></div>
              <div>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Citas Hoy</p>
                  <p className="text-2xl font-bold text-gray-800">{citasHoy.length}</p>
              </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center transition-transform hover:-translate-y-1 duration-300">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl mr-4"><Megaphone size={24} /></div>
              <div>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Campañas</p>
                  <p className="text-2xl font-bold text-gray-800">{misCampanas.length}</p>
              </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center transition-transform hover:-translate-y-1 duration-300">
              <div className="p-3 bg-orange-50 text-orange-600 rounded-xl mr-4"><Activity size={24} /></div>
              <div>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Estado</p>
                  <p className="text-lg font-bold text-gray-800">Activo</p>
              </div>
          </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center p-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Campañas */}
            <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center">
                        <Syringe className="w-5 h-5 mr-2 text-cyan-600"/> Campañas Asignadas
                    </h2>
                </div>

                {misCampanas?.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center">
                        <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-3"/>
                        <p className="text-gray-500">No tienes campañas asignadas por el momento.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {misCampanas.map(campana => (
                            <div key={campana.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col justify-between h-full group">
                                <div>
                                    <div className="flex justify-between items-start mb-3">
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide border ${getEstadoColor(campana.estado)}`}>
                                            {campana.estado === 'Ejecucion' ? '• EN CURSO' : campana.estado}
                                        </span>
                                        {campana.estado === 'Ejecucion' && <span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span></span>}
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800 mb-2 leading-tight group-hover:text-cyan-700 transition-colors">{campana.nombre}</h3>
                                    <p className="text-gray-500 text-sm mb-4 line-clamp-2">{campana.descripcion}</p>
                                    
                                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                        <div className="flex items-center text-xs text-gray-500 mb-1">
                                            <Calendar className="w-3 h-3 mr-1"/> Inicio: {formatFecha(campana.fecha_inicio)}
                                        </div>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-xs font-semibold text-gray-600">Stock Vacunas</span>
                                            <span className="text-sm font-bold text-cyan-700">{Number(campana.stock_asignado).toFixed(0)} u.</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <button 
                                    onClick={() => handleEjecutar(campana)}
                                    disabled={campana.estado !== 'Ejecucion'} 
                                    className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center transition-all ${
                                        campana.estado === 'Ejecucion' 
                                            ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/30 hover:scale-[1.02]' 
                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                                >
                                    {campana.estado === 'Ejecucion' ? <><Play className="w-4 h-4 mr-2 fill-current" /> Iniciar Vacunación</> : <><Lock className="w-4 h-4 mr-2" /> Esperando Inicio</>}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Agenda del día Filtrada */}
            <div>
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-purple-600"/> Agenda de Hoy
                </h2>
                
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[300px]">
                    {citasHoy?.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center p-10 text-gray-400">
                             <div className="bg-gray-50 p-4 rounded-full mb-3">
                                <Calendar className="w-8 h-8 opacity-50"/>
                             </div>
                             <p className="text-sm font-medium">Sin citas pendientes para hoy.</p>
                             <p className="text-xs mt-1">¡Buen trabajo!</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {citasHoy.map((cita) => (
                                <div key={cita.id} className="p-4 hover:bg-gray-50 transition-colors flex items-start group cursor-pointer border-l-4 border-transparent hover:border-purple-500">
                                    <div className={`bg-gray-100 text-gray-600 rounded-lg px-2 py-1 text-center min-w-[60px] mr-3 group-hover:bg-purple-100 group-hover:text-purple-700 transition-colors`}>
                                        <span className="block text-xs font-bold uppercase">{new Date(cita.fecha_cita).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}</span>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-gray-800 text-sm mb-1">{cita.motivo}</h4>
                                        <div className="flex items-center text-xs text-gray-500 mb-1">
                                            <User className="w-3 h-3 mr-1"/> {cita.propietario_nombre}
                                        </div>
                                        <div className="flex items-center text-xs text-gray-500">
                                            <Stethoscope className="w-3 h-3 mr-1"/> Paciente: <span className="font-medium text-gray-700 ml-1">{cita.animal_nombre}</span>
                                        </div>
                                    </div>
                                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                        cita.estado === 'Confirmada' ? 'bg-green-500' : 
                                        cita.estado === 'Pendiente' ? 'bg-yellow-500' : 'bg-gray-300'
                                    }`} title={cita.estado}></div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

        </div>
      )}
    </div>
  );
};

export default VeteDashboard;