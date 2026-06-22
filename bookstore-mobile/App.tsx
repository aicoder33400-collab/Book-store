import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppNavigator } from './src/navigation';
import { useAuthStore } from './src/store/auth.store';
import { authService } from './src/services/auth.service';

export default function App() {
  const { setUser, setToken, setIsLoading } = useAuthStore();  // ← Correction

  useEffect(() => {
    const loadStoredUser = async () => {
      setIsLoading(true);  // ← Correction
      try {
        const user = await authService.getCurrentUser();
        const token = await authService.getToken();
        if (user && token) {
          setUser(user);
          setToken(token);
        }
      } catch (error) {
        console.error('Erreur chargement utilisateur:', error);
      } finally {
        setIsLoading(false);  // ← Correction
      }
    };
    loadStoredUser();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}