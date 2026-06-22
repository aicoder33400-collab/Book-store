import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export const DashboardScreen = () => {
  const [stats, setStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    // Simuler des données (à remplacer par appel API)
    setTimeout(() => {
      setStats({
        totalBooks: 156,
        totalUsers: 24,
        activeLoans: 8,
        todaySales: 3,
        pendingReturns: 2,
        lowStockBooks: 4,
      });
      setLoading(false);
    }, 500);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <LinearGradient colors={[colors.gradient.start, colors.gradient.end]} style={styles.header}>
        <Text style={styles.headerTitle}>📊 Dashboard Admin</Text>
        <Text style={styles.headerSubtitle}>Aperçu de l'activité</Text>
      </LinearGradient>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>📚</Text>
          <Text style={styles.statValue}>{stats?.totalBooks}</Text>
          <Text style={styles.statLabel}>Livres</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>👥</Text>
          <Text style={styles.statValue}>{stats?.totalUsers}</Text>
          <Text style={styles.statLabel}>Utilisateurs</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>🔄</Text>
          <Text style={styles.statValue}>{stats?.activeLoans}</Text>
          <Text style={styles.statLabel}>Emprunts actifs</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>💰</Text>
          <Text style={styles.statValue}>{stats?.todaySales}</Text>
          <Text style={styles.statLabel}>Ventes aujourd'hui</Text>
        </View>
      </View>

      <View style={styles.alertsContainer}>
        <Text style={styles.sectionTitle}>⚠️ Alertes</Text>
        
        {stats?.pendingReturns > 0 && (
          <View style={styles.alertCard}>
            <Text style={styles.alertIcon}>⏰</Text>
            <View>
              <Text style={styles.alertTitle}>Retards de retour</Text>
              <Text style={styles.alertText}>{stats.pendingReturns} emprunt(s) en retard</Text>
            </View>
          </View>
        )}

        {stats?.lowStockBooks > 0 && (
          <View style={styles.alertCard}>
            <Text style={styles.alertIcon}>⚠️</Text>
            <View>
              <Text style={styles.alertTitle}>Stock faible</Text>
              <Text style={styles.alertText}>{stats.lowStockBooks} livre(s) avec stock &lt; 3</Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 60, paddingBottom: 30, paddingHorizontal: 20, alignItems: 'center' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: colors.text.white },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 16 },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.background.secondary,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statEmoji: { fontSize: 32, marginBottom: 8 },
  statValue: { fontSize: 32, fontWeight: 'bold', color: colors.primary },
  statLabel: { fontSize: 14, color: colors.text.secondary, marginTop: 4 },
  alertsContainer: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text.primary, marginBottom: 16 },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  alertIcon: { fontSize: 24 },
  alertTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text.primary },
  alertText: { fontSize: 13, color: colors.text.secondary, marginTop: 2 },
});