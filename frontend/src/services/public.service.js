import axios from 'axios';

const API_URL = 'http://localhost:5000/api/public';

const getServicios = async () => {
    try {
        const response = await axios.get(`${API_URL}/servicios`);
        return response.data;
    } catch (error) {
        return [];
    }
};

const createServicio = async (data) => {
    await axios.post(`${API_URL}/servicios`, data);
};

const updateServicio = async (id, data) => {
    await axios.put(`${API_URL}/servicios/${id}`, data);
};

const deleteServicio = async (id) => {
    await axios.delete(`${API_URL}/servicios/${id}`);
};

export default {
    getServicios,
    createServicio,
    updateServicio,
    deleteServicio
};