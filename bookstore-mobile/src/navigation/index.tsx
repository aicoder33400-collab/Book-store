import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LoginScreen } from '../screens/Auth/LoginScreen';
import { CompleteProfileScreen } from '../screens/Auth/CompleteProfileScreen';
import { CompleteProfileRedirect } from '../screens/Auth/CompleteProfileRedirect';
import { CallbackScreen } from '../screens/Auth/CallbackScreen';
import { BooksScreen } from '../screens/Books/BooksScreen';
import { BookDetailScreen } from '../screens/Books/BookDetailScreen';
import { MyLoansScreen } from '../screens/Loans/MyLoansScreen';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';
import { useAuthStore } from '../store/auth.store';
import { colors } from '../theme/colors';
import { RootStackParamList } from '../types/navigation';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// 🔥 Exporter RoleBasedNavigator (alias de AppNavigator)
export const RoleBasedNavigator = () => {
  return <AppNavigator />;
};

// Exporter aussi AppNavigator
export { AppNavigator };

const MainTabs = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const isStaff = user?.role === 'STAFF';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.text.white,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text.light,
        tabBarStyle: {
          backgroundColor: colors.background.secondary,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 5,
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen 
        name="Catalogue" 
        component={BooksScreen} 
        options={{ 
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>📚</Text>
          )
        }}
      />
      
      <Tab.Screen 
        name="Mes emprunts" 
        component={MyLoansScreen}
        options={{ 
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>📖</Text>
          )
        }}
      />
      
      
      
      <Tab.Screen 
        name="Mon profil" 
        component={ProfileScreen}
        options={{ 
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>👤</Text>
          )
        }}
      />
      
      {(isAdmin || isStaff) && (
        <Tab.Screen 
          name="Admin" 
          component={AdminPlaceholder}
          options={{ 
            title: isAdmin ? '📊 Admin' : '📊 Dashboard',
            tabBarIcon: ({ color, size }) => (
              <Text style={{ fontSize: size, color }}>📊</Text>
            )
          }}
        />
      )}
    </Tab.Navigator>
  );
};

const AdminPlaceholder = () => {
  return (
    <View style={styles.placeholderContainer}>
      <Text style={styles.placeholderEmoji}>📊</Text>
      <Text style={styles.placeholderTitle}>Dashboard Admin</Text>
      <Text style={styles.placeholderSubtitle}>
        Gérez les livres, les emprunts et les utilisateurs
      </Text>
    </View>
  );
};

const AppNavigator = () => {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.text.white,
          headerBackTitle: 'Retour',
        }}
      >
        {!user ? (
          <>
            <Stack.Screen 
              name="Login" 
              component={LoginScreen} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="Callback" 
              component={CallbackScreen} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="CompleteProfileRedirect" 
              component={CompleteProfileRedirect} 
            />
            <Stack.Screen 
              name="CompleteProfile" 
              component={CompleteProfileScreen} 
              options={{ 
                title: 'Compléter votre profil',
                headerBackTitle: 'Retour',
                headerStyle: { backgroundColor: colors.primary },
                headerTintColor: colors.text.white,
              }}
            />
          </>
        ) : (
          <>
            <Stack.Screen 
              name="Main" 
              component={MainTabs} 
              options={{ headerShown: false }} 
            />
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

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text.secondary,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    padding: 20,
  },
  placeholderEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  placeholderSubtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});