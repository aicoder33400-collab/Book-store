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
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';

const { width, height } = Dimensions.get('window');

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

const GOOGLE_CLIENT_ID = Constants.expoConfig?.extra?.googleClientId || '';

WebBrowser.maybeCompleteAuthSession();

// 🕌 Palette cohérente
const C = {
  bgDark: '#0F3D28',      // Vert très foncé (fond haut)
  bgMid: '#1B5E3F',       // Vert moyen (fond milieu)
  bgLight: '#246B49',     // Vert plus clair (fond bas)
  gold: '#C9A961',        // Or principal
  goldLight: '#E5C989',   // Or clair
  white: '#FFFFFF',
  whiteSoft: 'rgba(255,255,255,0.7)',
  whiteFaint: 'rgba(255,255,255,0.15)',
  whiteLine: 'rgba(255,255,255,0.2)',
};

export const LoginScreen = () => {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [devLoading, setDevLoading] = useState(false);
  const [showDev, setShowDev] = useState(false);
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { setUser, setToken } = useAuthStore();

  useEffect(() => {
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

      const result = await WebBrowser.openAuthSessionAsync(authUrl, returnUrl);
      console.log('📱 Résultat:', result.type);
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
      const roleNames = { ADMIN: 'Admin', STAFF: 'Staff', USER: 'User' };
      const name = `Dev ${roleNames[role]}`;
      const email = `dev-${role.toLowerCase()}@bookstore.local`;

      const BACKEND_URL = 'http://localhost:3000';
      const response = await fetch(`${BACKEND_URL}/api/auth/dev-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, role }),
      });

      if (!response.ok) throw new Error('Erreur backend');

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
      Alert.alert('Erreur', 'Impossible de se connecter');
    } finally {
      setDevLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* 🕌 Fond dégradé vert plein écran */}
      <LinearGradient
        colors={[C.bgDark, C.bgMid, C.bgLight]}
        style={styles.gradient}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      >
        {/* Motif discret : 2 cercles en filigrane */}
        <View style={styles.haloTop} />
        <View style={styles.haloBottom} />

        {/* CONTENU */}
        <View style={styles.content}>

          {/* ─── LOGO ─── */}
          <View style={styles.logoSection}>
            <View style={styles.logoRing}>
              <LinearGradient
                colors={[C.goldLight, C.gold]}
                style={styles.logoInner}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.logoEmoji}>🕌</Text>
              </LinearGradient>
            </View>
            <Text style={styles.brand}>RMP Maktaba</Text>
            <Text style={styles.brandSub}>Bibliothèque de la mosquée</Text>
          </View>

          {/* ─── BOUTON GOOGLE ─── */}
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

            {/* Lien dev discret */}
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
                    <Text style={styles.devBtnText}>👑 Admin</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.devBtn, { backgroundColor: C.bgLight }]}
                    onPress={() => handleDevLogin('STAFF')}
                    disabled={devLoading}
                  >
                    <Text style={styles.devBtnText}>📋 Staff</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.devBtn, { backgroundColor: C.bgDark }]}
                    onPress={() => handleDevLogin('USER')}
                    disabled={devLoading}
                  >
                    <Text style={styles.devBtnText}>👤 User</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* ─── FOOTER ─── */}
          <View style={styles.footer}>
            <View style={styles.footerLine} />
            <Text style={styles.footerText}>
              En continuant, vous acceptez nos conditions
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bgDark },
  gradient: { flex: 1 },

  // Motifs discrets (2 cercles en filigrane or)
  haloTop: {
    position: 'absolute',
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: width * 0.45,
    borderWidth: 1,
    borderColor: 'rgba(201,169,97,0.10)',
    top: -width * 0.35,
    right: -width * 0.25,
  },
  haloBottom: {
    position: 'absolute',
    width: width * 1.1,
    height: width * 1.1,
    borderRadius: width * 0.55,
    borderWidth: 1,
    borderColor: 'rgba(201,169,97,0.07)',
    bottom: -width * 0.5,
    left: -width * 0.35,
  },

  // Contenu
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: 36,
    justifyContent: 'space-between',
  },

  // ─── Logo ───
  logoSection: {
    alignItems: 'center',
    marginTop: height * 0.06,
  },
  logoRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: 'rgba(201,169,97,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  logoInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  logoEmoji: { fontSize: 46 },
  brand: {
    fontSize: 32,
    fontWeight: '700',
    color: C.white,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  brandSub: {
    fontSize: 13,
    color: C.whiteSoft,
    letterSpacing: 1.2,
    fontWeight: '400',
  },

  // ─── Actions ───
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
    paddingVertical: 16,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
  },
  gIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F3F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  gIcon: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4285F4',
  },
  gText: {
    fontSize: 16,
    fontWeight: '600',
    color: C.bgDark,
    letterSpacing: 0.2,
  },

  // ─── Dev ───
  devToggle: {
    marginTop: 22,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  devToggleText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
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
    borderColor: 'rgba(255,255,255,0.15)',
  },
  devBtnText: {
    color: C.white,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // ─── Footer ───
  footer: {
    alignItems: 'center',
  },
  footerLine: {
    width: 40,
    height: 2,
    backgroundColor: C.gold,
    borderRadius: 1,
    marginBottom: 12,
    opacity: 0.5,
  },
  footerText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
});
