import React, { useState, useEffect } from 'react';
import horarioService from '../../services/horario.service';
import { Clock, Save, Plus, AlertCircle, Sun, Moon, CalendarDays, Trash2, Check } from 'lucide-react';
import Swal from 'sweetalert2';
import Calendar from 'react-calendar'; 
import 'react-calendar/dist/Calendar.css'; 

const HorarioConfigPage = () => {
   
    const [horarioNormal, setHorarioNormal] = useState({ 
        apertura_manana: '', 
        cierre_manana: '', 
        apertura_tarde: '', 
        cierre_tarde: '',
        dias_atencion: '1,2,3,4,5' 
    });

    const [diasEspeciales, setDiasEspeciales] = useState([]);
    
    const [nuevoDia, setNuevoDia] = useState({ 
        fecha: '', 
        tipo: 'Feriado', 
        descripcion: '',
        hora_apertura: '08:00',
        hora_cierre: '16:00'
    });
    
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false); // NUEVO ESTADO PARA EL BOTÓN
    const [date, setDate] = useState(new Date());

    // Definición de días para el selector visual
    const diasSemana = [
        { id: 1, label: 'L', nombre: 'Lunes' },
        { id: 2, label: 'M', nombre: 'Martes' },
        { id: 3, label: 'M', nombre: 'Miércoles' },
        { id: 4, label: 'J', nombre: 'Jueves' },
        { id: 5, label: 'V', nombre: 'Viernes' },
        { id: 6, label: 'S', nombre: 'Sábado' },
        { id: 0, label: 'D', nombre: 'Domingo' },
    ];

    useEffect(() => { cargarDatos(); }, []);

    const cargarDatos = async () => {
        try {
            const [normal, especiales] = await Promise.all([horarioService.getHorarioNormal(), horarioService.getDiasEspeciales()]);
            if (normal) {
                setHorarioNormal({
                    ...normal,
                    dias_atencion: normal.dias_atencion || '1,2,3,4,5'
                });
            }
            setDiasEspeciales(especiales);
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    const toggleDia = (id) => {
        let diasArray = horarioNormal.dias_atencion 
            ? horarioNormal.dias_atencion.split(',').map(Number) 
            : [];

        if (diasArray.includes(id)) {
            diasArray = diasArray.filter(d => d !== id); 
        } else {
            diasArray.push(id); 
        }
        
        setHorarioNormal({
            ...horarioNormal,
            dias_atencion: diasArray.join(',')
        });
    };

    const handleUpdateNormal = async (e) => {
        e.preventDefault();
        if (isSaving) return; // Evita doble clic

        setIsSaving(true); // Activa el estado de guardado
        try { 
            await horarioService.updateHorarioNormal(horarioNormal); 
            Swal.fire('Guardado', 'Configuración de días y horas actualizada.', 'success'); 
        } 
        catch (error) { Swal.fire('Error', 'No se pudo guardar.', 'error'); }
        finally { setIsSaving(false); } // Desactiva el estado de guardado, falle o no
    };

    const handleAddDia = async (e) => {
        e.preventDefault();
        if (!nuevoDia.fecha) return;

        const datosEnviados = {
            ...nuevoDia,
            hora_apertura: nuevoDia.tipo === 'Horario Continuo' ? nuevoDia.hora_apertura : null,
            hora_cierre: nuevoDia.tipo === 'Horario Continuo' ? nuevoDia.hora_cierre : null,
        };

        try { 
            await horarioService.addDiaEspecial(datosEnviados); 
            Swal.fire({ icon: 'success', title: 'Agregado', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false }); 
            setNuevoDia({ ...nuevoDia, tipo: 'Feriado', descripcion: '' }); 
            cargarDatos(); 
        } 
        catch (error) { Swal.fire('Error', error.response?.data?.message || 'Error al guardar.', 'error'); }
    };

    const handleDeleteDia = async (id) => {
        if ((await Swal.fire({ title: '¿Borrar?', text: 'El día volverá a su configuración normal', icon: 'warning', showCancelButton: true })).isConfirmed) {
            await horarioService.deleteDiaEspecial(id); cargarDatos();
        }
    };

    const handleHorarioChange = (e) => setHorarioNormal({ ...horarioNormal, [e.target.name]: e.target.value });

    // --- LÓGICA CALENDARIO ---
    const onDateClick = (value) => {
        const offset = value.getTimezoneOffset();
        const localDate = new Date(value.getTime() - (offset * 60 * 1000));
        const fechaStr = localDate.toISOString().split('T')[0];
        setNuevoDia({ ...nuevoDia, fecha: fechaStr });
        setDate(value);
    };

    const tileClassName = ({ date, view }) => {
        if (view === 'month') {
            const offset = date.getTimezoneOffset();
            const localDate = new Date(date.getTime() - (offset * 60 * 1000));
            const dateStr = localDate.toISOString().split('T')[0];
            
            // 1. Verificar si es Feriado/Excepción (Prioridad Alta)
            const diaEspecial = diasEspeciales.find(d => new Date(d.fecha).toISOString().split('T')[0] === dateStr);
            if (diaEspecial) return diaEspecial.tipo === 'Feriado' ? 'feriado-tile' : 'continuo-tile';

            // 2. Verificar si es día NO laboral según la configuración normal (Prioridad Media)
            const diaSemana = date.getDay(); 
            const diasLaborales = horarioNormal.dias_atencion ? horarioNormal.dias_atencion.split(',').map(Number) : [];
            
            if (!diasLaborales.includes(diaSemana)) {
                return 'descanso-tile'; // Clase gris para días no seleccionados
            }
        }
    };

    if (loading) return <div className="p-10 text-center">Cargando...</div>;

    return (
        <div className="container mx-auto p-6 max-w-6xl pb-20">
            <style>{`
                .react-calendar { border: none; width: 100%; border-radius: 0.75rem; box-shadow: none; font-family: inherit; }
                .react-calendar__tile { height: 50px; display: flex; flex-direction: column; justify-content: center; align-items: center; transition: background 0.2s; border-radius: 6px; margin: 2px 0; }
                
                /* HOY */
                .react-calendar__tile--now { background: #f3f4f6 !important; color: #374151 !important; border: 1px solid #d1d5db; font-weight: bold; }
                
                /* Feriado: Rojo */
                .feriado-tile { background-color: #fee2e2 !important; color: #b91c1c !important; font-weight: bold; border: 1px solid #fca5a5; }
                
                /* Continuo: Naranja */
                .continuo-tile { background-color: #ffedd5 !important; color: #c2410c !important; font-weight: bold; border: 1px solid #fdba74; }
                
                /* Descanso (Día no seleccionado en config): Gris claro tachado o desactivado */
                .descanso-tile { background-color: #ffffff !important; color: #d1d5db !important; }

                /* Seleccionado: Azul */
                .react-calendar__tile--active { background: #2563eb !important; color: white !important; border: none; }
                .react-calendar__tile:hover { background-color: #e5e7eb; }
            `}</style>

            <h1 className="text-3xl font-bold mb-6 flex items-center text-gray-800">
                <CalendarDays className="w-8 h-8 mr-3 text-blue-600"/> Gestión de Horarios
            </h1>
            
            {/* --- SECCIÓN 1: HORARIO NORMAL --- */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-8">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-700 flex items-center">
                            <Clock className="w-5 h-5 mr-2 text-green-600"/> Configuración Semanal
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">Selecciona los días de atención y sus horarios.</p>
                    </div>
                </div>

                <form onSubmit={handleUpdateNormal}>
                    
                    {/* SELECTOR DE DÍAS DE LA SEMANA */}
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-600 mb-3 uppercase tracking-wider">Días de Atención</label>
                        <div className="flex flex-wrap gap-3">
                            {diasSemana.map((dia) => {
                                // Chequeamos si el día está en el string "1,2,3..."
                                const isActive = horarioNormal.dias_atencion && horarioNormal.dias_atencion.split(',').map(Number).includes(dia.id);
                                return (
                                    <button
                                        key={dia.id}
                                        type="button"
                                        onClick={() => toggleDia(dia.id)}
                                        className={`
                                            w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all shadow-sm
                                            ${isActive 
                                                ? 'bg-blue-600 text-white shadow-blue-300 ring-2 ring-blue-200 transform scale-105' 
                                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}
                                        `}
                                        title={dia.nombre}
                                    >
                                        {isActive && <Check className="w-3 h-3 absolute -mt-7 ml-7 bg-green-500 text-white rounded-full p-0.5 border border-white" />}
                                        {dia.label}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Turno Mañana */}
                        <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                            <h3 className="text-sm font-bold text-blue-800 mb-3 flex items-center"><Sun className="w-4 h-4 mr-2"/> Turno Mañana</h3>
                            <div className="flex items-center space-x-2">
                                <input type="time" name="apertura_manana" className="border rounded-lg p-2.5 w-full bg-white text-center font-semibold text-gray-700" value={horarioNormal.apertura_manana} onChange={handleHorarioChange} required/>
                                <span className="text-blue-300 font-bold">-</span>
                                <input type="time" name="cierre_manana" className="border rounded-lg p-2.5 w-full bg-white text-center font-semibold text-gray-700" value={horarioNormal.cierre_manana} onChange={handleHorarioChange} required/>
                            </div>
                        </div>

                        {/* Turno Tarde */}
                        <div className="bg-orange-50 p-5 rounded-xl border border-orange-100">
                            <h3 className="text-sm font-bold text-orange-800 mb-3 flex items-center"><Moon className="w-4 h-4 mr-2"/> Turno Tarde</h3>
                            <div className="flex items-center space-x-2">
                                <input type="time" name="apertura_tarde" className="border rounded-lg p-2.5 w-full bg-white text-center font-semibold text-gray-700" value={horarioNormal.apertura_tarde} onChange={handleHorarioChange} required/>
                                <span className="text-orange-300 font-bold">-</span>
                                <input type="time" name="cierre_tarde" className="border rounded-lg p-2.5 w-full bg-white text-center font-semibold text-gray-700" value={horarioNormal.cierre_tarde} onChange={handleHorarioChange} required/>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-6 text-right">
                        <button 
                            type="submit" 
                            disabled={isSaving}
                            className={`font-bold py-3 px-8 rounded-xl shadow-lg transition-all flex items-center ml-auto text-white
                                ${isSaving 
                                    ? 'bg-gray-400 cursor-not-allowed' 
                                    : 'bg-green-600 hover:bg-green-700 hover:shadow-xl'
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
                                    <Save className="w-5 h-5 mr-2"/> Guardar Configuración
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* --- SECCIÓN 2: CALENDARIO Y EXCEPCIONES --- */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* CALENDARIO */}
                <div className="lg:col-span-7 bg-white rounded-xl shadow-md border border-gray-200 p-6">
                    <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center">
                        <AlertCircle className="w-5 h-5 mr-2 text-orange-500"/> Calendario de Excepciones
                    </h2>
                    <div className="flex justify-center">
                        <Calendar onChange={onDateClick} value={date} tileClassName={tileClassName} className="w-full" />
                    </div>
                    <div className="flex flex-wrap gap-4 mt-4 text-xs justify-center pt-4 border-t">
                        <span className="flex items-center"><span className="w-3 h-3 bg-red-100 border border-red-300 mr-1 rounded"></span> Feriado</span>
                        <span className="flex items-center"><span className="w-3 h-3 bg-orange-100 border border-orange-300 mr-1 rounded"></span> Horario Continuo</span>
                        <span className="flex items-center"><span className="w-3 h-3 bg-white border border-gray-300 mr-1 rounded"></span> Día No Laboral</span>
                    </div>
                </div>

                {/* FORMULARIO EXCEPCIONES */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
                        <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase border-b pb-2">Configurar Excepción</h3>
                        <form onSubmit={handleAddDia} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Fecha Seleccionada</label>
                                <input type="date" className="border rounded p-2 w-full bg-gray-50 text-gray-700 font-medium" value={nuevoDia.fecha} onChange={e => setNuevoDia({...nuevoDia, fecha: e.target.value})} required/>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Tipo</label>
                                <select className="border rounded p-2 w-full bg-white" value={nuevoDia.tipo} onChange={e => setNuevoDia({...nuevoDia, tipo: e.target.value})}>
                                    <option value="Feriado">🔴 Feriado (Cerrado)</option>
                                    <option value="Horario Continuo">🟠 Horario Especial/Continuo</option>
                                </select>
                            </div>

                            {nuevoDia.tipo === 'Horario Continuo' && (
                                <div className="bg-orange-50 p-3 rounded border border-orange-100 animate-in fade-in">
                                    <p className="text-xs text-orange-800 font-bold mb-2">Horario Especial:</p>
                                    <div className="flex gap-2 items-center">
                                        <input type="time" className="border rounded p-1 w-full text-sm bg-white" value={nuevoDia.hora_apertura} onChange={e => setNuevoDia({...nuevoDia, hora_apertura: e.target.value})} />
                                        <span className="text-orange-400 font-bold">-</span>
                                        <input type="time" className="border rounded p-1 w-full text-sm bg-white" value={nuevoDia.hora_cierre} onChange={e => setNuevoDia({...nuevoDia, hora_cierre: e.target.value})} />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Descripción</label>
                                <input type="text" placeholder="" className="border rounded p-2 w-full" value={nuevoDia.descripcion} onChange={e => setNuevoDia({...nuevoDia, descripcion: e.target.value})}/>
                            </div>

                            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2.5 rounded hover:bg-blue-700 flex justify-center items-center shadow-lg transition-transform transform active:scale-95">
                                <Plus className="inline w-4 h-4 mr-2"/> Aplicar Excepción
                            </button>
                        </form>
                    </div>

                    {/* LISTA EXCEPCIONES */}
                    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5 flex-1 flex flex-col min-h-[200px]">
                        <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase flex justify-between items-center">
                            Eventos <span className="bg-gray-100 px-2 rounded-full text-xs">{diasEspeciales.length}</span>
                        </h3>
                        <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-1 max-h-[250px]">
                            {diasEspeciales.length === 0 ? (
                                <div className="text-center py-8 text-gray-400 text-sm italic">Sin eventos configurados.</div>
                            ) : (
                                diasEspeciales.map(dia => (
                                    <div key={dia.id} className="flex justify-between items-center p-3 border border-gray-100 rounded hover:bg-gray-50 transition-colors">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-sm text-gray-800">{new Date(dia.fecha).toLocaleDateString('es-ES', { timeZone: 'UTC' })}</span>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${dia.tipo === 'Feriado' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                                                    {dia.tipo === 'Feriado' ? 'Cerrado' : 'Especial'}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-0.5">
                                                {dia.descripcion}
                                            </div>
                                        </div>
                                        <button onClick={() => handleDeleteDia(dia.id)} className="text-gray-300 hover:text-red-500 p-1.5 rounded hover:bg-red-50 transition-colors">
                                            <Trash2 className="w-4 h-4"/>
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default HorarioConfigPage;