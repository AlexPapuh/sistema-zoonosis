import React, { useState, useEffect } from 'react';
import { useAuth } from '/src/context/AuthContext.jsx'; 
import citasService from '../../services/citas.service.js';
import campanaService from '../../services/campana.service.js'; 
import { Calendar, Clock, User, Syringe, Megaphone, Lock, Play } from 'lucide-react'; 
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2'; 

const getEstadoColor = (estado) => {
    switch(estado) {
        case 'Planificada': return 'bg-blue-100 text-blue-800 border border-blue-200';
        case 'Ejecucion': return 'bg-green-100 text-green-800 border border-green-200 animate-pulse';
        case 'Finalizada': return 'bg-gray-100 text-gray-600 border border-gray-200';
        default: return 'bg-gray-100';
    }
};

const formatFecha = (isoString) => {
    if (!isoString) return 'Fecha pendiente';
    const fecha = new Date(isoString);
    return fecha.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
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
        
     
        setCitasHoy(Array.isArray(citasData) ? citasData : []);
        
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
    <div>
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-4xl font-bold text-gray-800">Panel Veterinario</h1>
            <p className="mt-2 text-xl text-gray-600">
                Hola, <span className="font-semibold text-gray-900">{user.nombre}</span>.
            </p>
        </div>
      </div>
      
      {loading ? (
        <div className="mt-10 text-center text-gray-500">Cargando información...</div>
      ) : (
        <div className="mt-8 space-y-10">
            
            <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                    <Megaphone className="w-6 h-6 mr-2 text-blue-600"/>
                    Mis Campañas Asignadas
                </h2>
                
                {misCampanas?.length === 0 ? (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 text-blue-800">
                        No tienes campañas activas asignadas en este momento.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {misCampanas.map(campana => (
                            <div key={campana.id} className={`bg-white rounded-xl shadow-md border overflow-hidden hover:shadow-lg transition-shadow flex flex-col ${campana.estado === 'Ejecucion' ? 'border-green-300 ring-1 ring-green-100' : 'border-gray-200'}`}>
                                <div className="p-6 flex-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-xl font-bold text-gray-800 line-clamp-2">{campana.nombre}</h3>
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${getEstadoColor(campana.estado)}`}>
                                            {campana.estado === 'Ejecucion' ? 'EN CURSO' : campana.estado}
                                        </span>
                                    </div>
                                    
                                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{campana.descripcion}</p>
                                    
                                    <div className="flex items-center text-sm text-gray-600 mb-4 bg-gray-50 p-2 rounded border border-gray-100">
                                        <Calendar className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0"/>
                                        <span className="capitalize">{formatFecha(campana.fecha_inicio)}</span>
                                    </div>

                                    <div className="bg-blue-50 rounded-lg p-3 flex items-center justify-between border border-blue-100">
                                        <span className="text-blue-800 text-sm font-medium">Stock Disponible</span>
                                        <span className="text-2xl font-bold text-blue-600">{Number(campana.stock_asignado).toFixed(0)}</span>
                                    </div>
                                </div>
                                
                                <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
                                    <button 
                                        onClick={() => handleEjecutar(campana)}
                                        disabled={campana.estado !== 'Ejecucion'} 
                                        className={`w-full flex items-center justify-center font-bold py-2 px-4 rounded-lg transition-colors ${
                                            campana.estado === 'Ejecucion' 
                                                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' 
                                                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                        }`}
                                    >
                                        {campana.estado === 'Ejecucion' ? (
                                            <><Syringe className="w-5 h-5 mr-2" /> Ejecutar Campaña</>
                                        ) : (
                                            <><Lock className="w-4 h-4 mr-2" /> Esperando Inicio</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                    <Calendar className="w-6 h-6 mr-2 text-cyan-600"/>
                    Agenda del Día
                </h2>
                
                {citasHoy?.length === 0 ? (
                    <div className="bg-white p-6 rounded-lg shadow text-gray-500">No tienes citas programadas para hoy.</div>
                ) : (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <ul className="divide-y divide-gray-200">
                            {citasHoy.map(cita => (
                                <li key={cita.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                    <div className="flex items-center">
                                        <div className="bg-cyan-100 p-3 rounded-full mr-4 text-cyan-600">
                                            <Clock className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800">{cita.motivo}</p>
                                            <p className="text-sm text-gray-500 flex items-center">
                                                <User className="h-3 w-3 mr-1"/> {cita.propietario_nombre} - Paciente: {cita.animal_nombre}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-gray-700">
                                            {new Date(cita.fecha_cita).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}
                                        </p>
                                        <span className={`text-xs px-2 py-1 rounded ${
                                            cita.estado === 'Confirmada' ? 'bg-green-100 text-green-800' : 
                                            cita.estado === 'Cancelada' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {cita.estado}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </section>
        </div>
      )}
    </div>
  );
};
export default VeteDashboard;