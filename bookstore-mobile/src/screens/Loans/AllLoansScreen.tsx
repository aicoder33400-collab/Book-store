import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import api from '../../services/api';
import { useDashboardStore } from '../../store/dashboard.store';
import { LoanRequest } from '../../services/admin.service';
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
  const [loans, setLoans] = useState<LoanRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { approveRequest, rejectRequest, handOverBook } = useDashboardStore();

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmReturn, setConfirmReturn] = useState<string | null>(null);

  const fetchLoans = async () => {
    try {
      const response = await api.get('/loans', { params: { limit: 100 } });
      setLoans(response.data.data);
    } catch (error) {
      console.error('Failed to fetch loans:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const handleApprove = (loanId: string) => {
    Alert.alert('Approuver', "Confirmer l'approbation ?", [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Approuver',
        onPress: async () => {
          await approveRequest(loanId);
          fetchLoans();
        },
      },
    ]);
  };

  const handleReject = (loanId: string) => {
    Alert.alert('Refuser', 'Confirmer le refus ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Refuser',
        style: 'destructive',
        onPress: async () => {
          await rejectRequest(loanId);
          fetchLoans();
        },
      },
    ]);
  };

  const handleHandOver = (loanId: string) => {
    Alert.alert('Remettre', 'Confirmer la remise du livre ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Remettre',
        onPress: async () => {
          await handOverBook(loanId);
          fetchLoans();
        },
      },
    ]);
  };

  const handleReturn = (loanId: string) => {
    setConfirmReturn(loanId);
  };

  const doReturn = async () => {
    if (!confirmReturn) return;
    try {
      await api.put(`/loans/${confirmReturn}/return`);
      setConfirmReturn(null);
      fetchLoans();
    } catch (error: any) {
      Alert.alert('Erreur', error.response?.data?.message || 'Échec du retour');
      setConfirmReturn(null);
    }
  };

  const handleDelete = (loanId: string) => {
    console.log('DELETE pressed for loan:', loanId);
    setConfirmDelete(loanId);
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    console.log('Confirmed delete for:', confirmDelete);
    try {
      await api.delete(`/loans/${confirmDelete}`);
      console.log('Delete successful');
      setConfirmDelete(null);
      fetchLoans();
    } catch (error: any) {
      console.log('Delete error:', error.response?.data || error.message);
      Alert.alert('Erreur', error.response?.data?.message || 'Échec de la suppression');
      setConfirmDelete(null);
    }
  };

  const renderLoan = ({ item }: { item: LoanRequest }) => (
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
        📅 Échéance: {new Date(item.dueDate).toLocaleDateString('fr-FR')}
      </Text>
      {item.borrowedAt && (
        <Text style={styles.date}>
          📆 Emprunté le: {new Date(item.borrowedAt).toLocaleDateString('fr-FR')} à{' '}
          {new Date(item.borrowedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      )}
      {!item.borrowedAt && item.status === 'REQUESTED' && (
        <Text style={styles.date}>
          📆 Demandé le: {new Date(item.createdAt).toLocaleDateString('fr-FR')} à{' '}
          {new Date(item.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      )}

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

      {(item.status === 'REJECTED' || item.status === 'RETURNED') && (
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
          <Text style={styles.btnText}>🗑️ Supprimer</Text>
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
    <View style={{ flex: 1 }}>
    <FlatList
      data={loans}
      keyExtractor={(item) => item.id}
      renderItem={renderLoan}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchLoans(); }} />}
      ListEmptyComponent={
        <Text style={styles.empty}>Aucun emprunt trouvé</Text>
      }
    />
    
      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>Supprimer</Text>
            <Text style={styles.confirmText}>Supprimer définitivement cet emprunt ?</Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity style={styles.confirmCancel} onPress={() => setConfirmDelete(null)}>
                <Text style={styles.confirmCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmDanger} onPress={doDelete}>
                <Text style={styles.confirmDangerText}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Return Confirmation Modal */}
      {confirmReturn && (
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>Retourner</Text>
            <Text style={styles.confirmText}>Confirmer le retour du livre ?</Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity style={styles.confirmCancel} onPress={() => setConfirmReturn(null)}>
                <Text style={styles.confirmCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmSave} onPress={doReturn}>
                <Text style={styles.confirmSaveText}>Retourner</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
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
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
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
  deleteBtn: {
    backgroundColor: '#999',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 14 },

    confirmOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center',
  },
  confirmBox: {
    backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '85%',
  },
  confirmTitle: { fontSize: 18, fontWeight: '700', color: colors.text.primary, marginBottom: 8 },
  confirmText: { fontSize: 14, color: colors.text.secondary, marginBottom: 20 },
  confirmActions: { flexDirection: 'row', gap: 10 },
  confirmCancel: {
    flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#f0f0f0', alignItems: 'center',
  },
  confirmCancelText: { color: '#666', fontWeight: '600' },
  confirmDanger: {
    flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#f44336', alignItems: 'center',
  },
  confirmDangerText: { color: '#fff', fontWeight: '600' },
  confirmSave: {
    flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#2196F3', alignItems: 'center',
  },
  confirmSaveText: { color: '#fff', fontWeight: '600' },
});