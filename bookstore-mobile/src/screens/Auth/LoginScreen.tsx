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
import { authService } from '../../services/auth.service';
import { RootStackParamList } from '../../types/navigation';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';

const { width, height } = Dimensions.get('window');

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

const GOOGLE_CLIENT_ID = Constants.expoConfig?.extra?.googleClientId || '';

WebBrowser.maybeCompleteAuthSession();

export const LoginScreen = () => {
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { setUser, setToken } = useAuthStore();

  // 🔥 Écouter le deep link retour
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
      // Extraire le token
      const token = url.split('token=')[1];
      if (token) {
        console.log('✅ Token reçu via deep link');
        // Ici tu peux stocker le token et connecter l'utilisateur
        Alert.alert('Connecté !', 'Vous êtes connecté avec succès');
      }
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);

      // 🔥 URL de retour vers l'app
      const returnUrl = Linking.createURL('auth-callback');
      console.log('📱 Return URL:', returnUrl);

      // 🔥 URL du backend (ngrok)
      const BACKEND_URL = 'https://lettuce-unlawful-disliking.ngrok-free.dev';
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
        // Le token sera reçu via le deep link
      }

      setGoogleLoading(false);
    } catch (error: any) {
      console.error('❌ Erreur Google:', error);
      Alert.alert('Erreur', error.message || 'Impossible de se connecter');
      setGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.circle3} />

        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <View style={styles.logoWrapper}>
              <LinearGradient
                colors={['#e94560', '#ff6b6b']}
                style={styles.logoGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.logoIcon}>📚</Text>
              </LinearGradient>
            </View>

            <Text style={styles.appName}>BookStore</Text>
            <Text style={styles.appSubtitle}>Votre bibliothèque numérique</Text>
          </View>

          <View style={styles.sloganContainer}>
            <Text style={styles.sloganText}>Gérez vos livres</Text>
            <Text style={styles.sloganText}>en toute simplicité</Text>
            <View style={styles.sloganLine} />
            <Text style={styles.sloganSubtext}>
              Accédez à votre bibliothèque en un clic
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleLogin}
              disabled={googleLoading}
              activeOpacity={0.85}
            >
              {googleLoading ? (
                <ActivityIndicator color="#4285F4" size="small" />
              ) : (
                <View style={styles.googleButtonContent}>
                  <View style={styles.googleIconWrapper}>
                    <Text style={styles.googleIcon}>G</Text>
                  </View>
                  <Text style={styles.googleButtonText}>
                    Continuer avec Google
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={styles.footerText}>
              En continuant, vous acceptez nos conditions d'utilisation
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
    backgroundColor: '#1a1a2e',
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
  circle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(233, 69, 96, 0.1)',
    top: -100,
    right: -100,
  },
  circle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(15, 52, 96, 0.3)',
    bottom: 100,
    left: -80,
  },
  circle3: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(233, 69, 96, 0.05)',
    bottom: 200,
    right: -50,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoWrapper: {
    width: 100,
    height: 100,
    borderRadius: 28,
    shadowColor: '#e94560',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
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
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 20,
    letterSpacing: 1,
  },
  appSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  sloganContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  sloganText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 38,
  },
  sloganLine: {
    width: 60,
    height: 3,
    backgroundColor: '#e94560',
    borderRadius: 2,
    marginTop: 20,
    marginBottom: 20,
  },
  sloganSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  buttonContainer: {
    alignItems: 'center',
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
    shadowOpacity: 0.15,
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
  footerText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    marginTop: 16,
    letterSpacing: 0.2,
  },
});
