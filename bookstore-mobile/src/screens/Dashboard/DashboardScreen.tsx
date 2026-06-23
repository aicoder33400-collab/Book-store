import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useDashboardStore } from '../../store/dashboard.store';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { useAuthStore } from '../../store/auth.store';

const StatCard = ({ icon, label, value, color }: { icon: string; label: string; value: number | string; color: string }) => (
  <View style={[styles.statCard, { borderTopColor: color }]}>
    <Text style={styles.statIcon}>{icon}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const RequestCard = ({
  userName,
  bookTitle,
  date,
  onApprove,
  onReject,
  loading,
}: {
  userName: string;
  bookTitle: string;
  date: string;
  onApprove: () => void;
  onReject: () => void;
  loading?: boolean;
}) => (
  <View style={styles.requestCard}>
    <View style={styles.requestInfo}>
      <Text style={styles.requestUser}>👤 {userName}</Text>
      <Text style={styles.requestBook}>📖 {bookTitle}</Text>
      <Text style={styles.requestDate}>📅 {new Date(date).toLocaleDateString('fr-FR')}</Text>
    </View>
    <View style={styles.requestActions}>
      <TouchableOpacity style={styles.approveBtn} onPress={onApprove} disabled={loading}>
        <Text style={styles.actionBtnText}>✓ Accepter</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.rejectBtn} onPress={onReject} disabled={loading}>
        <Text style={styles.actionBtnText}>✗ Refuser</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const PickupCard = ({
  userName,
  bookTitle,
  date,
  onHandOver,
}: {
  userName: string;
  bookTitle: string;
  date: string;
  onHandOver: () => void;
}) => (
  <View style={styles.pickupCard}>
    <View style={styles.requestInfo}>
      <Text style={styles.requestUser}>👤 {userName}</Text>
      <Text style={styles.requestBook}>📖 {bookTitle}</Text>
      <Text style={styles.requestDate}>✅ Approuvé le {new Date(date).toLocaleDateString('fr-FR')}</Text>
    </View>
    <TouchableOpacity style={styles.handOverBtn} onPress={onHandOver}>
      <Text style={styles.actionBtnText}>📦 Remettre</Text>
    </TouchableOpacity>
  </View>
);

export const DashboardScreen = () => {
  const {
    stats,
    pendingRequests,
    approvedLoans,
    loading,
    fetchDashboard,
    approveRequest,
    rejectRequest,
    handOverBook,
  } = useDashboardStore();

  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      fetchDashboard();
    }
  }, [user]);

  if (loading && !stats) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchDashboard} />}
    >
      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <StatCard icon="📚" label="Livres" value={stats?.totalBooks ?? '-'} color="#4A90D9" />
        <StatCard icon="🔄" label="En cours" value={stats?.activeLoans ?? '-'} color="#F5A623" />
        <StatCard icon="💰" label="Revenus" value={`${stats?.totalRevenue ?? 0}€`} color="#7ED321" />
      </View>

      {/* Pending Requests */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          🔔 Demandes en attente ({pendingRequests.length})
        </Text>
        {pendingRequests.length === 0 ? (
          <Text style={styles.emptyText}>Aucune demande en attente</Text>
        ) : (
          pendingRequests.map((req) => (
            <RequestCard
              key={req.id}
              userName={req.user.name}
              bookTitle={req.book.title}
              date={req.borrowedAt}
              onApprove={() => approveRequest(req.id)}
              onReject={() => rejectRequest(req.id)}
            />
          ))
        )}
      </View>

      {/* Approved - Awaiting Pickup */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          📦 En attente de retrait ({approvedLoans.length})
        </Text>
        {approvedLoans.length === 0 ? (
          <Text style={styles.emptyText}>Aucun retrait en attente</Text>
        ) : (
          approvedLoans.map((loan) => (
            <PickupCard
              key={loan.id}
              userName={loan.user.name}
              bookTitle={loan.book.title}
              date={loan.borrowedAt}
              onHandOver={() => handOverBook(loan.id)}
            />
          ))
        )}
      </View>

      {/* Recent Sales */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💰 Dernières ventes</Text>
        {!stats?.recentSales?.length ? (
          <Text style={styles.emptyText}>Aucune vente récente</Text>
        ) : (
          stats.recentSales.map((sale) => (
            <View key={sale.id} style={styles.saleRow}>
              <Text style={styles.saleBook}>📖 {sale.book.title}</Text>
              <Text style={styles.saleAmount}>{sale.totalPrice}€</Text>
            </View>
          ))
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statsRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderTopWidth: 3,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statIcon: { fontSize: 22, marginBottom: 6 },
  statValue: { fontSize: 20, fontWeight: '700', marginBottom: 2 },
  statLabel: { fontSize: 11, color: colors.text.secondary },
  section: { padding: 16 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 12,
  },
  emptyText: {
    color: colors.text.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
  },
  requestInfo: { marginBottom: 10 },
  requestUser: { fontSize: 15, fontWeight: '600', color: colors.text.primary },
  requestBook: { fontSize: 14, color: colors.text.secondary, marginTop: 2 },
  requestDate: { fontSize: 12, color: colors.text.secondary, marginTop: 2 },
  requestActions: { flexDirection: 'row', gap: 8 },
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
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  pickupCard: {
    backgroundColor: '#FFF9C4',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
  },
  handOverBtn: {
    backgroundColor: '#FF9800',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  saleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  saleBook: { fontSize: 14, color: colors.text.primary },
  saleAmount: { fontSize: 14, fontWeight: '600', color: '#4CAF50' },
});