import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../store/auth.store';
import { RootStackParamList } from '../../types/navigation';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import { GoogleAuthService } from '../../services/google-auth.service';
import { authService } from '../../services/auth.service';

const { width, height } = Dimensions.get('window');

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

const GOOGLE_CLIENT_ID = Constants.expoConfig?.extra?.googleClientId || '';

const BACKEND_URL =
  Platform.OS === 'web'
    ? (typeof window !== 'undefined' ? window.location.origin : 'https://51-77-244-126.sslip.io')
    : (process.env.EXPO_PUBLIC_API_URL || 'https://51-77-244-126.sslip.io');

// 🕌 Palette islamique LUMINEUSE
const C = {
  // Vert émeraude plus vif et clair
  bgTop: '#3FA476',
  bgMid: '#2D8F5F',
  bgBottom: '#1B6E45',
  // Or lumineux
  gold: '#F0D98A',
  goldBright: '#FAEDC4',
  goldDeep: '#C9A961',
  // Blancs
  white: '#FFFFFF',
  whiteSoft: 'rgba(255,255,255,0.92)',
  whiteFaint: 'rgba(255,255,255,0.7)',
};

export const LoginScreen = () => {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [devLoading, setDevLoading] = useState(false);
  const [showDev, setShowDev] = useState(false);
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const setUser = useAuthStore((s) => s.setUser);
  const setToken = useAuthStore((s) => s.setToken);

  // Retour OAuth sur WEB
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const hash = window.location.hash;
    if (!hash || !hash.includes('id_token')) return;

    console.log('🔐 Retour OAuth détecté sur web, traitement...');
    setGoogleLoading(true);

    const params = new URLSearchParams(hash.substring(1));
    const googleToken = params.get('id_token');

    if (!googleToken) {
      console.error('❌ Pas de id_token dans le hash');
      setGoogleLoading(false);
      return;
    }

    window.history.replaceState({}, document.title, window.location.pathname);

    (async () => {
      try {
        const checkResult = await authService.checkGoogleUser(googleToken);
        console.log('📱 Résultat check:', checkResult);

        if (!checkResult.exists || checkResult.needsProfile) {
          console.log('🚀 Store: needsProfile = true');
          useAuthStore.getState().setNeedsProfile(true, googleToken, {
            email: checkResult.email || '',
            name: checkResult.name || '',
            avatar: checkResult.avatar || '',
          });
        } else {
          console.log('🎯 Connexion directe');
          const result = await authService.loginWithGoogle(googleToken);

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
            isProfileComplete: result.user.isProfileComplete ?? true,
          };

          setUser(user as any);
          setToken(result.token);
        }
      } catch (error: any) {
        console.error('❌ Erreur traitement OAuth:', error);
        setGoogleLoading(false);
      }
    })();
  }, []);

  // Deep link natif
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const handleDeepLink = async () => {
      const url = await Linking.getInitialURL();
      if (url) handleUrl(url);
    };

    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleUrl(url);
    });

    handleDeepLink();
    return () => subscription.remove();
  }, []);

  const handleUrl = async (url: string) => {
    if (url && url.includes('token=')) {
      const token = url.split('token=')[1]?.split('&')[0];
      if (token) {
        setToken(token);
        Alert.alert('Connecté !', 'Vous êtes connecté avec succès');
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          })
        );
      }
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      await GoogleAuthService.login();
    } catch (error: any) {
      console.error('❌ Erreur Google:', error);
      if (Platform.OS === 'web') {
        window.alert(error.message || 'Impossible de se connecter avec Google');
      } else {
        Alert.alert('Erreur', error.message || 'Impossible de se connecter avec Google');
      }
      setGoogleLoading(false);
    }
  };

  const handleDevLogin = async (role: 'ADMIN' | 'STAFF' | 'USER') => {
    try {
      setDevLoading(true);
      const roleNames = { ADMIN: 'Admin', STAFF: 'Staff', USER: 'User' };
      const name = `Dev ${roleNames[role]}`;
      const email = `dev-${role.toLowerCase()}@bookstore.local`;

      const response = await fetch(`${BACKEND_URL}/api/auth/dev-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, role }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Erreur backend (${response.status}): ${errText}`);
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
      if (Platform.OS === 'web') {
        window.alert(`Impossible de se connecter: ${error.message}`);
      } else {
        Alert.alert('Erreur', `Impossible de se connecter: ${error.message}`);
      }
    } finally {
      setDevLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Dégradé vert clair et lumineux */}
      <LinearGradient
        colors={[C.bgTop, C.bgMid, C.bgBottom]}
        style={styles.gradient}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
      >
        {/* ═══ MOTIFS DÉCORATIFS ISLAMIQUES ═══ */}

        {/* Grand cercle concentrique haut droite */}
        <View style={styles.ringTopOuter} />
        <View style={styles.ringTopInner} />

        {/* Cercle moyen bas gauche */}
        <View style={styles.ringBottomOuter} />

        {/* Petit cercle milieu */}
        <View style={styles.ringCenter} />

        {/* Arc islamique (mihrab) en haut gauche */}
        <View style={styles.archTopLeft} />

        {/* Arc islamique bas droite */}
        <View style={styles.archBottomRight} />

        {/* Étoile à 8 branches (motif islamique) en filigrane */}
        <View style={styles.starTopRight} />
        <View style={styles.starBottomLeft} />

        {/* CONTENU */}
        <View style={styles.content}>
          {/* ═══ LOGO ═══ */}
          <View style={styles.logoSection}>
            {/* Anneau doré extérieur */}
            <View style={styles.logoRingOuter}>
              {/* Anneau doré intérieur */}
              <View style={styles.logoRingInner}>
                <LinearGradient
                  colors={[C.goldBright, C.gold, C.goldDeep]}
                  style={styles.logoInner}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.logoEmoji}>🕌</Text>
                </LinearGradient>
              </View>
            </View>

            <Text style={styles.brand}>RMP Maktaba</Text>
            <Text style={styles.brandSub}>Bibliothèque de la mosquée</Text>

            {/* Ligne dorée décorative */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <View style={styles.dividerDiamond} />
              <View style={styles.dividerLine} />
            </View>
          </View>

          {/* ═══ ACTIONS ═══ */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.googleBtn}
              onPress={handleGoogleLogin}
              disabled={googleLoading}
              activeOpacity={0.9}
            >
              {googleLoading ? (
                <ActivityIndicator color={C.bgMid} size="small" />
              ) : (
                <>
                  <View style={styles.gIconWrap}>
                    <Text style={styles.gIcon}>G</Text>
                  </View>
                  <Text style={styles.gText}>Continuer avec Google</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.devToggle}
              onPress={() => setShowDev(!showDev)}
              activeOpacity={0.7}
            >
              <Text style={styles.devToggleText}>
                {showDev ? 'Masquer' : 'Mode développeur'}
              </Text>
            </TouchableOpacity>

            {showDev && (
              <View style={styles.devPanel}>
                <View style={styles.devRow}>
                  <TouchableOpacity
                    style={[styles.devBtn, { backgroundColor: C.gold }]}
                    onPress={() => handleDevLogin('ADMIN')}
                    disabled={devLoading}
                  >
                    <Text style={styles.devBtnTextDark}>👑 Admin</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.devBtn, { backgroundColor: '#4A8F6E' }]}
                    onPress={() => handleDevLogin('STAFF')}
                    disabled={devLoading}
                  >
                    <Text style={styles.devBtnText}>📋 Staff</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.devBtn, { backgroundColor: C.bgBottom }]}
                    onPress={() => handleDevLogin('USER')}
                    disabled={devLoading}
                  >
                    <Text style={styles.devBtnText}>👤 User</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* ═══ FOOTER épuré ═══ */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>﷽</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bgMid },
  gradient: { flex: 1 },

  // ═══ DÉCORS ISLAMIQUES ═══

  // Anneaux concentriques en haut droite
  ringTopOuter: {
    position: 'absolute',
    width: width * 1.4,
    height: width * 1.4,
    borderRadius: width * 0.7,
    borderWidth: 1.5,
    borderColor: 'rgba(250,237,196,0.20)',
    top: -width * 0.8,
    right: -width * 0.55,
  },
  ringTopInner: {
    position: 'absolute',
    width: width * 0.95,
    height: width * 0.95,
    borderRadius: width * 0.475,
    borderWidth: 1,
    borderColor: 'rgba(250,237,196,0.28)',
    top: -width * 0.5,
    right: -width * 0.3,
  },

  // Anneau bas gauche
  ringBottomOuter: {
    position: 'absolute',
    width: width * 1.3,
    height: width * 1.3,
    borderRadius: width * 0.65,
    borderWidth: 1.5,
    borderColor: 'rgba(250,237,196,0.12)',
    bottom: -width * 0.75,
    left: -width * 0.5,
  },

  // Anneau milieu gauche (plus discret)
  ringCenter: {
    position: 'absolute',
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    borderWidth: 1,
    borderColor: 'rgba(250,237,196,0.10)',
    top: height * 0.35,
    left: -width * 0.3,
  },

  // Arc islamique haut gauche (mihrab)
  archTopLeft: {
    position: 'absolute',
    width: width * 0.9,
    height: width * 0.45,
    borderTopLeftRadius: width * 0.45,
    borderTopRightRadius: width * 0.45,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    borderColor: 'rgba(250,237,196,0.18)',
    top: -width * 0.15,
    left: -width * 0.35,
    transform: [{ rotate: '-15deg' }],
  },

  // Arc islamique bas droite
  archBottomRight: {
    position: 'absolute',
    width: width * 1.1,
    height: width * 0.55,
    borderTopLeftRadius: width * 0.55,
    borderTopRightRadius: width * 0.55,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(250,237,196,0.10)',
    bottom: -width * 0.1,
    right: -width * 0.4,
    transform: [{ rotate: '160deg' }],
  },

  // Étoile à 8 branches (motif islamique) - simplifiée en cercle pointillé
  starTopRight: {
    position: 'absolute',
    width: width * 0.35,
    height: width * 0.35,
    borderRadius: width * 0.175,
    borderWidth: 1.5,
    borderColor: 'rgba(250,237,196,0.20)',
    borderStyle: 'dashed',
    top: height * 0.18,
    right: width * 0.08,
    transform: [{ rotate: '45deg' }],
  },
  starBottomLeft: {
    position: 'absolute',
    width: width * 0.25,
    height: width * 0.25,
    borderRadius: width * 0.125,
    borderWidth: 1,
    borderColor: 'rgba(250,237,196,0.15)',
    borderStyle: 'dashed',
    bottom: height * 0.25,
    left: width * 0.05,
    transform: [{ rotate: '22deg' }],
  },

  // ═══ CONTENU ═══
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: 36,
    justifyContent: 'space-between',
  },

  // ═══ LOGO ═══
  logoSection: {
    alignItems: 'center',
    marginTop: height * 0.05,
  },
  logoRingOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: 'rgba(250,237,196,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    backgroundColor: 'rgba(250,237,196,0.06)',
    shadowColor: C.goldBright,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 8,
  },
  logoRingInner: {
    width: 116,
    height: 116,
    borderRadius: 58,
    borderWidth: 1.5,
    borderColor: 'rgba(250,237,196,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 10,
  },
  logoEmoji: { fontSize: 52 },

  brand: {
    fontSize: 36,
    fontWeight: '800',
    color: C.white,
    letterSpacing: 1.2,
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.20)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  brandSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 1.5,
    fontWeight: '500',
    marginBottom: 18,
  },

  // Séparateur doré avec losange
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  dividerLine: {
    width: 30,
    height: 1,
    backgroundColor: 'rgba(250,237,196,0.5)',
  },
  dividerDiamond: {
    width: 6,
    height: 6,
    backgroundColor: C.goldBright,
    transform: [{ rotate: '45deg' }],
    shadowColor: C.goldBright,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 3,
  },

  // ═══ ACTIONS ═══
  actions: {
    width: '100%',
    alignItems: 'center',
  },
  googleBtn: {
    width: '100%',
    maxWidth: 380,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.white,
    borderRadius: 50,
    paddingVertical: 17,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 10,
  },
  gIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F3F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  gIcon: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#4285F4',
  },
  gText: {
    fontSize: 16,
    fontWeight: '700',
    color: C.bgBottom,
    letterSpacing: 0.2,
  },

  devToggle: {
    marginTop: 24,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  devToggleText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.5,
    textDecorationLine: 'underline',
  },
  devPanel: {
    marginTop: 14,
    width: '100%',
    maxWidth: 380,
  },
  devRow: {
    flexDirection: 'row',
    gap: 8,
  },
  devBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  devBtnText: {
    color: C.white,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  devBtnTextDark: {
    color: C.bgBottom,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // ═══ FOOTER (﷽ - Basmala stylisée) ═══
  footer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  footerText: {
    fontSize: 22,
    color: 'rgba(250,237,196,0.55)',
    letterSpacing: 2,
    fontWeight: '500',
  },
});