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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/auth.store';
import { GoogleAuthService } from '../../services/google-auth.service';

const { width } = Dimensions.get('window');

// 🕌 Palette islamique CLAIRE
const C = {
  bgTop: '#FAFDFB',
  bgMid: '#F0F7F3',
  bgBottom: '#E3EFE7',
  primary: '#1B5E3F',
  gold: '#C9A961',
  goldLight: '#E5C989',
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
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  }, []);

  const validate = () => {
    const newErrors: typeof errors = {};
    let isValid = true;

    if (!firstName.trim()) {
      newErrors.firstName = 'Prénom obligatoire';
      isValid = false;
    } else if (!/^[a-zA-ZÀ-ÿ\s'-]{2,30}$/.test(firstName.trim())) {
      newErrors.firstName = 'Prénom invalide';
      isValid = false;
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'Nom obligatoire';
      isValid = false;
    } else if (!/^[a-zA-ZÀ-ÿ\s'-]{2,30}$/.test(lastName.trim())) {
      newErrors.lastName = 'Nom invalide';
      isValid = false;
    }

    const cleanPhone = phone.replace(/[\s\-\.\(\)]/g, '');
    if (!cleanPhone) {
      newErrors.phone = 'Téléphone obligatoire';
      isValid = false;
    } else if (!/^[+]?[0-9]{8,15}$/.test(cleanPhone)) {
      newErrors.phone = 'Numéro invalide';
      isValid = false;
    } else if (/^(\d)\1+$/.test(cleanPhone.replace(/^\+/, ''))) {
      newErrors.phone = 'Numéro invalide';
      isValid = false;
    } else if (
      /^(?:\+33|0)/.test(cleanPhone) &&
      !/^(?:\+33|0)[1-9][0-9]{8}$/.test(cleanPhone)
    ) {
      newErrors.phone = 'Numéro FR invalide (10 chiffres)';
      isValid = false;
    }

    if (!ageGroup) {
      newErrors.ageGroup = 'Choisissez votre âge';
      isValid = false;
    }

    if (!commune.trim()) {
      newErrors.commune = 'Commune obligatoire';
      isValid = false;
    } else if (!/^[a-zA-ZÀ-ÿ\s'-]{2,50}$/.test(commune.trim())) {
      newErrors.commune = 'Commune invalide';
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

      {/* Fond décoré */}
      <LinearGradient
        colors={[C.bgTop, C.bgMid, C.bgBottom]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
      />

      {/* Motifs dorés discrets */}
      <View style={styles.ringTopRight} />
      <View style={styles.ringBottomLeft} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 20,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={true}
        overScrollMode="auto"
        nestedScrollEnabled={true}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* ═══ Mini header ═══ */}
          <View style={styles.header}>
            {userEmail ? (
              <Text style={styles.emailText} numberOfLines={1}>
                📧 {userEmail}
              </Text>
            ) : null}
            <Text style={styles.subtitle}>Complétez votre profil</Text>
          </View>

          {/* ═══ FORMULAIRE COMPACT ═══ */}
          <View style={styles.form}>
            {/* Prénom + Nom sur 2 colonnes */}
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>
                  Prénom <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.firstName && styles.inputError]}
                  placeholder="Prénom"
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

              <View style={styles.col}>
                <Text style={styles.label}>
                  Nom <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.lastName && styles.inputError]}
                  placeholder="Nom"
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
                    - de 18 ans
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
                    18 ans et +
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
    overflow: 'hidden',
  },
  scroll: {
    flex: 1,
    width: '100%',
  },

  // Décors
  ringTopRight: {
    position: 'absolute',
    width: width * 1.3,
    height: width * 1.3,
    borderRadius: width * 0.65,
    borderWidth: 1.5,
    borderColor: 'rgba(201,169,97,0.15)',
    top: -width * 0.8,
    right: -width * 0.5,
  },
  ringBottomLeft: {
    position: 'absolute',
    width: width * 1.1,
    height: width * 1.1,
    borderRadius: width * 0.55,
    borderWidth: 1.5,
    borderColor: 'rgba(27,94,63,0.06)',
    bottom: -width * 0.75,
    left: -width * 0.45,
  },

  // Contenu
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },

  // Mini header
  header: {
    alignItems: 'center',
    marginBottom: 14,
  },
  emailText: {
    fontSize: 12,
    color: C.textMid,
    fontWeight: '600',
    marginBottom: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(201,169,97,0.25)',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.textDark,
    letterSpacing: 0.3,
  },

  // Form
  form: { flex: 1 },

  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  col: { flex: 1 },

  inputGroup: { marginBottom: 10 },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: C.textDark,
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  required: { color: C.gold, fontSize: 13 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: C.textDark,
    borderWidth: 1,
    borderColor: 'rgba(201,169,97,0.25)',
    shadowColor: 'rgba(15,61,40,0.05)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  inputError: { borderColor: C.danger, borderWidth: 1.5 },
  errorText: {
    fontSize: 11,
    color: C.danger,
    marginTop: 3,
    marginLeft: 2,
    fontWeight: '500',
  },

  // Âge
  ageContainer: { flexDirection: 'row', gap: 8 },
  ageButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(201,169,97,0.25)',
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
  },
  ageButtonTextSelected: { color: C.textDark, fontWeight: '800' },

  // Bouton
  button: {
    backgroundColor: C.primary,
    borderRadius: 40,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: C.white,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});