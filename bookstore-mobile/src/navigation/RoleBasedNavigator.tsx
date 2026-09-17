import React, { useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuthStore } from '../store/auth.store';
import { colors } from '../theme/colors';
import { UserMenu } from '../components/UserMenu';
import { UserNotificationBadge } from '../components/UserNotificationBadge';

// Screens
import { LoginScreen } from '../screens/Auth/LoginScreen';
import { CompleteProfileScreen } from '../screens/Auth/CompleteProfileScreen';
import { CompleteProfileRedirect } from '../screens/Auth/CompleteProfileRedirect';
import { CallbackScreen } from '../screens/Auth/CallbackScreen';
import { BooksScreen } from '../screens/Books/BooksScreen';
import { BookDetailScreen } from '../screens/Books/BookDetailScreen';
import { AddBookScreen } from '../screens/Books/AddBookScreen';
import { MyLoansScreen } from '../screens/Loans/MyLoansScreen';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';
import { DashboardScreen } from '../screens/Dashboard/DashboardScreen';
import { UsersScreen } from '../screens/Users/UserScreen';
import { AllLoansScreen } from '../screens/Loans/AllLoansScreen';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

// ═══════════════════════════════════════════════════
// STACKS INTERNES
// ═══════════════════════════════════════════════════

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
    <Stack.Screen
      name="AddBook"
      component={AddBookScreen}
      options={{
        headerShown: true,
        title: 'Ajouter un livre',
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.text.white,
        headerBackTitle: 'Retour',
      }}
    />
  </Stack.Navigator>
);

const LoansStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MyLoans" component={MyLoansScreen} />
  </Stack.Navigator>
);

// ═══════════════════════════════════════════════════
// HEADERS
// ═══════════════════════════════════════════════════

const UserAvatar = () => {
  const user = useAuthStore((s) => s.user);
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={{ marginRight: 16 }}
        onPress={() => setMenuVisible(true)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0).toUpperCase() || '?'}
          </Text>
        </View>
      </TouchableOpacity>
      <UserMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </>
  );
};

const UserHeaderRight = () => (
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <UserNotificationBadge />
    <UserAvatar />
  </View>
);

const AdminHeaderRight = () => <UserAvatar />;

// ═══════════════════════════════════════════════════
// DRAWER (utilisateurs connectés)
// ═══════════════════════════════════════════════════

const DrawerNavigator = () => {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'ADMIN';
  const isStaff = user?.role === 'STAFF';
  const isUser = !isAdmin && !isStaff;

  return (
    <Drawer.Navigator
      key={user?.id || 'default'}
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
        drawerActiveTintColor: '#6C63FF',
        drawerInactiveTintColor: '#1a1a2e',
        drawerActiveBackgroundColor: '#6C63FF15',
        drawerStyle: {
          width: 280,
          backgroundColor: '#ffffff',
        },
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.text.white,
        headerRight: isUser ? UserHeaderRight : AdminHeaderRight,
        headerLeftContainerStyle: { paddingLeft: 8 },
        drawerLabelStyle: {
          fontSize: 15,
          fontWeight: '500',
          color: '#1a1a2e',
        },
        drawerItemStyle: {
          borderRadius: 8,
          marginHorizontal: 8,
        },
      }}
    >
      {isAdmin && (
        <>
          <Drawer.Screen
            name="Dashboard"
            component={DashboardScreen}
            options={{ title: '📊 Dashboard', headerTitle: '📊 Dashboard' }}
          />
          <Drawer.Screen
            name="Historique des demandes"
            component={AllLoansScreen}
            options={{ title: '📋 Historique des demandes', headerTitle: '📋 Historique des demandes' }}
          />
          <Drawer.Screen
            name="Catalogue"
            component={BooksStack}
            options={{ title: '📚 Catalogue', headerTitle: '📚 Catalogue' }}
          />
          <Drawer.Screen
            name="Utilisateurs"
            component={UsersScreen}
            options={{ title: '👥 Utilisateurs', headerTitle: '👥 Utilisateurs' }}
          />
          <Drawer.Screen
            name="Mon profil"
            component={ProfileScreen}
            options={{ title: '👤 Mon profil', headerTitle: '👤 Mon profil' }}
          />
        </>
      )}

      {isStaff && (
        <>
          <Drawer.Screen
            name="Demandes"
            component={AllLoansScreen}
            options={{ title: '📋 Demandes', headerTitle: '📋 Demandes' }}
          />
          <Drawer.Screen
            name="Catalogue"
            component={BooksStack}
            options={{ title: '📚 Catalogue', headerTitle: '📚 Catalogue' }}
          />
          <Drawer.Screen
            name="Mon profil"
            component={ProfileScreen}
            options={{ title: '👤 Mon profil', headerTitle: '👤 Mon profil' }}
          />
        </>
      )}

      {isUser && (
        <>
          <Drawer.Screen
            name="Catalogue"
            component={BooksStack}
            options={{ title: '📚 Catalogue', headerTitle: '📚 Catalogue' }}
          />
          <Drawer.Screen
            name="Mes demandes"
            component={LoansStack}
            options={{ title: '📩 Mes demandes', headerTitle: '📩 Mes demandes' }}
          />
          <Drawer.Screen
            name="Mon profil"
            component={ProfileScreen}
            options={{ title: '👤 Mon profil', headerTitle: '👤 Mon profil' }}
          />
        </>
      )}
    </Drawer.Navigator>
  );
};

// ═══════════════════════════════════════════════════
// STACK AUTH (non connecté) — avec OAuth Google
// ═══════════════════════════════════════════════════

const AuthStack = () => {
  const needsProfile = useAuthStore((s) => s.needsProfile);
  const googleToken = useAuthStore((s) => s.googleToken);
  const googleUserData = useAuthStore((s) => s.googleUserData);

  // 🔥 Route initiale selon l'état OAuth
  let initialRoute: string = 'Login';
  if (needsProfile && googleToken) {
    initialRoute = 'CompleteProfile';
  }

  console.log('🎨 AuthStack render:', { initialRoute, needsProfile, hasToken: !!googleToken });

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.text.white,
        headerBackTitle: 'Retour',
      }}
    >
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
        initialParams={
          needsProfile && googleToken
            ? {
                googleToken,
                email: googleUserData?.email || '',
                name: googleUserData?.name || '',
                avatar: googleUserData?.avatar || '',
              }
            : undefined
        }
        options={{
           headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

// ═══════════════════════════════════════════════════
// RACINE
// ═══════════════════════════════════════════════════

export const RoleBasedNavigator = () => {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const needsProfile = useAuthStore((s) => s.needsProfile);

  console.log('🎨 RoleBasedNavigator render:', {
    user: !!user,
    isLoading,
    needsProfile,
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // 🔥 Clé de navigation pour forcer le remount lors des transitions d'état
  const navKey = user ? 'auth' : needsProfile ? 'profile' : 'guest';

  return (
    <NavigationContainer key={navKey}>
      {user ? <DrawerNavigator /> : <AuthStack />}
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
  avatarContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});