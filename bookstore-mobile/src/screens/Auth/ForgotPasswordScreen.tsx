import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types/navigation';
import api from '../../services/api';
import { colors } from '../../theme/colors';

type NavProp = StackNavigationProp<RootStackParamList, 'ForgotPassword'>;

export const ForgotPasswordScreen = () => {
  const navigation = useNavigation<NavProp>();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!email) { Alert.alert('Erreur', 'Veuillez entrer votre email'); return; }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (error: any) {
      Alert.alert('Erreur', error.response?.data?.message || 'Échec');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🔑</Text>
      <Text style={styles.title}>Mot de passe oublié</Text>
      <Text style={styles.subtitle}>Entrez votre email pour recevoir un code de réinitialisation</Text>

      <TextInput style={styles.input} placeholder="Votre email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

      {!sent ? (
        <TouchableOpacity style={styles.button} onPress={handleSend} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Envoyer le code</Text>}
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('ResetPassword', { email })}>
          <Text style={styles.buttonText}>Entrer le code →</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.backLink}>← Retour</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary, justifyContent: 'center', alignItems: 'center', padding: 24 },
  icon: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text.primary, marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.text.secondary, textAlign: 'center', marginBottom: 30 },
  input: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, fontSize: 15,
    color: colors.text.primary, marginBottom: 20, width: '100%',
    borderWidth: 1, borderColor: '#E0E0E0',
  },
  button: {
    backgroundColor: colors.primary, borderRadius: 12, padding: 16,
    alignItems: 'center', width: '100%', marginBottom: 16,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  backLink: { fontSize: 14, color: colors.text.secondary, marginTop: 10 },
});