import axios from 'axios';
import authService from './auth.service.js';

const API_URL = 'http://localhost:5000/api/usuarios';

const authHeader = () => {
  const storedData = authService.getCurrentUser();
  if (storedData && storedData.token) {
    return { Authorization: 'Bearer ' + storedData.token };
  } else {
    return {};
  }
};

const getAllUsers = async () => {
  try {
    const response = await axios.get(API_URL, { headers: authHeader() });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

const createUser = async (userData) => {
    try {
        const response = await axios.post(API_URL, userData, { headers: authHeader() });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

const updateUser = async (id, userData) => {
    try {
        const response = await axios.put(API_URL + id, userData, { headers: authHeader() });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

const deleteUser = async (id) => {
    try {
        const response = await axios.delete(API_URL + id, { headers: authHeader() });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};
const toggleEstado = async (id) => {
  let token = localStorage.getItem('token');
  
  if (!token) throw new Error("No hay token guardado");
  token = token.replace(/['"]+/g, ''); 

  const response = await axios.put(`${API_URL}/${id}/toggle`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  return response.data;
};
const userService = {
  getAllUsers,
  createUser, 
  updateUser,
  deleteUser,
  toggleEstado
};

export default userService;