import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom'; 
import animalService from '../../services/animal.service.js';
import { Dog, Edit, Trash2, Stethoscope, ArrowLeft } from 'lucide-react';

const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return 'N/A';
  const hoy = new Date();
  const cumple = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - cumple.getFullYear();
  const m = hoy.getMonth() - cumple.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < cumple.getDate())) {
    edad--;
  }
  return edad > 0 ? `${edad} años` : 'Menos de 1 año';
};

const GestionAnimalesPage = () => {
  const { id: propietarioId } = useParams(); 
  const [animales, setAnimales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAnimales = async () => {
      try {
        setLoading(true);
        let data;
        
        if (propietarioId) {
            data = await animalService.getAnimalsByPropietarioId(propietarioId);
        } else {
            data = await animalService.getAllAnimals();
        }
        
        setAnimales(data);
      } catch (err) {
        setError(err.message || 'Error al cargar animales');
      } finally {
        setLoading(false);
      }
    };

    fetchAnimales();
  }, [propietarioId]);

  if (loading) return <div className="text-center text-lg py-10">Cargando animales...</div>;
  if (error) return <div className="text-center text-lg text-red-600 py-10">{error}</div>;

  const nombrePropietario = animales.length > 0 ? animales[0].propietario_nombre : 'Propietario';

  const irAHistorial = (animalId) => {
      navigate(`/gestion/animal/${animalId}/historial`, { 
          state: { fromPropietarioId: propietarioId } 
      });
  };

  return (
    <div className="container mx-auto px-4 py-6">
      
      {propietarioId ? (
          <div className="mb-6">
            <button onClick={() => navigate('/gestion/propietarios')} className="flex items-center text-blue-600 hover:text-blue-800 mb-2 transition-colors">
                <ArrowLeft className="h-4 w-4 mr-1"/> Volver a Propietarios
            </button>
            <h1 className="text-4xl font-bold text-gray-800">
                Mascotas de <span className="text-gray-900">{nombrePropietario}</span>
            </h1>
          </div>
      ) : (
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-4xl font-bold text-gray-800">Gestión de Animales</h1>
            <button className="flex items-center rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white shadow-md hover:bg-blue-700 transition-colors">
              <Dog className="mr-2 h-5 w-5" /> Nuevo Animal
            </button>
          </div>
      )}

      <div className="overflow-x-auto rounded-xl bg-white shadow-lg border border-gray-100">
        <table className="w-full min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Nombre</th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Especie</th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Raza</th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Edad</th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Sexo</th>
              {!propietarioId && <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Propietario</th>}
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {animales.length === 0 ? (
                <tr>
                  <td colSpan={propietarioId ? "6" : "7"} className="p-10 text-center text-gray-500 italic">
                    No se encontraron mascotas registradas.
                  </td>
                </tr>
            ) : (
                animales.map((animal) => (
                <tr key={animal.id} className="hover:bg-gray-50 transition-colors">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">{animal.nombre}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      animal.especie === 'Perro' ? 'bg-blue-100 text-blue-800' : 
                      animal.especie === 'Gato' ? 'bg-purple-100 text-purple-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}>
                        {animal.especie}
                    </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{animal.raza}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{calcularEdad(animal.fecha_nacimiento)}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{animal.sexo}</td>
                    
                    {!propietarioId && <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 font-medium">{animal.propietario_nombre}</td>}
                    
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                      <div className="flex space-x-3">
                        <button onClick={() => irAHistorial(animal.id)} className="text-green-600 hover:text-green-900 transition-colors" title="Ver Historial">
                          <Stethoscope className="h-5 w-5" />
                        </button>
                        <button className="text-blue-600 hover:text-blue-900 transition-colors" title="Editar">
                          <Edit className="h-5 w-5" />
                        </button>
                        <button className="text-red-600 hover:text-red-900 transition-colors" title="Eliminar">
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GestionAnimalesPage;