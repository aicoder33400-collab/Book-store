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

  const requestedLoans = stats?.requestedLoans || 0;
  const totalBooks = stats?.totalBooks || 0;
  const totalUsers = stats?.totalUsers || 0;
  const activeLoans = stats?.activeLoans || 0;
  const overdueLoans = stats?.overdueLoans || 0;
  const totalLoans = stats?.totalLoans || 0;

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
      {requestedLoans > 0 && (
        <TouchableOpacity
          style={styles.pendingBanner}
          onPress={handleGoToLoans}
        >
          <View style={styles.pendingIconContainer}>
            <Text style={styles.pendingIcon}>🔔</Text>
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>{requestedLoans}</Text>
            </View>
          </View>
          <View style={styles.pendingContent}>
            <Text style={styles.pendingTitle}>
              {requestedLoans} demande{requestedLoans > 1 ? 's' : ''} en attente
            </Text>
            <Text style={styles.pendingSub}>Cliquez pour valider</Text>
          </View>
          <Text style={styles.pendingArrow}>›</Text>
        </TouchableOpacity>
      )}

      {/* STATS EN GRILLE 3 COLONNES */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, styles.statBlue]}>
          <Text style={styles.statNumber}>{totalBooks}</Text>
          <Text style={styles.statLabel}>📚 Livres</Text>
        </View>
        <View style={[styles.statCard, styles.statGreen]}>
          <Text style={styles.statNumber}>{totalUsers}</Text>
          <Text style={styles.statLabel}>👥 Utilisateurs</Text>
        </View>
        <View style={[styles.statCard, styles.statOrange]}>
          <Text style={styles.statNumber}>{activeLoans}</Text>
          <Text style={styles.statLabel}>📖 En cours</Text>
        </View>
        <View style={[styles.statCard, styles.statRed]}>
          <Text style={styles.statNumber}>{requestedLoans}</Text>
          <Text style={styles.statLabel}>⏳ En attente</Text>
        </View>
        <View style={[styles.statCard, styles.statPurple]}>
          <Text style={styles.statNumber}>{overdueLoans}</Text>
          <Text style={styles.statLabel}>⚠️ Retards</Text>
        </View>
        <View style={[styles.statCard, styles.statTeal]}>
          <Text style={styles.statNumber}>{totalLoans}</Text>
          <Text style={styles.statLabel}>🔄 Total</Text>
        </View>
      </View>
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
});
