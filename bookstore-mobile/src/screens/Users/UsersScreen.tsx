import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
} from 'react-native';
import api from '../../services/api';
import { colors } from '../../theme/colors';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'ADMIN' | 'STAFF' | 'USER';
  authProvider: string;
  avatar?: string;
  createdAt: string;
  lastLoginAt?: string;
  emailVerified: boolean;
}

export const UsersScreen = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Jamais';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleColor = (role: string) => {
    switch(role) {
      case 'ADMIN': return '#4A90D9';
      case 'STAFF': return '#7ED321';
      default: return '#999';
    }
  };

  const getRoleLabel = (role: string) => {
    switch(role) {
      case 'ADMIN': return '👑 Admin';
      case 'STAFF': return '📋 Staff';
      default: return '👤 User';
    }
  };

  const renderUser = ({ item }: { item: User }) => (
    <TouchableOpacity style={styles.card} onPress={() => setSelectedUser(item)}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        <View style={styles.userMeta}>
          <Text style={styles.userDate}>
            📅 {formatDate(item.createdAt)}
          </Text>
          {item.lastLoginAt && (
            <Text style={styles.userDate}>
              🔄 {formatDate(item.lastLoginAt)}
            </Text>
          )}
        </View>
      </View>
      <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) }]}>
        <Text style={styles.roleText}>{item.role}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchUsers(); }} />}
        ListEmptyComponent={<Text style={styles.empty}>Aucun utilisateur</Text>}
      />

      {/* 🔥 User Detail Modal - Version complète */}
      <Modal visible={!!selectedUser} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScroll}>
            <View style={styles.modal}>
              <View style={styles.modalAvatar}>
                <Text style={styles.modalAvatarText}>
                  {selectedUser?.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              
              <Text style={styles.modalName}>{selectedUser?.name}</Text>
              <Text style={styles.modalEmail}>{selectedUser?.email}</Text>
              
              {/* 🔥 Rôle */}
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>👤 Rôle</Text>
                <View style={[styles.roleBadge, { backgroundColor: getRoleColor(selectedUser?.role || 'USER') }]}>
                  <Text style={styles.roleText}>{getRoleLabel(selectedUser?.role || 'USER')}</Text>
                </View>
              </View>

              {/* 🔥 Fournisseur */}
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>🔗 Fournisseur</Text>
                <Text style={styles.modalValue}>
                  {selectedUser?.authProvider === 'google' ? 'Google' : 'Email/Mot de passe'}
                </Text>
              </View>

              {/* 🔥 Téléphone */}
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>📱 Téléphone</Text>
                <Text style={styles.modalValue}>
                  {selectedUser?.phone || 'Non renseigné'}
                </Text>
              </View>

              {/* 🔥 Email vérifié */}
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>✅ Email vérifié</Text>
                <Text style={[styles.modalValue, { color: selectedUser?.emailVerified ? colors.success : colors.danger }]}>
                  {selectedUser?.emailVerified ? '✅ Oui' : '❌ Non'}
                </Text>
              </View>

              {/* 🔥 Date de création */}
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>📅 Créé le</Text>
                <Text style={styles.modalValue}>{formatDate(selectedUser?.createdAt)}</Text>
              </View>

              {/* 🔥 Dernière connexion */}
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>🔄 Dernière connexion</Text>
                <Text style={styles.modalValue}>{formatDate(selectedUser?.lastLoginAt)}</Text>
              </View>

              {/* 🔥 ID */}
              <View style={[styles.modalRow, styles.modalRowLast]}>
                <Text style={styles.modalLabel}>🆔 ID</Text>
                <Text style={styles.modalValueSmall}>{selectedUser?.id}</Text>
              </View>

              <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedUser(null)}>
                <Text style={styles.closeBtnText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 16 },
  
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '600', color: colors.text.primary },
  userEmail: { fontSize: 13, color: colors.text.secondary, marginTop: 1 },
  userMeta: { marginTop: 2 },
  userDate: { fontSize: 11, color: '#999', marginTop: 1 },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  roleText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  
  // 🔥 Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScroll: {
    maxHeight: '90%',
    width: '90%',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginVertical: 20,
    alignItems: 'center',
  },
  modalAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalAvatarText: { color: '#fff', fontSize: 28, fontWeight: '700' },
  modalName: { fontSize: 20, fontWeight: '700', color: colors.text.primary, marginBottom: 4 },
  modalEmail: { fontSize: 14, color: colors.text.secondary, marginBottom: 16 },
  
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalRowLast: {
    borderBottomWidth: 0,
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  modalValue: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '500',
  },
  modalValueSmall: {
    fontSize: 11,
    color: colors.text.light,
    maxWidth: '60%',
    textAlign: 'right',
  },
  
  closeBtn: {
    width: '100%',
    padding: 14,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    marginTop: 8,
  },
  closeBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
