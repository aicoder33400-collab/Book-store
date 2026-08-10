import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RoleBasedNavigator } from './src/navigation/RoleBasedNavigator';
import { useAuthStore } from './src/store/auth.store';

export default function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <RoleBasedNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}