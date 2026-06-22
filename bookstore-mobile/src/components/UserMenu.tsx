import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { useNavigation, CommonActions, TabActions } from '@react-navigation/native';
import { useAuthStore } from '../store/auth.store';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

interface UserMenuProps {
  visible: boolean;
  onClose: () => void;
}

export const UserMenu = ({ visible, onClose }: UserMenuProps) => {
  const { user, reset } = useAuthStore();
  const navigation = useNavigation();

  const navigateToTab = (tabName: string) => {
    onClose();
    // Naviguer vers l'onglet spécifique dans la navigation tabs
    navigation.dispatch(
      CommonActions.navigate({
        name: 'Main',
        params: {
          screen: tabName,
        },
      })
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: () => {
            reset();
            onClose();
          },
        },
      ]
    );
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

          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => navigateToTab('Catalogue')}
          >
            <Text style={styles.menuIcon}>📚</Text>
            <Text style={styles.menuText}>Catalogue</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => navigateToTab('Mes emprunts')}
          >
            <Text style={styles.menuIcon}>🔄</Text>
            <Text style={styles.menuText}>Mes emprunts</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => navigateToTab('Ventes')}
          >
            <Text style={styles.menuIcon}>💰</Text>
            <Text style={styles.menuText}>Ventes</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => navigateToTab('Mon profil')}
          >
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
    width: 280,
    marginTop: 60,
    marginRight: 16,
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
    padding: 20,
    backgroundColor: colors.background.primary,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.white,
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  userEmail: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  roleBadge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: `${colors.primary}15`,
    borderRadius: 12,
  },
  roleText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 32,
  },
  menuText: {
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
  },
  logoutItem: {
    marginBottom: 8,
  },
  logoutText: {
    fontSize: typography.fontSize.md,
    color: colors.danger,
    fontWeight: typography.fontWeight.medium,
  },
});