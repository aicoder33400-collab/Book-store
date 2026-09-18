import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Animated,
  StyleSheet,
  View,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

type Props = {
  onRefresh: () => void | Promise<void>;
  refreshing?: boolean;
  size?: number;
  style?: any;
};

export const RefreshButton = ({ onRefresh, refreshing = false, size = 20, style }: Props) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const handlePress = async () => {
    // Lancer l'animation
    rotateAnim.setValue(0);
    Animated.timing(rotateAnim, {
      toValue: 1,
      duration: 800,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();

    // Lancer le refresh
    await onRefresh();
  };

  // Animation de rotation
  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={[styles.button, style]}
      disabled={refreshing}
    >
      <View style={styles.inner}>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons
            name="refresh-outline"
            size={size}
            color={refreshing ? colors.text.light : colors.primary}
          />
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 6,
  },
  inner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(201, 169, 97, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 97, 0.3)',
  },
});
