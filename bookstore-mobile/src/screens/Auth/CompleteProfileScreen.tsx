import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/auth.store';
import { GoogleAuthService } from '../../services/google-auth.service';

const { width } = Dimensions.get('window');

// 🕌 Palette islamique
const C = {
  bgDark: '#0F3D28',
  bgMid: '#1B5E3F',
  bgLight: '#246B49',
  gold: '#C9A961',
  goldLight: '#E5C989',
  goldSoft: 'rgba(201,169,97,0.15)',
  white: '#FFFFFF',
  whiteSoft: 'rgba(255,255,255,0.85)',
  whiteFaint: 'rgba(255,255,255,0.6)',
  whiteLine: 'rgba(255,255,255,0.12)',
  inputBg: 'rgba(255,255,255,0.95)',
  danger: '#E86B6B',
  success: '#5BBF8B',
};

export const CompleteProfileScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  const completeGoogleProfile = useAuthStore((s) => s.completeGoogleProfile);

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

  const validate = () => {
    const newErrors: typeof errors = {};
    let isValid = true;

    if (!firstName.trim()) {
      newErrors.firstName = 'Le prénom est obligatoire';
      isValid = false;
    } else if (!/^[a-zA-ZÀ-ÿ\s'-]{2,30}$/.test(firstName.trim())) {
      newErrors.firstName = 'Prénom invalide';
      isValid = false;
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'Le nom est obligatoire';
      isValid = false;
    } else if (!/^[a-zA-ZÀ-ÿ\s'-]{2,30}$/.test(lastName.trim())) {
      newErrors.lastName = 'Nom invalide';
      isValid = false;
    }

    if (!phone.trim()) {
      newErrors.phone = 'Le téléphone est obligatoire';
      isValid = false;
    } else if (!/^[0-9]{8,15}$/.test(phone.trim())) {
      newErrors.phone = 'Téléphone invalide (8-15 chiffres)';
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
        phone: phone.trim(),
        age: ageGroup === 'major' ? 25 : 17,
        commune: commune.trim(),
      };

      console.log('📤 Envoi des données:', payload);

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
      console.error('❌ Erreur complète:', error);
      console.error('❌ Réponse:', error.response?.data);
      if (Platform.OS === 'web') {
        window.alert(error.response?.data?.error || 'Erreur lors de l\'inscription. Veuillez réessayer.');
      } else {
        Alert.alert(
          'Erreur',
          error.response?.data?.error || 'Erreur lors de l\'inscription. Veuillez réessayer.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <LinearGradient
        colors={[C.bgDark, C.bgMid, C.bgLight]}
        style={styles.gradient}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      >
        {/* Motifs décoratifs */}
        <View style={styles.haloTop} />
        <View style={styles.haloBottom} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ─── HEADER ─── */}
            <View style={styles.header}>
              <View style={styles.iconWrap}>
                <Text style={styles.iconEmoji}>🕌</Text>
              </View>
              <Text style={styles.title}>Bienvenue !</Text>
              <Text style={styles.subtitle}>
                Complétez votre profil pour rejoindre la bibliothèque
              </Text>
              {userEmail ? (
                <View style={styles.emailBadge}>
                  <Text style={styles.emailText}>📧 {userEmail}</Text>
                </View>
              ) : null}
            </View>

            {/* ─── FORMULAIRE ─── */}
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Prénom <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.firstName && styles.inputError]}
                  placeholder="Votre prénom"
                  placeholderTextColor="rgba(0,0,0,0.35)"
                  value={firstName}
                  onChangeText={(text) => {
                    setFirstName(text);
                    setErrors({ ...errors, firstName: undefined });
                  }}
                  autoCapitalize="words"
                />
                {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Nom <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.lastName && styles.inputError]}
                  placeholder="Votre nom"
                  placeholderTextColor="rgba(0,0,0,0.35)"
                  value={lastName}
                  onChangeText={(text) => {
                    setLastName(text);
                    setErrors({ ...errors, lastName: undefined });
                  }}
                  autoCapitalize="words"
                />
                {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Téléphone <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.phone && styles.inputError]}
                  placeholder="06 12 34 56 78"
                  placeholderTextColor="rgba(0,0,0,0.35)"
                  value={phone}
                  onChangeText={(text) => {
                    setPhone(text.replace(/[^0-9]/g, ''));
                    setErrors({ ...errors, phone: undefined });
                  }}
                  keyboardType="phone-pad"
                />
                {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Tranche d'âge <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.ageContainer}>
                  <TouchableOpacity
                    style={[
                      styles.ageButton,
                      ageGroup === 'minor' && styles.ageButtonSelected,
                    ]}
                    onPress={() => {
                      setAgeGroup('minor');
                      setErrors({ ...errors, ageGroup: undefined });
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.ageButtonText,
                        ageGroup === 'minor' && styles.ageButtonTextSelected,
                      ]}
                    >
                      Moins de 18 ans
                    </Text>
                    {ageGroup === 'minor' && (
                      <View style={styles.checkmark}>
                        <Text style={styles.checkmarkText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.ageButton,
                      ageGroup === 'major' && styles.ageButtonSelected,
                    ]}
                    onPress={() => {
                      setAgeGroup('major');
                      setErrors({ ...errors, ageGroup: undefined });
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.ageButtonText,
                        ageGroup === 'major' && styles.ageButtonTextSelected,
                      ]}
                    >
                      18 ans et plus
                    </Text>
                    {ageGroup === 'major' && (
                      <View style={styles.checkmark}>
                        <Text style={styles.checkmarkText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
                {errors.ageGroup && <Text style={styles.errorText}>{errors.ageGroup}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Commune <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.commune && styles.inputError]}
                  placeholder="Votre ville"
                  placeholderTextColor="rgba(0,0,0,0.35)"
                  value={commune}
                  onChangeText={(text) => {
                    setCommune(text);
                    setErrors({ ...errors, commune: undefined });
                  }}
                  autoCapitalize="words"
                />
                {errors.commune && <Text style={styles.errorText}>{errors.commune}</Text>}
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color={C.bgDark} />
                ) : (
                  <Text style={styles.buttonText}>Valider mon inscription</Text>
                )}
              </TouchableOpacity>

              <Text style={styles.footerText}>
                En vous inscrivant, vous acceptez nos conditions d'utilisation
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bgDark },
  gradient: { flex: 1 },
  keyboardView: { flex: 1 },

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

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },

  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'rgba(201,169,97,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  iconEmoji: { fontSize: 38 },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: C.white,
    marginBottom: 8,
    letterSpacing: 0.4,
  },
  subtitle: {
    fontSize: 14,
    color: C.whiteFaint,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  emailBadge: {
    backgroundColor: C.goldSoft,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(201,169,97,0.3)',
  },
  emailText: {
    fontSize: 13,
    color: C.goldLight,
    fontWeight: '500',
  },

  form: { flex: 1 },
  inputGroup: { marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: C.whiteSoft,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  required: {
    color: C.gold,
    fontSize: 14,
  },
  input: {
    backgroundColor: C.inputBg,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
    color: '#0F3D28',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  inputError: {
    borderColor: C.danger,
    borderWidth: 1.5,
  },
  errorText: {
    fontSize: 12,
    color: C.danger,
    marginTop: 5,
    marginLeft: 4,
  },

  ageContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  ageButton: {
    flex: 1,
    backgroundColor: C.inputBg,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  ageButtonSelected: {
    borderColor: C.gold,
    backgroundColor: 'rgba(201,169,97,0.10)',
  },
  ageButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  ageButtonTextSelected: {
    color: C.goldLight,
    fontWeight: '700',
  },
  checkmark: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.gold,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  checkmarkText: {
    color: C.bgDark,
    fontSize: 13,
    fontWeight: 'bold',
  },

  button: {
    backgroundColor: C.gold,
    borderRadius: 50,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: C.bgDark,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  footerText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    marginTop: 20,
    letterSpacing: 0.3,
  },
});