import React from 'react';
import { useAuth } from '../context/AuthContext.jsx'; 
import AdminDashboard from './admin/AdminDashboard.jsx';
import VeteDashboard from './veterinario/VeteDashboard.jsx';
import PropietarioDashboard from './propietario/PropietarioDashboard.jsx';


 
const DashboardPage = () => {
  const { user } = useAuth();

  switch (user?.rol) {
    case 'Admin':
      return <AdminDashboard />;
    case 'Veterinario':
      return <VeteDashboard />;
    case 'Propietario':
      return <PropietarioDashboard />;
    default:
      return <div className="text-red-500">Error: Rol de usuario desconocido.</div>;
  }
};

export default DashboardPage;