import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LoginScreen } from '../screens/Auth/LoginScreen';
import { BooksScreen } from '../screens/Books/BooksScreen';
import { BookDetailScreen } from '../screens/Books/BookDetailScreen';
import { MyLoansScreen } from '../screens/Loans/MyLoansScreen';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';
import { useAuthStore } from '../store/auth.store';
import { colors } from '../theme/colors';
import { SalesHistoryScreen } from '../screens/Sales/SalesHistoryScreen';


const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.text.white,
        tabBarActiveTintColor: colors.primary,
      }}
    >
      <Tab.Screen name="Catalogue" component={BooksScreen} />
      <Tab.Screen name="Mes emprunts" component={MyLoansScreen} />
      <Tab.Screen 
  name="Ventes" 
  component={SalesHistoryScreen} 
  options={{ title: '💰 Ventes' }}
/>
      <Tab.Screen name="Mon profil" component={ProfileScreen} />
      
      {isAdmin && (
        <Tab.Screen name="Admin" component={AdminPlaceholder} />
      )}
    </Tab.Navigator>
  );
};

const AdminPlaceholder = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 18, color: colors.text.secondary }}>Dashboard Admin (à venir)</Text>
    </View>
  );
};

export const AppNavigator = () => {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen 
              name="BookDetail" 
              component={BookDetailScreen} 
              options={{ 
                title: 'Détail du livre',
                headerStyle: { backgroundColor: colors.primary },
                headerTintColor: colors.text.white,
                headerBackTitle: 'Retour',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};