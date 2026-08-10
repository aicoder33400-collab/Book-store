import React, { useEffect, useState, useRef } from 'react';
import { useIsFocused } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuthStore } from '../../store/auth.store';
import { loanService, Loan } from '../../services/loan.service';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

const STATUS_LABELS: Record<string, string> = {
  REQUESTED: '🔔 En attente',
  APPROVED: '✅ Approuvé',
  REJECTED: '❌ Refusé',
  BORROWED: '📖 Emprunté',
  RETURNED: '↩️ Retourné',
  LATE: '⚠️ En retard',
};

const STATUS_COLORS: Record<string, string> = {
  REQUESTED: '#F5A623',
  APPROVED: '#4A90D9',
  REJECTED: '#f44336',
  BORROWED: '#4CAF50',
  RETURNED: '#9E9E9E',
  LATE: '#FF5722',
};

const STATUS_MESSAGES: Record<string, string> = {
  REQUESTED: "⏳ En attente d'approbation par l'administrateur",
  APPROVED: '✅ Approuvé ! Venez récupérer votre livre à la bibliothèque',
  REJECTED: '❌ Votre demande a été refusée',
  BORROWED: '📖 Livre en votre possession',
  RETURNED: '↩️ Livre retourné, merci !',
  LATE: '⚠️ Livre en retard, veuillez le retourner rapidement',
};

export const MyLoansScreen = () => {
  const { user } = useAuthStore();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusChanged, setStatusChanged] = useState<string | null>(null);
  const previousLoansRef = useRef<Loan[]>([]);
  const isFocused = useIsFocused();

  const fetchLoans = async () => {
    try {
      const data = await loanService.getUserLoans();
      
      // Detect status changes for popups
      if (previousLoansRef.current.length > 0) {
        for (const newLoan of data) {
          const oldLoan = previousLoansRef.current.find(l => l.id === newLoan.id);
          if (oldLoan && oldLoan.status !== newLoan.status) {
            const bookTitle = newLoan.book?.title || 'Livre';
            const message = STATUS_MESSAGES[newLoan.status] || `Statut mis à jour : ${newLoan.status}`;
            setStatusChanged(`📚 ${bookTitle} : ${message}`);
            setTimeout(() => setStatusChanged(null), 6000);
          }
        }
      }
      
      previousLoansRef.current = data;
      setLoans(data);
    } catch (error) {
      console.error('Erreur chargement emprunts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchLoans();
    }
  }, [isFocused]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLoans();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLoans();
  };

  const renderLoan = ({ item }: { item: Loan }) => {
    const statusText = STATUS_LABELS[item.status] || item.status;
    const statusColor = STATUS_COLORS[item.status] || '#999';
    const statusMessage = STATUS_MESSAGES[item.status] || '';

    return (
      <View style={styles.loanCard}>
        <Text style={styles.bookTitle}>{item.book.title}</Text>
        <Text style={styles.bookAuthor}>{item.book.author}</Text>
        
        {item.borrowedAt && (
          <View style={styles.loanInfo}>
            <Text style={styles.loanDate}>
              📅 Emprunté le: {new Date(item.borrowedAt).toLocaleDateString('fr-FR')}
            </Text>
            <Text style={styles.loanDate}>
              ⏰ À rendre le: {new Date(item.dueDate).toLocaleDateString('fr-FR')}
            </Text>
          </View>
        )}
        {!item.borrowedAt && (
          <View style={styles.loanInfo}>
            <Text style={styles.loanDate}>
              📅 Demandé le: {new Date(item.dueDate).toLocaleDateString('fr-FR')}
            </Text>
          </View>
        )}

        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
        </View>

        <Text style={styles.statusMessage}>{statusMessage}</Text>
      </View>
    );
  };

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
      {/* Status change popup */}
      {statusChanged && (
        <View style={styles.popup}>
          <Text style={styles.popupText}>{statusChanged}</Text>
        </View>
      )}

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
  popup: {
    backgroundColor: colors.primary,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 12,
    elevation: 4,
  },
  popupText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
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
    marginBottom: 8,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  statusMessage: {
    fontSize: 12,
    color: colors.text.secondary,
    fontStyle: 'italic',
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