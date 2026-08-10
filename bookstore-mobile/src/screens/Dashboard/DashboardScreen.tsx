import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import api from '../../services/api';
import { colors } from '../../theme/colors';

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

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDashboard(); }} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📊 Tableau de bord</Text>
        <Text style={styles.headerSubtitle}>Vue d'ensemble de votre bibliothèque</Text>
      </View>

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
          <Text style={styles.statLabel}>📖 Emprunts actifs</Text>
        </View>
        <View style={[styles.statCard, styles.statRed]}>
          <Text style={styles.statNumber}>{stats?.requestedLoans || 0}</Text>
          <Text style={styles.statLabel}>⏳ Demandes en attente</Text>
        </View>
        <View style={[styles.statCard, styles.statPurple]}>
          <Text style={styles.statNumber}>{stats?.overdueLoans || 0}</Text>
          <Text style={styles.statLabel}>⚠️ Retards</Text>
        </View>
        <View style={[styles.statCard, styles.statTeal]}>
          <Text style={styles.statNumber}>{stats?.totalLoans || 0}</Text>
          <Text style={styles.statLabel}>🔄 Total emprunts</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          📋 Les demandes en attente sont disponibles dans l'onglet "Demandes"
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: colors.primary,
    padding: 24,
    paddingTop: 20,
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    marginTop: -20,
    gap: 8,
  },
  statCard: {
    width: '30%',
    margin: '1.5%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  footer: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});