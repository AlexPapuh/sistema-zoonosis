import axios from 'axios';
import authService from './auth.service.js';

const API_URL = 'http://localhost:5000/api/citas/';

const authHeader = () => {
  const storedData = authService.getCurrentUser();
  return (storedData && storedData.token) ? { Authorization: 'Bearer ' + storedData.token } : {};
};


const createCita = async (data) => {
    try {
        const response = await axios.post(API_URL, data, { headers: authHeader() });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

const getMisCitas = async () => {
    try {
        const response = await axios.get(API_URL + 'mis-citas', { headers: authHeader() });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

const getAgenda = async (filtros = {}) => {
    try {
        const response = await axios.get(API_URL + 'agenda', { 
            headers: authHeader(),
            params: filtros 
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

const updateCita = async (id, data) => {
    try {
        const response = await axios.put(API_URL + id, data, { headers: authHeader() });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

const deleteCita = async (id) => {
    try {
        const response = await axios.delete(API_URL + id, { headers: authHeader() });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};


const getDisponibilidad = async (fecha) => {
    try {
        const response = await axios.get(API_URL + 'disponibilidad', { 
            headers: authHeader(),
            params: { fecha } 
        });
        return response.data; 
    } catch (error) {
        console.error("Error disponibilidad", error);
        throw error;
    }
};
const getResumenMensual = async (year, month) => {
    try {
        const response = await axios.get(API_URL + 'resumen-mensual', { 
            headers: authHeader(),
            params: { year, month } 
        });
        return response.data; 
    } catch (error) {
        throw error;
    }
};
const citasService = {
    createCita,
    getMisCitas,
    getAgenda, 
    getAgendaHoy: getAgenda,
    updateCita,
    deleteCita,
    getDisponibilidad,
    getResumenMensual

};

export default citasService;