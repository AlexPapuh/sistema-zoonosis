import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  LayoutDashboard, Users, Dog, Stethoscope, Map, LogOut, FileText,
  Megaphone, Archive, CalendarDays, UserCircle, AlertTriangle,
  ChevronLeft, Menu, Clock, Globe
} from 'lucide-react';

const SidebarLink = ({ to, icon: Icon, text, isOpen }) => (
  <NavLink
    to={to}
    title={!isOpen ? text : ''} 
    className={({ isActive }) =>
      `flex items-center rounded-md py-2 text-gray-200 transition-colors duration-200 
      ${isActive ? 'bg-cyan-700' : 'hover:bg-cyan-800'}
      ${isOpen ? 'px-3 justify-start' : 'justify-center px-2'} 
      `
    }
  >
    <Icon className={`h-6 w-6 ${isOpen ? 'mr-3' : ''}`} />
    <span className={`transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'hidden opacity-0 w-0'}`}>
      {text}
    </span>
  </NavLink>
);

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user, logout } = useAuth();

  const isAdmin = user?.rol === 'Admin';
  const isVete = user?.rol === 'Veterinario';
  const isPropietario = user?.rol === 'Propietario';

  const renderSectionHeader = (title) => {
    if (isOpen) {
      return <p className="px-3 pt-4 pb-2 text-xs font-semibold uppercase text-cyan-400 truncate">{title}</p>;
    }
    return <div className="my-4 border-t border-cyan-800" title={title}></div>;
  };

  return (
    <div 
      className={`flex h-screen flex-col bg-cyan-900 text-white shadow-lg transition-all duration-300 
      ${isOpen ? 'w-64' : 'w-20'} 
      fixed left-0 top-0 z-50`} 
    >
      {/* --- Header --- */}
      <div className="flex items-center justify-between p-4 border-b border-cyan-800 h-20">
        <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'w-auto opacity-100' : 'w-0 opacity-0 hidden'}`}>
          <h1 className="text-2xl font-bold truncate">Zoonosis</h1>
          <p className="text-sm text-cyan-300 truncate">Potosí</p>
        </div>

        <button 
          onClick={toggleSidebar} 
          className="p-1 rounded hover:bg-cyan-800 text-cyan-300 focus:outline-none mx-auto"
        >
          {isOpen ? <ChevronLeft size={24} /> : <Menu size={24} />}
        </button>
      </div>
      
      {/* --- Navegación --- */}
      <nav className="flex-1 space-y-2 overflow-y-auto overflow-x-hidden px-3 py-4 custom-scrollbar">

      
        {/* --- Admin --- */}
        {isAdmin && (
          <>
            {renderSectionHeader("Administración")}
            <SidebarLink to="/admin/usuarios" icon={Users} text="Usuarios" isOpen={isOpen} />
            <SidebarLink to="/admin/reportes" icon={FileText} text="Reportes" isOpen={isOpen} />
            {/* CORREGIDO: Usamos SidebarLink para que se vea igual a los demás */}
            <SidebarLink to="/admin/servicios" icon={Globe} text="Portal Web" isOpen={isOpen} />
            <SidebarLink to="/admin/horarios" icon={Clock} text="Horarios" isOpen={isOpen} />
          </>
        )}

        {/* --- Gestión --- */}
        {(isAdmin || isVete) && (
          <>
            {renderSectionHeader("Gestión")}
            <SidebarLink to="/gestion/propietarios" icon={Users} text="Propietarios" isOpen={isOpen} />
            <SidebarLink to="/gestion/citas" icon={CalendarDays} text="Citas" isOpen={isOpen} />
            
            <SidebarLink to="/gestion/campanas" icon={Megaphone} text="Campañas" isOpen={isOpen} />
            <SidebarLink to="/gestion/inventario" icon={Archive} text="Inventario" isOpen={isOpen} />
            
            {isAdmin && (
                <SidebarLink to="/gestion/mapa-casos" icon={Map} text="Mapa de Casos" isOpen={isOpen} />
            )}
          </>
        )}

        {/* --- Veterinario --- */}
        {isVete && (
            <>
            {!isAdmin && renderSectionHeader("Consultas")} 
            <SidebarLink to="/gestion/tratamiento" icon={Stethoscope} text="Nueva Consulta" isOpen={isOpen} />
            </>
        )}

        {/* --- Propietario --- */}
        {isPropietario && (
          <>
            {renderSectionHeader("Mi Perfil")}
            <SidebarLink to="/propietario/mis-mascotas" icon={Dog} text="Mis Mascotas" isOpen={isOpen} />
            <SidebarLink to="/propietario/mis-citas" icon={CalendarDays} text="Mis Citas" isOpen={isOpen} />
            <SidebarLink to="/propietario/campanas" icon={Megaphone} text="Campañas" isOpen={isOpen} />
            <SidebarLink to="/propietario/mapa" icon={AlertTriangle} text="Animales Perdidos" isOpen={isOpen} />
          </>
        )}

      </nav>

      {/* --- Footer --- */}
      <div className="border-t border-cyan-800 p-4">
        <NavLink 
          to="/perfil" 
          className={`flex items-center rounded transition-colors cursor-pointer group mb-4
          ${isOpen ? 'hover:bg-cyan-800 p-2' : 'justify-center'}
          `}
          title={!isOpen ? "Ver Perfil" : ""}
        >
          <UserCircle className={`text-cyan-300 group-hover:text-cyan-200 ${isOpen ? 'h-10 w-10' : 'h-8 w-8'}`} />
          
          <div className={`ml-3 overflow-hidden transition-all duration-200 ${isOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 hidden'}`}>
            <p className="font-semibold truncate w-32">{user?.nombre}</p>
            <p className="text-xs text-cyan-300 group-hover:text-cyan-200">Ver Perfil</p>
          </div>
        </NavLink>

        <button
          onClick={logout}
          title={!isOpen ? "Cerrar Sesión" : ""}
          className={`flex w-full items-center rounded-md bg-red-600 text-gray-100 transition-colors duration-200 hover:bg-red-700
            ${isOpen ? 'px-3 py-2 justify-center' : 'p-2 justify-center'}
          `}
        >
          <LogOut className={`h-5 w-5 ${isOpen ? 'mr-3' : ''}`} />
          <span className={`${isOpen ? 'block' : 'hidden'}`}>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;