import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
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
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchDashboard();
          }}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >

      
      {/* 🔔 BANNIÈRE DEMANDES */}
      {pendingCount > 0 && (
        <TouchableOpacity
          style={styles.pendingBanner}
          onPress={handleGoToLoans}
          activeOpacity={0.85}
        >
          <View style={styles.pendingIconContainer}>
            <View style={styles.pendingIconBg}>
              <Text style={styles.pendingIcon}>🔔</Text>
            </View>
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>{pendingCount}</Text>
            </View>
          </View>
          <View style={styles.pendingContent}>
            <Text style={styles.pendingTitle}>
              {pendingCount} demande{pendingCount > 1 ? 's' : ''} en attente
            </Text>
            <Text style={styles.pendingSub}>
              Appuyez pour voir et valider
            </Text>
          </View>
          <Text style={styles.pendingArrow}>›</Text>
        </TouchableOpacity>
      )}

      {/* 📊 STATS */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, styles.statGold]}>
          <Text style={styles.statEmoji}>📚</Text>
          <Text style={styles.statNumber}>{stats?.totalBooks || 0}</Text>
          <Text style={styles.statLabel}>Livres</Text>
        </View>

        <View style={[styles.statCard, styles.statGreen]}>
          <Text style={styles.statEmoji}>👥</Text>
          <Text style={styles.statNumber}>{stats?.totalUsers || 0}</Text>
          <Text style={styles.statLabel}>Utilisateurs</Text>
        </View>

        <View style={[styles.statCard, styles.statBlue]}>
          <Text style={styles.statEmoji}>📖</Text>
          <Text style={styles.statNumber}>{stats?.activeLoans || 0}</Text>
          <Text style={styles.statLabel}>En cours</Text>
        </View>

        <View style={[styles.statCard, styles.statOrange]}>
          <Text style={styles.statEmoji}>⏳</Text>
          <Text style={styles.statNumber}>{stats?.requestedLoans || 0}</Text>
          <Text style={styles.statLabel}>En attente</Text>
        </View>

        <View style={[styles.statCard, styles.statRed]}>
          <Text style={styles.statEmoji}>⚠️</Text>
          <Text style={styles.statNumber}>{stats?.overdueLoans || 0}</Text>
          <Text style={styles.statLabel}>Retards</Text>
        </View>

        <View style={[styles.statCard, styles.statPurple]}>
          <Text style={styles.statEmoji}>🔄</Text>
          <Text style={styles.statNumber}>{stats?.totalLoans || 0}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>

        <View style={[styles.statCard, styles.statGold]}>
          <Text style={styles.statEmoji}>📩</Text>
          <Text style={styles.statNumber}>{stats?.returnRequests || 0}</Text>
          <Text style={styles.statLabel}>Retours</Text>
        </View>
      </View>

      {/* 📋 DERNIÈRES DEMANDES */}
      {pendingCount > 0 && (
        <View style={styles.requestsList}>
          <View style={styles.requestsHeader}>
            <View style={styles.requestsHeaderLine} />
            <Text style={styles.sectionTitle}>Dernières demandes</Text>
            <View style={styles.requestsHeaderLine} />
          </View>

          {stats?.pendingRequests?.slice(0, 5).map((req) => {
            const isReturnRequest = req.status === 'RETURN_REQUESTED';
            return (
              <View key={req.id} style={styles.requestItem}>
                <View style={styles.requestIconBg}>
                  <Text style={styles.requestIcon}>
                    {isReturnRequest ? '📩' : '📚'}
                  </Text>
                </View>
                <View style={styles.requestContent}>
                  <Text style={styles.requestUser}>👤 {req.user.name}</Text>
                  <Text style={styles.requestBook} numberOfLines={1}>
                    📖 {req.book.title}
                  </Text>
                  <Text style={styles.requestTime}>
                    {new Date(req.createdAt).toLocaleString('fr-FR')}
                  </Text>
                </View>
                <View style={[styles.requestTypeBadge, { backgroundColor: isReturnRequest ? colors.warning : colors.success }]}>
                  <Text style={styles.requestTypeBadgeText}>
                    {isReturnRequest ? 'Retour' : 'Emprunt'}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Motif pied de page */}
      <View style={styles.footer}>
        <Text style={styles.footerStar}>✦</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },

  // En-tête islamique
  header: {
    paddingTop: 30,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
  },
  headerPattern1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: 'rgba(201,169,97,0.15)',
    top: -60,
    right: -50,
  },
  headerPattern2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: 'rgba(201,169,97,0.10)',
    bottom: -40,
    left: -30,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerEmoji: {
    fontSize: 42,
    marginRight: 14,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.white,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
    marginTop: 2,
  },
  headerLine: {
    width: 40,
    height: 2,
    backgroundColor: colors.secondary,
    borderRadius: 1,
  },

  // Bannière demandes
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  pendingIconContainer: {
    position: 'relative',
    marginRight: 14,
  },
  pendingIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(201,169,97,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingIcon: { fontSize: 22 },
  pendingBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.danger,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background.secondary,
  },
  pendingBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 4,
  },
  pendingContent: { flex: 1 },
  pendingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
  },
  pendingSub: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  pendingArrow: {
    fontSize: 24,
    color: colors.secondary,
    fontWeight: '300',
  },

  // Stats
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '30%',
    marginBottom: 12,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderTopWidth: 3,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  statGold: { borderTopColor: colors.secondary },
  statGreen: { borderTopColor: colors.primary },
  statBlue: { borderTopColor: colors.info },
  statOrange: { borderTopColor: colors.warning },
  statRed: { borderTopColor: colors.danger },
  statPurple: { borderTopColor: '#7A6DA8' },
  statEmoji: {
    fontSize: 22,
    marginBottom: 6,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 4,
    fontWeight: '500',
  },

  // Demandes récentes
  requestsList: {
    backgroundColor: colors.background.secondary,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 18,
    borderRadius: 18,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  requestsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  requestsHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    marginHorizontal: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  requestIconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  requestIcon: { fontSize: 18 },
  requestContent: { flex: 1 },
  requestUser: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
  },
  requestBook: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  requestTime: {
    fontSize: 10,
    color: colors.text.light,
    marginTop: 2,
  },
  requestTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  requestTypeBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Footer
  footer: {
    alignItems: 'center',
    marginTop: 24,
  },
  footerStar: {
    color: colors.secondary,
    fontSize: 16,
    opacity: 0.6,
  },
});
