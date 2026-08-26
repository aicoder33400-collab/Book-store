import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// 🔥 URL NGROK
const NGROK_URL = 'https://shudder-oppose-disburse.ngrok-free.dev/api';

const getBaseURL = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:3000/api';
  }
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    // return NGROK_URL;
    return 'http://localhost:3000/api';
  }
  return 'http://localhost:3000/api';
};

const API_URL = getBaseURL();
console.log('🔗 API URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export default api;
