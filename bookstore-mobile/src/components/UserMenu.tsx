import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useAuthStore } from '../store/auth.store';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserMenuProps {
  visible: boolean;
  onClose: () => void;
}

export const UserMenu = ({ visible, onClose }: UserMenuProps) => {
  const { user, reset } = useAuthStore();
  const navigation = useNavigation();

  const handleProfile = () => {
    onClose();
    navigation.dispatch(
      CommonActions.navigate({ name: '👤 Mon profil' })
    );
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    reset();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.menuContainer}>
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.name}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>
                  {user?.role === 'ADMIN' ? '👑 Administrateur' : '👤 Staff'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuItem} onPress={handleProfile}>
            <Text style={styles.menuIcon}>👤</Text>
            <Text style={styles.menuText}>Mon profil</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
            <Text style={styles.menuIcon}>🚪</Text>
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  menuContainer: {
    backgroundColor: colors.background.secondary,
    width: 260,
    marginTop: 60,
    marginRight: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    padding: 18,
    backgroundColor: colors.background.primary,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.white,
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  userEmail: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  roleBadge: {
    marginTop: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: `${colors.primary}15`,
    borderRadius: 10,
  },
  roleText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  menuIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  menuText: {
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
  },
  logoutItem: {
    paddingVertical: 16,
  },
  logoutText: {
    fontSize: typography.fontSize.md,
    color: colors.danger,
    fontWeight: typography.fontWeight.medium,
  },
});