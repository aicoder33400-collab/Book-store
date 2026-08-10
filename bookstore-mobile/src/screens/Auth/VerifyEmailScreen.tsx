import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuthStore } from '../../store/auth.store';
import api from '../../services/api';
import { colors } from '../../theme/colors';

export const VerifyEmailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId, email } = route.params as { userId: string; email: string };
  const { setUser, setToken } = useAuthStore();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (code.length !== 6) {
      Alert.alert('Erreur', 'Le code doit contenir 6 chiffres');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-email', { userId, code });
      const { token, user } = res.data.data;
      setUser(user);
      setToken(token);
      // Navigation will auto-redirect to main app
    } catch (error: any) {
      Alert.alert('Erreur', error.response?.data?.message || 'Code invalide');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📧</Text>
      <Text style={styles.title}>Vérifiez votre email</Text>
      <Text style={styles.subtitle}>
        Un code à 6 chiffres a été envoyé à{'\n'}{email}
      </Text>

      <TextInput
        style={styles.codeInput}
        placeholder="000000"
        value={code}
        onChangeText={(t) => setCode(t.replace(/[^0-9]/g, '').slice(0, 6))}
        keyboardType="number-pad"
        maxLength={6}
        textAlign="center"
      />

      <TouchableOpacity style={styles.button} onPress={handleVerify} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Vérifier</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.link}>
        <Text style={styles.linkText}>← Retour</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary, justifyContent: 'center', alignItems: 'center', padding: 24 },
  icon: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text.primary, marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.text.secondary, textAlign: 'center', marginBottom: 30, lineHeight: 20 },
  codeInput: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, fontSize: 32, fontWeight: '700',
    letterSpacing: 12, color: colors.text.primary, marginBottom: 24, width: '80%',
    borderWidth: 1, borderColor: '#E0E0E0', textAlign: 'center',
  },
  button: {
    backgroundColor: colors.primary, borderRadius: 12, padding: 16,
    alignItems: 'center', width: '80%', marginBottom: 16,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { alignItems: 'center' },
  linkText: { fontSize: 14, color: colors.text.secondary },
});