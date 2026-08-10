import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  SafeAreaView,
  Dimensions,
  StatusBar,
  Platform,  // 🔥 AJOUTÉ
} from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../store/auth.store';
import { authService } from '../../services/auth.service';
import { GoogleAuthService } from '../../services/google-auth.service';
import { colors } from '../../theme/colors';
import { RootStackParamList } from '../../types/navigation';

const { width, height } = Dimensions.get('window');

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

export const LoginScreen = () => {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [processingToken, setProcessingToken] = useState(false);
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { setUser, setToken } = useAuthStore();

  // 🔥 Traiter le token de Google
  useEffect(() => {
    if (processingToken) return;
    
    const hash = window.location.hash;
    if (hash && hash.includes('id_token')) {
      setProcessingToken(true);
      const params = new URLSearchParams(hash.substring(1));
      const idToken = params.get('id_token');
      
      if (idToken) {
        console.log('✅ Token Google trouvé');
        window.history.pushState('', document.title, window.location.pathname);
        
        authService.checkGoogleUser(idToken)
          .then((result) => {
            if (!result.exists || result.needsProfile) {
              navigation.navigate('CompleteProfile', {
                googleToken: idToken,
                email: result.email,
                name: result.name,
                avatar: result.avatar,
              });
              setProcessingToken(false);
              return;
            }
            return authService.loginWithGoogle(idToken);
          })
          .then((result) => {
            if (result?.user) {
              const user = {
                id: result.user.id,
                name: result.user.name,
                email: result.user.email,
                phone: result.user.phone || null,
                role: result.user.role || 'USER',
                authProvider: 'google' as const,
                avatar: result.user.avatar || null,
                emailVerified: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                lastLoginAt: null,
                googleId: null,
                firstName: result.user.firstName || null,
                lastName: result.user.lastName || null,
                age: result.user.age || null,
                commune: result.user.commune || null,
                isProfileComplete: true,
              };
              setUser(user);
              setToken(result.token);
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Main' }],
                })
              );
            }
            setProcessingToken(false);
          })
          .catch((error) => {
            console.error('❌ Erreur:', error);
            setProcessingToken(false);
          });
      }
    }
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      await GoogleAuthService.login();
      setGoogleLoading(false);
    } catch (error: any) {
      console.error('❌ Erreur Google:', error);
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
        {/* Décoration - Cercles flous */}
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.circle3} />

        <View style={styles.content}>
          {/* Logo / Icône */}
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

          {/* Slogan */}
          <View style={styles.sloganContainer}>
            <Text style={styles.sloganText}>Gérez vos livres</Text>
            <Text style={styles.sloganText}>en toute simplicité</Text>
            <View style={styles.sloganLine} />
            <Text style={styles.sloganSubtext}>
              Accédez à votre bibliothèque en un clic
            </Text>
          </View>

          {/* Bouton Google */}
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
  
  // 🔥 Cercles décoratifs
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

  // 🔥 Logo
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

  // 🔥 Slogan
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

  // 🔥 Bouton Google
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