import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuthStore } from '../store/auth.store';
import { colors } from '../theme/colors';

// Screens existants
import { BooksScreen } from '../screens/Books/BooksScreen';
import { BookDetailScreen } from '../screens/Books/BookDetailScreen';
import { MyLoansScreen } from '../screens/Loans/MyLoansScreen';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';
import { DashboardScreen } from '../screens/Dashboard/DashboardScreen';
import { UsersScreen } from '../screens/Users/UserScreen';
import { SalesHistoryScreen } from '../screens/Sales/SalesHistoryScreen';
import { CreateSaleScreen } from '../screens/Sales/CreateSaleScreen';
import { AllLoansScreen } from '../screens/Loans/AllLoansScreen';
import { LoanDetailScreen } from '../screens/Loans/LoanDetailScreen';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

// Stack pour les livres
const BooksStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="BooksList" component={BooksScreen} />
    <Stack.Screen name="BookDetail" component={BookDetailScreen} />
  </Stack.Navigator>
);

// Stack pour les emprunts
const LoansStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MyLoans" component={MyLoansScreen} />
    <Stack.Screen name="LoanDetail" component={LoanDetailScreen} />
  </Stack.Navigator>
);

// Stack pour les ventes
const SalesStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="SalesHistory" component={SalesHistoryScreen} />
    <Stack.Screen name="CreateSale" component={CreateSaleScreen} />
  </Stack.Navigator>
);

// Stack pour l'admin
const AdminStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Dashboard" component={DashboardScreen} />
    <Stack.Screen name="Users" component={UsersScreen} />
    <Stack.Screen name="AllLoans" component={AllLoansScreen} />
  </Stack.Navigator>
);

// Menu commun
const CommonDrawer = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: true,
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.text.secondary,
        drawerStyle: { width: 280 },
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.text.white,
      }}
    >
      <Drawer.Screen name="Catalogue" component={BooksStack} />
      <Drawer.Screen name="Mes emprunts" component={LoansStack} />
      <Drawer.Screen name="Ventes" component={SalesStack} />
      <Drawer.Screen name="Mon profil" component={ProfileScreen} />

      {isAdmin && (
        <>
          <Drawer.Screen name="Dashboard Admin" component={AdminStack} />
          <Drawer.Screen name="Utilisateurs" component={UsersScreen} />
          <Drawer.Screen name="Tous les emprunts" component={AllLoansScreen} />
        </>
      )}
    </Drawer.Navigator>
  );
};

export const RoleBasedNavigator = () => {
  return <CommonDrawer />;
};