import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../../types/navigation';

type CompleteProfileRedirectNavigationProp =
  StackNavigationProp<RootStackParamList, 'CompleteProfileRedirect'>;

// 🕌 Palette islamique
const C = {
  bgDark: '#0F3D28',
  bgMid: '#1B5E3F',
  bgLight: '#246B49',
  gold: '#C9A961',
  goldLight: '#E5C989',
  white: '#FFFFFF',
  whiteSoft: 'rgba(255,255,255,0.7)',
};

export const CompleteProfileRedirect = () => {
  const navigation = useNavigation<CompleteProfileRedirectNavigationProp>();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const googleToken = params.get('googleToken');
    const email = params.get('email');
    const name = params.get('name');
    const avatar = params.get('avatar');

    console.log('📝 CompleteProfileRedirect - Paramètres:', {
      googleToken,
      email,
      name,
      avatar,
    });

    if (googleToken && email) {
      console.log('📝 Redirection vers CompleteProfile');
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
    <View style={styles.root}>
      <LinearGradient
        colors={[C.bgDark, C.bgMid, C.bgLight]}
        style={styles.gradient}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      >
        <View style={styles.logoWrap}>
          <Text style={styles.logoEmoji}>🕌</Text>
        </View>
        <ActivityIndicator size="large" color={C.gold} />
        <Text style={styles.text}>Préparation de votre profil...</Text>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bgDark },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: 'rgba(201,169,97,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  logoEmoji: { fontSize: 44 },
  text: {
    marginTop: 20,
    fontSize: 15,
    color: C.whiteSoft,
    letterSpacing: 0.4,
  },
});