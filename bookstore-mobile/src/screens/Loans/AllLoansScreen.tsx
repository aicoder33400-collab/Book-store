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
  ScrollView,
} from 'react-native';
import api from '../../services/api';
import { colors } from '../../theme/colors';

const STATUS_LABELS: Record<string, string> = {
  REQUESTED: 'En attente',
  APPROVED: 'Approuvé',
  REJECTED: 'Refusé',
  BORROWED: 'Emprunté',
  RETURN_REQUESTED: 'Retour demandé',
  RETURNED: 'Retourné',
  LATE: 'En retard',
};

const STATUS_ICONS: Record<string, string> = {
  REQUESTED: '🔔',
  APPROVED: '✅',
  REJECTED: '❌',
  BORROWED: '📖',
  RETURN_REQUESTED: '📩',
  RETURNED: '↩️',
  LATE: '⚠️',
};

const STATUS_COLORS: Record<string, string> = {
  REQUESTED: '#D4853A',
  APPROVED: '#3A6B8F',
  REJECTED: '#B53A3A',
  BORROWED: '#2D7A55',
  RETURN_REQUESTED: '#C9A961',
  RETURNED: '#6B7B72',
  LATE: '#B53A3A',
};

const PRAYER_LABELS: Record<string, string> = {
  DOHR: '🕐 Dohr',
  ASR: '🕓 Asr',
  MAGHREB: '🌅 Maghreb',
};

type FilterType = 'ALL' | 'REQUESTED' | 'APPROVED' | 'BORROWED' | 'RETURN_REQUESTED' | 'RETURNED';

