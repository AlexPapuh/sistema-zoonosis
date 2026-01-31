import React, { useState, useEffect } from 'react';

import userService from '../../services/user.service.js';

import Swal from 'sweetalert2';

import {

  Users, User, Stethoscope, Shield, Search,

  Plus, Edit, Trash2, Filter, ChevronLeft, ChevronRight, X, Save, Lock, MapPin

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



const GestionUsuariosPage = () => {

  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);

 

  const [searchTerm, setSearchTerm] = useState('');

  const [roleFilter, setRoleFilter] = useState('Todos');

  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 5;



  // Modales

  const [showEditModal, setShowEditModal] = useState(false);

  const [editingUser, setEditingUser] = useState(null);

  const [showCreateModal, setShowCreateModal] = useState(false);

  const [newUser, setNewUser] = useState({

      nombre: '', email: '', password: '', rol: 'Propietario', telefono: '', ci: '',

      direccion: '', latitud: '', longitud: ''

  });



  useEffect(() => {

    fetchUsers();

  }, []);



  useEffect(() => {

    setCurrentPage(1);

  }, [searchTerm, roleFilter]);



  const fetchUsers = async () => {

    try {

      const data = await userService.getAllUsers();

      setUsers(data);

    } catch (error) {

      console.error(error);

      Swal.fire('Error', 'No se pudieron cargar los usuarios', 'error');

    } finally {

      setLoading(false);

    }

  };



  // --- CREAR ---

  const handleCreateChange = (e) => setNewUser({ ...newUser, [e.target.name]: e.target.value });

  const handleMapClick = (latlng) => setNewUser({ ...newUser, latitud: latlng.lat, longitud: latlng.lng });



  const handleCreateUser = async (e) => {

      e.preventDefault();

      try {

          await userService.createUser(newUser);

          setShowCreateModal(false);

          setNewUser({ nombre: '', email: '', password: '', rol: 'Propietario', telefono: '', ci: '', direccion: '', latitud: '', longitud: '' });

          Swal.fire({ icon: 'success', title: 'Usuario Creado', text: 'El nuevo usuario ha sido registrado exitosamente.', timer: 2000, showConfirmButton: false });

          fetchUsers();

      } catch (error) {

          Swal.fire('Error', error.response?.data?.message || 'No se pudo crear el usuario', 'error');

      }

  };



  // --- ELIMINAR (DESACTIVAR) ---

  const handleDelete = (id) => {

    Swal.fire({

      title: '¿Desactivar usuario?',

      text: "El usuario pasará a estado INACTIVO y perderá acceso al sistema.",

      icon: 'warning',

      showCancelButton: true,

      confirmButtonColor: '#d33',

      confirmButtonText: 'Sí, desactivar',

      cancelButtonText: 'Cancelar'

    }).then(async (result) => {

      if (result.isConfirmed) {

        try {

          await userService.deleteUser(id);

          Swal.fire('Desactivado', 'El usuario ha sido desactivado.', 'success');

          fetchUsers();

        } catch (error) {

          Swal.fire('Error', 'No se pudo desactivar el usuario.', 'error');

        }

      }

    });

  };



  // --- EDITAR ---

  const openEditModal = (user) => { setEditingUser({ ...user }); setShowEditModal(true); };

  const handleEditChange = (e) => setEditingUser({ ...editingUser, [e.target.name]: e.target.value });

 

  const handleUpdateUser = async (e) => {

      e.preventDefault();

      try {

          await userService.updateUser(editingUser.id, editingUser);

          setShowEditModal(false);

          Swal.fire({ icon: 'success', title: 'Usuario actualizado', showConfirmButton: false, timer: 1500 });

          fetchUsers();

      } catch (error) {

          Swal.fire('Error', 'No se pudo actualizar el usuario', 'error');

      }

  };



  const filteredUsers = users.filter(user => {

    const matchesSearch = user.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || user.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'Todos' ? true : user.rol === roleFilter;

    return matchesSearch && matchesRole;

  });



  const indexOfLastItem = currentPage * itemsPerPage;

  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const handlePageChange = (newPage) => { if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage); };



  const getRoleBadge = (rol) => {

    switch(rol) {

      case 'Admin': return 'bg-purple-100 text-purple-700 border-purple-200';

      case 'Veterinario': return 'bg-blue-100 text-blue-700 border-blue-200';

      case 'Propietario': return 'bg-green-100 text-green-700 border-green-200';

      default: return 'bg-gray-100 text-gray-700';

    }

  };

  const getRoleIcon = (rol) => {

    switch(rol) {

      case 'Admin': return <Shield size={14} className="mr-1"/>;

      case 'Veterinario': return <Stethoscope size={14} className="mr-1"/>;

      case 'Propietario': return <User size={14} className="mr-1"/>;

      default: return null;

    }

  };



  if (loading) return <div className="p-10 text-center">Cargando gestión de usuarios...</div>;



  return (

    <div className="container mx-auto pb-10 px-4">

      {/* HEADER */}

      <div className="flex justify-between items-center mb-6">

        <div>

            <h1 className="text-3xl font-bold text-gray-800">Gestión de Usuarios</h1>

            <p className="text-gray-500">Administra los accesos y roles del sistema</p>

        </div>

        <button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center shadow-md transition transform hover:-translate-y-0.5">

            <Plus size={20} className="mr-2"/> Nuevo Usuario

        </button>

      </div>



      {/* KPI */}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">

         <StatCard label="Total Usuarios" count={users.length} icon={<Users size={24}/>} color="bg-gray-500" />

         <StatCard label="Propietarios" count={users.filter(u => u.rol === 'Propietario').length} icon={<User size={24}/>} color="bg-green-500" />

         <StatCard label="Veterinarios" count={users.filter(u => u.rol === 'Veterinario').length} icon={<Stethoscope size={24}/>} color="bg-blue-500" />

         <StatCard label="Administradores" count={users.filter(u => u.rol === 'Admin').length} icon={<Shield size={24}/>} color="bg-purple-500" />

      </div>



      {/* FILTROS */}

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">

        <div className="relative w-full md:w-96">

            <Search className="absolute left-3 top-3 text-gray-400" size={20} />

            <input type="text" placeholder="Buscar por nombre o email..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>

        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">

            <Filter size={20} className="text-gray-500"/>

            <select className="border border-gray-200 rounded-lg py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>

                <option value="Todos">Todos los roles</option>

                <option value="Propietario">Propietarios</option>

                <option value="Veterinario">Veterinarios</option>

                <option value="Admin">Administradores</option>

            </select>

        </div>

      </div>



      {/* LISTA */}

      <div className="space-y-4 mb-6">

        <div className="flex justify-between items-center"><h3 className="text-gray-500 font-medium">Usuarios Registrados ({filteredUsers.length})</h3><span className="text-xs text-gray-400">Página {currentPage} de {totalPages || 1}</span></div>

        {currentUsers.map(user => (

            <div

                key={user.id}

                className={`p-4 rounded-xl shadow-sm border flex flex-col md:flex-row items-start md:items-center justify-between transition relative overflow-hidden

                    ${user.estado === 'Inactivo'

                        ? 'bg-gray-100 border-gray-200 opacity-70 grayscale'

                        : 'bg-white border-gray-100 hover:shadow-md'}

                `}

            >

                {user.estado === 'Inactivo' && (

                    <div className="absolute top-0 right-0 bg-gray-500 text-white text-[10px] uppercase font-bold px-2 py-1 rounded-bl-lg z-10">Inactivo</div>

                )}



                <div className="flex items-center gap-4 w-full md:w-1/2">

                    <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg shadow-sm

                        ${user.estado === 'Inactivo' ? 'bg-gray-300 text-white' :

                          (user.rol === 'Admin' ? 'bg-purple-600 text-white' : user.rol === 'Veterinario' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white')}

                    `}>

                        {user.nombre.charAt(0).toUpperCase()}

                    </div>

                    <div>

                        <div className="flex items-center gap-2">

                            <h4 className="font-bold text-gray-800 text-lg flex items-center">

                                {user.nombre}

                                {user.estado === 'Inactivo' && <Lock size={14} className="ml-2 text-gray-500"/>}

                            </h4>

                            <span className={`px-2 py-0.5 rounded-md text-xs font-bold border flex items-center ${getRoleBadge(user.rol)}`}>{getRoleIcon(user.rol)} {user.rol}</span>

                        </div>

                        <p className="text-gray-500 text-sm">{user.email}</p>

                        <div className="text-xs text-gray-400 mt-1 flex gap-3">{user.telefono && <span>Tel: {user.telefono}</span>}{user.ci && <span>CI: {user.ci}</span>}</div>

                    </div>

                </div>

                <div className="flex items-center gap-3 mt-4 md:mt-0 w-full md:w-auto justify-end">

                    <button onClick={() => openEditModal(user)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg border border-transparent hover:border-blue-100 transition-all" title="Editar"><Edit size={18}/></button>

                   

                    {user.estado !== 'Inactivo' && (

                        <button onClick={() => handleDelete(user.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 transition-all" title="Desactivar"><Trash2 size={18}/></button>

                    )}

                </div>

            </div>

        ))}

      </div>



      {totalPages > 1 && (

        <div className="flex justify-center items-center space-x-2 mt-6">

            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"><ChevronLeft size={20} className="text-gray-600"/></button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (

                <button key={number} onClick={() => handlePageChange(number)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${currentPage === number ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>{number}</button>

            ))}

            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"><ChevronRight size={20} className="text-gray-600"/></button>

        </div>

      )}



      {showEditModal && editingUser && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">

           <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg relative animate-in fade-in zoom-in duration-200">

             <button onClick={() => setShowEditModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={24}/></button>

             <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center"><Edit className="mr-2 text-blue-600" size={24}/> Editar Usuario</h2>

             <form onSubmit={handleUpdateUser} className="space-y-4">

                <div><label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label><input type="text" name="nombre" className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" value={editingUser.nombre} onChange={handleEditChange} required/></div>

                <div><label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label><input type="email" name="email" className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" value={editingUser.email} onChange={handleEditChange} required/></div>

                <div className="grid grid-cols-2 gap-4">

                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Rol</label><select name="rol" className="w-full border rounded-lg p-2.5 bg-white" value={editingUser.rol} onChange={handleEditChange}><option value="Propietario">Propietario</option><option value="Veterinario">Veterinario</option><option value="Admin">Administrador</option></select></div>

                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label><input type="text" name="telefono" className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" value={editingUser.telefono || ''} onChange={handleEditChange}/></div>

                </div>

                <div className="flex justify-end pt-4 space-x-3"><button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancelar</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center shadow-md"><Save size={18} className="mr-2"/> Guardar Cambios</button></div>

             </form>

           </div>

        </div>

      )}



      {showCreateModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">

           <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in duration-200">

             <button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={24}/></button>

             <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center"><Plus className="mr-2 text-green-600" size={24}/> Nuevo Usuario</h2>

             <form onSubmit={handleCreateUser} className="space-y-3">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label><input type="text" name="nombre" className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 outline-none" value={newUser.nombre} onChange={handleCreateChange} required/></div>

                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label><input type="email" name="email" className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 outline-none" value={newUser.email} onChange={handleCreateChange} required/></div>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label><div className="relative"><Lock className="absolute left-3 top-3 text-gray-400" size={18}/><input type="password" name="password" className="w-full border rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-green-500 outline-none" value={newUser.password} onChange={handleCreateChange} required/></div></div>

                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Rol</label><select name="rol" className="w-full border rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-green-500" value={newUser.rol} onChange={handleCreateChange}><option value="Propietario">Propietario</option><option value="Veterinario">Veterinario</option><option value="Admin">Administrador</option></select></div>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label><input type="text" name="telefono" className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 outline-none" value={newUser.telefono} onChange={handleCreateChange}/></div>

                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Cédula Identidad</label><input type="text" name="ci" className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 outline-none" value={newUser.ci} onChange={handleCreateChange}/></div>

                </div>

                {newUser.rol === 'Propietario' && (

                    <div className="border-t pt-3 mt-2">

                         <h3 className="text-md font-bold text-gray-700 mb-2 flex items-center"><MapPin size={18} className="mr-2 text-blue-500"/> Ubicación del Domicilio</h3>

                         <div className="mb-2"><label className="block text-sm font-medium text-gray-700 mb-1">Dirección Escrita</label><input type="text" name="direccion" className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 outline-none" value={newUser.direccion} onChange={handleCreateChange}/></div>

                         <div className="h-40 w-full rounded-lg overflow-hidden border border-gray-300 relative z-0 shadow-sm">

                             <label className="absolute top-2 right-2 z-[1000] bg-white/90 px-2 py-1 text-xs font-bold rounded shadow text-gray-600 pointer-events-none">Haz clic en el mapa</label>

                             <MapContainer center={[-19.5894, -65.7541]} zoom={14} style={{ height: '100%', width: '100%' }}><TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OSM' /><LocationPicker onLocationSelected={handleMapClick} position={newUser.latitud ? [newUser.latitud, newUser.longitud] : null} /></MapContainer>

                         </div>

                         {newUser.latitud && (<p className="text-xs text-green-600 mt-1 font-semibold text-center">Coordenadas: {newUser.latitud.toFixed(5)}, {newUser.longitud.toFixed(5)}</p>)}

                    </div>

                )}

                <div className="flex justify-end pt-3 space-x-3"><button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancelar</button><button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center shadow-md"><Plus size={18} className="mr-2"/> Crear Usuario</button></div>

             </form>

           </div>

        </div>

      )}



    </div>

  );

};



const StatCard = ({ label, count, icon, color }) => (<div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between"><div><p className="text-gray-500 text-xs uppercase font-semibold">{label}</p><h3 className="text-2xl font-bold text-gray-800">{count}</h3></div><div className={`p-3 rounded-lg text-white ${color} shadow-md`}>{icon}</div></div>);



export default GestionUsuariosPage;