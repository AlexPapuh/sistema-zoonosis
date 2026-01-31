import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import propietarioService from '../../services/propietario.service.js';
import Swal from 'sweetalert2';
import { 
    Users, Phone, MapPin, Search, Plus, Edit, Trash2, 
    Dog, Mail, Lock, Camera, ArrowRight, CheckCircle, ChevronLeft, ChevronRight, XCircle
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const LocationPicker = ({ onLocationSelected, position }) => {
    useMapEvents({ click(e) { onLocationSelected(e.latlng); } });
    return position ? <Marker position={position} /> : null;
};

const razasPerro = ["Mestizo", "Labrador", "Pastor Alemán", "Golden", "Bulldog", "Poodle", "Chihuahua", "Husky", "Otro"];
const razasGato = ["Mestizo", "Persa", "Siamés", "Angora", "Maine Coon", "Sphynx", "Otro"];

const GestionPropietariosPage = () => {
  const navigate = useNavigate();
  const [propietarios, setPropietarios] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Obtener fecha de hoy para el max="YYYY-MM-DD"
  const today = new Date().toISOString().split('T')[0];

  // Filtros y Paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const [step, setStep] = useState(1); 

  const [ownerForm, setOwnerForm] = useState({
      nombre: '', email: '', password: '', telefono: '', direccion: '', latitud: '', longitud: ''
  });

  const [petsList, setPetsList] = useState([]);

  const [petForm, setPetForm] = useState({
      petNombre: '', 
      petEspecie: 'Perro', petEspecieOtro: '',  
      petRaza: 'Mestizo', petRazaOtro: '',     
      petSexo: 'Macho', petFecha: '', petFoto: null
  });
  const [previewImage, setPreviewImage] = useState(null);
  
  const [editingOwner, setEditingOwner] = useState(null);

  useEffect(() => {
    fetchPropietarios();
  }, []);

  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const fetchPropietarios = async () => {
    try {
      const data = await propietarioService.getAllPropietarios();
      setPropietarios(data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  
  const handleOwnerChange = (e) => setOwnerForm({ ...ownerForm, [e.target.name]: e.target.value });
  const handleMapClick = (latlng) => setOwnerForm({ ...ownerForm, latitud: latlng.lat, longitud: latlng.lng });

  const handlePetChange = (e) => {
      setPetForm({ ...petForm, [e.target.name]: e.target.value });
      if (e.target.name === 'petEspecie') {
          if (e.target.value === 'Perro' || e.target.value === 'Gato') {
              setPetForm(prev => ({ ...prev, petEspecie: e.target.value, petRaza: 'Mestizo', petEspecieOtro: '' }));
          } else {
              setPetForm(prev => ({ ...prev, petEspecie: 'Otro', petRaza: '', petEspecieOtro: '' }));
          }
      }
  };

  const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setPreviewImage(reader.result);
              setPetForm({ ...petForm, petFoto: reader.result });
          };
          reader.readAsDataURL(file);
      }
  };

  const handleAddPetToList = () => {
      if (!petForm.petNombre || !petForm.petFecha) {
          Swal.fire('Faltan datos', 'Ingresa al menos el nombre y la fecha de nacimiento de la mascota.', 'warning');
          return;
      }
      
      const finalEspecie = petForm.petEspecie === 'Otro' ? petForm.petEspecieOtro : petForm.petEspecie;
      const finalRaza = petForm.petEspecie === 'Otro' ? petForm.petRazaOtro : petForm.petRaza;

      if (!finalEspecie) {
          Swal.fire('Atención', 'Debes especificar la especie del animal.', 'warning');
          return;
      }

      const newPet = {
          nombre: petForm.petNombre,
          especie: finalEspecie,
          raza: finalRaza || 'Desconocida',
          sexo: petForm.petSexo,
          fecha_nacimiento: petForm.petFecha,
          foto: petForm.petFoto,
          tempId: Date.now() 
      };

      setPetsList([...petsList, newPet]);
      
      setPetForm({
        petNombre: '', petEspecie: 'Perro', petEspecieOtro: '', 
        petRaza: 'Mestizo', petRazaOtro: '', petSexo: 'Macho', petFecha: '', petFoto: null
      });
      setPreviewImage(null);
      
      const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
      Toast.fire({ icon: 'success', title: 'Mascota agregada a la lista' });
  };

  const handleRemovePetFromList = (tempId) => {
      setPetsList(petsList.filter(p => p.tempId !== tempId));
  };

  const handleNextStep = () => {
      if (!ownerForm.nombre || !ownerForm.email || !ownerForm.password || !ownerForm.telefono) {
          Swal.fire('Atención', 'Por favor completa los campos obligatorios del propietario', 'warning');
          return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(ownerForm.email)) {
          Swal.fire('Correo inválido', 'Por favor ingresa un correo electrónico válido (ej: usuario@email.com)', 'warning');
          return;
      }

      if (ownerForm.password.length < 6) {
          Swal.fire('Contraseña débil', 'La contraseña debe tener al menos 6 caracteres', 'warning');
          return;
      }

      setStep(2);
  };

  const handleSubmitAll = async () => {
      if (petsList.length === 0) {
          const result = await Swal.fire({
              title: '¿Sin mascotas?',
              text: "No has agregado ninguna mascota a la lista. ¿Deseas registrar solo al propietario?",
              icon: 'question',
              showCancelButton: true,
              confirmButtonText: 'Sí, registrar solo dueño',
              cancelButtonText: 'No, agregar mascota'
          });
          if (!result.isConfirmed) return;
      }

      const payload = {
          ...ownerForm,
          mascotas: petsList 
      };

      try {
          await propietarioService.createPropietario(payload);
          setShowCreateModal(false);
          resetForm();
          Swal.fire({
              icon: 'success',
              title: '¡Registro Completo!',
              text: `Propietario y ${petsList.length} mascota(s) registrados.`,
              timer: 2500,
              showConfirmButton: false
          });
          fetchPropietarios();
      } catch (error) {
          Swal.fire('Error', error.message || 'Error al crear', 'error');
      }
  };

  const resetForm = () => {
      setOwnerForm({ nombre: '', email: '', password: '', telefono: '', direccion: '', latitud: '', longitud: '' });
      setPetForm({ petNombre: '', petEspecie: 'Perro', petEspecieOtro: '', petRaza: 'Mestizo', petRazaOtro: '', petSexo: 'Macho', petFecha: '', petFoto: null });
      setPetsList([]);
      setPreviewImage(null);
      setStep(1);
  };

  const openEditModal = (owner) => { setEditingOwner({ ...owner }); setShowEditModal(true); };
  const handleEditChange = (e) => setEditingOwner({ ...editingOwner, [e.target.name]: e.target.value });
  const handleEditMapClick = (latlng) => setEditingOwner({ ...editingOwner, latitud: latlng.lat, longitud: latlng.lng });

  const handleUpdate = async (e) => {
      e.preventDefault();
      try {
          await propietarioService.updatePropietario(editingOwner.id, editingOwner);
          setShowEditModal(false);
          Swal.fire('Actualizado', 'Datos guardados', 'success');
          fetchPropietarios();
      } catch (error) { Swal.fire('Error', 'No se pudo actualizar', 'error'); }
  };

  const handleDelete = (id) => {
      Swal.fire({
          title: '¿Desactivar propietario?', text: "El usuario pasará a estado INACTIVO.", icon: 'warning',
          showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Sí, desactivar'
      }).then(async (result) => {
          if (result.isConfirmed) {
              try { await propietarioService.deletePropietario(id); Swal.fire('Desactivado', 'Propietario inactivo.', 'success'); fetchPropietarios(); } 
              catch (error) { Swal.fire('Error', 'No se pudo desactivar', 'error'); }
          }
      });
  };

  const filteredOwners = propietarios.filter(p => 
      p.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.email?.toLowerCase().includes(searchTerm.toLowerCase()) || p.telefono?.includes(searchTerm)
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOwners = filteredOwners.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOwners.length / itemsPerPage);
  const handlePageChange = (newPage) => { if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage); };

  if (loading) return <div className="p-10 text-center">Cargando...</div>;

  return (
    <div className="container mx-auto pb-10 px-4">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div><h1 className="text-3xl font-bold text-gray-800">Gestión de Propietarios</h1><p className="text-gray-500">Administra dueños y sus mascotas</p></div>
        <button onClick={() => { resetForm(); setShowCreateModal(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center shadow-md transition">
            <Plus size={20} className="mr-2"/> Nuevo Propietario
        </button>
      </div>

      {/* BUSCADOR */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="relative"><Search className="absolute left-3 top-3 text-gray-400" size={20} /><input type="text" placeholder="Buscar..." className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/></div>
      </div>

      {/* LISTA */}
      <div className="grid grid-cols-1 gap-4 mb-6">
          <div className="flex justify-between items-center"><h3 className="text-gray-500 font-medium">Propietarios ({filteredOwners.length})</h3><span className="text-xs text-gray-400">Página {currentPage} de {totalPages || 1}</span></div>
          {currentOwners.map(owner => (
              <div key={owner.id} className={`p-5 rounded-xl shadow-sm border flex flex-col md:flex-row items-center justify-between transition relative overflow-hidden ${owner.estado === 'Inactivo' ? 'bg-gray-100 border-gray-200 opacity-70 grayscale' : 'bg-white border-gray-100 hover:shadow-md'}`}>
                  {owner.estado === 'Inactivo' && <div className="absolute top-0 right-0 bg-gray-500 text-white text-[10px] uppercase font-bold px-2 py-1 rounded-bl-lg z-10">Inactivo</div>}
                  <div className="flex items-center gap-4 w-full md:w-1/2 mb-4 md:mb-0">
                      <div className={`h-14 w-14 rounded-full flex items-center justify-center font-bold text-xl border ${owner.estado === 'Inactivo' ? 'bg-gray-300 text-white border-gray-400' : 'bg-blue-100 text-blue-600 border-blue-200'}`}>{owner.nombre.charAt(0).toUpperCase()}</div>
                      <div>
                          <h3 className="font-bold text-gray-800 text-lg flex items-center">{owner.nombre}{owner.estado === 'Inactivo' && <Lock size={14} className="ml-2 text-gray-500"/>}</h3>
                          <div className="flex items-center text-sm text-gray-500 mb-1"><Mail size={14} className="mr-1"/> {owner.email}</div>
                          <div className="flex items-center text-sm text-gray-500"><Phone size={14} className="mr-1"/> {owner.telefono}</div>
                      </div>
                  </div>
                  <div className="w-full md:w-1/3 mb-4 md:mb-0 pl-0 md:pl-4 border-l-0 md:border-l border-gray-200">
                      <div className="text-sm text-gray-600 mb-1 flex items-center"><MapPin size={14} className="mr-1 text-green-500"/> {owner.direccion || 'Sin dirección'}</div>
                      <div className="inline-flex items-center px-2 py-1 bg-gray-100 rounded text-xs font-semibold text-gray-700"><Dog size={12} className="mr-1"/> {owner.total_mascotas || 0} Mascotas activas</div>
                  </div>
                  <div className="flex items-center gap-2">
                      <button onClick={() => navigate(`/gestion/propietario/${owner.id}/animales`)} className="p-2 text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition"><Dog size={20}/></button>
                      <button onClick={() => openEditModal(owner)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"><Edit size={20}/></button>
                      {owner.estado !== 'Inactivo' && <button onClick={() => handleDelete(owner.id)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"><Trash2 size={20}/></button>}
                  </div>
              </div>
          ))}
      </div>
      
      {/* PAGINACIÓN */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-6">
            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"><ChevronLeft size={20}/></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (<button key={number} onClick={() => handlePageChange(number)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${currentPage === number ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>{number}</button>))}
            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"><ChevronRight size={20}/></button>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 backdrop-blur-sm overflow-y-auto">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
             {/* Header */}
             <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                 <div><h2 className="text-xl font-bold text-gray-800">Nuevo Registro</h2><p className="text-xs text-gray-500">Paso {step} de 2: {step === 1 ? 'Datos del Propietario' : 'Mascotas'}</p></div>
                 <div className="flex gap-1"><div className={`h-2 w-8 rounded-full ${step === 1 ? 'bg-blue-600' : 'bg-green-500'}`}></div><div className={`h-2 w-8 rounded-full ${step === 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div></div>
             </div>

             <div className="p-6 overflow-y-auto flex-1">
                 {step === 1 ? (
                     <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div><label className="text-sm font-medium text-gray-700">Nombre Completo *</label><input type="text" name="nombre" className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500" value={ownerForm.nombre} onChange={handleOwnerChange}/></div>
                             <div><label className="text-sm font-medium text-gray-700">Correo Electrónico *</label><input type="email" name="email" className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500" value={ownerForm.email} onChange={handleOwnerChange}/></div>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div><label className="text-sm font-medium text-gray-700">Contraseña *</label><div className="relative"><Lock size={16} className="absolute left-3 top-3 text-gray-400"/><input type="password" name="password" className="w-full border rounded-lg pl-9 p-2 outline-none focus:ring-2 focus:ring-blue-500" value={ownerForm.password} onChange={handleOwnerChange}/></div></div>
                             <div><label className="text-sm font-medium text-gray-700">Teléfono *</label><input type="text" name="telefono" className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500" value={ownerForm.telefono} onChange={handleOwnerChange}/></div>
                         </div>
                         <div className="border-t pt-4">
                             <label className="text-sm font-medium text-gray-700 block mb-2">Ubicación Domicilio</label>
                             <input type="text" name="direccion" placeholder="Dirección escrita..." className="w-full border rounded-lg p-2 mb-2 outline-none focus:ring-2 focus:ring-blue-500" value={ownerForm.direccion} onChange={handleOwnerChange}/>
                             <div className="h-40 rounded-lg border overflow-hidden relative"><MapContainer center={[-19.5894, -65.7541]} zoom={14} style={{ height: '100%', width: '100%' }}><TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OSM' /><LocationPicker onLocationSelected={handleMapClick} position={ownerForm.latitud ? [ownerForm.latitud, ownerForm.longitud] : null} /></MapContainer></div>
                         </div>
                     </div>
                 ) : (
                     <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                         
                         <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                             <h3 className="font-bold text-blue-800 mb-3 flex items-center"><Plus size={18} className="mr-1"/> Agregar Mascota</h3>
                             <div className="flex items-start gap-4 mb-4">
                                <div className="h-20 w-20 bg-white rounded-lg border-2 border-dashed border-blue-300 flex items-center justify-center relative overflow-hidden group cursor-pointer flex-shrink-0">
                                    {previewImage ? <img src={previewImage} className="w-full h-full object-cover"/> : <Camera className="text-blue-300"/>}
                                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} />
                                </div>
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                                     <input type="text" name="petNombre" placeholder="Nombre Mascota *" className="w-full border rounded-lg p-2 text-sm" value={petForm.petNombre} onChange={handlePetChange}/>
                                     
                                     <input 
                                        type="date" 
                                        name="petFecha" 
                                        max={today} 
                                        className="w-full border rounded-lg p-2 text-sm" 
                                        value={petForm.petFecha} 
                                        onChange={handlePetChange}
                                     />

                                     <select name="petEspecie" className="w-full border rounded-lg p-2 text-sm" value={petForm.petEspecie} onChange={handlePetChange}>
                                         <option value="Perro">Perro</option><option value="Gato">Gato</option><option value="Otro">Otro</option>
                                     </select>
                                     {petForm.petEspecie === 'Otro' && <input type="text" name="petEspecieOtro" placeholder="Especifique..." className="w-full border rounded-lg p-2 text-sm" value={petForm.petEspecieOtro} onChange={handlePetChange}/>}
                                     <select name="petSexo" className="w-full border rounded-lg p-2 text-sm" value={petForm.petSexo} onChange={handlePetChange}>
                                         <option value="Macho">Macho</option><option value="Hembra">Hembra</option>
                                     </select>
                                     {petForm.petEspecie === 'Otro' ? <input type="text" name="petRazaOtro" placeholder="Raza/Tipo..." className="w-full border rounded-lg p-2 text-sm" value={petForm.petRazaOtro} onChange={handlePetChange}/> 
                                     : <select name="petRaza" className="w-full border rounded-lg p-2 text-sm" value={petForm.petRaza} onChange={handlePetChange}>{(petForm.petEspecie === 'Perro' ? razasPerro : razasGato).map(r => <option key={r} value={r}>{r}</option>)}</select>}
                                </div>
                             </div>
                             <button onClick={handleAddPetToList} className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-bold shadow">Agregar a la lista</button>
                         </div>

                         <div>
                             <h4 className="text-sm font-bold text-gray-700 mb-2">Mascotas en lista ({petsList.length})</h4>
                             {petsList.length === 0 ? (
                                 <div className="text-center py-4 bg-gray-50 rounded border border-dashed text-gray-400 text-sm">Aún no has agregado mascotas</div>
                             ) : (
                                 <div className="space-y-2 max-h-40 overflow-y-auto">
                                     {petsList.map((pet) => (
                                         <div key={pet.tempId} className="flex items-center justify-between bg-white p-2 rounded border shadow-sm">
                                             <div className="flex items-center gap-3">
                                                 <div className="h-10 w-10 bg-gray-200 rounded overflow-hidden">{pet.foto ? <img src={pet.foto} className="w-full h-full object-cover"/> : <Dog size={20} className="m-auto mt-2 text-gray-500"/>}</div>
                                                 <div><p className="font-bold text-sm">{pet.nombre}</p><p className="text-xs text-gray-500">{pet.especie} - {pet.raza}</p></div>
                                             </div>
                                             <button onClick={() => handleRemovePetFromList(pet.tempId)} className="text-red-500 hover:bg-red-50 p-1 rounded"><XCircle size={18}/></button>
                                         </div>
                                     ))}
                                 </div>
                             )}
                         </div>

                     </div>
                 )}
             </div>

             <div className="p-6 border-t bg-gray-50 flex justify-between">
                 <button onClick={() => { if(step===1) setShowCreateModal(false); else setStep(1); }} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition">{step === 1 ? 'Cancelar' : 'Atrás'}</button>
                 {step === 1 ? (
                     <button onClick={handleNextStep} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center shadow-md">Siguiente <ArrowRight size={18} className="ml-2"/></button>
                 ) : (
                     <button onClick={handleSubmitAll} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center shadow-md"><CheckCircle size={18} className="mr-2"/> Guardar Todo</button>
                 )}
             </div>
           </div>
        </div>
      )}

      {showEditModal && editingOwner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
             <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg relative">
                 <h2 className="text-xl font-bold mb-4 flex items-center"><Edit className="mr-2 text-blue-600"/> Editar Propietario</h2>
                 <form onSubmit={handleUpdate} className="space-y-3">
                     <div><label className="text-sm font-medium text-gray-700">Nombre (Solo lectura)</label><input type="text" className="w-full border bg-gray-100 rounded-lg p-2 text-gray-500" value={editingOwner.nombre} readOnly/></div>
                     <div><label className="text-sm font-medium text-gray-700">Teléfono</label><input type="text" name="telefono" className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500" value={editingOwner.telefono} onChange={handleEditChange}/></div>
                     <div><label className="text-sm font-medium text-gray-700">Dirección</label><input type="text" name="direccion" className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500" value={editingOwner.direccion} onChange={handleEditChange}/></div>
                     <div className="h-40 rounded-lg border overflow-hidden mt-2 relative">
                         <MapContainer center={editingOwner.latitud ? [editingOwner.latitud, editingOwner.longitud] : [-19.5894, -65.7541]} zoom={14} style={{ height: '100%', width: '100%' }}><TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OSM' /><LocationPicker onLocationSelected={handleEditMapClick} position={editingOwner.latitud ? [editingOwner.latitud, editingOwner.longitud] : null} /></MapContainer>
                     </div>
                     <div className="flex justify-end pt-3 gap-2">
                         <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancelar</button>
                         <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Guardar</button>
                     </div>
                 </form>
             </div>
          </div>
      )}

    </div>
  );
};

export default GestionPropietariosPage;