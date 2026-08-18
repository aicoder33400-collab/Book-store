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
  Platform,
} from 'react-native';
import api from '../../services/api';
import { colors } from '../../theme/colors';

const STATUS_LABELS: Record<string, string> = {
  REQUESTED: '🔔 En attente',
  APPROVED: '✅ Approuvé',
  REJECTED: '❌ Refusé',
  BORROWED: '📖 Emprunté',
  RETURN_REQUESTED: '📩 Retour demandé',
  RETURNED: '↩️ Retourné',
  LATE: '⚠️ En retard',
};

const STATUS_COLORS: Record<string, string> = {
  REQUESTED: '#F5A623',
  APPROVED: '#4A90D9',
  REJECTED: '#f44336',
  BORROWED: '#4CAF50',
  RETURN_REQUESTED: '#FF9800',
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

  const handleApprove = async (loanId: string) => {
    try {
      await api.put(`/loans/${loanId}/approve`);
      Alert.alert('Succès', '✅ Demande approuvée');
      fetchLoans();
    } catch (error: any) {
      console.error('Erreur approve:', error.response?.data || error.message);
      Alert.alert('Erreur', error.response?.data?.message || 'Erreur');
    }
  };

  const handleReject = async (loanId: string) => {
    try {
      await api.put(`/loans/${loanId}/reject`);
      Alert.alert('Succès', '❌ Demande refusée');
      fetchLoans();
    } catch (error: any) {
      console.error('Erreur reject:', error.response?.data || error.message);
      Alert.alert('Erreur', error.response?.data?.message || 'Erreur');
    }
  };

  const handleHandOver = async (loanId: string) => {
    try {
      await api.put(`/loans/${loanId}/hand-over`);
      Alert.alert('Succès', '📦 Livre remis');
      fetchLoans();
    } catch (error: any) {
      console.error('Erreur hand-over:', error.response?.data || error.message);
      Alert.alert('Erreur', error.response?.data?.message || 'Erreur');
    }
  };

  // 🔥 Admin confirme le retour - avec window.confirm pour web
  const handleConfirmReturn = async (loanId: string) => {
    console.log('🟢 CONFIRMER LE RETOUR - ID:', loanId);
    
    // 🔥 Fonction pour exécuter la requête
    const executeConfirm = async () => {
      try {
        console.log('📤 PUT /loans/' + loanId + '/confirm-return');
        const response = await api.put(`/loans/${loanId}/confirm-return`);
        console.log('✅ Réponse:', response.data);
        
        if (Platform.OS === 'web') {
          alert('✅ Retour confirmé !');
        } else {
          Alert.alert('Succès', '✅ Retour confirmé !');
        }
        fetchLoans();
      } catch (error: any) {
        console.error('❌ ERREUR COMPLÈTE:', error);
        console.error('❌ Status:', error.response?.status);
        console.error('❌ Data:', error.response?.data);
        
        const errorMsg = error.response?.data?.message || 'Échec de la confirmation';
        if (Platform.OS === 'web') {
          alert('❌ Erreur: ' + errorMsg);
        } else {
          Alert.alert('Erreur', errorMsg);
        }
      }
    };

    // 🔥 Pour le web : utiliser window.confirm
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Avez-vous bien vérifié que le livre est en bon état ?');
      if (confirmed) {
        await executeConfirm();
      }
      return;
    }

    // 🔥 Pour mobile : utiliser Alert.alert
    Alert.alert(
      'Confirmer le retour',
      'Avez-vous bien vérifié que le livre est en bon état ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer le retour',
          onPress: executeConfirm,
        }
      ]
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderLoan = ({ item }: { item: any }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.userName}>👤 {item.user?.name || 'Utilisateur'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] || '#999' }]}>
            <Text style={styles.statusText}>{STATUS_LABELS[item.status] || item.status}</Text>
          </View>
        </View>

        <Text style={styles.bookTitle}>📖 {item.book?.title || 'Livre'}</Text>
        <Text style={styles.bookAuthor}>✍️ {item.book?.author || ''}</Text>

        <View style={styles.dates}>
          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>📅 Demandé le</Text>
            <Text style={styles.dateValue}>{formatDate(item.createdAt)}</Text>
          </View>
          
          {item.borrowedAt && (
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>📆 Emprunté le</Text>
              <Text style={styles.dateValue}>{formatDate(item.borrowedAt)}</Text>
            </View>
          )}
          
          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>⏳ À rendre avant</Text>
            <Text style={[styles.dateValue, styles.dueDate]}>{formatDate(item.dueDate)}</Text>
          </View>
          
          {item.returnedAt && (
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>↩️ Retourné le</Text>
              <Text style={[styles.dateValue, styles.returnedDate]}>
                {formatDate(item.returnedAt)}
              </Text>
            </View>
          )}
        </View>

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

        {item.status === 'RETURN_REQUESTED' && (
          <TouchableOpacity style={styles.confirmReturnBtn} onPress={() => handleConfirmReturn(item.id)}>
            <Text style={styles.btnText}>✅ Confirmer le retour</Text>
          </TouchableOpacity>
        )}

        {(item.status === 'BORROWED' || item.status === 'LATE') && (
          <View style={styles.waitingBadge}>
            <Text style={styles.waitingText}>📖 En cours d'emprunt</Text>
          </View>
        )}
      </View>
    );
  };

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
    marginBottom: 4,
  },
  userName: { fontSize: 15, fontWeight: '600', color: colors.text.primary },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  bookTitle: { fontSize: 16, fontWeight: '700', color: colors.text.primary, marginBottom: 2 },
  bookAuthor: { fontSize: 13, color: colors.text.secondary, marginBottom: 6 },
  dates: { marginTop: 4, gap: 2 },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  dateLabel: { fontSize: 12, color: '#888' },
  dateValue: { fontSize: 12, color: '#333' },
  dueDate: { color: colors.danger, fontWeight: '600' },
  returnedDate: { color: colors.success, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 8 },
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
  confirmReturnBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  waitingBadge: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  waitingText: {
    color: '#1565C0',
    fontWeight: '600',
    fontSize: 14,
  },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
