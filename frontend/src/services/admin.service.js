import axios from 'axios';
import authService from './auth.service.js';

const API_URL = 'http://2.25.170.83:5000/api/admin';

const authHeader = () => {
    const storedData = authService.getCurrentUser();
    return (storedData && storedData.token) 
        ? { Authorization: 'Bearer ' + storedData.token } 
        : {};
};

const descargarBackup = async () => {
    try {
        const response = await axios.get(`${API_URL}/backup`, {
            headers: authHeader(),
            responseType: 'blob' // Clave para manejar archivos
        });

        // Lógica para descargar el archivo en el navegador
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        const fecha = new Date().toISOString().split('T')[0];
        link.setAttribute('download', `Copia_Seguridad_${fecha}.sql`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        
        return true;
    } catch (error) {
        throw error.response?.data?.message || 'Error al descargar el backup';
    }
};

export default {
    descargarBackup
};