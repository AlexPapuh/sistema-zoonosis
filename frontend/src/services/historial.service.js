import axios from 'axios';
import authService from './auth.service.js';

const API_URL = 'http://localhost:5000/api/historiales/';

const authHeader = () => {
  const storedData = authService.getCurrentUser();
  if (storedData && storedData.token) {
    return { Authorization: 'Bearer ' + storedData.token };
  } else {
    return {};
  }
};

const getAllHistoriales = async () => {
  try {
    const response = await axios.get(API_URL, { headers: authHeader() });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

const getHistorialByAnimalId = async (animalId) => {
    try {
      const response = await axios.get(API_URL + `animal/${animalId}`, { headers: authHeader() });
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) return [];
      throw error.response?.data || error;
    }
};

const registrarConsultaCompleta = async (datosConsulta) => {
    try {
      const response = await axios.post(API_URL + 'consulta-completa', datosConsulta, {
        headers: authHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
};

const historialService = {
  getAllHistoriales,
  getHistorialByAnimalId,
  registrarConsultaCompleta 
};

export default historialService;