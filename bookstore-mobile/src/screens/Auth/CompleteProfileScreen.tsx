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
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/auth.store';
import { GoogleAuthService } from '../../services/google-auth.service';

const { width } = Dimensions.get('window');

// 🕌 Palette islamique lumineuse
const C = {
  bgDark: '#0F3D28',
  bgMid: '#1B5E3F',
  bgLight: '#2D7A55',
  gold: '#C9A961',
  goldLight: '#E5C989',
  goldSoft: 'rgba(201,169,97,0.15)',
  white: '#FFFFFF',
  whiteSoft: 'rgba(255,255,255,0.92)',
  whiteFaint: 'rgba(255,255,255,0.65)',
  inputBg: '#FFFFFF',
  inputBorder: 'rgba(201,169,97,0.25)',
  textDark: '#0F3D28',
  textMid: '#4A6B5A',
  danger: '#E86B6B',
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

  const validate = () => {
    const newErrors: typeof errors = {};
    let isValid = true;

    // Prénom
    if (!firstName.trim()) {
      newErrors.firstName = 'Le prénom est obligatoire';
      isValid = false;
    } else if (!/^[a-zA-ZÀ-ÿ\s'-]{2,30}$/.test(firstName.trim())) {
      newErrors.firstName = 'Prénom invalide (lettres, 2-30 caractères)';
      isValid = false;
    }

    // Nom
    if (!lastName.trim()) {
      newErrors.lastName = 'Le nom est obligatoire';
      isValid = false;
    } else if (!/^[a-zA-ZÀ-ÿ\s'-]{2,30}$/.test(lastName.trim())) {
      newErrors.lastName = 'Nom invalide (lettres, 2-30 caractères)';
      isValid = false;
    }

    // Téléphone
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

    // Âge
    if (!ageGroup) {
      newErrors.ageGroup = 'Veuillez sélectionner votre tranche d\'âge';
      isValid = false;
    }

    // Commune
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
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <LinearGradient
        colors={[C.bgDark, C.bgMid, C.bgLight]}
        style={styles.gradient}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
      >
        {/* Motifs décoratifs */}
        <View style={styles.haloTop} />
        <View style={styles.haloBottom} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingTop: insets.top + 32,
                paddingBottom: insets.bottom + 40,
              },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
            overScrollMode="never"
          >
            {/* ═══ HEADER ═══ */}
            <View style={styles.header}>
              <View style={styles.iconWrap}>
                <Text style={styles.iconEmoji}>🕌</Text>
              </View>
              <Text style={styles.title}>Bienvenue !</Text>
              <Text style={styles.subtitle}>
                Plus qu'une étape pour rejoindre la bibliothèque
              </Text>

              {userEmail ? (
                <View style={styles.emailBadge}>
                  <Text style={styles.emailBadgeLabel}>Compte Google</Text>
                  <Text style={styles.emailBadgeValue}>📧 {userEmail}</Text>
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
                  placeholder="Ex : Mouhcine"
                  placeholderTextColor="#A0AFA6"
                  value={firstName}
                  onChangeText={(text) => {
                    setFirstName(text);
                    if (errors.firstName) setErrors({ ...errors, firstName: undefined });
                  }}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
                {errors.firstName && (
                  <Text style={styles.errorText}>⚠ {errors.firstName}</Text>
                )}
              </View>

              {/* Nom */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Nom <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.lastName && styles.inputError]}
                  placeholder="Ex : Ahbaiz"
                  placeholderTextColor="#A0AFA6"
                  value={lastName}
                  onChangeText={(text) => {
                    setLastName(text);
                    if (errors.lastName) setErrors({ ...errors, lastName: undefined });
                  }}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
                {errors.lastName && (
                  <Text style={styles.errorText}>⚠ {errors.lastName}</Text>
                )}
              </View>

              {/* Téléphone */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Téléphone <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.phone && styles.inputError]}
                  placeholder="06 12 34 56 78"
                  placeholderTextColor="#A0AFA6"
                  value={phone}
                  onChangeText={(text) => {
                    setPhone(text);
                    if (errors.phone) setErrors({ ...errors, phone: undefined });
                  }}
                  keyboardType="phone-pad"
                />
                {errors.phone && (
                  <Text style={styles.errorText}>⚠ {errors.phone}</Text>
                )}
              </View>

              {/* Tranche d'âge */}
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
                      if (errors.ageGroup) setErrors({ ...errors, ageGroup: undefined });
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.ageEmoji}>🧒</Text>
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
                      if (errors.ageGroup) setErrors({ ...errors, ageGroup: undefined });
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.ageEmoji}>👨</Text>
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
                {errors.ageGroup && (
                  <Text style={styles.errorText}>⚠ {errors.ageGroup}</Text>
                )}
              </View>

              {/* Commune */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Commune <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.commune && styles.inputError]}
                  placeholder="Ex : Paris"
                  placeholderTextColor="#A0AFA6"
                  value={commune}
                  onChangeText={(text) => {
                    setCommune(text);
                    if (errors.commune) setErrors({ ...errors, commune: undefined });
                  }}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
                {errors.commune && (
                  <Text style={styles.errorText}>⚠ {errors.commune}</Text>
                )}
              </View>

              {/* Bouton */}
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color={C.bgDark} />
                ) : (
                  <Text style={styles.buttonText}>Rejoindre la bibliothèque</Text>
                )}
              </TouchableOpacity>

              <Text style={styles.footerText}>
                En continuant, vous acceptez nos conditions d'utilisation
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
  scroll: { flex: 1 },

  // Motifs
  haloTop: {
    position: 'absolute',
    width: width * 1.1,
    height: width * 1.1,
    borderRadius: width * 0.55,
    borderWidth: 1,
    borderColor: 'rgba(201,169,97,0.10)',
    top: -width * 0.55,
    right: -width * 0.35,
  },
  haloBottom: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    borderWidth: 1,
    borderColor: 'rgba(201,169,97,0.07)',
    bottom: -width * 0.6,
    left: -width * 0.4,
  },

  // Conteneur principal
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },

  // ═══ HEADER ═══
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: 'rgba(201,169,97,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(201,169,97,0.08)',
  },
  iconEmoji: { fontSize: 42 },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: C.white,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 14,
    color: C.whiteFaint,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  emailBadge: {
    backgroundColor: C.goldSoft,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(201,169,97,0.3)',
    alignItems: 'center',
  },
  emailBadgeLabel: {
    fontSize: 10,
    color: C.goldLight,
    letterSpacing: 1,
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  emailBadgeValue: {
    fontSize: 13,
    color: C.goldLight,
    fontWeight: '600',
  },

  // ═══ FORMULAIRE ═══
  form: { flex: 1 },
  inputGroup: { marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: C.whiteSoft,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  required: { color: C.gold, fontSize: 14 },
  input: {
    backgroundColor: C.inputBg,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
    color: C.textDark,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: C.danger,
  },
  errorText: {
    fontSize: 12,
    color: C.danger,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '500',
  },

  // Tranche d'âge
  ageContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  ageButton: {
    flex: 1,
    backgroundColor: C.inputBg,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  ageButtonSelected: {
    borderColor: C.gold,
    backgroundColor: 'rgba(201,169,97,0.12)',
  },
  ageEmoji: { fontSize: 26, marginBottom: 4 },
  ageButtonText: {
    fontSize: 12,
    color: C.textMid,
    fontWeight: '600',
    textAlign: 'center',
  },
  ageButtonTextSelected: {
    color: C.goldLight,
    fontWeight: '700',
  },
  checkmark: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: C.gold,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  checkmarkText: {
    color: C.bgDark,
    fontSize: 14,
    fontWeight: '900',
  },

  // Bouton
  button: {
    backgroundColor: C.gold,
    borderRadius: 50,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: C.bgDark,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  footerText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
    marginTop: 18,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
});