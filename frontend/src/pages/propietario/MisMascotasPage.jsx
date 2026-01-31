import React, { useState, useEffect, useRef } from 'react';
import animalService from '../../services/animal.service.js';
import authService from '../../services/auth.service.js';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Dog, QrCode, FileText, X, Camera, Download, Globe, Type, 
  MoreVertical, AlertTriangle, HeartCrack, Check, Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import QRCode from 'qrcode'; 
import Swal from 'sweetalert2'; 

const razasPerro = ["Mestizo", "Labrador", "Pastor Alemán", "Husky", "Golden Retriever", "Chihuahua", "Bulldog", "Poodle", "Otro"];
const razasGato = ["Mestizo", "Persa", "Siamés", "Angora", "Maine Coon", "Sphynx", "Otro"];

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer)
    toast.addEventListener('mouseleave', Swal.resumeTimer)
  }
});

const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return 'Edad desconocida';
  const hoy = new Date();
  const cumple = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - cumple.getFullYear();
  const m = hoy.getMonth() - cumple.getMonth();
  
  if (m < 0 || (m === 0 && hoy.getDate() < cumple.getDate())) {
    edad--;
  }
  
  if (edad < 0) return 'Recién nacido';
  if (edad === 0) {
      let meses = (hoy.getFullYear() - cumple.getFullYear()) * 12;
      meses -= cumple.getMonth();
      meses += hoy.getMonth();
      if (hoy.getDate() < cumple.getDate()) meses--;
      return meses <= 0 ? 'Menos de 1 mes' : `${meses} meses`;
  }
  
  return `${edad} año${edad > 1 ? 's' : ''}`;
};

 
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
  
        <div className="p-6 flex items-start">
            <div className="h-24 w-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden mr-5 border border-gray-200 relative shadow-inner">
                <img src={imageUrl} alt={mascota.nombre} className="h-full w-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
                {mascota.estado === 'Perdida' && <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-0.5 rounded mb-1 inline-flex items-center"><AlertTriangle size={10} className="mr-1"/> PERDIDA</span>}
                {mascota.estado === 'Deceso' && <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-0.5 rounded mb-1 inline-flex items-center">✝️ FALLECIDA</span>}

                <h2 className="text-2xl font-bold text-gray-800 truncate">{mascota.nombre}</h2>
                <p className="text-blue-600 font-medium text-sm uppercase tracking-wide mt-1">{mascota.especie} - {mascota.raza}</p>
                <p className="text-gray-500 text-sm mt-1 flex flex-col">
                    <span>{mascota.sexo}</span>
                    <span className="font-semibold text-gray-700 mt-1">
                        {calcularEdad(mascota.fecha_nacimiento)}
                    </span>
                </p>
            </div>
        </div>
        
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


const MisMascotasPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate(); 
  const [mascotas, setMascotas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  const [selectedPet, setSelectedPet] = useState(null);
  const [newStatus, setNewStatus] = useState(null); 
  
  const [previewImage, setPreviewImage] = useState(null);
  const [newPhotoFile, setNewPhotoFile] = useState(null); 

  const [selectedQR, setSelectedQR] = useState(null);
  const [qrType, setQrType] = useState('web'); 
  const [currentAnimalData, setCurrentAnimalData] = useState(null);

  useEffect(() => {
    fetchMascotas();
  }, []);

  const fetchMascotas = async () => {
    try {
      setLoading(true);
      const data = await animalService.getMisMascotas();
      setMascotas(data);
    } catch (error) {
      console.error("Error cargando mascotas", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToHistory = (id) => {
    navigate(`/propietario/mascota/${id}/historial`);
  };

  const handleCardAction = (action, pet) => {
      setSelectedPet(pet);
      
      if (action === 'photo') {
          setPreviewImage(pet.foto); 
          setNewPhotoFile(null);
          setShowPhotoModal(true);
      } else if (action === 'status_perdida') {
          setNewStatus('Perdida');
          setShowStatusModal(true);
      } else if (action === 'status_deceso') {
          setNewStatus('Deceso');
          setShowStatusModal(true);
      } else if (action === 'status_encontrada') {
          setNewStatus('Activo'); 
          setShowStatusModal(true);
      }
  };

  const handleFileChange = (e, isEdit = false) => {
      const file = e.target.files[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              if (isEdit) {
                  setPreviewImage(reader.result);
                  setNewPhotoFile(reader.result);
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSubmitPhoto = async () => {
    if (!newPhotoFile) {
        closeModals();
        return;
    }
    try {
        const token = authService.getCurrentUser().token;
        await axios.put(`http://localhost:5000/api/animales/${selectedPet.id}`, {
            foto: newPhotoFile
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        closeModals();
        Toast.fire({icon: 'success', title: 'Foto actualizada'});
        fetchMascotas();
    } catch (error) {
        Swal.fire({icon: 'error', title: 'Error', text: 'No se pudo subir la foto.'});
    }
  };

  const handleSubmitStatus = async () => {
      try {
        const token = authService.getCurrentUser().token;
        await axios.put(`http://localhost:5000/api/animales/${selectedPet.id}`, {
            estado: newStatus
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        closeModals();

        let titleMsg = `Estado actualizado a: ${newStatus}`;
        let iconType = 'success';
        if (newStatus === 'Perdida') {
            titleMsg = 'Alerta de pérdida generada';
            iconType = 'warning';
        } else if (newStatus === 'Deceso') {
            titleMsg = 'Registro archivado';
            iconType = 'info';
        }

        Swal.fire({
            icon: iconType,
            title: titleMsg,
            showConfirmButton: false,
            timer: 2500
        });

        fetchMascotas();
      } catch (error) {
        Swal.fire({icon: 'error', title: 'Error', text: 'No se pudo cambiar el estado.'});
      }
  };

  const closeModals = () => {
      setShowPhotoModal(false);
      setShowStatusModal(false);
      setShowQRModal(false);
      setPreviewImage(null);
      setSelectedPet(null);
      setNewStatus(null);
  };

  const handleVerQR = async (mascota) => {
      if (mascota.estado === 'Deceso') return;

      setCurrentAnimalData(mascota);
      setQrType('web'); 
      await generateWebQR(mascota);
      setShowQRModal(true);
  };

  const generateWebQR = async (mascota) => {
    try {
        const data = await animalService.getAnimalQR(mascota.id);
        setSelectedQR({
            img: data.qrDataUrl,
            nombre: mascota.nombre,
            tipo: 'Enlace Web'
        });
    } catch (error) {
        Swal.fire({icon: 'error', title: 'Error', text: 'No se pudo generar el QR'});
    }
  };

  const generateTextQR = async (mascota) => {
      try {
        const nombreDueno = mascota.propietario_nombre || "No registrado";
        const telefonoDueno = mascota.propietario_telefono || "No registrado";
        const texto = `Mascota: ${mascota.nombre}\nEspecie: ${mascota.especie} (${mascota.raza})\nSexo: ${mascota.sexo}\n\nPropietario: ${nombreDueno}\nTeléfono: ${telefonoDueno}\n\nSi me encuentras, por favor ayúdame a volver a casa.`;
        
        const url = await QRCode.toDataURL(texto);
        setSelectedQR({
            img: url,
            nombre: mascota.nombre,
            tipo: 'Información de Texto (Offline)'
        });
      } catch (error) {
          Swal.fire({icon: 'error', title: 'Error', text: 'No se pudo generar el QR'});
      }
  };

  useEffect(() => {
      if (showQRModal && currentAnimalData) {
          if (qrType === 'web') {
              generateWebQR(currentAnimalData);
          } else {
              generateTextQR(currentAnimalData);
          }
      }
  }, [qrType]);

  const downloadQR = () => {
      if (!selectedQR) return;
      const link = document.createElement('a');
      link.href = selectedQR.img;
      link.download = `QR-${selectedQR.nombre}-${qrType}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };


  if (loading) return <div className="text-center p-10">Cargando tus mascotas...</div>;

  return (
    <div className="container mx-auto pb-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-4xl font-bold text-gray-800">Mis Mascotas</h1>
      </div>

      {mascotas.length === 0 ? (
        <div className="bg-white p-10 rounded-xl shadow-sm border border-gray-200 text-center max-w-2xl mx-auto mt-10">
            <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
                <Dog className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">¡Bienvenido a Zoonosis Potosí!</h2>
            <p className="text-gray-600 text-lg mb-6">
                Para garantizar la seguridad y veracidad de los datos, el registro de nuevas mascotas se realiza <strong>únicamente de forma presencial</strong>.
            </p>
            
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 text-left text-sm text-blue-800 rounded">
                <p className="font-bold flex items-center mb-1">
                    <Info className="w-4 h-4 mr-2"/> ¿Cómo registro a mi mascota?
                </p>
                <p>Acércate a las oficinas de <strong>Zoonosis</strong> o visita a un <strong>veterinario autorizado</strong> en tu próxima consulta para que la den de alta en el sistema.</p>
            </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mascotas.map(mascota => (
                <PetCard 
                    key={mascota.id} 
                    mascota={mascota}
                    onVerifyQR={handleVerQR}
                    onHistory={handleNavigateToHistory}
                    onAction={handleCardAction}
                />
            ))}
        </div>
      )}

  
      {showPhotoModal && selectedPet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md relative">
             <button onClick={closeModals} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"><X size={24}/></button>
             <h2 className="text-xl font-bold mb-4 flex items-center"><Camera className="mr-2 text-blue-500"/> Cambiar Foto de {selectedPet.nombre}</h2>
             
             <div className="mb-4 text-center">
                <div className="w-40 h-40 mx-auto bg-gray-100 rounded-lg overflow-hidden border border-gray-200 mb-2 relative">
                    {previewImage ? <img src={previewImage} className="w-full h-full object-cover" /> : <Dog className="w-full h-full p-8 text-gray-300"/>}
                </div>
                <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, true)} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 mb-4"/>
             </div>

             <div className="flex justify-end space-x-3">
                 <button onClick={closeModals} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancelar</button>
                 <button onClick={handleSubmitPhoto} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Guardar Cambio</button>
             </div>
           </div>
        </div>
      )}

      {showStatusModal && selectedPet && newStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md relative border-t-4 border-orange-500">
             <h2 className="text-xl font-bold mb-4 flex items-center text-gray-800">
                 {newStatus === 'Perdida' ? <><AlertTriangle className="mr-2 text-orange-500"/> Reportar Pérdida</> : 
                  newStatus === 'Deceso' ? <><HeartCrack className="mr-2 text-red-500"/> Reportar Deceso</> :
                  <><Check className="mr-2 text-green-500"/> Mascota Encontrada</>}
             </h2>
             
             <p className="text-gray-600 mb-6">
                 ¿Estás seguro de que quieres cambiar el estado de <strong>{selectedPet.nombre}</strong> a "{newStatus}"?
             </p>
             
             <div className="flex justify-end space-x-3">
                 <button onClick={closeModals} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancelar</button>
                 <button 
                     onClick={handleSubmitStatus} 
                     className={`px-4 py-2 text-white rounded-md font-medium transition-colors
                        ${newStatus === 'Perdida' ? 'bg-orange-500 hover:bg-orange-600' : 
                          newStatus === 'Deceso' ? 'bg-red-600 hover:bg-red-700' : 
                          'bg-green-600 hover:bg-green-700'}`}
                 >
                     Confirmar
                 </button>
             </div>
           </div>
        </div>
      )}

      {showQRModal && selectedQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl text-center border-4 border-blue-100">
            <button onClick={() => setShowQRModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
            <h3 className="text-2xl font-bold text-gray-800 mb-1">{selectedQR.nombre}</h3>
            <div className="flex justify-center space-x-4 mb-4 mt-2"><button onClick={() => setQrType('web')} className={`flex items-center px-3 py-1 rounded-full text-xs font-semibold transition-colors ${qrType === 'web' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}><Globe className="w-3 h-3 mr-1" /> Web</button><button onClick={() => setQrType('text')} className={`flex items-center px-3 py-1 rounded-full text-xs font-semibold transition-colors ${qrType === 'text' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}><Type className="w-3 h-3 mr-1" /> Texto</button></div>
            <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-inner inline-block mb-6"><img src={selectedQR.img} alt="Código QR" className="w-48 h-48 object-contain" /></div>
            <button onClick={downloadQR} className="w-full flex items-center justify-center rounded-lg bg-gray-900 py-3 font-semibold text-white hover:bg-black transition-all shadow-lg"><Download className="mr-2 h-5 w-5" /> Descargar QR</button>
          </div>
        </div>
      )}

    </div>
  );
};

export default MisMascotasPage;