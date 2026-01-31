import axios from 'axios';
import authService from './auth.service.js';

const API_URL = 'http://localhost:5000/api/inventario/';

const authHeader = () => {
  const user = authService.getCurrentUser();
  if (user && user.token) {
    return { Authorization: 'Bearer ' + user.token };
  } else {
    return {};
  }
};

const getAllProductos = async () => {
  const response = await axios.get(API_URL, { headers: authHeader() });
  return response.data;
};

const getStats = async () => {
    try {
        const response = await axios.get(API_URL + 'stats', { headers: authHeader() });
        return response.data;
    } catch (error) {
        return { total_productos: 0, stock_total_vacunas: 0, productos_bajo_stock: 0 };
    }
};

const createProducto = async (data) => {
  const response = await axios.post(API_URL, data, { headers: authHeader() });
  return response.data;
};


const updateProducto = async (id, data) => {
  const response = await axios.put(API_URL + id, data, { headers: authHeader() });
  return response.data;
};

const deleteProducto = async (id) => {
  const response = await axios.delete(API_URL + id, { headers: authHeader() });
  return response.data;
};

const inventarioService = {
  getAllProductos,
  getStats,
  createProducto,
  updateProducto, 
  deleteProducto 
};

export default inventarioService;