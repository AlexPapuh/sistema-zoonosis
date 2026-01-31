import React, { useState, useEffect } from 'react';
import citasService from '../../services/citas.service.js';
import propietarioService from '../../services/propietario.service.js';
import animalService from '../../services/animal.service.js';
import horarioService from '../../services/horario.service.js'; 
import { useAuth } from '../../context/AuthContext.jsx';
import { 
    Calendar as CalendarIcon, Clock, CheckCircle, AlertCircle, 
    Stethoscope, X, Search, FileText, ChevronLeft, ChevronRight, 
    CalendarDays, User, ArrowRight, MessageSquare, ShieldCheck, Trash2, Edit 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import Calendar from 'react-calendar'; 
import 'react-calendar/dist/Calendar.css';

const formatFechaHora = (isoString) => {
  if (!isoString) return 'N/A';
  const fecha = new Date(isoString);
  return fecha.toLocaleString('es-ES', { 
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });
};

const GestionCitasPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [date, setDate] = useState(new Date());
  const [diasEspeciales, setDiasEspeciales] = useState([]);
  const [diasLlenos, setDiasLlenos] = useState([]);

  const [diasAtencion, setDiasAtencion] = useState([1, 2, 3, 4, 5]); 

  const [availableSlots, setAvailableSlots] = useState([]);
  const [infoHorario, setInfoHorario] = useState('');
  const [showModal, setShowModal] = useState(false);
  
  const [todosPropietarios, setTodosPropietarios] = useState([]);
  const [busquedaProp, setBusquedaProp] = useState('');
  const [propietarioSeleccionado, setPropietarioSeleccionado] = useState(null);
  const [mascotasDelPropietario, setMascotasDelPropietario] = useState([]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; 

  const [formCita, setFormCita] = useState({ animal_id: '', fecha: '', hora: '', motivo: '' });

  const hoy = new Date();
  const fechaMinima = new Date(hoy.getTime() - (hoy.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  const minutosActuales = hoy.getHours() * 60 + hoy.getMinutes();
  const esHoy = formCita.fecha === fechaMinima;

  useEffect(() => {
    fetchCitas();
    fetchCalendarioData(new Date());
    fetchConfiguracionDias();

    const cargarProps = async () => {
        if (user.rol === 'Veterinario') { 
            try {
                const data = await propietarioService.getAllPropietarios();
                setTodosPropietarios(Array.isArray(data) ? data : []);
            } catch (e) { setTodosPropietarios([]); }
        }
    };
    cargarProps();
  }, [user.rol]);

  const fetchCitas = async () => {
    try {
      setLoading(true);
      const data = await citasService.getAgenda({}); 
      setCitas(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); setCitas([]); } 
    finally { setLoading(false); }
  };

  const fetchCalendarioData = async (fechaBase) => {
      try {
          const year = fechaBase.getFullYear();
          const month = fechaBase.getMonth() + 1;
          const data = await citasService.getResumenMensual(year, month);
          setDiasEspeciales(data.especiales || []);
          setDiasLlenos(data.concurridos || []);
      } catch (error) { console.error(error); }
  };

  const fetchConfiguracionDias = async () => {
      try {
          const config = await horarioService.getHorarioNormal();
          if (config && config.dias_atencion) {
              const diasArray = config.dias_atencion.split(',').map(Number);
              setDiasAtencion(diasArray);
          }
      } catch (error) {
          console.error("Error cargando configuración de días:", error);
      }
  };

  useEffect(() => {
    const cargarDisponibilidad = async () => {
        if (formCita.fecha) {
            try {
                const data = await citasService.getDisponibilidad(formCita.fecha);
                setAvailableSlots(data.slots || []); 
                setInfoHorario(data.horario || '');  
            } catch (error) { setAvailableSlots([]); }
        } else { setAvailableSlots([]); }
    };
    cargarDisponibilidad();
  }, [formCita.fecha]);

const onDateClick = (value) => {
      if (user.rol !== 'Veterinario') return;

      if (!diasAtencion.includes(value.getDay())) return; 

      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      const fechaStr = `${year}-${month}-${day}`;

      handleOpenModal();
      setFormCita(prev => ({ ...prev, fecha: fechaStr }));
  };

  const tileDisabled = ({ date, view }) => {
      if (view === 'month') {
          const diaSemana = date.getDay();
          return !diasAtencion.includes(diaSemana);
      }
      return false; 
  };

  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
        const offset = date.getTimezoneOffset();
        const localDate = new Date(date.getTime() - (offset * 60 * 1000));
        const dateStr = localDate.toISOString().split('T')[0];
        const diaSemana = date.getDay();

        const especial = diasEspeciales.find(d => new Date(d.fecha).toISOString().split('T')[0] === dateStr);
        if (especial) return especial.tipo === 'Feriado' ? 'tile-feriado' : 'tile-continuo';
        
        if (!diasAtencion.includes(diaSemana)) {
            return 'tile-desactivado';
        }

        const lleno = diasLlenos.find(d => d.fecha === dateStr);
        if (lleno) return 'tile-lleno';
    }
  };

  const handleOpenModal = () => {
      setShowModal(true);
      setPropietarioSeleccionado(null);
      setMascotasDelPropietario([]); 
      setFormCita({ animal_id: '', fecha: '', hora: '', motivo: '' });
      setBusquedaProp('');
      setAvailableSlots([]);
  };

  const seleccionarPropietario = async (prop) => {
      setPropietarioSeleccionado(prop);
      setBusquedaProp(''); 
      try {
          const mascotas = await animalService.getAnimalsByPropietarioId(prop.id);
          setMascotasDelPropietario(Array.isArray(mascotas) ? mascotas : []);
      } catch (e) { setMascotasDelPropietario([]); }
  };

  const handleFormChange = (e) => {
      const { name, value } = e.target;
      
      if (name === 'fecha') {
          const dateObj = new Date(value + 'T00:00:00');
          const dia = dateObj.getDay();
          
          if (!diasAtencion.includes(dia)) {
              Swal.fire({ 
                  icon: 'warning', 
                  title: 'Día no laboral', 
                  text: 'El centro no atiende este día según la configuración actual.' 
              });
              setFormCita({...formCita, fecha: ''});
              return;
          }
      }
      setFormCita({...formCita, [name]: value});
  };

  const handleAgendar = async (e) => {
      e.preventDefault();
      if (!formCita.animal_id || !formCita.fecha || !formCita.hora || !formCita.motivo) {
          return Swal.fire({ icon: 'warning', title: 'Faltan datos', text: 'Complete todos los campos.' });
      }
      const datosEnviar = {
          propietario_id: propietarioSeleccionado.id,
          animal_id: formCita.animal_id,
          fecha_cita: `${formCita.fecha}T${formCita.hora}:00`,
          motivo: formCita.motivo,
          notas: "Agendada por Veterinario",
          veterinario_id: user.id, 
          estado: 'Confirmada' 
      };
      try {
          await citasService.createCita(datosEnviar);
          await Swal.fire({ icon: 'success', title: 'Cita Agendada', timer: 1500, showConfirmButton: false });
          setShowModal(false);
          fetchCitas(); 
          fetchCalendarioData(new Date());
      } catch (error) { Swal.fire({ icon: 'error', title: 'Error', text: error.message }); }
  };

  const handleCambiarEstado = async (id, nuevoEstado) => {
      if (user.rol !== 'Veterinario') return; 

      let notasCancelacion = '';
      if (nuevoEstado === 'Cancelada') {
          const { value: motivo } = await Swal.fire({
              title: 'Motivo de rechazo', input: 'text', showCancelButton: true, confirmButtonText: 'Rechazar', confirmButtonColor: '#d33'
          });
          if (motivo === undefined) return;
          notasCancelacion = motivo || "Sin motivo";
      } else {
          const result = await Swal.fire({ title: '¿Confirmar cita?', icon: 'question', showCancelButton: true, confirmButtonText: 'Sí, confirmar' });
          if (!result.isConfirmed) return;
      }
      
      try {
          const updateData = { estado: nuevoEstado };
          if (nuevoEstado === 'Confirmada') updateData.veterinario_id = user.id;
          if (notasCancelacion) updateData.notas = `Cancelada: ${notasCancelacion}`;
          await citasService.updateCita(id, updateData);
          fetchCitas(); 
      } catch (error) { Swal.fire({ icon: 'error', title: 'Error', text: "No se pudo actualizar" }); }
  };

  const pendientes = citas.filter(c => c.estado === 'Pendiente');
  const agendaCompleta = citas
      .filter(c => c.estado !== 'Pendiente')
      .sort((a, b) => new Date(b.fecha_cita) - new Date(a.fecha_cita));

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentAgenda = agendaCompleta.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(agendaCompleta.length / itemsPerPage);

  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500 font-bold">Cargando Sistema...</div>;

  return (
    <div className="container mx-auto p-6 max-w-7xl min-h-screen">
      <style>{`
        .react-calendar { border: none; width: 100%; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); padding: 1rem; background: white; font-family: inherit; }
        .react-calendar__tile { height: 40px; border-radius: 8px; font-size: 0.85rem; margin: 2px 0; }
        .react-calendar__tile:enabled:hover { background-color: #e5e7eb; }
        .react-calendar__tile--now { background: #eff6ff; color: #2563eb; font-weight: bold; border: 1px solid #bfdbfe; }
        .react-calendar__tile--active { background: #2563eb !important; color: white !important; }
        .tile-feriado { background-color: #fee2e2 !important; color: #b91c1c !important; font-weight: bold; opacity: 0.8; }
        .tile-continuo { background-color: #fef9c3 !important; color: #a16207 !important; font-weight: bold; }
        .tile-lleno { background-color: #e5e7eb !important; color: #374151 !important; border-bottom: 3px solid #6b7280; font-weight: bold; }
        /* ESTILO GRIS PARA DÍAS NO LABORALES (NUEVO) */
        .tile-desactivado { background-color: #f3f4f6 !important; color: #d1d5db !important; pointer-events: none; opacity: 0.6; }
      `}</style>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
           <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight flex items-center gap-3">
              {user.rol === 'Admin' ? <ShieldCheck className="text-blue-600 w-8 h-8"/> : null} 
              Gestión de Citas
           </h1>
           <p className="text-gray-500 text-sm mt-1">
              {user.rol === 'Admin' 
                ? 'Vista general de todas las citas del sistema (Solo Lectura).' 
                : 'Administra tu agenda y atiende solicitudes.'}
           </p>
        </div>
        
        {user.rol === 'Veterinario' && (
            <button onClick={handleOpenModal} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2">
                <CalendarIcon size={20} /> Nueva Cita
            </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-8">
            
            {/* PENDIENTES */}
            {pendientes.length > 0 && (
                <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-6">
                    <h2 className="text-lg font-bold text-orange-700 mb-4 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5"/> Solicitudes Pendientes ({pendientes.length})
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        {pendientes.map(cita => (
                            <div key={cita.id} className="bg-white p-4 rounded-xl shadow-sm border border-orange-200 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
                                <div className="flex justify-between items-start mb-2 pl-2">
                                    <div>
                                        <p className="font-bold text-gray-800">{cita.animal_nombre}</p>
                                        <p className="text-xs text-gray-500 flex items-center gap-1"><User size={12}/> {cita.propietario_nombre}</p>
                                    </div>
                                    <span className="text-[10px] font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full uppercase">Pendiente</span>
                                </div>
                                <div className="pl-2 mb-3">
                                    <p className="text-sm text-gray-600 line-clamp-2 italic">"{cita.motivo}"</p>
                                    <p className="text-xs font-mono text-gray-400 mt-1">{formatFechaHora(cita.fecha_cita)}</p>
                                </div>
                                
                                {user.rol === 'Veterinario' && (
                                    <div className="flex gap-2 pl-2">
                                        <button onClick={() => handleCambiarEstado(cita.id, 'Confirmada')} className="flex-1 bg-green-50 text-green-700 hover:bg-green-100 py-1.5 rounded-lg text-xs font-bold transition-colors">Aceptar</button>
                                        <button onClick={() => handleCambiarEstado(cita.id, 'Cancelada')} className="flex-1 bg-red-50 text-red-700 hover:bg-red-100 py-1.5 rounded-lg text-xs font-bold transition-colors">Rechazar</button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* AGENDA CONFIRMADA */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="font-bold text-gray-800 flex items-center gap-2">
                        <CalendarDays className="w-5 h-5 text-blue-600"/> Agenda Confirmada
                    </h2>
                    <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded border">Página {currentPage} de {totalPages || 1}</span>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 font-medium">Fecha y Hora</th>
                                <th className="px-6 py-3 font-medium">Paciente</th>
                                
                                {user.rol === 'Admin' && <th className="px-6 py-3 font-medium">Propietario</th>}
                                {user.rol === 'Admin' && <th className="px-6 py-3 font-medium">Veterinario</th>}
                                
                                <th className="px-6 py-3 font-medium">Motivo</th>
                                <th className="px-6 py-3 font-medium">Estado</th>
                                
                                {user.rol === 'Veterinario' && <th className="px-6 py-3 font-medium text-center">Acciones</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {currentAgenda.map(cita => (
                                <tr key={cita.id} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="px-6 py-4 font-mono text-gray-600">{formatFechaHora(cita.fecha_cita)}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{cita.animal_nombre}</div>
                                        <div className="text-xs text-gray-500">{cita.especie}</div>
                                    </td>

                                    {user.rol === 'Admin' && (
                                        <td className="px-6 py-4 text-gray-600">{cita.propietario_nombre}</td>
                                    )}
                                    {user.rol === 'Admin' && (
                                        <td className="px-6 py-4 text-blue-600 font-medium">{cita.veterinario_nombre || 'Sin asignar'}</td>
                                    )}

                                    <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{cita.motivo}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium 
                                            ${cita.estado==='Confirmada' ? 'bg-green-50 text-green-700 border border-green-100' : 
                                              cita.estado==='Completada' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 
                                              'bg-red-50 text-red-700 border border-red-100'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${cita.estado==='Confirmada'?'bg-green-500':cita.estado==='Completada'?'bg-blue-500':'bg-red-500'}`}></span>
                                            {cita.estado}
                                        </span>
                                    </td>

                                    {user.rol === 'Veterinario' && (
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {cita.estado === 'Confirmada' && (
                                                    <>
                                                        <button onClick={() => navigate(`/gestion/tratamiento`, { state: { prefill: { propietarioId: cita.propietario_id, animalId: cita.animal_id, citaId: cita.id } } })} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Atender"><Stethoscope size={18}/></button>
                                                        <button onClick={() => handleCambiarEstado(cita.id, 'Cancelada')} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors" title="Cancelar"><X size={18}/></button>
                                                    </>
                                                )}
                                                {cita.estado === 'Completada' && (
                                                    <button onClick={() => navigate( `/gestion/animal/${cita.animal_id}/historial`, { state: { from: '/gestion/citas' } } )} className="text-xs font-bold text-gray-500 hover:text-blue-600 flex items-center gap-1">
                                                        <FileText size={14}/> Historial
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {currentAgenda.length === 0 && (
                                <tr><td colSpan={user.rol === 'Admin' ? 7 : 5} className="p-8 text-center text-gray-400">No hay citas confirmadas en esta página.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {agendaCompleta.length > itemsPerPage && (
                    <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-3">
                        <button onClick={prevPage} disabled={currentPage === 1} className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-blue-600 disabled:opacity-50 transition-colors">
                            <ChevronLeft size={16}/> Anterior
                        </button>
                        <button onClick={nextPage} disabled={currentPage === totalPages} className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-blue-600 disabled:opacity-50 transition-colors">
                            Siguiente <ChevronRight size={16}/>
                        </button>
                    </div>
                )}
            </div>
        </div>

        {/* CALENDARIO */}
        <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2"><CalendarIcon className="w-5 h-5 text-purple-600"/> Disponibilidad</h3>
                </div>
                <Calendar 
                    onChange={onDateClick} 
                    value={date} 
                    tileClassName={tileClassName}
                    tileDisabled={tileDisabled} 
                    className="w-full text-sm border-none"
                    prev2Label={null} next2Label={null}
                />
                <div className="mt-5 grid grid-cols-2 gap-y-2 gap-x-4 text-xs text-gray-500">
                      <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red-200 border border-red-400"></span> Feriado</div>
                      <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-yellow-100 border border-yellow-400"></span> Continuo</div>
                      <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-f3f4f6 border border-gray-300"></span> Cerrado</div>
                      <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-blue-100 border border-blue-400"></span> Hoy</div>
                      <div className="flex items-center gap-2 col-span-2"> <span className="w-2.5 h-2.5 rounded-full bg-gray-300 border border-gray-500"></span> Agenda Llena</div>  
                </div>
            </div>

            {user.rol === 'Veterinario' ? (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100 text-xs text-blue-800 shadow-sm">
                    <p className="font-bold mb-1 flex items-center"><MessageSquare className="w-3 h-3 mr-1"/> Nota:</p>
                    Selecciona un día en el calendario para ver los horarios libres y agendar tu cita rápidamente.
                </div>
            ) : (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs text-gray-500 shadow-sm">
                    <p className="font-bold mb-1 flex items-center"><ShieldCheck className="w-3 h-3 mr-1"/> Modo Admin:</p>
                    Estás visualizando la agenda global. No puedes modificar citas desde aquí.
                </div>
            )}
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-800">Programar Cita</h2>
                    <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500"><X size={20}/></button>
                </div>
                
                <form onSubmit={handleAgendar} className="p-6 space-y-4">
                    {/* Buscador de Propietario */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Propietario</label>
                        {!propietarioSeleccionado ? (
                            <div className="relative">
                                <Search className="absolute left-3 top-3 text-gray-400" size={16}/>
                                <input 
                                    type="text" 
                                    className="w-full border-gray-300 rounded-xl pl-10 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                    placeholder="Buscar por nombre o celular..." 
                                    value={busquedaProp} 
                                    onChange={(e) => setBusquedaProp(e.target.value)} 
                                />
                                {todosPropietarios.length > 0 && busquedaProp.length > 1 && (
                                    <div className="absolute z-20 w-full bg-white mt-1 rounded-xl shadow-xl border border-gray-100 max-h-48 overflow-y-auto">
                                        {todosPropietarios.filter(p => p.nombre.toLowerCase().includes(busquedaProp.toLowerCase())).map(p => (
                                            <div key={p.id} onClick={() => seleccionarPropietario(p)} className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0">
                                                <p className="font-bold text-sm text-gray-800">{p.nombre}</p>
                                                <p className="text-xs text-gray-500">{p.telefono || 'Sin teléfono'}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex justify-between items-center bg-blue-50 p-3 rounded-xl border border-blue-100">
                                <div className="flex items-center gap-2">
                                    <div className="bg-blue-100 p-1.5 rounded-full"><User size={14} className="text-blue-600"/></div>
                                    <span className="font-bold text-blue-900 text-sm">{propietarioSeleccionado.nombre}</span>
                                </div>
                                <button type="button" onClick={() => {setPropietarioSeleccionado(null); setBusquedaProp('')}} className="text-xs text-red-500 hover:text-red-700 font-bold">Cambiar</button>
                            </div>
                        )}
                    </div>

                    {/* Mascota */}
                    {propietarioSeleccionado && (
                        <div className="animate-in slide-in-from-top-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Paciente</label>
                            <select name="animal_id" required className="w-full border-gray-300 rounded-xl py-2.5 text-sm focus:ring-2 focus:ring-blue-500" value={formCita.animal_id} onChange={handleFormChange}>
                                <option value="">-- Seleccionar --</option>
                                {(mascotasDelPropietario || []).filter(m => !['Deceso','Perdida'].includes(m.estado)).map(m => (
                                    <option key={m.id} value={m.id}>{m.nombre} ({m.especie})</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha</label>
                            <input type="date" name="fecha" required min={fechaMinima} className="w-full border-gray-300 rounded-xl py-2.5 text-sm" value={formCita.fecha} onChange={handleFormChange} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hora</label>
                            <select name="hora" required className="w-full border-gray-300 rounded-xl py-2.5 text-sm bg-white" value={formCita.hora} onChange={handleFormChange} disabled={!formCita.fecha || availableSlots.length === 0}>
                                <option value="">--</option>
                                {availableSlots.map((slot, i) => {
                                    let esPasado = false;
                                    if(esHoy) {
                                        const [h,m] = slot.hora.split(':').map(Number);
                                        if((h*60+m) <= minutosActuales) esPasado = true;
                                    }
                                    const disabled = slot.estado === 'ocupado' || esPasado;
                                    return <option key={i} value={slot.hora} disabled={disabled} className={disabled?'text-gray-300':''}>{slot.hora}</option>
                                })}
                            </select>
                        </div>
                    </div>
                    
                    {availableSlots.length === 0 && formCita.fecha && <p className="text-center text-xs text-red-500 bg-red-50 p-2 rounded-lg">No hay turnos disponibles para esta fecha.</p>}

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Motivo</label>
                        <input type="text" name="motivo" required className="w-full border-gray-300 rounded-xl py-2.5 text-sm" placeholder="" value={formCita.motivo} onChange={handleFormChange} />
                    </div>

                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/30 transition-all mt-2">
                        Confirmar Cita
                    </button>
                </form>
            </div>
        </div>
      )}

    </div>
  );
};

export default GestionCitasPage;