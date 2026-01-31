import React, { useState, useEffect } from 'react';
import publicService from '../../services/public.service';
import Swal from 'sweetalert2';
import { 
    Plus, Edit, Trash2, X, Save, 
    ShieldCheck, Heart, Stethoscope, Search, Phone, 
    CreditCard, BookOpen, PawPrint, AlertTriangle, Info, Megaphone,
    Syringe, Dog, Cat, Activity, Pill, Globe, Check
} from 'lucide-react';

// LISTA DE ICONOS
const iconList = [
    { name: 'Heart', icon: Heart },
    { name: 'Stethoscope', icon: Stethoscope },
    { name: 'Search', icon: Search },
    { name: 'CreditCard', icon: CreditCard },
    { name: 'BookOpen', icon: BookOpen },
    { name: 'Phone', icon: Phone },
    { name: 'ShieldCheck', icon: ShieldCheck },
    { name: 'PawPrint', icon: PawPrint },
    { name: 'Syringe', icon: Syringe },
    { name: 'Dog', icon: Dog },
    { name: 'Cat', icon: Cat },
    { name: 'Activity', icon: Activity },
    { name: 'Pill', icon: Pill },
    { name: 'Megaphone', icon: Megaphone },
    { name: 'AlertTriangle', icon: AlertTriangle },
    { name: 'Info', icon: Info }
];

const colorOptions = [
    { id: 'blue', bg: 'bg-blue-500', ring: 'ring-blue-500', text: 'text-blue-600', light: 'bg-blue-50' },
    { id: 'red', bg: 'bg-red-500', ring: 'ring-red-500', text: 'text-red-600', light: 'bg-red-50' },
    { id: 'green', bg: 'bg-green-500', ring: 'ring-green-500', text: 'text-green-600', light: 'bg-green-50' },
    { id: 'purple', bg: 'bg-purple-500', ring: 'ring-purple-500', text: 'text-purple-600', light: 'bg-purple-50' },
    { id: 'yellow', bg: 'bg-yellow-500', ring: 'ring-yellow-500', text: 'text-yellow-600', light: 'bg-yellow-50' },
    { id: 'indigo', bg: 'bg-indigo-500', ring: 'ring-indigo-500', text: 'text-indigo-600', light: 'bg-indigo-50' },
    { id: 'orange', bg: 'bg-orange-500', ring: 'ring-orange-500', text: 'text-orange-600', light: 'bg-orange-50' },
    { id: 'gray', bg: 'bg-gray-500', ring: 'ring-gray-500', text: 'text-gray-600', light: 'bg-gray-50' }
];

