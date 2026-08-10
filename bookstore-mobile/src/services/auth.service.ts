import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  status: string;
  message: string;
  data: {
    token: string;
    user: {
      id: string;
      name: string;
      email: string;
      role: 'ADMIN' | 'STAFF' | 'USER';
      avatar?: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      age?: number;
      commune?: string;
      isProfileComplete?: boolean;
    };
  };
}

interface GoogleAuthResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: 'ADMIN' | 'STAFF' | 'USER';
    firstName?: string;
    lastName?: string;
    phone?: string;
    age?: number;
    commune?: string;
    isProfileComplete?: boolean;
  };
}

const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
} as const;

export const authService = {
  // ============================================
  // Connexion Email/Password
  // ============================================
  login: async (credentials: LoginCredentials) => {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    const { token, user } = response.data.data;
    
    await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    
    return { token, user };
  },

  // ============================================
  // 🔥 Vérifier si l'utilisateur existe
  // ============================================
  checkGoogleUser: async (googleToken: string) => {
    const response = await api.post('/auth/google/check', { token: googleToken });
    return response.data;
  },

  // ============================================
  // 🔥 Compléter le profil (inscription)
  // ============================================
  completeGoogleProfile: async (googleToken: string, data: {
    firstName: string;
    lastName: string;
    phone: string;
    age: number;
    commune: string;
  }) => {
    const response = await api.post('/auth/google/complete-profile', {
      token: googleToken,
      ...data
    });
    return response.data;
  },

  // ============================================
  // 🔥 Connexion Google (profil complet)
  // ============================================
  loginWithGoogle: async (googleToken: string): Promise<GoogleAuthResponse> => {
    const response = await api.post<GoogleAuthResponse>('/auth/google/login', {
      token: googleToken,
    });
    
    const { token, user } = response.data;
    
    await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    
    return { 
      success: true,
      token, 
      user 
    };
  },

  // ============================================
  // Gestion des tokens
  // ============================================
  logout: async () => {
    await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
  },
  
  getCurrentUser: async () => {
    try {
      const userStr = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('❌ Erreur getCurrentUser:', error);
      return null;
    }
  },
  
  getToken: async () => {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    } catch (error) {
      console.error('❌ Erreur getToken:', error);
      return null;
    }
  },

  isAuthenticated: async (): Promise<boolean> => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      return !!token;
    } catch (error) {
      return false;
    }
  },
};

export default authService;
