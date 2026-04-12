import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import historialService from '../../services/historial.service.js';
import animalService from '../../services/animal.service.js';
import { ArrowLeft, Stethoscope, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const formatFecha = (isoString) => {
  if (!isoString) return 'N/A';
  const fecha = new Date(isoString);
  return fecha.toLocaleString('es-ES', { 
    year: 'numeric', month: 'long', day: 'numeric', 
    hour: '2-digit', minute: '2-digit' 
  });
};

const AnimalHistorialPage = () => {
  const { id: animalId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [animal, setAnimal] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isVete = user?.rol === 'Veterinario' || user?.rol === 'Admin';
  const isPropietario = user?.rol === 'Propietario';

  const fromPropietarioId = location.state?.fromPropietarioId;
  const fromPath = location.state?.from;
  
  let backLink = '/';
  let backText = 'Volver';

  if (isPropietario) {
      backLink = '/propietario/mis-mascotas';
      backText = 'Volver a Mis Mascotas';
  } else if (fromPath) {
      backLink = fromPath;
      if (fromPath.includes('citas')) backText = 'Volver a Gestión de Citas';
      else backText = 'Volver';
  } else if (fromPropietarioId) {
      backLink = `/gestion/propietario/${fromPropietarioId}/animales`;
      backText = 'Volver a Mascotas del Propietario';
  } else {
      backLink = '/gestion/animales'; 
      backText = 'Volver a Gestión';
  }

  useEffect(() => {
    const fetchHistorial = async () => {
      try {
        setLoading(true);
        const [animalData, historialData] = await Promise.all([
          animalService.getAnimalById(animalId),
          historialService.getHistorialByAnimalId(animalId)
        ]);
        setAnimal(animalData);
        setHistorial(historialData);
      } catch (err) {
        console.error(err);
        setError('No se pudo cargar la información.');
      } finally {
        setLoading(false);
      }
    };
    if (animalId) fetchHistorial();
  }, [animalId]);

  const handleNuevaConsulta = () => {
      if (!animal) return;
      navigate('/gestion/tratamiento', {
          state: { prefill: { propietarioId: animal.propietario_id, animalId: animal.id } }
      });
  };

  const parseInsumos = (insumosData) => {
      if (!insumosData) return [];
      if (Array.isArray(insumosData)) return insumosData;
      try {
          return JSON.parse(insumosData);
      } catch (e) {
          return [];
      }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  if (error && !animal) return <div className="text-center text-lg text-red-600 p-10">{error}</div>;
  if (!animal) return <div className="text-center text-lg text-red-600 p-10">Animal no encontrado.</div>;

  return (
    <div className="container mx-auto pb-10 px-4 md:px-8">
      <Link to={backLink} className="mb-6 inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors mt-6">
        <ArrowLeft className="mr-2 h-5 w-5" />
        {backText}
      </Link>

      <div className="mb-8 rounded-xl bg-white p-6 shadow-md border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div className="flex items-center">
            <div className="h-24 w-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden mr-6 border border-gray-200">
                {animal.foto ? <img src={animal.foto} alt={animal.nombre} className="h-full w-full object-cover" /> : <FileText className="h-10 w-10 text-gray-400 m-auto mt-6" />}
            </div>
            <div>
                <h1 className="text-3xl font-bold text-gray-800 flex items-center">{animal.nombre}</h1>
                <div className="mt-2 text-gray-600 space-y-1">
                   <p className="text-sm"><span className="font-semibold">Especie:</span> {animal.especie} - {animal.raza}</p>
                   <p className="text-sm"><span className="font-semibold">Sexo:</span> {animal.sexo}</p>
                </div>
            </div>
        </div>
        
        {isVete && animal.estado !== 'Deceso' && (
            <button onClick={handleNuevaConsulta} className="mt-4 md:mt-0 flex items-center rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white shadow-md hover:bg-blue-700">
            <Stethoscope className="mr-2 h-5 w-5" /> Nueva Consulta
            </button>
        )}
      </div>
      
      <div className="mb-4"><h2 className="text-2xl font-bold text-gray-800 border-l-4 border-blue-500 pl-3">Historial Médico</h2></div>

      <div className="overflow-hidden rounded-xl bg-white shadow-md border border-gray-100">
        <table className="w-full min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Fecha</th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Diagnóstico</th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Tratamiento / Insumos</th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Veterinario</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {historial.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-500 italic">No hay registros médicos.</td></tr>
            ) : (
                historial.map((item) => {
                  const listaInsumos = parseInsumos(item.insumos);
                  return (
                  <tr key={item.id} className="hover:bg-blue-50 transition-colors">
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 font-medium">{formatFecha(item.fecha_consulta)}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-blue-900">{item.diagnostico}</td>
                    
                    <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="font-medium text-gray-800 whitespace-pre-wrap">{item.tratamiento || 'Sin descripción'}</div>
                        
                        {listaInsumos.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                                {listaInsumos.map((ins, idx) => (
                                    <span key={idx} className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-700 border border-green-200 shadow-sm">
                                        💊 {ins.nombre} 
                                        <span className="ml-1 text-green-900">({parseFloat(ins.cantidad)} {ins.unidad || ''})</span>
                                    </span>
                                ))}
                            </div>
                        )}

                        {item.notas && (
                            <div className="mt-2 text-xs text-gray-500 italic bg-gray-50 p-2 rounded border border-gray-100">
                                <span className="font-bold">Nota:</span> {item.notas}
                            </div>
                        )}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{item.veterinario_nombre || 'N/A'}</td>
                  </tr>
                  );
                })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AnimalHistorialPage;