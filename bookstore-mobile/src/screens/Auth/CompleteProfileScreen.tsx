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
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../store/auth.store';
import { GoogleAuthService } from '../../services/google-auth.service';

export const CompleteProfileScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  
  const { completeGoogleProfile } = useAuthStore();
  
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
      newErrors.firstName = 'Prénom invalide (lettres uniquement)';
      isValid = false;
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'Le nom est obligatoire';
      isValid = false;
    } else if (!/^[a-zA-ZÀ-ÿ\s'-]{2,30}$/.test(lastName.trim())) {
      newErrors.lastName = 'Nom invalide (lettres uniquement)';
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
      newErrors.ageGroup = 'Veuillez sélectionner votre âge';
      isValid = false;
    }

    if (!commune.trim()) {
      newErrors.commune = 'La commune est obligatoire';
      isValid = false;
    } else if (commune.trim().length < 2) {
      newErrors.commune = 'Commune invalide (minimum 2 caractères)';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      // 🔥 Construction des données avec le bon format
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
        const { setUser, setToken } = useAuthStore.getState();
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
    } catch (error: any) {
      console.error('❌ Erreur complète:', error);
      console.error('❌ Réponse:', error.response?.data);
      Alert.alert(
        'Erreur',
        error.response?.data?.error || 'Erreur lors de l\'inscription. Veuillez réessayer.'
      );
    } finally {
      setLoading(false);
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

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Text style={styles.title}>Complétez votre profil</Text>
              <Text style={styles.subtitle}>
                Nous avons besoin de quelques informations
              </Text>
              <View style={styles.emailBadge}>
                <Text style={styles.emailText}>📧 {userEmail}</Text>
              </View>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Prénom <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[styles.input, errors.firstName && styles.inputError]}
                  placeholder="Votre prénom"
                  placeholderTextColor="rgba(0,0,0,0.4)"
                  value={firstName}
                  onChangeText={(text) => {
                    setFirstName(text);
                    setErrors({ ...errors, firstName: undefined });
                  }}
                />
                {errors.firstName && (
                  <Text style={styles.errorText}>{errors.firstName}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nom <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[styles.input, errors.lastName && styles.inputError]}
                  placeholder="Votre nom"
                  placeholderTextColor="rgba(0,0,0,0.4)"
                  value={lastName}
                  onChangeText={(text) => {
                    setLastName(text);
                    setErrors({ ...errors, lastName: undefined });
                  }}
                />
                {errors.lastName && (
                  <Text style={styles.errorText}>{errors.lastName}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Téléphone <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[styles.input, errors.phone && styles.inputError]}
                  placeholder="06 12 34 56 78"
                  placeholderTextColor="rgba(0,0,0,0.4)"
                  value={phone}
                  onChangeText={(text) => {
                    setPhone(text.replace(/[^0-9]/g, ''));
                    setErrors({ ...errors, phone: undefined });
                  }}
                  keyboardType="phone-pad"
                />
                {errors.phone && (
                  <Text style={styles.errorText}>{errors.phone}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Âge <Text style={styles.required}>*</Text></Text>
                <View style={styles.ageContainer}>
                  <TouchableOpacity
                    style={[
                      styles.ageButton,
                      ageGroup === 'minor' && styles.ageButtonActive,
                      ageGroup === 'minor' && styles.ageButtonValid,
                    ]}
                    onPress={() => {
                      setAgeGroup('minor');
                      setErrors({ ...errors, ageGroup: undefined });
                    }}
                  >
                    <Text style={[
                      styles.ageButtonText,
                      ageGroup === 'minor' && styles.ageButtonTextActive,
                      ageGroup === 'minor' && styles.ageButtonTextValid,
                    ]}>
                      - 18 ans
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
                      ageGroup === 'major' && styles.ageButtonActive,
                      ageGroup === 'major' && styles.ageButtonValid,
                    ]}
                    onPress={() => {
                      setAgeGroup('major');
                      setErrors({ ...errors, ageGroup: undefined });
                    }}
                  >
                    <Text style={[
                      styles.ageButtonText,
                      ageGroup === 'major' && styles.ageButtonTextActive,
                      ageGroup === 'major' && styles.ageButtonTextValid,
                    ]}>
                      + 18 ans
                    </Text>
                    {ageGroup === 'major' && (
                      <View style={styles.checkmark}>
                        <Text style={styles.checkmarkText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
                {errors.ageGroup && (
                  <Text style={styles.errorText}>{errors.ageGroup}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Commune <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[styles.input, errors.commune && styles.inputError]}
                  placeholder="Votre ville"
                  placeholderTextColor="rgba(0,0,0,0.4)"
                  value={commune}
                  onChangeText={(text) => {
                    setCommune(text);
                    setErrors({ ...errors, commune: undefined });
                  }}
                />
                {errors.commune && (
                  <Text style={styles.errorText}>{errors.commune}</Text>
                )}
              </View>

              <TouchableOpacity
                style={styles.button}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>S'inscrire</Text>
                )}
              </TouchableOpacity>

              <Text style={styles.footerText}>
                En vous inscrivant, vous acceptez nos conditions d'utilisation
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 40,
    paddingBottom: 40,
  },
  circle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(233, 69, 96, 0.1)',
    top: -150,
    right: -100,
  },
  circle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(15, 52, 96, 0.3)',
    bottom: 50,
    left: -80,
  },
  circle3: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(233, 69, 96, 0.05)',
    bottom: 150,
    right: -50,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 16,
  },
  emailBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  emailText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 6,
  },
  required: {
    color: '#e94560',
    fontSize: 16,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: '#1a1a2e',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  inputError: {
    borderColor: '#e94560',
    borderWidth: 1.5,
  },
  errorText: {
    fontSize: 12,
    color: '#e94560',
    marginTop: 4,
    marginLeft: 4,
  },
  ageContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  ageButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.05)',
    position: 'relative',
  },
  ageButtonActive: {
    borderColor: '#e94560',
    borderWidth: 2,
  },
  ageButtonValid: {
    borderColor: '#4CAF50',
    borderWidth: 2,
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
  },
  ageButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  ageButtonTextActive: {
    color: '#e94560',
    fontWeight: '600',
  },
  ageButtonTextValid: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  checkmark: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#e94560',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#e94560',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.25)',
    textAlign: 'center',
    marginTop: 20,
  },
});