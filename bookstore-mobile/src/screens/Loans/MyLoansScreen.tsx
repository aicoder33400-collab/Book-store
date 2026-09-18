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
  Modal,
  ScrollView,
} from 'react-native';
import { loanService, Loan, PrayerSlot } from '../../services/loan.service';
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

const PRAYER_LABELS: Record<string, string> = {
  DOHR: '🕐 Dohr',
  ASR: '🕓 Asr',
  MAGHREB: '🌅 Maghreb',
};

// 🎯 Helpers cross-platform
const confirmDialog = (
  title: string,
  message: string,
  onConfirm: () => void,
  confirmText = 'Confirmer',
) => {
  if (Platform.OS === 'web') {
    const ok = window.confirm(`${title}\n\n${message}`);
    if (ok) onConfirm();
  } else {
    Alert.alert(title, message, [
      { text: 'Annuler', style: 'cancel' },
      { text: confirmText, onPress: onConfirm },
    ]);
  }
};

const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

// 🎯 Génère les 7 prochains jours
const getNext7Days = () => {
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    days.push({
      date,
      iso: date.toISOString().split('T')[0],
      dayNum: date.getDate(),
      dayName: date.toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 3),
      monthName: date.toLocaleDateString('fr-FR', { month: 'short' }).slice(0, 3),
      isToday: i === 0,
      isTomorrow: i === 1,
    });
  }
  return days;
};

