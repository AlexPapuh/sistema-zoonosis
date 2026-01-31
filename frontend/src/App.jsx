import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx'; 

import Layout from './components/Layout'; 

// --- PÁGINAS PÚBLICAS ---
import WelcomePage from './pages/WelcomePage.jsx'; 
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import PublicCampanasPage from './pages/PublicCampanasPage.jsx';
import PublicCasosPage from './pages/PublicCasosPage'; 

import DashboardPage from './pages/DashboardPage.jsx'; 
import PerfilPage from './pages/PerfilPage.jsx';

// Admin
import GestionUsuariosPage from './pages/admin/GestionUsuariosPage.jsx'; 
import ReportesPage from './pages/admin/ReportesPage.jsx';
import HorarioConfigPage from './pages/admin/HorarioConfigPage';
import MapaCalorPage from './pages/admin/MapaCalorPage.jsx';
import GestionServiciosPage from './pages/admin/GestionServiciosPage';

// Gestión
import GestionAnimalesPage from './pages/gestion/GestionAnimalesPage.jsx';
import GestionPropietariosPage from './pages/gestion/GestionPropietariosPage.jsx';
import AnimalHistorialPage from './pages/gestion/AnimalHistorialPage.jsx';
import GestionCitasPage from './pages/gestion/GestionCitasPage.jsx';
import GestionCampanasPage from './pages/gestion/GestionCampanasPage.jsx';
import GestionInventarioPage from './pages/gestion/GestionInventarioPage.jsx';

// Propietario
import ReporteCasosPage from './pages/propietario/ReporteCasosPage.jsx';
import MisMascotasPage from './pages/propietario/MisMascotasPage.jsx';
import MisCitasPage from './pages/propietario/MisCitasPage.jsx';
import CampanasPropietarioPage from './pages/propietario/CampanasPropietarioPage.jsx';

// Veterinario
import TratamientoPage from './pages/veterinario/TratamientoPage.jsx';
import EjecucionCampanaPage from './pages/veterinario/EjecucionCampanaPage.jsx'; 

const RutaProtegida = ({ children }) => {
  const { isAuthenticated, loading } = useAuth(); 

  if (loading) return <div>Cargando...</div>;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

const HomePorRol = () => {
  const { user } = useAuth();

  if (!user) return <div>Cargando...</div>;

  if (user.rol === 'Admin') return <ReportesPage />;

  if (user.rol === 'Propietario') return <MisMascotasPage />;

  if (user.rol === 'Veterinario') return <GestionCitasPage />;

  return <DashboardPage />;
};

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Rutas Públicas */}
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <WelcomePage />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <RegisterPage />} />
      <Route path="/campanas-publicas" element={<PublicCampanasPage />} />
      <Route path="/reportes-publicos" element={<PublicCasosPage />} />
      
      {/* --- RUTA PRINCIPAL --- */}
      <Route path="/dashboard" element={
        <RutaProtegida>
           <HomePorRol />
        </RutaProtegida>
      } />

      <Route path="/perfil" element={<RutaProtegida><PerfilPage /></RutaProtegida>} />
      
      {/* --- Rutas Admin --- */}
      <Route path="/admin/usuarios" element={<RutaProtegida><GestionUsuariosPage /></RutaProtegida>} />
      <Route path="/admin/reportes" element={<RutaProtegida><ReportesPage /></RutaProtegida>} />
      <Route path="/admin/horarios" element={<RutaProtegida><HorarioConfigPage /></RutaProtegida>} />
      <Route path="/admin/mapa-calor" element={<MapaCalorPage />} /> 
      <Route path="/admin/servicios" element={<RutaProtegida><GestionServiciosPage /></RutaProtegida>} />

      {/* --- Rutas Gestión --- */}
      <Route path="/gestion/mapa-casos" element={<RutaProtegida><ReporteCasosPage /></RutaProtegida>} />
      <Route path="/gestion/animales" element={<RutaProtegida><GestionAnimalesPage /></RutaProtegida>} />
      <Route path="/gestion/propietario/:id/animales" element={<RutaProtegida><GestionAnimalesPage /></RutaProtegida>} />
      <Route path="/gestion/propietarios" element={<RutaProtegida><GestionPropietariosPage /></RutaProtegida>} />
      <Route path="/gestion/animal/:id/historial" element={<RutaProtegida><AnimalHistorialPage /></RutaProtegida>} />
      <Route path="/gestion/citas" element={<RutaProtegida><GestionCitasPage /></RutaProtegida>} />
      <Route path="/gestion/campanas" element={<RutaProtegida><GestionCampanasPage /></RutaProtegida>} />
      <Route path="/gestion/inventario" element={<RutaProtegida><GestionInventarioPage /></RutaProtegida>} />

      {/* --- Rutas Propietario --- */}
      <Route path="/propietario/mapa" element={<RutaProtegida><ReporteCasosPage /></RutaProtegida>} />
      <Route path="/propietario/mis-mascotas" element={<RutaProtegida><MisMascotasPage /></RutaProtegida>} />
      <Route path="/propietario/mis-citas" element={<RutaProtegida><MisCitasPage /></RutaProtegida>} />       
      <Route path="/propietario/campanas" element={<RutaProtegida><CampanasPropietarioPage /></RutaProtegida>} />
      <Route path="/propietario/mascota/:id/historial" element={<RutaProtegida><AnimalHistorialPage /></RutaProtegida>} />

      {/* --- Rutas Veterinario --- */}
      <Route path="/gestion/campana/:id/ejecucion" element={<RutaProtegida><EjecucionCampanaPage /></RutaProtegida>} />
      <Route path="/gestion/tratamiento" element={<RutaProtegida><TratamientoPage /></RutaProtegida>} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;