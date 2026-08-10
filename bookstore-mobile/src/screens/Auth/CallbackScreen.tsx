import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

export const CallbackScreen = () => {
  useEffect(() => {
    console.log('📱 CallbackScreen - Récupération du token...');
    
    // Extraire le token de l'URL
    const hash = window.location.hash;
    if (hash && hash.includes('id_token')) {
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get('id_token');
      
      if (token) {
        console.log('✅ Token trouvé dans CallbackScreen');
        // Stocker le token et fermer la fenêtre
        window.opener?.postMessage({ type: 'google-token', token }, window.location.origin);
        window.close();
        return;
      }
    }
    
    console.log('❌ Pas de token dans CallbackScreen');
    window.close();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4A90D9" />
      <Text style={styles.text}>Authentification en cours...</Text>
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