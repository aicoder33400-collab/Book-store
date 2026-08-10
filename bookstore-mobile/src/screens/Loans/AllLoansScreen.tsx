import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import api from '../../services/api';
import { colors } from '../../theme/colors';

const STATUS_LABELS: Record<string, string> = {
  REQUESTED: '🔔 En attente',
  APPROVED: '✅ Approuvé',
  REJECTED: '❌ Refusé',
  BORROWED: '📖 Emprunté',
  RETURNED: '↩️ Retourné',
  LATE: '⚠️ En retard',
};

const STATUS_COLORS: Record<string, string> = {
  REQUESTED: '#F5A623',
  APPROVED: '#4A90D9',
  REJECTED: '#f44336',
  BORROWED: '#4CAF50',
  RETURNED: '#9E9E9E',
  LATE: '#FF5722',
};

export const AllLoansScreen = () => {
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLoans = async () => {
    try {
      const response = await api.get('/loans', { params: { limit: 100 } });
      setLoans(response.data.data);
    } catch (error: any) {
      console.error('Erreur:', error.response?.data || error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  // ✅ APPROUVER
  const handleApprove = async (loanId: string) => {
    try {
      await api.put(`/loans/${loanId}/approve`);
      fetchLoans();
    } catch (error: any) {
      console.error('Erreur approve:', error.response?.data || error.message);
    }
  };

  // ❌ REFUSER
  const handleReject = async (loanId: string) => {
    try {
      await api.put(`/loans/${loanId}/reject`);
      fetchLoans();
    } catch (error: any) {
      console.error('Erreur reject:', error.response?.data || error.message);
    }
  };

  // 📦 REMETTRE LE LIVRE
  const handleHandOver = async (loanId: string) => {
    try {
      await api.put(`/loans/${loanId}/hand-over`);
      fetchLoans();
    } catch (error: any) {
      console.error('Erreur hand-over:', error.response?.data || error.message);
    }
  };

  // ↩️ RETOURNER
  const handleReturn = async (loanId: string) => {
    try {
      await api.put(`/loans/${loanId}/return`);
      fetchLoans();
    } catch (error: any) {
      console.error('Erreur return:', error.response?.data || error.message);
    }
  };

  const renderLoan = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.userName}>👤 {item.user?.name || 'Utilisateur'}</Text>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] || '#999' }]}>
          <Text style={styles.statusText}>{STATUS_LABELS[item.status] || item.status}</Text>
        </View>
      </View>

      <Text style={styles.bookTitle}>📖 {item.book?.title || 'Livre'}</Text>
      <Text style={styles.bookAuthor}>✍️ {item.book?.author || ''}</Text>
      <Text style={styles.date}>
        📅 Demandé le: {new Date(item.createdAt).toLocaleDateString('fr-FR')}
      </Text>

      {item.status === 'REQUESTED' && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(item.id)}>
            <Text style={styles.btnText}>✓ Approuver</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(item.id)}>
            <Text style={styles.btnText}>✗ Refuser</Text>
          </TouchableOpacity>
        </View>
      )}

      {item.status === 'APPROVED' && (
        <TouchableOpacity style={styles.handOverBtn} onPress={() => handleHandOver(item.id)}>
          <Text style={styles.btnText}>📦 Remettre le livre</Text>
        </TouchableOpacity>
      )}

      {(item.status === 'BORROWED' || item.status === 'LATE') && (
        <TouchableOpacity style={styles.returnBtn} onPress={() => handleReturn(item.id)}>
          <Text style={styles.btnText}>↩️ Retourner</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={loans}
      keyExtractor={(item) => item.id}
      renderItem={renderLoan}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchLoans(); }} />}
      ListEmptyComponent={<Text style={styles.empty}>Aucun emprunt trouvé</Text>}
    />
  );
};

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: { fontSize: 15, fontWeight: '600', color: colors.text.primary },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  bookTitle: { fontSize: 16, fontWeight: '700', color: colors.text.primary, marginBottom: 2 },
  bookAuthor: { fontSize: 13, color: colors.text.secondary, marginBottom: 4 },
  date: { fontSize: 12, color: '#666', marginBottom: 4 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  approveBtn: {
    flex: 1,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: '#f44336',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  handOverBtn: {
    backgroundColor: '#FF9800',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  returnBtn: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});