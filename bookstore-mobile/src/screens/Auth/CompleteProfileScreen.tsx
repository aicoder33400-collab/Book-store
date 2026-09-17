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

// 🕌 Palette islamique CLAIRE
const C = {
  // Fond : vert très clair / crème
  bgTop: '#F0F7F2',
  bgBottom: '#E5F0E8',
  // Vert émeraude (accents)
  primary: '#1B5E3F',
  primaryLight: '#2D7A55',
  // Or (accent chaud)
  gold: '#C9A961',
  goldLight: '#E5C989',
  goldSoft: 'rgba(201,169,97,0.12)',
  // Textes
  textDark: '#0F3D28',
  textMid: '#4A6B5A',
  textLight: '#7A9084',
  white: '#FFFFFF',
  // Inputs
  inputBg: '#FFFFFF',
  inputBorder: '#D9E5DD',
  inputBorderFocus: '#C9A961',
  // Erreurs
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
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      <LinearGradient
        colors={[C.bgTop, C.bgBottom]}
        style={styles.gradient}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      >
        {/* Motif doré discret (cercle en filigrane) */}
        <View style={styles.haloTop} />

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
                paddingBottom: insets.bottom + 60,
              },
            ]}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
            overScrollMode="never"
            horizontal={false}
            alwaysBounceHorizontal={false}
            alwaysBounceVertical={false}
          >
            {/* ═══ HEADER ═══ */}
            <View style={styles.header}>
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
                {errors.firstName && (
                  <Text style={styles.errorText}>{errors.firstName}</Text>
                )}
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
                {errors.lastName && (
                  <Text style={styles.errorText}>{errors.lastName}</Text>
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
                  placeholderTextColor={C.textLight}
                  value={phone}
                  onChangeText={(text) => {
                    setPhone(text);
                    if (errors.phone) setErrors({ ...errors, phone: undefined });
                  }}
                  keyboardType="phone-pad"
                />
                {errors.phone && (
                  <Text style={styles.errorText}>{errors.phone}</Text>
                )}
              </View>

              {/* Tranche d'âge — sans icônes */}
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
                {errors.ageGroup && (
                  <Text style={styles.errorText}>{errors.ageGroup}</Text>
                )}
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
                {errors.commune && (
                  <Text style={styles.errorText}>{errors.commune}</Text>
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
                  <ActivityIndicator color={C.white} />
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
  root: { flex: 1, backgroundColor: C.bgTop, overflow: 'hidden'},
  gradient: { flex: 1 },
  keyboardView: { flex: 1 },
  scroll: { flex: 1, width: '100%', maxWidth: '100%'},

  // Motif discret
  haloTop: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    borderWidth: 2,
    borderColor: 'rgba(201,169,97,0.15)',
    top: -width * 0.75,
    right: -width * 0.45,
  },

  // Conteneur
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
  title: {
    fontSize: 30,
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
    paddingHorizontal: 12,
  },
  emailBadge: {
    backgroundColor: C.goldSoft,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(201,169,97,0.3)',
  },
  emailBadgeText: {
    fontSize: 13,
    color: C.textDark,
    fontWeight: '600',
  },

  // ═══ FORMULAIRE ═══
  form: { flex: 1 },
  inputGroup: { marginBottom: 18 },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: C.textDark,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  required: { color: C.gold, fontSize: 15 },
  input: {
    backgroundColor: C.inputBg,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
    color: C.textDark,
    borderWidth: 1.5,
    borderColor: C.inputBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
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

  // Tranche d'âge — sans icônes
  ageContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  ageButton: {
    flex: 1,
    backgroundColor: C.inputBg,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: C.inputBorder,
  },
  ageButtonSelected: {
    borderColor: C.gold,
    borderWidth: 2,
    backgroundColor: 'rgba(201,169,97,0.10)',
  },
  ageButtonText: {
    fontSize: 14,
    color: C.textMid,
    fontWeight: '600',
    textAlign: 'center',
  },
  ageButtonTextSelected: {
    color: C.textDark,
    fontWeight: '800',
  },

  // Bouton
  button: {
    backgroundColor: C.primary,
    borderRadius: 50,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: C.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  footerText: {
    fontSize: 11,
    color: C.textLight,
    textAlign: 'center',
    marginTop: 18,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
});