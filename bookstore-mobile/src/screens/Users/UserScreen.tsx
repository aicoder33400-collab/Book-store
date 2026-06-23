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
} from 'react-native';
import api from '../../services/api';
import { colors } from '../../theme/colors';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'STAFF';
  createdAt: string;
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

  const renderUser = ({ item }: { item: User }) => (
    <TouchableOpacity style={styles.card} onPress={() => setSelectedUser(item)}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        <Text style={styles.userDate}>
          Créé le {new Date(item.createdAt).toLocaleDateString('fr-FR')}
        </Text>
      </View>
      <View style={[styles.roleBadge, { backgroundColor: item.role === 'ADMIN' ? '#4A90D9' : '#7ED321' }]}>
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

      {/* User Detail Modal */}
      <Modal visible={!!selectedUser} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalAvatar}>
              <Text style={styles.modalAvatarText}>
                {selectedUser?.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.modalName}>{selectedUser?.name}</Text>
            <Text style={styles.modalEmail}>{selectedUser?.email}</Text>
            
            <View style={styles.roleDisplay}>
              <Text style={styles.roleLabel}>Rôle :</Text>
              <View style={[styles.roleBadge, { backgroundColor: selectedUser?.role === 'ADMIN' ? '#4A90D9' : '#7ED321' }]}>
                <Text style={styles.roleText}>{selectedUser?.role}</Text>
              </View>
            </View>

            <Text style={styles.modalDate}>
              Créé le {selectedUser?.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString('fr-FR') : ''}
            </Text>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedUser(null)}>
              <Text style={styles.closeBtnText}>Fermer</Text>
            </TouchableOpacity>
          </View>
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
  userDate: { fontSize: 11, color: '#999', marginTop: 2 },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  roleText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
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
  roleDisplay: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  roleLabel: { fontSize: 14, color: colors.text.secondary },
  modalDate: { fontSize: 12, color: '#999', marginBottom: 20 },
  closeBtn: {
    width: '100%',
    padding: 14,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  closeBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});