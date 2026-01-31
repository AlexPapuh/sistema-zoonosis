import axios from 'axios';
import authService from './auth.service.js'; 

const API_URL = 'http://localhost:5000/api/propietarios/';

const authHeader = () => {
  const storedData = authService.getCurrentUser();
  if (storedData && storedData.token) {
    return { Authorization: 'Bearer ' + storedData.token };
  } else {
    return {};
  }
};

const getAllPropietarios = async () => {
  try {
    const response = await axios.get(API_URL, { headers: authHeader() });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

const createPropietario = async (data) => {
    try {
        const response = await axios.post(API_URL, data, { headers: authHeader() });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

const updatePropietario = async (id, data) => {
    try {
        const response = await axios.put(API_URL + id, data, { headers: authHeader() });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

const deletePropietario = async (id) => {
    try {
        const response = await axios.delete(API_URL + id, { headers: authHeader() });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

const propietarioService = {
  getAllPropietarios,
  createPropietario,
  updatePropietario,
  deletePropietario,
};

export default propietarioService;