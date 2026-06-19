import React from 'react';
import { View, Text, ActivityIndicator, Button } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { LoginScreen } from '../screens/Auth/LoginScreen';
import { useAuthStore } from '../store/auth.store';

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

// Composant temporaire pour Main
const MainScreen = () => {
  const { reset, user } = useAuthStore();
  
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Bienvenue dans Bookstore Manager!</Text>
      <Text style={{ fontSize: 16, marginBottom: 10 }}>Connecté en tant que: {user?.name}</Text>
      <Text style={{ fontSize: 14, marginBottom: 30, color: '#666' }}>Rôle: {user?.role}</Text>
      <Button title="Déconnexion" onPress={() => reset()} />
    </View>
  );
};

export const AppNavigator = () => {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <Stack.Screen name="Main" component={MainScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};