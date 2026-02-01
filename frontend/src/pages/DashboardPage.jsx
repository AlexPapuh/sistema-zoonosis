import React from 'react';
import { useAuth } from '../context/AuthContext.jsx'; 
import { Navigate } from 'react-router-dom'; 
import VeteDashboard from './veterinario/VeteDashboard.jsx';
import PropietarioDashboard from './propietario/PropietarioDashboard.jsx';

const DashboardPage = () => {
  const { user } = useAuth();

  if (!user) {
    return <div className="p-10 text-center text-gray-500">Cargando perfil...</div>;
  }

  switch (user.rol) {
    case 'Admin':
 
      return <Navigate to="/dashboard/reportes" replace />;

    case 'Veterinario':
      return <VeteDashboard />;

    case 'Propietario':
      return <PropietarioDashboard />;

    default:
      return (
        <div className="flex items-center justify-center h-full p-10">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error de Acceso: </strong>
            <span className="block sm:inline">Tu usuario tiene un rol desconocido ({user.rol}). Contacta soporte.</span>
          </div>
        </div>
      );
  }
};

export default DashboardPage;