export const AllLoansScreen = () => {
  const [loans, setLoans] = useState<any[]>([]);
  const [filteredLoans, setFilteredLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');

  const fetchLoans = async () => {
    try {
      const response = await api.get('/loans', { params: { limit: 100 } });
      setLoans(response.data.data);
      applyFilter(response.data.data, activeFilter);
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

  const applyFilter = (list: any[], filter: FilterType) => {
    if (filter === 'ALL') {
      setFilteredLoans(list);
    } else {
      setFilteredLoans(list.filter((l) => l.status === filter));
    }
  };

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    applyFilter(loans, filter);
  };

  // 🔥 Fonction pour afficher un message (compatible web)
  const showMessage = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // 🔥 Fonction pour confirmer (compatible web)
  const confirmAction = (title: string, message: string, onConfirm: () => void) => {
    if (Platform.OS === 'web') {
      const ok = window.confirm(`${title}\n\n${message}`);
      if (ok) onConfirm();
    } else {
      Alert.alert(title, message, [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Confirmer', onPress: onConfirm },
      ]);
    }
  };

  const handleApprove = async (loanId: string) => {
    confirmAction(
      'Approuver',
      'Confirmer l\'approbation de cette demande ?',
      async () => {
        try {
          await api.put(`/loans/${loanId}/approve`);
          showMessage('✅ Succès', 'Demande approuvée !');
          fetchLoans();
        } catch (error: any) {
          showMessage('Erreur', error.response?.data?.message || 'Erreur');
        }
      }
    );
  };

  const handleReject = async (loanId: string) => {
    confirmAction(
      'Refuser',
      'Confirmer le refus de cette demande ?',
      async () => {
        try {
          await api.put(`/loans/${loanId}/reject`);
          showMessage('❌ Succès', 'Demande refusée');
          fetchLoans();
        } catch (error: any) {
          showMessage('Erreur', error.response?.data?.message || 'Erreur');
        }
      }
    );
  };

  const handleHandOver = async (loanId: string) => {
    confirmAction(
      'Remettre',
      'Confirmer la remise du livre à l\'utilisateur ?',
      async () => {
        try {
          await api.put(`/loans/${loanId}/hand-over`);
          showMessage('📦 Succès', 'Livre remis !');
          fetchLoans();
        } catch (error: any) {
          showMessage('Erreur', error.response?.data?.message || 'Erreur');
        }
      }
    );
  };

  const handleConfirmReturn = async (loanId: string) => {
    confirmAction(
      'Confirmer le retour',
      'Avez-vous vérifié que le livre est en bon état ?',
      async () => {
        try {
          await api.put(`/loans/${loanId}/confirm-return`);
          showMessage('✅ Succès', 'Retour confirmé !');
          fetchLoans();
        } catch (error: any) {
          showMessage('Erreur', error.response?.data?.message || 'Erreur');
        }
      }
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

  const FILTERS: Array<{ key: FilterType; label: string; icon: string }> = [
    { key: 'ALL', label: 'Tout', icon: '📋' },
    { key: 'REQUESTED', label: 'En attente', icon: '🔔' },
    { key: 'APPROVED', label: 'Approuvés', icon: '✅' },
    { key: 'BORROWED', label: 'Empruntés', icon: '📖' },
    { key: 'RETURN_REQUESTED', label: 'Retours', icon: '📩' },
    { key: 'RETURNED', label: 'Retournés', icon: '↩️' },
  ];

  const renderLoan = ({ item }: { item: any }) => (
    <View style={styles.card}>
      {/* En-tête */}
      <View style={styles.cardHeader}>
        <View style={styles.userRow}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {(item.user?.name || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.user?.name || 'Utilisateur'}</Text>
            <Text style={styles.userEmail} numberOfLines={1}>
              {item.user?.email || ''}
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] }]}>
          <Text style={styles.statusIcon}>{STATUS_ICONS[item.status]}</Text>
          <Text style={styles.statusText}>{STATUS_LABELS[item.status] || item.status}</Text>
        </View>
      </View>

      {/* Livre */}
      <View style={styles.bookRow}>
        <Text style={styles.bookEmoji}>📖</Text>
        <View style={styles.bookInfo}>
          <Text style={styles.bookTitle} numberOfLines={1}>{item.book?.title || 'Livre'}</Text>
          <Text style={styles.bookAuthor} numberOfLines={1}>✍️ {item.book?.author || ''}</Text>
        </View>
      </View>

      {/* Dates */}
      <View style={styles.dates}>
        <View style={styles.dateRow}>
          <Text style={styles.dateLabel}>📅 Demandé le</Text>
          <Text style={styles.dateValue}>{formatDate(item.createdAt)}</Text>
        </View>

        {item.borrowedAt &&
          (item.status === 'BORROWED' ||
            item.status === 'LATE' ||
            item.status === 'RETURNED') && (
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>📆 Emprunté le</Text>
              <Text style={styles.dateValue}>{formatDate(item.borrowedAt)}</Text>
            </View>
          )}

        {(item.status === 'BORROWED' ||
          item.status === 'LATE' ||
          item.status === 'RETURN_REQUESTED' ||
          item.status === 'RETURNED') && (
          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>⏳ À rendre avant</Text>
            <Text style={[styles.dateValue, styles.dueDate]}>
              {formatDate(item.dueDate)}
            </Text>
          </View>
        )}

        {item.returnedAt && (
          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>↩️ Retourné le</Text>
            <Text style={[styles.dateValue, styles.returnedDate]}>
              {formatDate(item.returnedAt)}
            </Text>
          </View>
        )}
      </View>

      {/* 🔥 Créneau de retrait */}
      {item.pickupDate && item.pickupPrayer && (
        <View style={styles.pickupBox}>
          <Text style={styles.pickupTitle}>📅 Rendez-vous de retrait</Text>
          <Text style={styles.pickupText}>
            {new Date(item.pickupDate).toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: '2-digit',
              month: 'long',
              timeZone: 'UTC',
            })}{' '}
            — {PRAYER_LABELS[item.pickupPrayer] || item.pickupPrayer}
          </Text>
        </View>
      )}

      {/* 🔥 Créneau de retour */}
      {item.returnPickupDate && item.returnPickupPrayer && (
        <View style={[styles.pickupBox, { borderLeftColor: colors.success, backgroundColor: 'rgba(45, 122, 85, 0.08)' }]}>
          <Text style={[styles.pickupTitle, { color: colors.success }]}>
            📅 Rendez-vous de retour
          </Text>
          <Text style={styles.pickupText}>
            {new Date(item.returnPickupDate).toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: '2-digit',
              month: 'long',
              timeZone: 'UTC',
            })}{' '}
            — {PRAYER_LABELS[item.returnPickupPrayer] || item.returnPickupPrayer}
          </Text>
        </View>
      )}


      {/* Actions */}
      {item.status === 'REQUESTED' && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.approveBtn]}
            onPress={() => handleApprove(item.id)}
            activeOpacity={0.85}
          >
            <Text style={styles.actionBtnText}>✓ Approuver</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.rejectBtn]}
            onPress={() => handleReject(item.id)}
            activeOpacity={0.85}
          >
            <Text style={styles.actionBtnText}>✗ Refuser</Text>
          </TouchableOpacity>
        </View>
      )}

      {item.status === 'APPROVED' && item.pickupDate && item.pickupPrayer && (
        <TouchableOpacity
          style={[styles.actionBtn, styles.handOverBtn]}
          onPress={() => handleHandOver(item.id)}
          activeOpacity={0.85}
        >
          <Text style={styles.actionBtnText}>📦 Remettre le livre</Text>
        </TouchableOpacity>
      )}

      {item.status === 'APPROVED' && (!item.pickupDate || !item.pickupPrayer) && (
        <View style={styles.noPickupWarning}>
          <Text style={styles.noPickupText}>
            ⏳ En attente du créneau choisi par l'utilisateur
          </Text>
        </View>
      )}     

      {item.status === 'RETURN_REQUESTED' && (
        <TouchableOpacity
          style={[styles.actionBtn, styles.confirmReturnBtn]}
          onPress={() => handleConfirmReturn(item.id)}
          activeOpacity={0.85}
        >
          <Text style={styles.actionBtnText}>✅ Confirmer le retour</Text>
        </TouchableOpacity>
      )}

      {(item.status === 'BORROWED' || item.status === 'LATE') && (
        <View style={styles.waitingBadge}>
          <Text style={styles.waitingText}>📖 En cours d'emprunt</Text>
        </View>
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
    <View style={styles.container}>
      {/* Filtres */}
      <View style={styles.filtersWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          {FILTERS.map((f) => {
            const count =
              f.key === 'ALL' ? loans.length : loans.filter((l) => l.status === f.key).length;
            return (
              <TouchableOpacity
                key={f.key}
                style={[
                  styles.filterChip,
                  activeFilter === f.key && styles.filterChipActive,
                ]}
                onPress={() => handleFilterChange(f.key)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    activeFilter === f.key && styles.filterChipTextActive,
                  ]}
                >
                  {f.icon} {f.label} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={filteredLoans}
        keyExtractor={(item) => item.id}
        renderItem={renderLoan}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchLoans();
            }}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>Aucune demande</Text>
            <Text style={styles.emptySubText}>
              {activeFilter === 'ALL'
                ? 'Aucun emprunt enregistré'
                : 'Aucune demande dans cette catégorie'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },

  // Filtres
  filtersWrapper: {
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filtersContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: colors.text.white,
  },

  // Liste
  list: {
    padding: 16,
    paddingBottom: 60,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: { fontSize: 48, marginBottom: 12, opacity: 0.4 },
  emptyText: {
    fontSize: 16,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  emptySubText: {
    fontSize: 13,
    color: colors.text.light,
    marginTop: 4,
  },

  // Carte
  card: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.secondary,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  userAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  userAvatarText: {
    color: colors.text.white,
    fontSize: 16,
    fontWeight: '700',
  },
  userInfo: { flex: 1 },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
  },
  userEmail: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  statusIcon: { fontSize: 11 },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Livre
  bookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  bookEmoji: { fontSize: 22, marginRight: 10 },
  bookInfo: { flex: 1 },
  bookTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
  },
  bookAuthor: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },

  // Dates
  dates: {
    gap: 4,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  dateLabel: {
    fontSize: 11,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  dateValue: {
    fontSize: 11,
    color: colors.text.primary,
    fontWeight: '600',
  },
  dueDate: {
    color: colors.danger,
  },
  returnedDate: {
    color: colors.success,
  },

  // Actions
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  approveBtn: {
    flex: 1,
    backgroundColor: colors.success,
    marginTop: 0,
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: colors.danger,
    marginTop: 0,
  },
  handOverBtn: {
    backgroundColor: colors.warning,
  },
  confirmReturnBtn: {
    backgroundColor: colors.success,
  },

  // Badge d'attente
  waitingBadge: {
    backgroundColor: 'rgba(58, 107, 143, 0.1)',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(58, 107, 143, 0.2)',
  },
  waitingText: {
    color: colors.info,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  pickupBox: {
    backgroundColor: 'rgba(74, 144, 217, 0.08)',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#4A90D9',
  },
  pickupTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4A90D9',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  pickupText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
    textTransform: 'capitalize',
  },
  noPickupWarning: {
    backgroundColor: 'rgba(245, 166, 35, 0.1)',
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 166, 35, 0.3)',
    alignItems: 'center',
  },
  noPickupText: {
    fontSize: 12,
    color: '#D4853A',
    fontWeight: '600',
  },
});