export const MyLoansScreen = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // État modale créneau
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedPrayer, setSelectedPrayer] = useState<PrayerSlot | null>(null);
  const [saving, setSaving] = useState(false);

  const days = getNext7Days();

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

  // 🔥 Ouvrir la modale
  const openPickupModal = (loan: Loan) => {
    setSelectedLoan(loan);
    setSelectedDay(loan.pickupDate ? String(loan.pickupDate).split('T')[0] : null);
    setSelectedPrayer((loan.pickupPrayer as PrayerSlot) || null);
    setModalVisible(true);
  };

  // 🔥 Confirmer le créneau
  const handleConfirmPickup = async () => {
    if (!selectedDay || !selectedPrayer) {
      showAlert('Erreur', 'Veuillez choisir un jour et une prière');
      return;
    }
    if (!selectedLoan) return;

    setSaving(true);
    try {
      // 🔥 Fix timezone : forcer la date à midi UTC
      // Sinon `new Date('2026-09-21')` = minuit UTC = veille en France
      const dateWithNoon = `${selectedDay}T12:00:00.000Z`;
      await loanService.setPickupSlot(selectedLoan.id, dateWithNoon, selectedPrayer);

      setModalVisible(false);
      setSaving(false);
      showAlert('✅ Succès', 'Votre créneau est enregistré !');
      fetchLoans();
    } catch (error: any) {
      setSaving(false);
      showAlert(
        'Erreur',
        error.response?.data?.message || 'Impossible d\'enregistrer le créneau',
      );
    }
  };

  // 🔥 Demander le retour
  const handleRequestReturn = (loanId: string) => {
    confirmDialog(
      'Demander le retour',
      'Voulez-vous signaler que vous souhaitez retourner ce livre ?',
      async () => {
        try {
          await loanService.requestReturn(loanId);
          showAlert('✅ Succès', '📩 Demande de retour envoyée !');
          fetchLoans();
        } catch (error: any) {
          showAlert(
            'Erreur',
            error.response?.data?.message || 'Impossible de demander le retour',
          );
        }
      },
      'Demander le retour',
    );
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPickupDate = (dateString?: string | null) => {
    if (!dateString) return '—';
    // 🔥 Fix timezone : forcer le fuseau UTC pour éviter le décalage
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      timeZone: 'UTC',  // ← force UTC pour éviter le décalage
    });
  };

  const renderLoan = ({ item }: { item: Loan }) => {
    const isBorrowedOrLate = item.status === 'BORROWED' || item.status === 'LATE';
    const isReturnRequested = item.status === 'RETURN_REQUESTED';
    const canRequestReturn = isBorrowedOrLate && !isReturnRequested;
    const showDates =
      item.status === 'BORROWED' || item.status === 'LATE' || item.status === 'RETURNED';

    const isApproved = item.status === 'APPROVED';
    const hasPickup = !!(item.pickupDate && item.pickupPrayer);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.bookTitle}>📖 {item.book?.title || 'Livre'}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: STATUS_COLORS[item.status] || '#999' },
            ]}
          >
            <Text style={styles.statusText}>{STATUS_LABELS[item.status] || item.status}</Text>
          </View>
        </View>

        <Text style={styles.bookAuthor}>✍️ {item.book?.author || ''}</Text>

        <View style={styles.dates}>
          {showDates && (
            <>
              <View style={styles.dateRow}>
                <Text style={styles.dateLabel}>📅 Emprunté le</Text>
                <Text style={styles.dateValue}>{formatDate(item.borrowedAt)}</Text>
              </View>
              <View style={styles.dateRow}>
                <Text style={styles.dateLabel}>⏳ À rendre avant</Text>
                <Text style={[styles.dateValue, styles.dueDate]}>{formatDate(item.dueDate)}</Text>
              </View>
            </>
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
        {isApproved && hasPickup && (
          <View style={styles.pickupInfo}>
            <Text style={styles.pickupInfoTitle}>📅 Rendez-vous confirmé</Text>
            <Text style={styles.pickupInfoText}>
              {formatPickupDate(item.pickupDate)} — {PRAYER_LABELS[item.pickupPrayer!] || item.pickupPrayer}
            </Text>
          </View>
        )}

        {/* Bouton choisir/modifier créneau */}
        {isApproved && (
          <TouchableOpacity
            style={[styles.requestReturnBtn, styles.pickupBtn]}
            onPress={() => openPickupModal(item)}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>
              {hasPickup ? '✏️ Modifier le créneau' : '📅 Choisir un créneau'}
            </Text>
          </TouchableOpacity>
        )}

        {isApproved && !hasPickup && (
          <View style={styles.infoBadge}>
            <Text style={styles.infoText}>
              ⏳ Choisissez un créneau pour venir récupérer le livre
            </Text>
          </View>
        )}

        {canRequestReturn && (
          <TouchableOpacity
            style={styles.requestReturnBtn}
            onPress={() => handleRequestReturn(item.id)}
            activeOpacity={0.85}
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
    <>
      <FlatList
        data={loans}
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
          />
        }
        ListEmptyComponent={<Text style={styles.empty}>Aucun emprunt</Text>}
      />

      {/* 🔥 MODALE DE CHOIX DE CRÉNEAU */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Choisir un créneau</Text>
                <Text style={styles.modalSubtitle}>Pour venir récupérer le livre</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Jours */}
              <Text style={styles.sectionLabel}>📅 Choisissez un jour</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.daysRow}
              >
                {days.map((day) => {
                  const isSelected = selectedDay === day.iso;
                  return (
                    <TouchableOpacity
                      key={day.iso}
                      style={[styles.dayCard, isSelected && styles.dayCardSelected]}
                      onPress={() => setSelectedDay(day.iso)}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.dayName, isSelected && styles.dayNameSelected]}>
                        {day.dayName}
                      </Text>
                      <Text style={[styles.dayNum, isSelected && styles.dayNumSelected]}>
                        {day.dayNum}
                      </Text>
                      <Text style={[styles.dayMonth, isSelected && styles.dayMonthSelected]}>
                        {day.monthName}
                      </Text>
                      {day.isToday && (
                        <View style={styles.todayBadge}>
                          <Text style={styles.todayBadgeText}>Auj.</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Prières */}
              <Text style={[styles.sectionLabel, { marginTop: 24 }]}>
                🕌 Choisissez la prière
              </Text>
              <View style={styles.prayersGrid}>
                {(['DOHR', 'ASR', 'MAGHREB'] as const).map((prayer) => {
                  const isSelected = selectedPrayer === prayer;
                  return (
                    <TouchableOpacity
                      key={prayer}
                      style={[styles.prayerCard, isSelected && styles.prayerCardSelected]}
                      onPress={() => setSelectedPrayer(prayer)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.prayerEmoji}>
                        {prayer === 'DOHR' ? '🕐' : prayer === 'ASR' ? '🕓' : '🌅'}
                      </Text>
                      <Text style={[styles.prayerText, isSelected && styles.prayerTextSelected]}>
                        {prayer === 'DOHR' ? 'Dohr' : prayer === 'ASR' ? 'Asr' : 'Maghreb'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Récap */}
              {selectedDay && selectedPrayer && (
                <View style={styles.summaryBox}>
                  <Text style={styles.summaryTitle}>📌 Votre rendez-vous</Text>
                  <Text style={styles.summaryText}>
                    {formatPickupDate(selectedDay)} à la prière{' '}
                    {selectedPrayer === 'DOHR' ? 'Dohr' : selectedPrayer === 'ASR' ? 'Asr' : 'Maghreb'}
                  </Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleConfirmPickup}
                disabled={saving}
              >
                <Text style={styles.saveBtnText}>{saving ? '...' : 'Confirmer'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
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
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  dateLabel: { fontSize: 12, color: '#888' },
  dateValue: { fontSize: 12, color: '#333' },
  dueDate: { color: colors.danger, fontWeight: '600' },
  returnedDate: { color: colors.success, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  requestReturnBtn: {
    backgroundColor: '#FF9800',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  pickupBtn: { backgroundColor: colors.primary },
  waitingBadge: {
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  waitingText: { color: '#E65100', fontWeight: '600', fontSize: 14 },
  infoBadge: {
    backgroundColor: 'rgba(74, 144, 217, 0.1)',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 217, 0.3)',
  },
  infoText: { color: '#4A90D9', fontWeight: '600', fontSize: 12, textAlign: 'center' },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  // Pickup info
  pickupInfo: {
    backgroundColor: 'rgba(74, 144, 217, 0.08)',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#4A90D9',
  },
  pickupInfoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4A90D9',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  pickupInfoText: { fontSize: 14, fontWeight: '600', color: colors.text.primary },

  // Modale
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.text.primary },
  modalSubtitle: { fontSize: 13, color: colors.text.secondary, marginTop: 2 },
  modalClose: { fontSize: 24, color: colors.text.secondary, padding: 4 },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 12,
    letterSpacing: 0.2,
  },

  // Jours
  daysRow: { gap: 8, paddingRight: 8 },
  dayCard: {
    width: 68,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: '#F5F7F6',
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
    position: 'relative',
  },
  dayCardSelected: {
    backgroundColor: 'rgba(27,94,63,0.1)',
    borderColor: colors.primary,
  },
  dayName: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.secondary,
    textTransform: 'capitalize',
  },
  dayNameSelected: { color: colors.primary },
  dayNum: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.primary,
    marginVertical: 2,
  },
  dayNumSelected: { color: colors.primary },
  dayMonth: {
    fontSize: 10,
    color: colors.text.light,
    textTransform: 'capitalize',
  },
  dayMonthSelected: { color: colors.primary },
  todayBadge: {
    position: 'absolute',
    top: -6,
    right: -4,
    backgroundColor: colors.secondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  todayBadgeText: { fontSize: 9, fontWeight: '700', color: '#fff' },

  // Prières
  prayersGrid: { flexDirection: 'row', gap: 10 },
  prayerCard: {
    flex: 1,
    paddingVertical: 20,
    borderRadius: 16,
    backgroundColor: '#F5F7F6',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prayerCardSelected: {
    backgroundColor: 'rgba(27,94,63,0.1)',
    borderColor: colors.primary,
  },
  prayerEmoji: { fontSize: 28, marginBottom: 6 },
  prayerText: { fontSize: 13, fontWeight: '700', color: colors.text.secondary },
  prayerTextSelected: { color: colors.primary },

  // Récap
  summaryBox: {
    marginTop: 20,
    padding: 16,
    backgroundColor: 'rgba(201,169,97,0.12)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(201,169,97,0.3)',
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    lineHeight: 20,
    textTransform: 'capitalize',
  },

  // Actions
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F5F7F6',
    alignItems: 'center',
  },
  cancelBtnText: { color: colors.text.secondary, fontWeight: '700', fontSize: 14 },
  saveBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});