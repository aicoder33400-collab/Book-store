import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types/navigation';
import api from '../../services/api';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type NavProp = StackNavigationProp<RootStackParamList, 'Register'>;

export const RegisterScreen = () => {
  const navigation = useNavigation<NavProp>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Erreur', 'Nom, email et mot de passe requis');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Erreur', 'Mot de passe : 6 caractères minimum');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/register', { name, email, phone: phone || undefined, password });
      Alert.alert('Succès', res.data.data.message);
      navigation.navigate('VerifyEmail', { userId: res.data.data.userId, email });
    } catch (error: any) {
      const msg = error.response?.data?.message || "Échec de l'inscription";
      Alert.alert('Erreur', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Créer un compte</Text>
        <Text style={styles.subtitle}>Rejoignez la bibliothèque</Text>

        <TextInput style={styles.input} placeholder="Nom complet" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Téléphone (optionnel)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <TextInput style={styles.input} placeholder="Mot de passe (6+ caractères)" value={password} onChangeText={setPassword} secureTextEntry />

        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>S'inscrire</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.link}>
          <Text style={styles.linkText}>Déjà un compte ? <Text style={styles.linkBold}>Se connecter</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  inner: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: '700', color: colors.text.primary, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 15, color: colors.text.secondary, textAlign: 'center', marginBottom: 30 },
  input: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, fontSize: 15,
    color: colors.text.primary, marginBottom: 14, borderWidth: 1, borderColor: '#E0E0E0',
  },
  button: {
    backgroundColor: colors.primary, borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 8, marginBottom: 20,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { alignItems: 'center' },
  linkText: { fontSize: 14, color: colors.text.secondary },
  linkBold: { color: colors.primary, fontWeight: '600' },
});