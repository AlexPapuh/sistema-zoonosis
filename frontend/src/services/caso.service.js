import axios from 'axios';
import authService from './auth.service.js';

const API_URL = 'http://localhost:5000/api/casos/';

const authHeader = () => {
  const storedData = authService.getCurrentUser();
  if (storedData && storedData.token) {
    return { Authorization: 'Bearer ' + storedData.token };
  } else {
    return {};
  }
};

const getAllCasos = async (estado = 'Abierto') => {
  try {
    const response = await axios.get(API_URL + `?estado=${estado}`, { headers: authHeader() });
    return response.data;
  } catch (error) {
    console.error('Error al obtener casos:', error);
    throw error.response?.data || error;
  }
};

const createCaso = async (casoData) => {
    try {
      const response = await axios.post(API_URL, casoData, { headers: authHeader() });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
};

const resolverCaso = async (id) => {
    try {
      const response = await axios.put(API_URL + `${id}/resolver`, {}, { headers: authHeader() });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
};
const deleteCaso = async (id) => {
    try {
        const response = await axios.delete(API_URL + id, { headers: authHeader() });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};
const getPublicCasos = async () => {
    const response = await axios.get(API_URL + 'public');
    return response.data;
};

const createPublicCaso = async (data) => {
    const response = await axios.post(API_URL + 'public', data);
    return response.data;
};
const casoService = {
  getAllCasos,
  createCaso,
  resolverCaso,
  deleteCaso,
  getPublicCasos,
  createPublicCaso
};

export default casoService;