import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// const API_URL = 'http://localhost:3000/api'; // Change pour l'URL de votre backend
// const LOCAL_IP = '172.20.10.4';
const LOCAL_IP =  'localhost'
const API_URL = `http://${LOCAL_IP}:3000/api`;
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Only clear if it's not a login attempt
      const isLoginRequest = error.config.url?.includes('/auth/login');
      if (!isLoginRequest) {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        // Force page reload to show login
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;