import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
  Dimensions,
  Animated,
  KeyboardAvoidingView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/auth.store';
import { GoogleAuthService } from '../../services/google-auth.service';

const { width, height } = Dimensions.get('window');

// 🕌 Palette islamique CLAIRE
const C = {
  bgTop: '#FAFDFB',
  bgMid: '#F0F7F3',
  bgBottom: '#E3EFE7',
  primary: '#1B5E3F',
  primarySoft: 'rgba(27,94,63,0.08)',
  gold: '#C9A961',
  goldLight: '#E5C989',
  goldBright: '#FAEDC4',
  textDark: '#0F3D28',
  textMid: '#4A6B5A',
  textLight: '#7A9084',
  white: '#FFFFFF',
  danger: '#B53A3A',
};

export const CompleteProfileScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  const params = route.params as any;
  const googleToken = params?.googleToken || '';
  const userEmail = params?.email || '';

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [ageGroup, setAgeGroup] = useState<'major' | 'minor' | null>(null);
  const [commune, setCommune] = useState('');
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    phone?: string;
    ageGroup?: string;
    commune?: string;
  }>({});

  // 🎬 Animation fade-in
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  }, []);

  const validate = () => {
    const newErrors: typeof errors = {};
    let isValid = true;

    if (!firstName.trim()) {
      newErrors.firstName = 'Le prénom est obligatoire';
      isValid = false;
    } else if (!/^[a-zA-ZÀ-ÿ\s'-]{2,30}$/.test(firstName.trim())) {
      newErrors.firstName = 'Prénom invalide (lettres, 2-30 caractères)';
      isValid = false;
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'Le nom est obligatoire';
      isValid = false;
    } else if (!/^[a-zA-ZÀ-ÿ\s'-]{2,30}$/.test(lastName.trim())) {
      newErrors.lastName = 'Nom invalide (lettres, 2-30 caractères)';
      isValid = false;
    }

    const cleanPhone = phone.replace(/[\s\-\.\(\)]/g, '');
    if (!cleanPhone) {
      newErrors.phone = 'Le téléphone est obligatoire';
      isValid = false;
    } else if (!/^[+]?[0-9]{8,15}$/.test(cleanPhone)) {
      newErrors.phone = 'Numéro invalide (8 à 15 chiffres, + autorisé)';
      isValid = false;
    } else if (/^(\d)\1+$/.test(cleanPhone.replace(/^\+/, ''))) {
      newErrors.phone = 'Numéro invalide';
      isValid = false;
    } else if (
      /^(?:\+33|0)/.test(cleanPhone) &&
      !/^(?:\+33|0)[1-9][0-9]{8}$/.test(cleanPhone)
    ) {
      newErrors.phone = 'Numéro français invalide (10 chiffres attendus)';
      isValid = false;
    }

    if (!ageGroup) {
      newErrors.ageGroup = 'Veuillez sélectionner votre tranche d\'âge';
      isValid = false;
    }

    if (!commune.trim()) {
      newErrors.commune = 'La commune est obligatoire';
      isValid = false;
    } else if (commune.trim().length < 2) {
      newErrors.commune = 'Commune invalide (minimum 2 caractères)';
      isValid = false;
    } else if (!/^[a-zA-ZÀ-ÿ\s'-]{2,50}$/.test(commune.trim())) {
      newErrors.commune = 'Commune invalide (lettres uniquement)';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.replace(/[\s\-\.\(\)]/g, ''),
        age: ageGroup === 'major' ? 25 : 17,
        commune: commune.trim(),
      };

      const result = await GoogleAuthService.completeProfile(googleToken, payload);

      if (result.success) {
        const setUser = useAuthStore.getState().setUser;
        const setToken = useAuthStore.getState().setToken;

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

        setUser(user as any);
        setToken(result.token);
      }
    } catch (error: any) {
      const msg =
        error.response?.data?.error ||
        'Erreur lors de l\'inscription. Veuillez réessayer.';
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Erreur', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* ═══ FOND DÉCORÉ ═══ */}
      <LinearGradient
        colors={[C.bgTop, C.bgMid, C.bgBottom]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
      />

      {/* Motifs islamiques (anneaux + arcs) */}
      <View style={styles.ringTopRightOuter} />
      <View style={styles.ringTopRightInner} />
      <View style={styles.ringBottomLeft} />
      <View style={styles.ringMidLeft} />
      <View style={styles.archTopLeft} />
      <View style={styles.archBottomRight} />
      <View style={styles.starTopRight} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 24,
            paddingBottom: insets.bottom + 40,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={true}
        overScrollMode="auto"
        nestedScrollEnabled={true}
        contentInsetAdjustmentBehavior="automatic"
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* ═══ HEADER ═══ */}
          <View style={styles.header}>
            <Text style={styles.basmala}>﷽</Text>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <View style={styles.dividerDiamond} />
              <View style={styles.dividerLine} />
            </View>

            <Text style={styles.title}>Bienvenue !</Text>
            <Text style={styles.subtitle}>
              Plus qu'une étape pour rejoindre la bibliothèque
            </Text>

            {userEmail ? (
              <View style={styles.emailBadge}>
                <Text style={styles.emailBadgeText}>📧 {userEmail}</Text>
              </View>
            ) : null}
          </View>

          {/* ═══ FORMULAIRE ═══ */}
          <View style={styles.form}>
            {/* Prénom */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Prénom <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.firstName && styles.inputError]}
                placeholder="Votre prénom"
                placeholderTextColor={C.textLight}
                value={firstName}
                onChangeText={(text) => {
                  setFirstName(text);
                  if (errors.firstName) setErrors({ ...errors, firstName: undefined });
                }}
                autoCapitalize="words"
                autoCorrect={false}
              />
              {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
            </View>

            {/* Nom */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Nom <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.lastName && styles.inputError]}
                placeholder="Votre nom"
                placeholderTextColor={C.textLight}
                value={lastName}
                onChangeText={(text) => {
                  setLastName(text);
                  if (errors.lastName) setErrors({ ...errors, lastName: undefined });
                }}
                autoCapitalize="words"
                autoCorrect={false}
              />
              {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
            </View>

            {/* Téléphone */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Téléphone <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.phone && styles.inputError]}
                placeholder="06 12 34 56 78"
                placeholderTextColor={C.textLight}
                value={phone}
                onChangeText={(text) => {
                  setPhone(text);
                  if (errors.phone) setErrors({ ...errors, phone: undefined });
                }}
                keyboardType="phone-pad"
              />
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>

            {/* Tranche d'âge */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Tranche d'âge <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.ageContainer}>
                <TouchableOpacity
                  style={[styles.ageButton, ageGroup === 'minor' && styles.ageButtonSelected]}
                  onPress={() => {
                    setAgeGroup('minor');
                    if (errors.ageGroup) setErrors({ ...errors, ageGroup: undefined });
                  }}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.ageButtonText,
                      ageGroup === 'minor' && styles.ageButtonTextSelected,
                    ]}
                  >
                    Moins de 18 ans
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.ageButton, ageGroup === 'major' && styles.ageButtonSelected]}
                  onPress={() => {
                    setAgeGroup('major');
                    if (errors.ageGroup) setErrors({ ...errors, ageGroup: undefined });
                  }}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.ageButtonText,
                      ageGroup === 'major' && styles.ageButtonTextSelected,
                    ]}
                  >
                    18 ans et plus
                  </Text>
                </TouchableOpacity>
              </View>
              {errors.ageGroup && <Text style={styles.errorText}>{errors.ageGroup}</Text>}
            </View>

            {/* Commune */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Commune <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.commune && styles.inputError]}
                placeholder="Votre ville"
                placeholderTextColor={C.textLight}
                value={commune}
                onChangeText={(text) => {
                  setCommune(text);
                  if (errors.commune) setErrors({ ...errors, commune: undefined });
                }}
                autoCapitalize="words"
                autoCorrect={false}
              />
              {errors.commune && <Text style={styles.errorText}>{errors.commune}</Text>}
            </View>

            {/* Bouton */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={C.white} />
              ) : (
                <Text style={styles.buttonText}>Rejoindre la bibliothèque</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.footerText}>
              En continuant, vous acceptez nos conditions d'utilisation
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bgTop,
    overflow: 'hidden',   // ⚠️ Bloque le scroll horizontal du body
  },
  scroll: {
    flex: 1,
    width: '100%',
  },

  // ═══ DÉCORS ISLAMIQUES ═══
  ringTopRightOuter: {
    position: 'absolute',
    width: width * 1.4,
    height: width * 1.4,
    borderRadius: width * 0.7,
    borderWidth: 1.5,
    borderColor: 'rgba(201,169,97,0.18)',
    top: -width * 0.85,
    right: -width * 0.55,
  },
  ringTopRightInner: {
    position: 'absolute',
    width: width * 0.95,
    height: width * 0.95,
    borderRadius: width * 0.475,
    borderWidth: 1,
    borderColor: 'rgba(201,169,97,0.25)',
    top: -width * 0.55,
    right: -width * 0.35,
  },
  ringBottomLeft: {
    position: 'absolute',
    width: width * 1.3,
    height: width * 1.3,
    borderRadius: width * 0.65,
    borderWidth: 1.5,
    borderColor: 'rgba(27,94,63,0.06)',
    bottom: -width * 0.85,
    left: -width * 0.55,
  },
  ringMidLeft: {
    position: 'absolute',
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    borderWidth: 1,
    borderColor: 'rgba(201,169,97,0.10)',
    top: height * 0.4,
    left: -width * 0.35,
  },
  archTopLeft: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.4,
    borderTopLeftRadius: width * 0.4,
    borderTopRightRadius: width * 0.4,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    borderColor: 'rgba(201,169,97,0.14)',
    top: width * 0.55,
    left: -width * 0.35,
    transform: [{ rotate: '-20deg' }],
  },
  archBottomRight: {
    position: 'absolute',
    width: width * 0.9,
    height: width * 0.45,
    borderTopLeftRadius: width * 0.45,
    borderTopRightRadius: width * 0.45,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(201,169,97,0.10)',
    bottom: width * 0.3,
    right: -width * 0.4,
    transform: [{ rotate: '160deg' }],
  },
  starTopRight: {
    position: 'absolute',
    width: width * 0.32,
    height: width * 0.32,
    borderRadius: width * 0.16,
    borderWidth: 1.5,
    borderColor: 'rgba(201,169,97,0.15)',
    borderStyle: 'dashed',
    top: height * 0.22,
    right: width * 0.06,
    transform: [{ rotate: '45deg' }],
  },

  // ═══ CONTENU ═══
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },

  // ═══ HEADER ═══
  header: {
    alignItems: 'center',
    marginBottom: 26,
  },
  basmala: {
    fontSize: 48,
    color: C.gold,
    textShadowColor: 'rgba(201,169,97,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
    marginBottom: 12,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  dividerLine: {
    width: 32,
    height: 1,
    backgroundColor: 'rgba(201,169,97,0.5)',
  },
  dividerDiamond: {
    width: 6,
    height: 6,
    backgroundColor: C.gold,
    transform: [{ rotate: '45deg' }],
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: C.textDark,
    marginBottom: 8,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: C.textMid,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  emailBadge: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(201,169,97,0.35)',
    shadowColor: 'rgba(15,61,40,0.08)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  emailBadgeText: {
    fontSize: 13,
    color: C.textDark,
    fontWeight: '600',
  },

  // ═══ FORMULAIRE ═══
  form: { flex: 1 },
  inputGroup: { marginBottom: 14 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: C.textDark,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  required: { color: C.gold, fontSize: 14 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: C.textDark,
    borderWidth: 1,
    borderColor: 'rgba(201,169,97,0.25)',
    shadowColor: 'rgba(15,61,40,0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 1,
  },
  inputError: { borderColor: C.danger, borderWidth: 1.5 },
  errorText: {
    fontSize: 12,
    color: C.danger,
    marginTop: 5,
    marginLeft: 4,
    fontWeight: '500',
  },

  // Tranche d'âge
  ageContainer: { flexDirection: 'row', gap: 10 },
  ageButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(201,169,97,0.25)',
    shadowColor: 'rgba(15,61,40,0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 1,
  },
  ageButtonSelected: {
    borderColor: C.gold,
    borderWidth: 2,
    backgroundColor: 'rgba(201,169,97,0.15)',
  },
  ageButtonText: {
    fontSize: 13,
    color: C.textMid,
    fontWeight: '600',
    textAlign: 'center',
  },
  ageButtonTextSelected: { color: C.textDark, fontWeight: '800' },

  // Bouton
  button: {
    backgroundColor: C.primary,
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 6,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: C.white,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  footerText: {
    fontSize: 11,
    color: C.textLight,
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
});