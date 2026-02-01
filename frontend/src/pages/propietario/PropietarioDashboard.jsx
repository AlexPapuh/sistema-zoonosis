import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx'; 
import { Dog, Calendar, MapPin, ChevronRight, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';

const PropietarioDashboard = () => {
  const { user } = useAuth();

  const cards = [
    {
      to: "/propietario/mis-mascotas",
      title: "Mis Mascotas",
      desc: "Historial médico y carnet de vacunas.",
      icon: Dog,
      color: "bg-blue-500",
      lightColor: "bg-blue-100 text-blue-600"
    },
    {
      to: "/propietario/mis-citas",
      title: "Mis Citas",
      desc: "Próximas visitas programadas.",
      icon: Calendar,
      color: "bg-purple-500",
      lightColor: "bg-purple-100 text-purple-600"
    },
    {
      to: "/propietario/mapa",
      title: "Animales Perdidos",
      desc: "Reportar o buscar mascotas cerca.",
      icon: MapPin,
      color: "bg-red-500",
      lightColor: "bg-red-100 text-red-600"
    },
    {
      to: "/propietario/campanas",
      title: "Campañas Activas",
      desc: "Vacunación gratuita en tu zona.",
      icon: Activity,
      color: "bg-emerald-500",
      lightColor: "bg-emerald-100 text-emerald-600"
    }
  ];
const handleSoporte = () => {
    Swal.fire({
      title: '<strong>Contacto Zoonosis</strong>',
      icon: 'info',
      html: `
        <div style="text-align: left; font-size: 0.95rem; line-height: 1.6;">
          <p class="mb-3">Para consultas, dudas o reportes, comunícate con nosotros:</p>
          
          <div style="background: #f0fdf4; padding: 10px; border-radius: 8px; margin-bottom: 8px; border: 1px solid #dcfce7;">
             <b>📞 Teléfono Zoonosis:</b> <br/>
             <a href="tel:26229922" style="color: #15803d; text-decoration: none; font-weight: bold; font-size: 1.1em;">
               2 6229922
             </a>
          </div>

          <div style="background: #eff6ff; padding: 10px; border-radius: 8px; border: 1px solid #dbeafe;">
             <b>📍 Dirección:</b> <br/>
             <span style="color: #1e40af; font-weight: 500;">
               Av. Highland Players casi esq. Av. Las Banderas
             </span>
          </div>
        </div>
      `,
      showCloseButton: true,
      focusConfirm: false,
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#111827',
    });
  };
  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* --- HERO HEADER --- */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-500 rounded-3xl p-8 mb-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            ¡Hola, {user.nombre}! 👋
          </h1>
          <p className="text-blue-100 text-lg opacity-90 max-w-2xl">
            Bienvenido a tu espacio en Zoonosis. Aquí puedes gestionar la salud de tus mascotas y colaborar con la comunidad.
          </p>
        </div>
        {/* Decoración de fondo */}
        <div className="absolute right-0 top-0 h-full w-1/3 bg-white/10 skew-x-12 transform translate-x-10"></div>
        <div className="absolute bottom-[-20px] left-20 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
      </div>

      {/* --- GRID DE OPCIONES --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-2">
        {cards.map((card, index) => (
          <Link 
            key={index} 
            to={card.to} 
            className="group relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            <div className={`w-14 h-14 rounded-2xl ${card.lightColor} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
               <card.icon size={28} strokeWidth={2.5} />
            </div>
            
            <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-indigo-600 transition-colors">
              {card.title}
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              {card.desc}
            </p>

            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
              <ChevronRight className="text-gray-300" />
            </div>
          </Link>
        ))}
      </div>

      {/* --- SECCIÓN INFORMATIVA --- */}
      <div className="mt-10 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mx-2 flex flex-col md:flex-row items-center justify-between">
         <div>
            <h4 className="font-bold text-gray-800 text-lg">¿Necesitas ayuda urgente?</h4>
            <p className="text-gray-500 text-sm">Nuestros veterinarios están disponibles para consultas de emergencia.</p>
         </div>
         <button 
            onClick={handleSoporte} 
            className="mt-4 md:mt-0 px-6 py-2 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors text-sm">
            Contactar Soporte
         </button>
      </div>
    </div>
  );
};
export default PropietarioDashboard;