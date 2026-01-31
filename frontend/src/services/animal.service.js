import axios from 'axios';
import authService from './auth.service.js';

const API_URL = 'http://localhost:5000/api/animales/';

const authHeader = () => {
  const storedData = authService.getCurrentUser();
  if (storedData && storedData.token) {
    return { Authorization: 'Bearer ' + storedData.token };
  } else {
    return {};
  }
};

const getAllAnimals = async () => {
  try {
    const response = await axios.get(API_URL, { headers: authHeader() });
    return response.data;
  } catch (error) {
    console.error('Error al obtener animales:', error.response?.data);
    throw error.response?.data || error;
  }
};

const getAnimalById = async (id) => {
    try {
      const response = await axios.get(API_URL + id, { headers: authHeader() });
      return response.data;
    } catch (error) {
      console.error('Error al obtener animal:', error.response?.data);
      throw error.response?.data || error;
    }
};

const getMisMascotas = async () => {
    try {
      const response = await axios.get(API_URL + 'mis-animales', { headers: authHeader() });
      return response.data;
    } catch (error) {
      console.error('Error al obtener mis mascotas:', error.response?.data);
      throw error.response?.data || error;
    }
};

const getAnimalQR = async (id) => {
    try {
      const response = await axios.get(API_URL + `${id}/qr`, { headers: authHeader() });
      return response.data; 
    } catch (error) {
      console.error('Error al obtener QR:', error.response?.data);
      throw error.response?.data || error;
    }
};

const getAnimalsByPropietarioId = async (propietarioId) => {
    try {
      const response = await axios.get(`${API_URL}propietario/${propietarioId}`, { headers: authHeader() });
      return response.data;
    } catch (error) {
      console.error('Error al obtener animales del propietario:', error.response?.data);
      throw error.response?.data || error;
    }
};

const createAnimal = async (animalData) => {
    try {
        const response = await axios.post(API_URL, animalData, { headers: authHeader() });
        return response.data;
    } catch (error) {
        console.error('Error al crear animal:', error.response?.data);
        throw error.response?.data || error;
    }
};

const updateAnimal = async (id, animalData) => {
    try {
        const response = await axios.put(API_URL + id, animalData, { headers: authHeader() });
        return response.data;
    } catch (error) {
        console.error('Error al actualizar animal:', error.response?.data);
        throw error.response?.data || error;
    }
};

const deleteAnimal = async (id) => {
    try {
        const response = await axios.delete(API_URL + id, { headers: authHeader() });
        return response.data;
    } catch (error) {
        console.error('Error al eliminar animal:', error.response?.data);
        throw error.response?.data || error;
    }
};

const animalService = {
  getAllAnimals,
  getAnimalById,
  getMisMascotas,
  getAnimalQR,
  getAnimalsByPropietarioId,
  createAnimal,
  updateAnimal,  
  deleteAnimal,
};

export default animalService;