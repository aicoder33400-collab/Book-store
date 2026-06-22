import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuthStore } from '../../store/auth.store';
import { loanService } from '../../services/loan.service';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { saleService } from '../../services/sale.service';

export const BookDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuthStore();
  const { book } = route.params as any;
  const [loading, setLoading] = useState(false);

  const handleBorrow = async () => {
    Alert.alert(
      'Emprunter',
      `Voulez-vous emprunter "${book.title}" pour 14 jours ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Confirmer', 
          onPress: async () => {
            setLoading(true);
            try {
              const dueDate = new Date();
              dueDate.setDate(dueDate.getDate() + 14);
              
              await loanService.borrowBook(user!.id, book.id, dueDate);
              Alert.alert('Succès', 'Livre emprunté avec succès !');
              navigation.goBack();
            } catch (error: any) {
              Alert.alert(
                'Erreur', 
                error.response?.data?.message || 'Erreur lors de l\'emprunt'
              );
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  
  const handleBuy = async () => {
  Alert.alert(
    'Acheter',
    `Voulez-vous acheter "${book.title}" ?`,
    [
      { text: 'Annuler', style: 'cancel' },
      { 
        text: 'Confirmer', 
        onPress: async () => {
          setLoading(true);
          try {
            const price = 19.99; // Prix à définir
            await saleService.createSale(book.id, 1, price);
            Alert.alert('Succès', 'Achat effectué avec succès !');
            navigation.goBack();
          } catch (error: any) {
            Alert.alert('Erreur', error.response?.data?.message || 'Erreur lors de l\'achat');
          } finally {
            setLoading(false);
          }
        }
      }
    ]
  );
};


  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>{book.title}</Text>
        <Text style={styles.author}>par {book.author}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📖 Description</Text>
        <Text style={styles.description}>
          {book.description || 'Aucune description disponible'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Informations</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>ISBN :</Text>
          <Text style={styles.infoValue}>{book.isbn}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Stock :</Text>
          <Text style={[
            styles.infoValue,
            book.availableQuantity === 0 && styles.outOfStock
          ]}>
            {book.availableQuantity} / {book.totalQuantity}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Type :</Text>
          <Text style={styles.infoValue}>
            {book.isForRent && '📍 À emprunter '}
            {book.isForSale && '💰 À vendre'}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        {book.isForRent && (
          <TouchableOpacity 
            style={[styles.button, styles.borrowButton]}
            onPress={handleBorrow}
            disabled={book.availableQuantity === 0 || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {book.availableQuantity > 0 ? '📖 Emprunter' : '❌ Indisponible'}
              </Text>
            )}
          </TouchableOpacity>
        )}
        
        {book.isForSale && (
          <TouchableOpacity 
            style={[styles.button, styles.buyButton]}
            onPress={handleBuy}
            disabled={book.availableQuantity === 0}
          >
            <Text style={styles.buttonText}>
              {book.availableQuantity > 0 ? '💰 Acheter' : '❌ Indisponible'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

// Styles identiques à ce que tu as déjà
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    padding: 20,
    backgroundColor: colors.background.secondary,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  author: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: 12,
  },
  description: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    width: 80,
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
  },
  infoValue: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
  },
  outOfStock: {
    color: colors.danger,
    fontWeight: typography.fontWeight.bold,
  },
  actions: {
    padding: 20,
    gap: 12,
    marginBottom: 30,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  borrowButton: {
    backgroundColor: colors.info,
  },
  buyButton: {
    backgroundColor: colors.success,
  },
  buttonText: {
    color: colors.text.white,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
});