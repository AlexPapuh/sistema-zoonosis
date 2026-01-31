import axios from 'axios';
import authService from './auth.service.js';

const API_URL = 'http://localhost:5000/api/reportes/';

const authHeader = () => {
  const storedData = authService.getCurrentUser();
  return storedData?.token ? { Authorization: 'Bearer ' + storedData.token } : {};
};

const getDashboardStats = async () => {
  try {
    const response = await axios.get(API_URL + 'dashboard-stats', {
      headers: authHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error reportes:', error);
    throw error.response?.data || { message: 'Error de conexión' };
  }
};
const getMapaCalor = async () => {
  try {
    const response = await axios.get(API_URL + 'mapa-calor', {
      headers: authHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error mapa calor:', error);
    throw error.response?.data || { message: 'Error de conexión' };
  }
};
const getReporteCampanasFull = async () => {
  try {
    const response = await axios.get(API_URL + 'campanas-full', {
      headers: authHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error de conexión' };
  }
};
const getReporteConsultas = async () => {
  try {
    const response = await axios.get(API_URL + 'consultas-medicas', {
      headers: authHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error de conexión' };
  }
};
const getReporteDiagnosticosFull = async () => {
    const response = await axios.get(API_URL + 'diagnosticos-full', { headers: authHeader() });
    return response.data;
};
const getReportePoblacionFull = async () => {
    const response = await axios.get(API_URL + 'poblacion-full', { headers: authHeader() });
    return response.data;
};
const getReportePropietariosFull = async () => {
    const response = await axios.get(API_URL + 'propietarios-full', { headers: authHeader() });
    return response.data;
};
const getReporteCitasFull = async () => {
    const response = await axios.get(API_URL + 'citas-full', { headers: authHeader() });
    return response.data;
};
const reporteService = {
  getDashboardStats,
  getMapaCalor,
  getReporteCampanasFull,
  getReporteConsultas,
  getReporteDiagnosticosFull,
  getReportePoblacionFull,
  getReportePropietariosFull,
  getReporteCitasFull

};

export default reporteService;