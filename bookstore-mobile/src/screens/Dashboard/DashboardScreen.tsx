import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import api from '../../services/api';
import { colors } from '../../theme/colors';

const { width } = Dimensions.get('window');

interface DashboardStats {
  totalBooks: number;
  totalUsers: number;
  totalLoans: number;
  activeLoans: number;
  requestedLoans: number;
  approvedLoans: number;
  overdueLoans: number;
  returnRequests: number;
  pendingRequests: Array<{
    id: string;
    user: { name: string; email: string };
    book: { title: string; author: string };
    status: string;
    createdAt: string;
  }>;
}

export const DashboardScreen = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  const fetchDashboard = async () => {
    try {
      const statsRes = await api.get('/admin/dashboard');
      setStats(statsRes.data.data);
    } catch (error) {
      console.error('Erreur dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // 🔥 Compter les demandes en attente (emprunts + retours)
  const pendingCount = stats?.pendingRequests?.length || 0;

  const handleGoToLoans = () => {
    navigation.dispatch(
      CommonActions.navigate({
        name: 'Historique des demandes',
      })
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDashboard(); }} />
      }
    >
      {/* 🔥 BANNIÈRE DEMANDES EN ATTENTE */}
      {pendingCount > 0 && (
        <TouchableOpacity
          style={styles.pendingBanner}
          onPress={handleGoToLoans}
        >
          <View style={styles.pendingIconContainer}>
            <Text style={styles.pendingIcon}>🔔</Text>
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>{pendingCount}</Text>
            </View>
          </View>
          <View style={styles.pendingContent}>
            <Text style={styles.pendingTitle}>
              {pendingCount} demande{pendingCount > 1 ? 's' : ''} en attente
            </Text>
            <Text style={styles.pendingSub}>Cliquez pour voir et valider</Text>
          </View>
          <Text style={styles.pendingArrow}>›</Text>
        </TouchableOpacity>
      )}

      {/* STATS */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, styles.statBlue]}>
          <Text style={styles.statNumber}>{stats?.totalBooks || 0}</Text>
          <Text style={styles.statLabel}>📚 Livres</Text>
        </View>
        <View style={[styles.statCard, styles.statGreen]}>
          <Text style={styles.statNumber}>{stats?.totalUsers || 0}</Text>
          <Text style={styles.statLabel}>👥 Utilisateurs</Text>
        </View>
        <View style={[styles.statCard, styles.statOrange]}>
          <Text style={styles.statNumber}>{stats?.activeLoans || 0}</Text>
          <Text style={styles.statLabel}>📖 En cours</Text>
        </View>
        <View style={[styles.statCard, styles.statRed]}>
          <Text style={styles.statNumber}>{stats?.requestedLoans || 0}</Text>
          <Text style={styles.statLabel}>⏳ En attente</Text>
        </View>
        <View style={[styles.statCard, styles.statPurple]}>
          <Text style={styles.statNumber}>{stats?.overdueLoans || 0}</Text>
          <Text style={styles.statLabel}>⚠️ Retards</Text>
        </View>
        <View style={[styles.statCard, styles.statTeal]}>
          <Text style={styles.statNumber}>{stats?.totalLoans || 0}</Text>
          <Text style={styles.statLabel}>🔄 Total</Text>
        </View>
        <View style={[styles.statCard, styles.statGold]}>
          <Text style={styles.statNumber}>{stats?.returnRequests || 0}</Text>
          <Text style={styles.statLabel}>📩 Retours demandés</Text>
        </View>
      </View>

      {/* LISTE DES DEMANDES RÉCENTES */}
      {pendingCount > 0 && (
        <View style={styles.requestsList}>
          <Text style={styles.sectionTitle}>📋 Dernières demandes</Text>
          {stats?.pendingRequests?.slice(0, 5).map((req) => {
            const isReturnRequest = req.status === 'RETURN_REQUESTED';
            return (
              <View key={req.id} style={styles.requestItem}>
                <View style={styles.requestHeader}>
                  <Text style={styles.requestType}>
                    {isReturnRequest ? '📩 Retour' : '📚 Emprunt'}
                  </Text>
                  <Text style={styles.requestUser}>👤 {req.user.name}</Text>
                </View>
                <Text style={styles.requestBook}>📖 {req.book.title}</Text>
                <Text style={styles.requestTime}>
                  {new Date(req.createdAt).toLocaleString('fr-FR')}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 12,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#e94560',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  pendingIconContainer: {
    position: 'relative',
    marginRight: 12,
  },
  pendingIcon: { fontSize: 28 },
  pendingBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#e94560',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 4,
  },
  pendingContent: { flex: 1 },
  pendingTitle: { fontSize: 15, fontWeight: '600', color: '#1a1a2e' },
  pendingSub: { fontSize: 12, color: '#666', marginTop: 2 },
  pendingArrow: { fontSize: 22, color: '#ccc' },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '30%',
    marginBottom: 10,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  statBlue: { borderTopColor: '#4A90D9', borderTopWidth: 3 },
  statGreen: { borderTopColor: '#2ecc71', borderTopWidth: 3 },
  statOrange: { borderTopColor: '#f39c12', borderTopWidth: 3 },
  statRed: { borderTopColor: '#e94560', borderTopWidth: 3 },
  statPurple: { borderTopColor: '#9b59b6', borderTopWidth: 3 },
  statTeal: { borderTopColor: '#1abc9c', borderTopWidth: 3 },
  statGold: { borderTopColor: '#f1c40f', borderTopWidth: 3 },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },

  requestsList: {
    backgroundColor: '#fff',
    margin: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 12,
  },
  requestItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  requestType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#e94560',
  },
  requestUser: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1a1a2e',
  },
  requestBook: {
    fontSize: 14,
    color: '#666',
  },
  requestTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
});
