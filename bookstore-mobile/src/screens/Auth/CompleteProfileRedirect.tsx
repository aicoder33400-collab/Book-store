import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types/navigation';

type CompleteProfileRedirectNavigationProp = StackNavigationProp<RootStackParamList, 'CompleteProfileRedirect'>;

export const CompleteProfileRedirect = () => {
  const navigation = useNavigation<CompleteProfileRedirectNavigationProp>();

  useEffect(() => {
    // Récupérer les paramètres de l'URL
    const params = new URLSearchParams(window.location.search);
    const googleToken = params.get('googleToken');
    const email = params.get('email');
    const name = params.get('name');
    const avatar = params.get('avatar');

    console.log('📝 CompleteProfileRedirect - Paramètres:', { googleToken, email, name, avatar });

    if (googleToken && email) {
      console.log('📝 Redirection vers CompleteProfile avec données');
      navigation.navigate('CompleteProfile', {
        googleToken,
        email,
        name: name || '',
        avatar: avatar || '',
      });
    } else {
      console.log('❌ Pas de données, retour au Login');
      navigation.navigate('Login');
    }
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4A90D9" />
      <Text style={styles.text}>Redirection en cours...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});