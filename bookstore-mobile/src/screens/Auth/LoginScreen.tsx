import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  StatusBar,
  Alert,
} from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../store/auth.store';
import { RootStackParamList } from '../../types/navigation';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

const GOOGLE_CLIENT_ID = Constants.expoConfig?.extra?.googleClientId || '';

WebBrowser.maybeCompleteAuthSession();

export const LoginScreen = () => {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [devLoading, setDevLoading] = useState(false);
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { setUser, setToken } = useAuthStore();

  useEffect(() => {
    const handleDeepLink = async () => {
      const url = await Linking.getInitialURL();
      if (url) {
        handleUrl(url);
      }
    };

    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleUrl(url);
    });

    handleDeepLink();

    return () => {
      subscription.remove();
    };
  }, []);

  const handleUrl = async (url: string) => {
    console.log('🔗 Deep link reçu:', url);

    if (url && url.includes('token=')) {
      const token = url.split('token=')[1];
      if (token) {
        console.log('✅ Token reçu via deep link');
        Alert.alert('Connecté !', 'Vous êtes connecté avec succès');
      }
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);

      const returnUrl = Linking.createURL('auth-callback');
      const BACKEND_URL = 'http://localhost:3000';
      const authUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${GOOGLE_CLIENT_ID}&` +
        `redirect_uri=${BACKEND_URL}/api/auth/google/callback&` +
        `response_type=code&` +
        `scope=openid%20profile%20email&` +
        `state=${encodeURIComponent(returnUrl)}&` +
        `prompt=select_account`;

      console.log('🔗 URL:', authUrl);

      const result = await WebBrowser.openAuthSessionAsync(authUrl, returnUrl);

      console.log('📱 Résultat:', result.type);

      if (result.type === 'success' && result.url) {
        console.log('✅ URL retour:', result.url);
      }

      setGoogleLoading(false);
    } catch (error: any) {
      console.error('❌ Erreur Google:', error);
      Alert.alert('Erreur', error.message || 'Impossible de se connecter');
      setGoogleLoading(false);
    }
  };

  const handleDevLogin = async (role: 'ADMIN' | 'STAFF' | 'USER') => {
    try {
      setDevLoading(true);

      const roleNames = {
        ADMIN: 'Admin',
        STAFF: 'Staff',
        USER: 'User'
      };
      const name = `Dev ${roleNames[role]}`;
      const email = `dev-${role.toLowerCase()}@bookstore.local`;

      const BACKEND_URL = 'http://localhost:3000';
      const response = await fetch(`${BACKEND_URL}/api/auth/dev-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          name: name,
          role: role,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur backend');
      }

      const data = await response.json();
      
      setUser(data.user);
      setToken(data.token);

      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        })
      );
    } catch (error: any) {
      console.error('❌ Erreur Dev Login:', error);
      Alert.alert('Erreur', 'Impossible de se connecter en mode développement');
    } finally {
      setDevLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <LinearGradient
        colors={['#0a1a1a', '#0d2a2a', '#0f3a3a']}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Motifs décoratifs islamiques */}
        <View style={styles.pattern1} />
        <View style={styles.pattern2} />
        <View style={styles.pattern3} />

        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <View style={styles.logoWrapper}>
              <LinearGradient
                colors={['#2d7d46', '#1a5c3a']}
                style={styles.logoGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.logoIcon}>🕌</Text>
              </LinearGradient>
            </View>

            <Text style={styles.appName}>RMP Maktaba</Text>
            <Text style={styles.appSubtitle}>Bibliothèque de la mosquée</Text>
          </View>

          <View style={styles.sloganContainer}>
            <View style={styles.sloganLine} />
            <Text style={styles.sloganText}>Bienvenue</Text>
            <Text style={styles.sloganSubtext}>
              Accédez à votre bibliothèque
            </Text>
            <View style={styles.sloganLine} />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleLogin}
              disabled={googleLoading}
              activeOpacity={0.85}
            >
              {googleLoading ? (
                <ActivityIndicator color="#2d7d46" size="small" />
              ) : (
                <View style={styles.googleButtonContent}>
                  <View style={styles.googleIconWrapper}>
                    <Text style={styles.googleIcon}>G</Text>
                  </View>
                  <Text style={styles.googleButtonText}>
                    Connexion avec Google
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.devDividerContainer}>
              <View style={styles.devDivider} />
              <Text style={styles.devDividerText}>ou</Text>
              <View style={styles.devDivider} />
            </View>

            <View style={styles.devContainer}>
              <Text style={styles.devLabel}>🔧 Développeur</Text>
              <View style={styles.devButtons}>
                <TouchableOpacity
                  style={[styles.devButton, styles.devAdmin]}
                  onPress={() => handleDevLogin('ADMIN')}
                  disabled={devLoading}
                >
                  <Text style={styles.devButtonText}>👑 Admin</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.devButton, styles.devStaff]}
                  onPress={() => handleDevLogin('STAFF')}
                  disabled={devLoading}
                >
                  <Text style={styles.devButtonText}>📋 Staff</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.devButton, styles.devUser]}
                  onPress={() => handleDevLogin('USER')}
                  disabled={devLoading}
                >
                  <Text style={styles.devButtonText}>👤 User</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.footerText}>
              En continuant, vous acceptez nos conditions
            </Text>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a1a1a',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: height * 0.08,
    paddingBottom: 40,
  },
  // Motifs islamiques décoratifs
  pattern1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(45, 125, 70, 0.08)',
    top: -50,
    right: -50,
    borderWidth: 2,
    borderColor: 'rgba(45, 125, 70, 0.1)',
  },
  pattern2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(45, 125, 70, 0.05)',
    bottom: 150,
    left: -60,
    borderWidth: 2,
    borderColor: 'rgba(45, 125, 70, 0.08)',
  },
  pattern3: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(45, 125, 70, 0.05)',
    bottom: 250,
    right: -30,
    borderWidth: 2,
    borderColor: 'rgba(45, 125, 70, 0.08)',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoWrapper: {
    width: 100,
    height: 100,
    borderRadius: 28,
    shadowColor: '#2d7d46',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logoGradient: {
    width: 100,
    height: 100,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoIcon: {
    fontSize: 48,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 20,
    letterSpacing: 2,
  },
  appSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 6,
    letterSpacing: 1,
  },
  sloganContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  sloganLine: {
    width: 60,
    height: 2,
    backgroundColor: '#2d7d46',
    borderRadius: 1,
    marginVertical: 12,
  },
  sloganText: {
    fontSize: 24,
    fontWeight: '500',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 1,
  },
  sloganSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginTop: 6,
  },
  buttonContainer: {
    alignItems: 'center',
    width: '100%',
  },
  googleButton: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4285F4',
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
    letterSpacing: 0.3,
  },
  devDividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    width: '100%',
    maxWidth: 360,
  },
  devDivider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  devDividerText: {
    marginHorizontal: 12,
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
  },
  devContainer: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  devLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  devButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 8,
  },
  devButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  devAdmin: {
    backgroundColor: '#2d7d46',
  },
  devStaff: {
    backgroundColor: '#4a9a5a',
  },
  devUser: {
    backgroundColor: '#5a5a5a',
  },
  devButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  footerText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.2)',
    textAlign: 'center',
    marginTop: 16,
    letterSpacing: 0.2,
  },
});