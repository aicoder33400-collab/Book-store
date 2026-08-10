import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useAuthStore } from '../../store/auth.store';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import api from '../../services/api';

export const ProfileScreen = () => {
  const { user, logout } = useAuthStore();
  const navigation = useNavigation();
  const [totalLoans, setTotalLoans] = useState<number | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/loans/mine');
        setTotalLoans(res.data.data.length);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };
    fetchStats();
  }, []);

  const handleLogout = () => {
    console.log('🔓 Déconnexion directe sans confirmation...');
    logout()
      .then(() => {
        console.log('✅ Déconnecté');
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          })
        );
      })
      .catch((error) => {
        console.error('❌ Erreur déconnexion:', error);
      });
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Jamais';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>
            {user?.role === 'ADMIN' ? '👑 Administrateur' : 
             user?.role === 'STAFF' ? '📋 Staff' : '👤 Utilisateur'}
          </Text>
        </View>

        <View style={styles.providerBadge}>
          <Text style={styles.providerText}>
            {user?.authProvider === 'google' ? '🔗 Connecté avec Google' : '📧 Connecté avec email'}
          </Text>
        </View>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>👤 Informations personnelles</Text>
        
        {user?.firstName && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Prénom</Text>
            <Text style={styles.infoValue}>{user.firstName}</Text>
          </View>
        )}
        
        {user?.lastName && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nom</Text>
            <Text style={styles.infoValue}>{user.lastName}</Text>
          </View>
        )}
        
        {user?.phone && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📱 Téléphone</Text>
            <Text style={styles.infoValue}>{user.phone}</Text>
          </View>
        )}
        
        {user?.age && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>🎂 Âge</Text>
            <Text style={styles.infoValue}>{user.age} ans</Text>
          </View>
        )}
        
        {user?.commune && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📍 Commune</Text>
            <Text style={styles.infoValue}>{user.commune}</Text>
          </View>
        )}
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>📋 Compte</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>📅 Créé le</Text>
          <Text style={styles.infoValue}>{formatDate(user?.createdAt)}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>🔄 Dernière connexion</Text>
          <Text style={styles.infoValue}>{formatDate(user?.lastLoginAt)}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>✅ Email vérifié</Text>
          <Text style={[styles.infoValue, { color: user?.emailVerified ? colors.success : colors.danger }]}>
            {user?.emailVerified ? 'Oui' : 'Non'}
          </Text>
        </View>
        
        <View style={[styles.infoRow, styles.infoRowLast]}>
          <Text style={styles.infoLabel}>🆔 ID</Text>
          <Text style={styles.infoValueSmall}>{user?.id}</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>📚</Text>
          <Text style={styles.statValue}>{totalLoans !== null ? totalLoans : '—'}</Text>
          <Text style={styles.statLabel}>Emprunts</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>📧</Text>
          <Text style={styles.statValueSmall}>{user?.email}</Text>
          <Text style={styles.statLabel}>Email</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>Version 1.0.0</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { padding: 20, paddingBottom: 40 },
  
  profileCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarText: {
    fontSize: 48,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.white,
  },
  name: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  email: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    marginBottom: 12,
  },
  roleBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: `${colors.primary}15`,
    borderRadius: 20,
    marginBottom: 8,
  },
  roleText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
  },
  providerBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: `${colors.success}15`,
    borderRadius: 12,
  },
  providerText: {
    fontSize: typography.fontSize.xs,
    color: colors.success,
  },
  
  infoSection: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  infoValue: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontWeight: '500',
  },
  infoValueSmall: {
    fontSize: typography.fontSize.xs,
    color: colors.text.light,
    maxWidth: '60%',
    textAlign: 'right',
  },
  
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statEmoji: { fontSize: 28, marginBottom: 8 },
  statValue: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  statValueSmall: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginTop: 4,
  },
  
  logoutButton: {
    backgroundColor: colors.danger,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  logoutText: {
    color: colors.text.white,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  versionText: {
    textAlign: 'center',
    fontSize: typography.fontSize.xs,
    color: colors.text.light,
  },
});