import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/auth.service';
import { GoogleAuthService } from '../services/google-auth.service';

// 🔥 Interface utilisateur complète
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: 'ADMIN' | 'STAFF' | 'USER';
  authProvider: 'google' | 'local';
  avatar?: string | null;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string | null;
  googleId?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  age?: number | null;
  commune?: string | null;
  isProfileComplete?: boolean;
}

// 🔥 Type pour l'utilisateur du backend
type BackendUser = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: 'ADMIN' | 'STAFF' | 'USER';
  authProvider?: 'google' | 'local';
  avatar?: string | null;
  emailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string | null;
  googleId?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  age?: number | null;
  commune?: string | null;
  isProfileComplete?: boolean;
};

// 🔥 Fonction pour normaliser l'utilisateur
function normalizeUser(data: BackendUser): User {
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone || null,
    role: data.role,
    authProvider: data.authProvider || 'local',
    avatar: data.avatar || null,
    emailVerified: data.emailVerified || false,
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
    lastLoginAt: data.lastLoginAt || null,
    googleId: data.googleId || null,
    firstName: data.firstName || null,
    lastName: data.lastName || null,
    age: data.age || null,
    commune: data.commune || null,
    isProfileComplete: data.isProfileComplete || false,
  };
}

// 🔥 Interface du store
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  needsProfile: boolean;
  googleToken: string | null;
  googleUserData: { email: string; name: string; avatar: string } | null;
  
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  setIsLoading: (loading: boolean) => void;
  setNeedsProfile: (needs: boolean, googleToken?: string, userData?: any) => void;
  clearNeedsProfile: () => void;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  completeGoogleProfile: (data: {
    firstName: string;
    lastName: string;
    phone: string;
    age: number;
    commune: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      needsProfile: false,
      googleToken: null,
      googleUserData: null,

      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
        AsyncStorage.setItem('user', JSON.stringify(user)).catch(console.error);
      },

      setToken: (token: string) => {
        set({ token });
        AsyncStorage.setItem('token', token).catch(console.error);
      },

      setIsLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setNeedsProfile: (needs: boolean, googleToken?: string, userData?: any) => {
        set({
          needsProfile: needs,
          googleToken: googleToken || null,
          googleUserData: userData || null,
        });
      },

      clearNeedsProfile: () => {
        set({
          needsProfile: false,
          googleToken: null,
          googleUserData: null,
        });
      },

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true });
          const { token, user: rawUser } = await authService.login({ email, password });
          
          const user = normalizeUser(rawUser);
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            needsProfile: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      loginWithGoogle: async () => {
        try {
          set({ isLoading: true });
          const result = await GoogleAuthService.login();
          
          if (result.needsProfile) {
            set({
              isLoading: false,
              needsProfile: true,
              googleToken: result.googleToken,
              googleUserData: result.userData,
            });
            return;
          }

          if (!result.user) {
            throw new Error('Aucun utilisateur retourné par Google');
          }

          const user = normalizeUser(result.user);
          
          set({
            user,
            token: result.token,
            isAuthenticated: true,
            isLoading: false,
            needsProfile: false,
            googleToken: null,
            googleUserData: null,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      completeGoogleProfile: async (data: {
        firstName: string;
        lastName: string;
        phone: string;
        age: number;
        commune: string;
      }) => {
        try {
          set({ isLoading: true });
          const { googleToken } = get();
          
          if (!googleToken) {
            throw new Error('Token Google manquant');
          }

          const result = await GoogleAuthService.completeProfile(googleToken, data);
          
          if (!result.user) {
            throw new Error('Aucun utilisateur retourné');
          }

          const user = normalizeUser(result.user);
          
          set({
            user,
            token: result.token,
            isAuthenticated: true,
            isLoading: false,
            needsProfile: false,
            googleToken: null,
            googleUserData: null,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authService.logout();
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            needsProfile: false,
            googleToken: null,
            googleUserData: null,
          });
        } catch (error) {
          console.error('❌ Erreur logout:', error);
        }
      },

      checkAuth: async () => {
        try {
          set({ isLoading: true });
          const [rawUser, token] = await Promise.all([
            authService.getCurrentUser(),
            authService.getToken(),
          ]);
          
          if (rawUser && token) {
            const user = normalizeUser(rawUser);
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch (error) {
          console.error('❌ Erreur checkAuth:', error);
          set({
            isLoading: false,
            isAuthenticated: false,
            user: null,
            token: null,
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);