import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useAuthStore } from '../store/auth.store';
import { colors } from '../theme/colors';

interface UserMenuProps {
  visible: boolean;
  onClose: () => void;
}

export const UserMenu = ({ visible, onClose }: UserMenuProps) => {
  const { user, logout } = useAuthStore();
  const navigation = useNavigation();

  // 🔥 Fonction de déconnexion effective
  const performLogout = async () => {
    try {
      console.log('🔓 Déconnexion en cours...');
      await logout();
      console.log('✅ Déconnecté avec succès');
      
      onClose();
      
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        })
      );
    } catch (error) {
      console.error('❌ Erreur déconnexion:', error);
      if (Platform.OS === 'web') {
        window.alert('Impossible de se déconnecter');
      } else {
        Alert.alert('Erreur', 'Impossible de se déconnecter');
      }
    }
  };

  // 🔥 Gestion du clic sur "Se déconnecter" (compatible web + mobile)
  const handleLogout = () => {
    if (Platform.OS === 'web') {
      // Sur web : window.confirm
      const confirmed = window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?');
      if (confirmed) {
        performLogout();
      }
    } else {
      // Sur mobile : Alert.alert
      Alert.alert(
        'Déconnexion',
        'Êtes-vous sûr de vouloir vous déconnecter ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Se déconnecter',
            style: 'destructive',
            onPress: performLogout,
          },
        ]
      );
    }
  };

  // 🔥 Gestion du clic sur "Mon profil"
  const handleProfile = () => {
    onClose();
    setTimeout(() => {
      navigation.dispatch(
        CommonActions.navigate({
          name: 'Mon profil',
        })
      );
    }, 150);
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleClose}
      >
        <View style={styles.menu}>
          {/* En-tête utilisateur */}
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName} numberOfLines={1}>
                {user?.name || 'Utilisateur'}
              </Text>
              <Text style={styles.userEmail} numberOfLines={1}>
                {user?.email || ''}
              </Text>
            </View>
          </View>

          {/* Séparateur doré */}
          <View style={styles.divider} />

          {/* Mon profil */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleProfile}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemIcon}>
              <Text style={styles.menuItemEmoji}>👤</Text>
            </View>
            <Text style={styles.menuItemText}>Mon profil</Text>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>

          {/* Se déconnecter */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <View style={[styles.menuItemIcon, styles.menuItemIconDanger]}>
              <Text style={styles.menuItemEmoji}>🚪</Text>
            </View>
            <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>
              Se déconnecter
            </Text>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 61, 40, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  menu: {
    backgroundColor: colors.background.secondary,
    width: 280,
    marginTop: Platform.OS === 'ios' ? 100 : 70,
    marginRight: 12,
    borderRadius: 18,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },

  // En-tête
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: colors.secondary,
  },
  avatarText: {
    color: colors.text.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
  },
  userEmail: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 2,
  },

  // Séparateur
  divider: {
    height: 2,
    backgroundColor: colors.secondary,
    marginHorizontal: 16,
    marginBottom: 4,
    borderRadius: 1,
    opacity: 0.6,
  },

  // Items
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(27, 94, 63, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemIconDanger: {
    backgroundColor: 'rgba(181, 58, 58, 0.1)',
  },
  menuItemEmoji: {
    fontSize: 16,
  },
  menuItemText: {
    flex: 1,
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '600',
  },
  menuItemTextDanger: {
    color: colors.danger,
  },
  menuItemArrow: {
    fontSize: 20,
    color: colors.text.light,
    fontWeight: '300',
  },
});
