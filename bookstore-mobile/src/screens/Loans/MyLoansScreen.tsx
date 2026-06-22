import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../../store/auth.store';
import { loanService, Loan } from '../../services/loan.service';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { AppHeader } from '../../components/AppHeader';

export const MyLoansScreen = () => {
  const { user } = useAuthStore();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLoans = async () => {
    try {
      const data = await loanService.getUserLoans(user!.id);
      setLoans(data);
    } catch (error) {
      console.error('Erreur chargement emprunts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLoans();
  };

  const handleReturn = async (loanId: string, bookTitle: string) => {
    Alert.alert(
      'Retourner',
      `Voulez-vous retourner "${bookTitle}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              await loanService.returnBook(loanId);
              Alert.alert('Succès', 'Livre retourné avec succès !');
              fetchLoans();
            } catch (error: any) {
              Alert.alert('Erreur', error.response?.data?.message || 'Erreur lors du retour');
            }
          }
        }
      ]
    );
  };

  const renderLoan = ({ item }: { item: Loan }) => {
    const dueDate = new Date(item.dueDate);
    const now = new Date();
    const isLate = dueDate < now && item.status === 'BORROWED';
    
    const statusText = item.status === 'BORROWED' 
      ? (isLate ? '⚠️ En retard' : '📘 En cours') 
      : '✅ Rendu';
    
    const statusColor = isLate 
      ? colors.danger 
      : item.status === 'RETURNED' 
        ? colors.success 
        : colors.info;

    return (
      <View style={styles.loanCard}>
        <Text style={styles.bookTitle}>{item.book.title}</Text>
        <Text style={styles.bookAuthor}>{item.book.author}</Text>
        
        <View style={styles.loanInfo}>
          <Text style={styles.loanDate}>
            📅 Emprunté le: {new Date(item.borrowedAt).toLocaleDateString()}
          </Text>
          <Text style={styles.loanDate}>
            ⏰ À rendre le: {new Date(item.dueDate).toLocaleDateString()}
          </Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
        </View>

        {item.status === 'BORROWED' && (
          <TouchableOpacity 
            style={styles.returnButton} 
            onPress={() => handleReturn(item.id, item.book.title)}
          >
            <Text style={styles.returnButtonText}>🔄 Retourner</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const activeLoansCount = loans.filter(l => l.status === 'BORROWED').length;

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement de vos emprunts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <AppHeader 
        title="🔄 Mes emprunts" 
        subtitle={`${activeLoansCount} emprunt(s) en cours`}
      />

      <FlatList
        data={loans}
        keyExtractor={(item) => item.id}
        renderItem={renderLoan}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>Aucun emprunt</Text>
            <Text style={styles.emptySubtext}>
              Empruntez un livre pour le voir apparaître ici
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  loadingText: {
    marginTop: 12,
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
  },
  listContent: {
    padding: 16,
    paddingBottom: 20,
  },
  loanCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  bookTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: 12,
  },
  loanInfo: {
    marginBottom: 12,
  },
  loanDate: {
    fontSize: typography.fontSize.xs,
    color: colors.text.light,
    marginBottom: 2,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  returnButton: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  returnButtonText: {
    color: colors.text.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.text.light,
    textAlign: 'center',
  },
});