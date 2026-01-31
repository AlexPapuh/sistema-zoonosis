import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, FileText, MoreVertical, Camera, AlertTriangle, HeartCrack, Check } from 'lucide-react';

const PetCard = ({ mascota, onVerifyQR, onHistory, onAction }) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const imageUrl = mascota.foto || '/placeholder-paw.png'; 

  return (
    <div className={`bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-all flex flex-col relative ${mascota.estado === 'Perdida' ? 'ring-2 ring-orange-400' : ''} ${mascota.estado === 'Deceso' ? 'opacity-75 grayscale' : ''}`}>
      
      {/* --- 1. MENÚ DE ACCIONES (Kebab) --- */}
      <div className="absolute top-2 right-2 z-10" ref={menuRef}>
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-full bg-white/90 hover:bg-gray-100 text-gray-600 shadow-sm transition-colors"
          >
            <MoreVertical size={20} />
          </button>
  
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-xl z-20 border border-gray-100 py-1 text-left animate-in fade-in zoom-in duration-200">
              <button 
                  onClick={() => { setShowMenu(false); onAction('photo', mascota); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
              >
                <Camera size={16} className="mr-2 text-blue-500"/> Cambiar Foto
              </button>
              
              {mascota.estado !== 'Perdida' && mascota.estado !== 'Deceso' && (
                  <button 
                    onClick={() => { setShowMenu(false); onAction('status_perdida', mascota); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 flex items-center"
                  >
                    <AlertTriangle size={16} className="mr-2 text-orange-500"/> Reportar Pérdida
                  </button>
              )}

              {mascota.estado === 'Perdida' && (
                  <button 
                    onClick={() => { setShowMenu(false); onAction('status_encontrada', mascota); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 flex items-center"
                  >
                    <Check size={16} className="mr-2 text-green-500"/> Marcar Encontrada
                  </button>
              )}
              
              {mascota.estado !== 'Deceso' && (
                  <button 
                    onClick={() => { setShowMenu(false); onAction('status_deceso', mascota); }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center border-t border-gray-100"
                  >
                    <HeartCrack size={16} className="mr-2"/> Reportar Deceso
                  </button>
              )}
            </div>
          )}
        </div>


      {/* --- Contenido Principal --- */}
      <div className="flex p-4 items-start">
        {/* Foto */}
        <div className="h-24 w-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden mr-4 border border-gray-200 relative shadow-inner">
          <img 
            src={imageUrl} 
            alt={mascota.nombre} 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Datos */}
        <div className="flex-1 min-w-0">
            {mascota.estado === 'Perdida' && <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-0.5 rounded mb-1 inline-block">⚠️ Perdida</span>}
            {mascota.estado === 'Deceso' && <span className="bg-gray-200 text-gray-700 text-xs font-medium px-2 py-0.5 rounded mb-1 inline-block">✝️ Fallecida</span>}

          <h3 className="text-xl font-bold text-gray-800 truncate">{mascota.nombre}</h3>
          <p className="text-sm text-blue-600 font-semibold uppercase">{mascota.especie} - {mascota.raza}</p>
          <p className="text-sm text-gray-500">{mascota.sexo}</p>
          {/* Si tienes una función calcularEdad, úsala aquí, sino muestra mascota.edad */}
          <p className="text-sm text-gray-500">{mascota.edad} años</p> 
        </div>
      </div>

      {/* --- FOOTER BOTONES (Corregido con tu lógica de deshabilitar) --- */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-between mt-auto">
             
             <button 
               onClick={() => mascota.estado !== 'Deceso' && onVerifyQR(mascota)}
               disabled={mascota.estado === 'Deceso'}
               className={`flex-1 flex justify-center items-center text-sm font-medium transition-colors py-1 border-r border-gray-200
                 ${mascota.estado === 'Deceso' 
                    ? 'text-gray-300 cursor-not-allowed' 
                    : 'text-gray-600 hover:text-blue-600'
                 }
               `}
               title={mascota.estado === 'Deceso' ? "No disponible" : "Ver Código QR"}
             >
               <QrCode className="h-4 w-4 mr-2" /> QR
             </button>
             
             <button 
                onClick={() => onHistory(mascota.id)}
                className="flex-1 flex justify-center items-center text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors py-1"
             >
               <FileText className="h-4 w-4 mr-2" /> Historial
             </button>
        </div>
    </div>
  );
};

export default PetCard;