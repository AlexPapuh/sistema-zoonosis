import React, { useState, useEffect } from 'react';
import citasService from '../../services/citas.service.js';
import animalService from '../../services/animal.service.js';
import horarioService from '../../services/horario.service.js';
import { Calendar as CalendarIcon, Clock, Plus, X, CheckCircle, AlertCircle, Edit, Trash2, CheckSquare, MessageSquare, CalendarDays, Dog } from 'lucide-react';
import Swal from 'sweetalert2';
import Calendar from 'react-calendar'; 
import 'react-calendar/dist/Calendar.css'; 

const MisCitasPage = () => {
  const [citas, setCitas] = useState([]);
  const [mascotas, setMascotas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [esMascotaNueva, setEsMascotaNueva] = useState(false);
  const [nombreMascotaNueva, setNombreMascotaNueva] = useState('');

  const [date, setDate] = useState(new Date());
  const [diasEspeciales, setDiasEspeciales] = useState([]); 
  const [diasLlenos, setDiasLlenos] = useState([]); 


  const [diasAtencion, setDiasAtencion] = useState([1, 2, 3, 4, 5]); 

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false); 
  const [editingId, setEditingId] = useState(null); 

  const [availableSlots, setAvailableSlots] = useState([]);
  const [infoHorario, setInfoHorario] = useState(''); 

  const [form, setForm] = useState({
      animal_id: '',
      fecha: '',
      hora: '',
      motivo: ''
  });

  const hoy = new Date();
  const fechaMinima = new Date(hoy.getTime() - (hoy.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  const minutosActuales = hoy.getHours() * 60 + hoy.getMinutes();
  const esHoy = form.fecha === fechaMinima;

  useEffect(() => {
    fetchData();
    fetchCalendarioData(new Date());
    fetchConfiguracionDias(); 
  }, []);

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

  const fetchData = async () => {
    try {
      setLoading(true);
      const [citasData, mascotasData] = await Promise.all([
          citasService.getMisCitas(),
          animalService.getMisMascotas()
      ]);

      const listaSegura = Array.isArray(citasData) ? citasData : [];
      const mascotasSeguras = Array.isArray(mascotasData) ? mascotasData : [];

      const ordenadas = listaSegura.sort((a, b) => {
          const estadoOrder = { 'Pendiente': 1, 'Confirmada': 2, 'Completada': 3, 'Cancelada': 4 };
          return (estadoOrder[a.estado] - estadoOrder[b.estado]) || (new Date(b.fecha_cita) - new Date(a.fecha_cita));
      });

      setCitas(ordenadas);
      setMascotas(mascotasSeguras);
    } catch (error) {
      console.error("Error cargando datos:", error);
      setCitas([]); setMascotas([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCalendarioData = async (fechaBase) => {
      try {
          const year = fechaBase.getFullYear();
          const month = fechaBase.getMonth() + 1;
          const data = await citasService.getResumenMensual(year, month);
          setDiasEspeciales(data.especiales || []);
          setDiasLlenos(data.concurridos || []);
      } catch (error) { 
          console.error("Error cargando calendario", error); 
      }
  };

  useEffect(() => {
    const cargarDisponibilidad = async () => {
        if (form.fecha) {
            try {
                const data = await citasService.getDisponibilidad(form.fecha);
                setAvailableSlots(data?.slots || []); 
                setInfoHorario(data?.horario || '');  
            } catch (error) {
                console.error(error);
                setAvailableSlots([]);
            }
        } else {
            setAvailableSlots([]);
            setInfoHorario('');
        }
    };
    cargarDisponibilidad();
  }, [form.fecha]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'fecha') {
        const dateObj = new Date(value + 'T00:00:00');
        const dia = dateObj.getDay();
        
        if (!diasAtencion.includes(dia)) {
            Swal.fire({
                icon: 'warning',
                title: 'Día no laboral',
                text: 'El centro no atiende este día de la semana según la configuración actual.'
            });
            setForm({ ...form, fecha: '' }); 
            return;
        }
    }
    setForm({ ...form, [name]: value });
  };

  const handleOpenCreate = () => {
      setIsEditing(false);
      setForm({ animal_id: '', fecha: '', hora: '', motivo: '' });
      setEsMascotaNueva(false);
      setNombreMascotaNueva('');
      setShowModal(true);
      setAvailableSlots([]);
      setInfoHorario('');
  };

  const handleOpenEdit = (cita) => {
      const fechaObj = new Date(cita.fecha_cita);
      const fechaStr = fechaObj.toISOString().split('T')[0]; 
      const horaStr = fechaObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute:'2-digit' });
      
      setIsEditing(true);
      setEditingId(cita.id);
      setForm({
          animal_id: cita.animal_id, 
          fecha: fechaStr,
          hora: horaStr,
          motivo: cita.motivo
      });
      setShowModal(true);
  };

  const handleActiveStartDateChange = ({ activeStartDate }) => {
      fetchCalendarioData(activeStartDate);
  };

 const onDateClick = (value) => {
      if (!diasAtencion.includes(value.getDay())) return; 

      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      const fechaStr = `${year}-${month}-${day}`;

      setIsEditing(false);
      setForm({ animal_id: '', fecha: fechaStr, hora: '', motivo: '' });
      setEsMascotaNueva(false);
      setNombreMascotaNueva('');
      setShowModal(true);
  };
  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
        const offset = date.getTimezoneOffset();
        const localDate = new Date(date.getTime() - (offset * 60 * 1000));
        const dateStr = localDate.toISOString().split('T')[0];
        const diaSemana = date.getDay();

        const especial = diasEspeciales.find(d => new Date(d.fecha).toISOString().split('T')[0] === dateStr);
        if (especial) {
            return especial.tipo === 'Feriado' ? 'tile-feriado' : 'tile-continuo';
        }
        
        if (!diasAtencion.includes(diaSemana)) {
            return 'tile-desactivado'; 
        }
        
        const lleno = diasLlenos.find(d => d.fecha === dateStr);
        if (lleno) return 'tile-lleno';
    }
  };

  const handleDelete = async (id) => {
      const result = await Swal.fire({
          title: '¿Estás seguro?', text: "Se eliminará permanentemente.", icon: 'warning',
          showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
          try {
              await citasService.deleteCita(id);
              Swal.fire({ icon: 'success', title: 'Eliminada', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
              fetchData();
              fetchCalendarioData(new Date()); 
          } catch (error) {
              Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo eliminar la cita.' });
          }
      }
  };

  const handleSubmit = async (e) => {
      e.preventDefault();
      const fechaCitaISO = `${form.fecha}T${form.hora}:00`;
      
      const dataToSend = {
          animal_id: esMascotaNueva ? null : form.animal_id,
          nombre_mascota_temp: esMascotaNueva ? nombreMascotaNueva : null,
          fecha_cita: fechaCitaISO,
          motivo: form.motivo,
          notas: "Solicitud web"
      };

      try {
          if (isEditing) {
              await citasService.updateCita(editingId, dataToSend);
              Swal.fire({ icon: 'success', title: 'Actualizada', timer: 1500, showConfirmButton: false });
          } else {
              await citasService.createCita(dataToSend);
              Swal.fire({ icon: 'success', title: 'Solicitud Enviada', text: 'Espera la confirmación.', confirmButtonColor: '#9333ea' });
          }
          setShowModal(false);
          fetchData();
          fetchCalendarioData(new Date()); 
      } catch (error) {
          Swal.fire({ icon: 'error', title: 'Error', text: error.message || "Error al guardar." });
      }
  };

  return (
    <div className="container mx-auto pb-20 p-6 max-w-7xl">
      <style>{`
        .react-calendar { border: none; width: 100%; font-family: inherit; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); padding: 1rem; }
        .react-calendar__tile { height: 45px; border-radius: 8px; font-size: 0.9rem; margin: 2px 0; }
        .react-calendar__tile:enabled:hover { background-color: #e5e7eb; }
        .react-calendar__tile--now { background: #eff6ff; color: #2563eb; font-weight: bold; border: 1px solid #bfdbfe; }
        .react-calendar__tile--active { background: #2563eb !important; color: white !important; }
        
        .tile-feriado { background-color: #fee2e2 !important; color: #b91c1c !important; font-weight: bold; opacity: 0.8; }
        .tile-continuo { background-color: #fef9c3 !important; color: #a16207 !important; font-weight: bold; border: 1px solid #fde047; }
        .tile-lleno { background-color: #e5e7eb !important; color: #374151 !important; border-bottom: 3px solid #6b7280; font-weight: bold; }
        
        /* ESTILO PARA DÍAS NO LABORALES (NUEVO) */
        .tile-desactivado { 
            background-color: #f3f4f6 !important; 
            color: #d1d5db !important; 
            pointer-events: none; 
            opacity: 0.6; 
        }
      `}</style>

      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
            <CalendarDays className="mr-3 text-purple-600 h-8 w-8" /> Mis Citas
        </h1>
        <button onClick={handleOpenCreate} className="flex items-center rounded-lg bg-purple-600 px-5 py-2.5 font-bold text-white shadow-lg hover:bg-purple-700 transition-all transform hover:-translate-y-0.5">
          <Plus className="mr-2 h-5 w-5" /> Solicitar Cita
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        <div className="lg:col-span-2 space-y-4">
            {loading ? (
                <div className="text-center p-10">Cargando citas...</div>
            ) : citas.length === 0 ? (
                <div className="bg-white p-10 rounded-xl shadow-sm border border-gray-200 text-center">
                    <CalendarIcon className="mx-auto h-16 w-16 text-gray-200 mb-4" />
                    <p className="text-gray-500 text-lg">No tienes citas programadas.</p>
                    <p className="text-sm text-gray-400 mt-1">Usa el calendario o el botón para agendar una.</p>
                </div>
            ) : (
                citas.map(cita => (
                    <div key={cita.id} className={`bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between border-l-4 ${
                        cita.estado === 'Pendiente' ? 'border-orange-400' : 
                        cita.estado === 'Confirmada' ? 'border-green-500' : 
                        'border-gray-300'
                    }`}>
                        <div className="flex-1">
                            <div className="flex items-start">
                                <div className={`p-3 rounded-full mr-4 flex-shrink-0 ${
                                    cita.estado === 'Pendiente' ? 'bg-orange-50 text-orange-500' : 
                                    cita.estado === 'Confirmada' ? 'bg-green-50 text-green-500' : 
                                    'bg-gray-100 text-gray-400'
                                }`}>
                                    {cita.estado === 'Pendiente' && <AlertCircle className="h-6 w-6" />}
                                    {cita.estado === 'Confirmada' && <CheckCircle className="h-6 w-6" />}
                                    {(cita.estado === 'Completada' || cita.estado === 'Cancelada') && <CheckSquare className="h-6 w-6" />}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">{cita.motivo}</h3>
                                    <p className="text-sm text-gray-600">Paciente: <span className="font-semibold text-purple-600">{cita.animal_nombre}</span></p>
                                    <div className="flex items-center text-gray-500 text-sm mt-1">
                                            <Clock className="h-4 w-4 mr-1" />
                                            <span className="capitalize">{new Date(cita.fecha_cita).toLocaleDateString('es-ES', {weekday: 'long', day:'numeric', month:'long'})}</span> 
                                            <span className="mx-1">•</span> 
                                            {new Date(cita.fecha_cita).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </div>
                                    {cita.veterinario_nombre && <p className="text-xs text-gray-400 mt-1">Atiende: {cita.veterinario_nombre}</p>}
                                    
                                    {cita.estado === 'Cancelada' && cita.notas && (
                                        <div className="mt-2 text-xs text-red-600 bg-red-50 p-1.5 rounded flex items-center">
                                            <MessageSquare className="h-3 w-3 mr-1" /> {cita.notas}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex flex-col items-end space-y-2 mt-4 md:mt-0 min-w-[120px]">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide text-center w-full 
                                ${cita.estado === 'Pendiente' ? 'bg-orange-100 text-orange-700' : 
                                  cita.estado === 'Confirmada' ? 'bg-green-100 text-green-700' : 
                                  'bg-gray-100 text-gray-600'}`}>
                                {cita.estado}
                            </span>

                            <div className="flex space-x-1 justify-end w-full">
                                {cita.estado === 'Pendiente' && (
                                    <>
                                            <button onClick={() => handleOpenEdit(cita)} className="p-2 text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors" title="Editar">
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => handleDelete(cita.id)} className="p-2 text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors" title="Cancelar">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                    </>
                                )}
                                {(cita.estado === 'Completada' || cita.estado === 'Cancelada') && (
                                    <button onClick={() => handleDelete(cita.id)} className="flex items-center justify-center px-3 py-1.5 text-xs font-medium text-gray-400 bg-gray-50 rounded hover:bg-red-50 hover:text-red-600 transition-colors w-full">
                                            <Trash2 className="h-3 w-3 mr-1" /> Eliminar
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>

        <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200">
                <h3 className="font-bold text-gray-700 mb-4 flex items-center border-b pb-2"><CalendarDays className="w-5 h-5 mr-2 text-blue-500"/> Consultar Disponibilidad</h3>
                <Calendar 
                    onChange={onDateClick} 
                    value={date} 
                    tileClassName={tileClassName}
                    onActiveStartDateChange={handleActiveStartDateChange}
                    prev2Label={null} next2Label={null}
                    className="w-full text-sm"
                />
                
                <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] text-gray-600">
                    <div className="flex items-center"><span className="w-2 h-2 bg-red-200 border border-red-400 rounded-full mr-1.5"></span> Feriado</div>
                    <div className="flex items-center"><span className="w-2 h-2 bg-yellow-200 border border-yellow-400 rounded-full mr-1.5"></span> H. Continuo</div>
                    <div className="flex items-center"><span className="w-2 h-2 bg-f3f4f6 border border-gray-300 rounded-full mr-1.5"></span> No Laboral</div>
                    <div className="flex items-center"><span className="w-2 h-2 bg-blue-100 border border-blue-300 rounded-full mr-1.5"></span> Hoy</div>
                    <div className="flex items-center gap-2 col-span-2"> <span className="w-2.5 h-2.5 rounded-full bg-gray-300 border border-gray-500"></span> Agenda Llena</div>  

                </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100 text-xs text-blue-800 shadow-sm">
                <p className="font-bold mb-1 flex items-center"><MessageSquare className="w-3 h-3 mr-1"/> Nota:</p>
                Selecciona un día en el calendario para ver los horarios libres y agendar tu cita rápidamente.
            </div>
        </div>

      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-purple-700 p-4 flex justify-between items-center text-white">
                <h2 className="text-xl font-bold">{isEditing ? 'Modificar Cita' : 'Solicitar Nueva Cita'}</h2>
                <button onClick={() => setShowModal(false)} className="hover:bg-purple-600 rounded p-1"><X className="h-6 w-6" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Paciente / Mascota</label>
                    
                    {!esMascotaNueva ? (
                        <div className="space-y-2 animate-in fade-in">
                            <select 
                                name="animal_id" 
                                required={!esMascotaNueva} 
                                className="w-full rounded-lg border-gray-300 p-2.5 bg-gray-50 focus:ring-2 focus:ring-purple-500 border" 
                                value={form.animal_id} 
                                onChange={handleInputChange}
                            >
                                <option value="">-- Seleccionar de mis mascotas --</option>
                                {mascotas
                                    .filter(m => m.estado !== 'Deceso' && m.estado !== 'Perdida')
                                    .map(m => (<option key={m.id} value={m.id}>{m.nombre} ({m.especie})</option>))
                                }
                            </select>
                            
                            <button 
                                type="button" 
                                onClick={() => setEsMascotaNueva(true)}
                                className="text-xs text-purple-600 font-bold hover:underline flex items-center gap-1"
                            >
                                + Mi mascota no aparece / Es nueva
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2 animate-in slide-in-from-left-2">
                            <div className="flex items-center bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
                                <Dog className="text-purple-400 w-4 h-4 mr-2" />
                                <input 
                                    type="text" 
                                    placeholder="Escribe el nombre de la mascota..." 
                                    className="w-full bg-transparent outline-none text-sm font-medium text-purple-900 placeholder-purple-300"
                                    value={nombreMascotaNueva}
                                    onChange={(e) => setNombreMascotaNueva(e.target.value)}
                                    required={esMascotaNueva}
                                />
                            </div>
                            
                            <button 
                                type="button" 
                                onClick={() => { setEsMascotaNueva(false); setNombreMascotaNueva(''); }}
                                className="text-xs text-gray-500 hover:text-gray-700 underline"
                            >
                                Cancelar (Seleccionar de la lista)
                            </button>
                            
                            <p className="text-[10px] text-gray-400 italic">
                                * Al llegar a Zoonosis se procederá a crear su registro oficial.
                            </p>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Fecha</label>
                        <input 
                            type="date" name="fecha" required min={fechaMinima} 
                            className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-purple-500" 
                            value={form.fecha} onChange={handleInputChange} 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Hora</label>
                        <select 
                            name="hora" required 
                            className={`w-full rounded-lg border p-2.5 focus:ring-2 focus:ring-purple-500 ${availableSlots.length === 0 ? 'bg-gray-100 text-gray-400' : 'bg-white border-gray-300'}`}
                            value={form.hora} onChange={handleInputChange}
                            disabled={availableSlots.length === 0}
                        >
                            <option value="">-- Hora --</option>
                            {availableSlots.map((slot, index) => {
                                let esPasado = false;
                                if (esHoy) {
                                    const [h, m] = slot.hora.split(':').map(Number);
                                    if ((h * 60 + m) <= minutosActuales) esPasado = true;
                                }
                                const ocupado = slot.estado === 'ocupado';
                                const esMiHoraActual = isEditing && slot.hora === form.hora; 
                                const deshabilitado = (ocupado && !esMiHoraActual) || (esPasado && !esMiHoraActual);

                                return (
                                    <option key={index} value={slot.hora} disabled={deshabilitado} className={deshabilitado ? "text-gray-300 bg-gray-50" : "font-medium text-gray-900"}>
                                        {slot.hora} {ocupado && !esMiHoraActual ? '(Ocupado)' : ''}
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                </div>

                {infoHorario && (
                    <div className={`text-xs p-2 rounded text-center font-bold border ${infoHorario.includes('Feriado') ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                        ℹ️ {infoHorario}
                    </div>
                )}
                {availableSlots.length === 0 && form.fecha && !infoHorario.includes('Feriado') && (
                    <p className="text-xs text-red-500 text-center">No hay horarios disponibles para esta fecha.</p>
                )}

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Motivo de la consulta</label>
                    <textarea name="motivo" rows="3" required className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-purple-500" placeholder="" value={form.motivo} onChange={handleInputChange} />
                </div>
                
                <button type="submit" className="w-full rounded-lg bg-purple-600 py-3 font-bold text-white hover:bg-purple-700 shadow-lg transition-transform transform active:scale-95">
                    {isEditing ? 'Guardar Cambios' : 'Enviar Solicitud'}
                </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MisCitasPage;