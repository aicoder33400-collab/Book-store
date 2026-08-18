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
import { loanService, Loan } from '../../services/loan.service';
import { colors } from '../../theme/colors';
import api from '../../services/api';

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

export const MyLoansScreen = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLoans = async () => {
    try {
      const data = await loanService.getUserLoans();
      setLoans(data);
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  // 🔥 Demande de retour avec confirmation
  const handleRequestReturn = async (loanId: string, bookTitle: string) => {
    console.log('🟢 DEMANDE DE RETOUR - ID:', loanId);
    
    // 🔥 Fonction pour exécuter la requête
    const executeRequest = async () => {
      try {
        console.log('📤 PUT /loans/' + loanId + '/request-return');
        const response = await api.put(`/loans/${loanId}/request-return`);
        console.log('✅ Réponse:', response.data);
        
        Alert.alert('Succès', '📩 Demande de retour envoyée !');
        fetchLoans();
      } catch (error: any) {
        console.error('❌ Erreur:', error);
        console.error('❌ Status:', error.response?.status);
        console.error('❌ Data:', error.response?.data);
        Alert.alert('Erreur', error.response?.data?.message || 'Impossible de demander le retour');
      }
    };

    // 🔥 Pour le web : utiliser window.confirm
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Voulez-vous signaler que vous souhaitez retourner "${bookTitle}" ?`);
      if (confirmed) {
        await executeRequest();
      }
      return;
    }

    // 🔥 Pour mobile : utiliser Alert.alert
    Alert.alert(
      'Demander le retour',
      `Voulez-vous signaler que vous souhaitez retourner "${bookTitle}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Demander le retour',
          onPress: executeRequest,
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

  const renderLoan = ({ item }: { item: Loan }) => {
    const isBorrowedOrLate = item.status === 'BORROWED' || item.status === 'LATE';
    const isReturnRequested = item.status === 'RETURN_REQUESTED';
    const canRequestReturn = isBorrowedOrLate && !isReturnRequested;
    
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.bookTitle}>📖 {item.book?.title || 'Livre'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] || '#999' }]}>
            <Text style={styles.statusText}>{STATUS_LABELS[item.status] || item.status}</Text>
          </View>
        </View>

        <Text style={styles.bookAuthor}>✍️ {item.book?.author || ''}</Text>
        
        <View style={styles.dates}>
          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>📅 Emprunté le</Text>
            <Text style={styles.dateValue}>{formatDate(item.borrowedAt)}</Text>
          </View>
          
          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>⏳ À rendre avant</Text>
            <Text style={[styles.dateValue, styles.dueDate]}>
              {formatDate(item.dueDate)}
            </Text>
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

        {canRequestReturn && (
          <TouchableOpacity 
            style={styles.requestReturnBtn} 
            onPress={() => handleRequestReturn(item.id, item.book?.title || 'ce livre')}
            activeOpacity={0.8}
          >
            <Text style={styles.btnText}>📩 Demander le retour</Text>
          </TouchableOpacity>
        )}

        {isReturnRequested && (
          <View style={styles.waitingBadge}>
            <Text style={styles.waitingText}>⏳ En attente de validation</Text>
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
      ListEmptyComponent={<Text style={styles.empty}>Aucun emprunt</Text>}
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
  bookTitle: { fontSize: 16, fontWeight: '700', color: colors.text.primary, flex: 1 },
  bookAuthor: { fontSize: 13, color: colors.text.secondary, marginBottom: 8 },
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
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  requestReturnBtn: {
    backgroundColor: '#FF9800',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  waitingBadge: {
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  waitingText: {
    color: '#E65100',
    fontWeight: '600',
    fontSize: 14,
  },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
