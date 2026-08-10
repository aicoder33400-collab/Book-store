import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../../services/api';
import { colors } from '../../theme/colors';

export const ResetPasswordScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { email } = route.params as { email: string };
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!code || !newPassword) { Alert.alert('Erreur', 'Tous les champs requis'); return; }
    if (newPassword.length < 6) { Alert.alert('Erreur', '6 caractères minimum'); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, code, newPassword });
      Alert.alert('Succès', 'Mot de passe réinitialisé !', [
        { text: 'OK', onPress: () => navigation.navigate('Login' as never) },
      ]);
    } catch (error: any) {
      Alert.alert('Erreur', error.response?.data?.message || 'Échec');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🔐</Text>
      <Text style={styles.title}>Nouveau mot de passe</Text>
      <Text style={styles.subtitle}>Code envoyé à {email}</Text>

      <TextInput style={styles.input} placeholder="Code à 6 chiffres" value={code} onChangeText={(t) => setCode(t.replace(/[^0-9]/g, '').slice(0, 6))} keyboardType="number-pad" maxLength={6} />
      <TextInput style={styles.input} placeholder="Nouveau mot de passe" value={newPassword} onChangeText={setNewPassword} secureTextEntry />

      <TouchableOpacity style={styles.button} onPress={handleReset} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Réinitialiser</Text>}
      </TouchableOpacity>

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
  subtitle: { fontSize: 14, color: colors.text.secondary, marginBottom: 30 },
  input: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, fontSize: 15,
    color: colors.text.primary, marginBottom: 14, width: '100%',
    borderWidth: 1, borderColor: '#E0E0E0',
  },
  button: {
    backgroundColor: colors.primary, borderRadius: 12, padding: 16,
    alignItems: 'center', width: '100%', marginBottom: 16,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  backLink: { fontSize: 14, color: colors.text.secondary, marginTop: 10 },
});