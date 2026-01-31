import axios from "axios";

const API_URL = "http://localhost:5000/api/auth/"; 

const register = async (userData) => {
  const response = await axios.post(API_URL + 'register', userData);
  return response.data;
};

const login = async (email, password) => {
  const response = await axios.post(API_URL + "login", {
    email,
    password,
  });

  if (response.data.token) {

    
    const usuarioConToken = {
        ...response.data.user, 
        token: response.data.token 
    };

    localStorage.setItem("user", JSON.stringify(usuarioConToken));
    
    return response.data;
  }

  return response.data;
};

const logout = () => {
  localStorage.removeItem("user");
};

const getCurrentUser = () => {
  const userStr = localStorage.getItem("user");
  if (userStr) return JSON.parse(userStr);
  return null;
};
const getProfile = async () => {
  const userStr = localStorage.getItem("user");
  let token = null;
  
  if (userStr) {
      const userObj = JSON.parse(userStr);
      token = userObj.token;
  }

  if (!token) return Promise.reject("No token found");

  const response = await axios.get(API_URL + "profile", {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  return response.data;
};
const updateProfile = async (userData) => {
  const userStr = localStorage.getItem("user");
  let token = null;
  if (userStr) {
      const userObj = JSON.parse(userStr);
      token = userObj.token;
  }

  const response = await axios.put(API_URL + "profile", userData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (response.data && userStr) {
      const currentUser = JSON.parse(userStr);
      currentUser.nombre = userData.nombre; 
      localStorage.setItem("user", JSON.stringify(currentUser));
  }

  return response.data;
};
const forgotPassword = async (email) => {
    try {
        const response = await axios.post(`${API_URL}/forgot-password`, { email });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Error al solicitar código';
    }
};

const resetPassword = async (email, code, newPassword) => {
    try {
        const response = await axios.post(`${API_URL}/reset-password`, { email, code, newPassword });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Error al restablecer contraseña';
    }
};
const authService = {
  register,
  login,
  logout,
  getCurrentUser,
  getProfile, 
  updateProfile,
  register,
  forgotPassword,
  resetPassword
};

export default authService;