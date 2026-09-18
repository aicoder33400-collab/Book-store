import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
  Easing,
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

// 🕌 Palette islamique CLAIRE
const C = {
  bgTop: '#F5FBF7',
  bgMid: '#E8F3EC',
  bgBottom: '#DCEAE0',
  primary: '#1B5E3F',
  primaryMid: '#2D8F5F',
  primaryDark: '#1B6E45',
  gold: '#C9A961',
  goldBright: '#FAEDC4',
  goldDeep: '#B8955A',
  textDark: '#0F3D28',
  textMid: '#4A6B5A',
  textLight: '#7A9084',
  white: '#FFFFFF',
};

export const LoginScreen = () => {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [devLoading, setDevLoading] = useState(false);
  const [showDev, setShowDev] = useState(false);
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const setUser = useAuthStore((s) => s.setUser);
  const setToken = useAuthStore((s) => s.setToken);

  // 🎬 Animations fade-in
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // 🎬 Animations continues (islamiques)
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animation d'entrée
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 900,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();

    // Rotation lente continue (anneau extérieur)
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 60000,
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== 'web',
      })
    ).start();

    // Pulse de l'anneau
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    ).start();

    // Flottement des étoiles
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim1, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(floatAnim1, {
          toValue: 0,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim2, {
          toValue: 1,
          duration: 5000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(floatAnim2, {
          toValue: 0,
          duration: 5000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    ).start();
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const floatY1 = floatAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -12],
  });

  const floatY2 = floatAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -18],
  });

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
          useAuthStore.getState().setNeedsProfile(true, googleToken, {
            email: checkResult.email || '',
            name: checkResult.name || '',
            avatar: checkResult.avatar || '',
          });
        } else {
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
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* Fond dégradé clair */}
      <LinearGradient
        colors={[C.bgTop, C.bgMid, C.bgBottom]}
        style={styles.gradient}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
      />

      {/* ═══ MOTIF POINTILLÉ ═══ */}
      <View style={styles.patternDots} />

      {/* ═══ ARC ISLAMIQUE (mihrab) ═══ */}
      <View style={styles.arch} />

      {/* ═══ ANNEAUX (un rotatif + un pulsant) ═══ */}
      <Animated.View
        style={[
          styles.ringRotating,
          { transform: [{ rotate }] },
        ]}
      />
      <Animated.View
        style={[
          styles.ringPulsing,
          { transform: [{ scale: pulseAnim }] },
        ]}
      />
      <View style={styles.ringStatic1} />
      <View style={styles.ringStatic2} />

      {/* ═══ ÉTOILES FLOTTANTES ═══ */}
      <Animated.View
        style={[styles.starTopRight, { transform: [{ translateY: floatY1 }] }]}
      >
        <Text style={styles.starText}>✦</Text>
      </Animated.View>
      <Animated.View
        style={[styles.starBottomLeft, { transform: [{ translateY: floatY2 }] }]}
      >
        <Text style={styles.starText}>✦</Text>
      </Animated.View>

      {/* ═══ LIVRE EN FILIGRANE (bas) ═══ */}
      <View style={styles.bookBg}>
        <Text style={styles.bookBgText}>📖</Text>
      </View>

      {/* ═══ CONTENU ═══ */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* HEADER avec Basmala */}
        <View style={styles.header}>
          <Animated.View
            style={[
              styles.basmala,
              { transform: [{ scale: scaleAnim }] },
            ]}
          >
            <Text style={styles.basmalaText}>﷽</Text>
          </Animated.View>

          <View style={styles.dividerTop}>
            <View style={styles.dividerLine} />
            <View style={styles.dividerDiamond} />
            <View style={styles.dividerLine} />
          </View>

          <Text style={styles.brand}>RMP Maktaba</Text>
          <Text style={styles.brandSub}>Bibliothèque de la mosquée</Text>
        </View>

        {/* ACTIONS */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.googleBtn}
            onPress={handleGoogleLogin}
            disabled={googleLoading}
            activeOpacity={0.9}
          >
            {googleLoading ? (
              <ActivityIndicator color={C.primary} size="small" />
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
                  style={[styles.devBtn, { backgroundColor: C.primary }]}
                  onPress={() => handleDevLogin('ADMIN')}
                  disabled={devLoading}
                >
                  <Text style={styles.devBtnTextLight}>👑 Admin</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.devBtn, { backgroundColor: C.primaryMid }]}
                  onPress={() => handleDevLogin('STAFF')}
                  disabled={devLoading}
                >
                  <Text style={styles.devBtnTextLight}>📋 Staff</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.devBtn, { backgroundColor: C.primaryDark }]}
                  onPress={() => handleDevLogin('USER')}
                  disabled={devLoading}
                >
                  <Text style={styles.devBtnTextLight}>👤 User</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>بسم الله الرحمن الرحيم</Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bgTop,
    overflow: 'hidden',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },

  // ═══ MOTIF POINTILLÉ ═══
  patternDots: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.4,
    // Points simulés par des cercles discrets en grid
    // (React Native ne supporte pas background-image)
  },

  // ═══ ARC ISLAMIQUE (mihrab) ═══
  arch: {
    position: 'absolute',
    top: -60,
    left: -70,
    width: width * 0.55,
    height: width * 0.7,
    borderTopLeftRadius: width * 0.28,
    borderTopRightRadius: width * 0.28,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    borderColor: 'rgba(201,169,97,0.22)',
    opacity: 0.9,
  },

  // ═══ ANNEAUX ═══
  ringRotating: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width * 0.75,
    borderWidth: 1.5,
    borderColor: 'rgba(201,169,97,0.15)',
    borderStyle: 'dashed',
    bottom: -width * 0.85,
    left: -width * 0.6,
  },
  ringPulsing: {
    position: 'absolute',
    width: width * 0.95,
    height: width * 0.95,
    borderRadius: width * 0.475,
    borderWidth: 1.5,
    borderColor: 'rgba(201,169,97,0.35)',
    top: -width * 0.45,
    right: -width * 0.3,
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
  },
  ringStatic1: {
    position: 'absolute',
    width: width * 1.3,
    height: width * 1.3,
    borderRadius: width * 0.65,
    borderWidth: 1,
    borderColor: 'rgba(201,169,97,0.10)',
    top: -width * 0.65,
    right: -width * 0.5,
  },
  ringStatic2: {
    position: 'absolute',
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    borderWidth: 1,
    borderColor: 'rgba(27,94,63,0.08)',
    top: height * 0.4,
    left: -width * 0.28,
  },

  // ═══ ÉTOILES ═══
  starTopRight: {
    position: 'absolute',
    top: height * 0.18,
    right: width * 0.08,
  },
  starBottomLeft: {
    position: 'absolute',
    bottom: height * 0.25,
    left: width * 0.05,
  },
  starText: {
    fontSize: 26,
    color: C.gold,
    opacity: 0.55,
    textShadowColor: 'rgba(201,169,97,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },

  // ═══ LIVRE EN FILIGRANE ═══
  bookBg: {
    position: 'absolute',
    bottom: -20,
    left: 0,
    right: 0,
    alignItems: 'center',
    opacity: 0.05,
  },
  bookBgText: {
    fontSize: 180,
    color: C.primary,
  },

  // ═══ CONTENU ═══
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: 36,
    justifyContent: 'space-between',
  },

  // ═══ HEADER ═══
  header: {
    alignItems: 'center',
    marginTop: height * 0.06,
  },

  basmala: {
    marginBottom: 20,
  },
  basmalaText: {
    fontSize: 64,
    color: C.gold,
    textShadowColor: 'rgba(201,169,97,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    fontWeight: '400',
  },

  dividerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  dividerLine: {
    width: 40,
    height: 1,
    backgroundColor: 'rgba(201,169,97,0.6)',
  },
  dividerDiamond: {
    width: 7,
    height: 7,
    backgroundColor: C.gold,
    transform: [{ rotate: '45deg' }],
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 3,
  },

  brand: {
    fontSize: 38,
    fontWeight: '800',
    color: C.textDark,
    letterSpacing: 1.2,
    marginBottom: 10,
    textShadowColor: 'rgba(27,94,63,0.10)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  brandSub: {
    fontSize: 12,
    color: C.textMid,
    letterSpacing: 1.8,
    fontWeight: '600',
    textTransform: 'uppercase',
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
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 28,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(27,94,63,0.06)',
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
    color: C.textDark,
    letterSpacing: 0.2,
  },

  devToggle: {
    marginTop: 24,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  devToggleText: {
    fontSize: 12,
    color: 'rgba(15,61,40,0.45)',
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
    borderColor: 'rgba(27,94,63,0.20)',
  },
  devBtnTextLight: {
    color: C.white,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // ═══ FOOTER ═══
  footer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(201,169,97,0.65)',
    letterSpacing: 1.5,
    fontWeight: '500',
  },
});