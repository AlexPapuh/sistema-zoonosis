import axios from 'axios';

const API_URL = "http://localhost:5000/api/horarios/"; 

const getHeaders = () => {
    const userStr = localStorage.getItem("user");
    return userStr ? { headers: { Authorization: `Bearer ${JSON.parse(userStr).token}` } } : {};
};


const getHorarioPublico = async () => {
    const res = await axios.get(API_URL + "config"); 
    return res.data;
};

const getHorarioNormal = async () => { 
    const res = await axios.get(API_URL + "config", getHeaders()); 
    return res.data; 
};

const updateHorarioNormal = async (data) => { 
    const res = await axios.put(API_URL + "config", data, getHeaders()); 
    return res.data; 
};

const getDiasEspeciales = async () => { 
    const res = await axios.get(API_URL + "especiales", getHeaders()); 
    return res.data; 
};

const addDiaEspecial = async (data) => { 
    const res = await axios.post(API_URL + "especiales", data, getHeaders()); 
    return res.data; 
};

const deleteDiaEspecial = async (id) => { 
    const res = await axios.delete(API_URL + "especiales/" + id, getHeaders()); 
    return res.data; 
};

export default { 
    getHorarioPublico, 
    getHorarioNormal, 
    updateHorarioNormal, 
    getDiasEspeciales, 
    addDiaEspecial, 
    deleteDiaEspecial 
};