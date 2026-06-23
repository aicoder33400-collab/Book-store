import React, { useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuthStore } from '../store/auth.store';
import { colors } from '../theme/colors';
import { UserMenu } from '../components/UserMenu';

// Screens
import { LoginScreen } from '../screens/Auth/LoginScreen';
import { BooksScreen } from '../screens/Books/BooksScreen';
import { BookDetailScreen } from '../screens/Books/BookDetailScreen';
import { MyLoansScreen } from '../screens/Loans/MyLoansScreen';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';
import { DashboardScreen } from '../screens/Dashboard/DashboardScreen';
import { UsersScreen } from '../screens/Users/UserScreen';
import { AllLoansScreen } from '../screens/Loans/AllLoansScreen';
import { LoanDetailScreen } from '../screens/Loans/LoanDetailScreen';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

// Book stack
const BooksStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="BooksList" component={BooksScreen} />
    <Stack.Screen 
      name="BookDetail" 
      component={BookDetailScreen} 
      options={{ 
        headerShown: true,
        title: 'Détail du livre',
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.text.white,
        headerBackTitle: 'Retour',
      }} 
    />
  </Stack.Navigator>
);

// Loans stack
const LoansStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MyLoans" component={MyLoansScreen} />
    <Stack.Screen 
      name="LoanDetail" 
      component={LoanDetailScreen} 
      options={{ 
        headerShown: true,
        title: 'Détail emprunt',
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.text.white,
        headerBackTitle: 'Retour',
      }} 
    />
  </Stack.Navigator>
);

// Avatar button for header
const UserAvatar = () => {
  const { user } = useAuthStore();
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={{ marginRight: 16 }}
        onPress={() => setMenuVisible(true)}
        activeOpacity={0.7}
      >
        <View style={{
          width: 34, height: 34, borderRadius: 17,
          backgroundColor: 'rgba(255,255,255,0.25)',
          justifyContent: 'center', alignItems: 'center',
        }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
            {user?.name?.charAt(0).toUpperCase() || '?'}
          </Text>
        </View>
      </TouchableOpacity>
      <UserMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </>
  );
};

// Main drawer
const CommonDrawer = () => {
  const { user, isLoading } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const isStaff = user?.role === 'STAFF';

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <Drawer.Navigator
        screenOptions={{
          headerShown: true,
          drawerActiveTintColor: colors.primary,
          drawerInactiveTintColor: colors.text.secondary,
          drawerStyle: { width: 280 },
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.text.white,
          headerRight: () => <UserAvatar />,
        }}
      >
        {/* ADMIN */}
        {isAdmin && (
          <>
            <Drawer.Screen name="🏠 Dashboard" component={DashboardScreen} />
            <Drawer.Screen name="📚 Catalogue" component={BooksStack} />
            <Drawer.Screen name="📋 Tous les emprunts" component={AllLoansScreen} />
            <Drawer.Screen name="👥 Utilisateurs" component={UsersScreen} />
            <Drawer.Screen name="👤 Mon profil" component={ProfileScreen} />
          </>
        )}

        {/* STAFF */}
        {isStaff && (
          <>
            <Drawer.Screen name="📚 Catalogue" component={BooksStack} />
            <Drawer.Screen name="👤 Mon profil" component={ProfileScreen} />
          </>
        )}

        {/* USER */}
        {!isAdmin && !isStaff && (
          <>
            <Drawer.Screen name="📚 Catalogue" component={BooksStack} />
            <Drawer.Screen name="🔄 Mes emprunts" component={LoansStack} />
            <Drawer.Screen name="👤 Mon profil" component={ProfileScreen} />
          </>
        )}
      </Drawer.Navigator>
    </NavigationContainer>
  );
};

export const RoleBasedNavigator = () => {
  return <CommonDrawer />;
};