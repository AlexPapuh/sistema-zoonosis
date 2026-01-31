import axios from 'axios';
import authService from './auth.service.js';

const API_URL = 'http://localhost:5000/api/campanas/';

const authHeader = () => {
  const user = authService.getCurrentUser();
  if (user && user.token) {
    return { Authorization: 'Bearer ' + user.token };
  } else {
    return {};
  }
};

const getPublicas = async () => {
  try {
    const response = await axios.get(API_URL + 'publicas');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

const inscribirse = async (campanaId, animalId) => {
    try {
        const response = await axios.post(
            API_URL + 'inscribirse', 
            { campana_id: campanaId, animal_id: animalId }, 
            { headers: authHeader() }
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};


const getAllCampanas = async () => {
  try {
    const response = await axios.get(API_URL, { headers: authHeader() });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

const getCampanaById = async (id) => {
  try {
    const response = await axios.get(API_URL + id, { headers: authHeader() });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

const createCampana = async (data) => {
  try {
    const response = await axios.post(API_URL, data, { headers: authHeader() });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

const updateCampana = async (id, data) => {
  try {
    const response = await axios.put(API_URL + id, data, { headers: authHeader() });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

const deleteCampana = async (id) => {
  try {
    const response = await axios.delete(API_URL + id, { headers: authHeader() });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

const iniciarCampana = async (id) => {
  try {
    const response = await axios.post(API_URL + id + '/iniciar', {}, { headers: authHeader() });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

const finalizarCampana = async (id) => {
  try {
    const response = await axios.post(API_URL + id + '/finalizar', {}, { headers: authHeader() });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

const getMisAsignaciones = async () => {
    try {
      const response = await axios.get(API_URL + 'mis-asignaciones', { headers: authHeader() });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
};

const getInscripcionesConGeo = async (id) => {
  try {
    const response = await axios.get(API_URL + id + '/inscripciones', { headers: authHeader() });
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) return [];
    throw error.response?.data || error;
  }
};

const registrarAtencionRapida = async (id, data) => {
  try {
    const response = await axios.post(API_URL + id + '/atencion', data, { headers: authHeader() });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};


const inscribir = async (campanaId, datosExtras) => {
    const response = await axios.post(`${API_URL}/${campanaId}/inscribir`, datosExtras, { headers: authHeader() });
    return response.data;
};

const marcarAtendido = async (inscripcionId) => {
    const userStr = localStorage.getItem('user');
    let token = null;

    if (userStr) {
        try {
            const userObj = JSON.parse(userStr);
            token = userObj.token;
        } catch (e) {
            console.error("Error al leer token", e);
        }
    }

    if (!token) {
        console.error("❌ No hay token disponible para marcar atendido.");
    }

    const response = await axios.put(
        `${API_URL}/inscripciones/${inscripcionId}/atendido`,
        {}, 
        {
            headers: { Authorization: `Bearer ${token}` }
        }
    );
    return response.data;
};
const getMisMascotas = async () => {
   const res = await axios.get(API_URL + 'mis-mascotas', { headers: authHeader() });
   return res.data;
};
const inscribirInvitado = async (datos) => {
    const response = await axios.post(API_URL + 'publicas/inscribir', datos);
    return response.data;
};
const campanaService = {
  getPublicas,    
  inscribirse,   
  getAllCampanas,
  getCampanaById,
  createCampana,
  updateCampana,
  deleteCampana,
  iniciarCampana,
  finalizarCampana,
  getMisAsignaciones, 
  getInscripcionesConGeo,
  registrarAtencionRapida,
  inscribir,
  marcarAtendido,
  getMisMascotas, 
  inscribirInvitado
};

export default campanaService;