const GestionServiciosPage = () => {
    const [servicios, setServicios] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    
    const [form, setForm] = useState({
        id: null, titulo: '', descripcion: '', icono: 'Heart', color: 'blue', activo: 1
    });

    const cargarDatos = async () => {
        try {
            const data = await publicService.getServicios();
            setServicios(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            setServicios([]);
        }
    };

    useEffect(() => { cargarDatos(); }, []);

    const handleOpenCreate = () => {
        setForm({ id: null, titulo: '', descripcion: '', icono: 'Heart', color: 'blue', activo: 1 });
        setIsEditing(false);
        setShowModal(true);
    };

    const handleOpenEdit = (servicio) => {
        setForm(servicio);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await publicService.updateServicio(form.id, form);
                Swal.fire('¡Actualizado!', 'Servicio modificado', 'success');
            } else {
                await publicService.createServicio(form);
                Swal.fire('¡Creado!', 'Nuevo servicio agregado', 'success');
            }
            setShowModal(false);
            cargarDatos();
        } catch (error) {
            Swal.fire('Error', 'No se pudo guardar', 'error');
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: '¿Eliminar?', text: "Desaparecerá del portal público.", icon: 'warning',
            showCancelButton: true, confirmButtonText: 'Sí, eliminar', confirmButtonColor: '#ef4444'
        });
        if (result.isConfirmed) {
            await publicService.deleteServicio(id);
            cargarDatos();
            Swal.fire('Eliminado', '', 'success');
        }
    };

    const renderIcon = (iconName, className = "w-6 h-6") => {
        const item = iconList.find(i => i.name === iconName);
        const IconComponent = (item && item.icon) ? item.icon : Info;
        return <IconComponent className={className} />;
    };

    const getCurrentColorStyle = (colorName) => {
        return colorOptions.find(c => c.id === colorName) || colorOptions[0];
    };

    return (
        <div className="container mx-auto p-6 font-sans">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center">
                        <Globe className="mr-2 text-blue-600 w-7 h-7"/> Gestión del Portal Web
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Configura los servicios que ven los ciudadanos</p>
                </div>
                <button onClick={handleOpenCreate} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg shadow-md hover:bg-blue-700 transition-all flex items-center font-bold text-sm">
                    <Plus className="w-5 h-5 mr-2"/> Agregar Servicio
                </button>
            </div>

            {/* GRID DE TARJETAS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {servicios.map((serv) => {
                    const style = getCurrentColorStyle(serv.color);
                    return (
                        <div key={serv.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-lg transition-all relative group">
                            <div className="flex justify-between items-start mb-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${style.light} ${style.text}`}>
                                    {renderIcon(serv.icono, "w-5 h-5")}
                                </div>
                                {!serv.activo && <span className="bg-gray-100 text-gray-500 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border border-gray-200">Oculto</span>}
                            </div>
                            
                            <h3 className="font-bold text-slate-800 text-base mb-1 line-clamp-1">{serv.titulo}</h3>
                            <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 min-h-[2.5em]">{serv.descripcion}</p>

                            <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm p-1 rounded-lg">
                                <button onClick={() => handleOpenEdit(serv)} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-md transition-colors"><Edit className="w-4 h-4"/></button>
                                <button onClick={() => handleDelete(serv.id)} className="p-1.5 hover:bg-red-50 text-red-600 rounded-md transition-colors"><Trash2 className="w-4 h-4"/></button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* MODAL COMPACTO */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
                        
                        <div className="w-full md:w-1/2 p-6 overflow-y-auto custom-scrollbar">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-slate-800">{isEditing ? 'Editar Servicio' : 'Crear Servicio'}</h2>
                                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100">
                                    <X className="w-5 h-5"/>
                                </button>
                            </div>
                            
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Título del Servicio</label>
                                    <input 
                                        type="text" 
                                        required 
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                                        value={form.titulo} 
                                        onChange={e => setForm({...form, titulo: e.target.value})} 
                                        placeholder="" 
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Descripción Corta</label>
                                    <textarea 
                                        required 
                                        rows="3" 
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all" 
                                        value={form.descripcion} 
                                        onChange={e => setForm({...form, descripcion: e.target.value})} 
                                        placeholder="Breve descripción para el público..." 
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase">Color del Tema</label>
                                    <div className="flex flex-wrap gap-2">
                                        {colorOptions.map((c) => (
                                            <button 
                                                type="button"
                                                key={c.id} 
                                                onClick={() => setForm({...form, color: c.id})}
                                                className={`w-7 h-7 rounded-full ${c.bg} transition-transform hover:scale-110 flex items-center justify-center ${form.color === c.id ? `ring-2 ring-offset-2 ${c.ring}` : ''}`}
                                            >
                                                {form.color === c.id && <Check className="w-3.5 h-3.5 text-white"/>}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase">Icono</label>
                                    <div className="grid grid-cols-8 gap-2 max-h-32 overflow-y-auto p-2 border border-slate-200 rounded-lg bg-slate-50 custom-scrollbar">
                                        {iconList.map((item) => {
                                            const Icon = item.icon || Info;
                                            return (
                                                <div 
                                                    key={item.name} 
                                                    onClick={() => setForm({...form, icono: item.name})}
                                                    className={`cursor-pointer p-1.5 rounded-md flex justify-center items-center transition-all aspect-square ${form.icono === item.name ? 'bg-blue-600 text-white shadow-md scale-105' : 'bg-white text-slate-400 hover:bg-blue-100 hover:text-blue-600'}`}
                                                    title={item.name}
                                                >
                                                    <Icon className="w-5 h-5"/>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                    <input 
                                        type="checkbox" 
                                        id="activo" 
                                        checked={Boolean(form.activo)} 
                                        onChange={e => setForm({...form, activo: e.target.checked ? 1 : 0})} 
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                                    />
                                    <label htmlFor="activo" className="text-sm font-medium text-slate-700 cursor-pointer select-none">Mostrar en página principal</label>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button 
                                        type="button" 
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 px-4 py-2.5 rounded-lg font-bold border border-slate-300 text-slate-600 hover:bg-slate-50 text-sm transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-lg font-bold hover:bg-blue-700 shadow-md hover:shadow-lg transition-all flex justify-center items-center text-sm"
                                    >
                                        <Save className="w-4 h-4 mr-2"/> Guardar
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div className="hidden md:flex w-1/2 bg-slate-100 p-8 flex-col justify-center items-center border-l border-slate-200 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

                            <h3 className="text-slate-400 font-bold uppercase tracking-widest mb-8 text-xs z-10">Vista Previa</h3>
                            
                            <div className="w-full max-w-[280px] bg-white p-6 rounded-2xl shadow-xl border border-slate-100 transform transition-all duration-300 z-10">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${getCurrentColorStyle(form.color).light} ${getCurrentColorStyle(form.color).text} transition-colors duration-300`}>
                                    {renderIcon(form.icono, "w-6 h-6")}
                                </div>
                                <h3 className="font-bold text-slate-800 text-lg mb-2 leading-tight">{form.titulo || "Título del Servicio"}</h3>
                                <p className="text-slate-500 leading-relaxed text-sm">
                                    {form.descripcion || "Descripción del servicio..."}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GestionServiciosPage;