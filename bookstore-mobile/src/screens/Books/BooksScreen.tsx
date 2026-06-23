import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Keyboard,
  Modal,
  Alert,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useBookStore } from '../../store/book.store';
import { useAuthStore } from '../../store/auth.store';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import api from '../../services/api';

type RootStackParamList = {
  BookDetail: { book: any };
};

type Navigation = NavigationProp<RootStackParamList>;

export const BooksScreen = () => {
  const {
    books: allBooks,
    loading,
    error,
    pagination,
    fetchBooks,
    setAvailableOnly,
    availableOnly,
  } = useBookStore();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const searchInputRef = useRef<TextInput>(null);
  const navigation = useNavigation<Navigation>();

  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  // Add Book Modal
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newBook, setNewBook] = useState({ title: '', author: '', isbn: '', description: '', totalQuantity: '1', isForRent: true, isForSale: true });
  const [addingBook, setAddingBook] = useState(false);

  const handleAddBook = async () => {
    if (!newBook.title || !newBook.author || !newBook.isbn) {
      Alert.alert('Erreur', 'Titre, auteur et ISBN sont requis');
      return;
    }
    setAddingBook(true);
    try {
      await api.post('/books', {
        title: newBook.title,
        author: newBook.author,
        isbn: newBook.isbn,
        description: newBook.description,
        totalQuantity: parseInt(newBook.totalQuantity) || 1,
        isForRent: newBook.isForRent,
        isForSale: newBook.isForSale,
      });
      Alert.alert('Succès', 'Livre ajouté !');
      setAddModalVisible(false);
      setNewBook({ title: '', author: '', isbn: '', description: '', totalQuantity: '1', isForRent: true, isForSale: true });
      fetchBooks();
    } catch (error: any) {
      const msg = error.response?.data?.errors 
        ? error.response.data.errors.join('\n')
        : error.response?.data?.message || "Échec de l'ajout";
      Alert.alert('Erreur', msg);
    } finally {
      setAddingBook(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const filteredBooks = useMemo(() => {
    if (!allBooks || allBooks.length === 0) return [];
    if (!searchText.trim()) return allBooks;
    const searchLower = searchText.toLowerCase().trim();
    return allBooks.filter(book => 
      book.title?.toLowerCase().includes(searchLower) ||
      book.author?.toLowerCase().includes(searchLower)
    );
  }, [allBooks, searchText]);

  const displayedBooks = useMemo(() => {
    if (!filteredBooks || filteredBooks.length === 0) return [];
    if (availableOnly) {
      return filteredBooks.filter(book => book.availableQuantity > 0);
    }
    return filteredBooks;
  }, [filteredBooks, availableOnly]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBooks();
    setRefreshing(false);
  };

  const loadMore = () => {
    if (searchText) return;
    if (pagination.page < pagination.totalPages && !loading) {
      fetchBooks(pagination.page + 1);
    }
  };

  const handleSearchChange = (text: string) => setSearchText(text);
  const clearSearch = () => {
    setSearchText('');
    Keyboard.dismiss();
    searchInputRef.current?.blur();
  };

  const renderBook = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.bookCard} 
      activeOpacity={0.9}
      onPress={() => navigation.navigate('BookDetail', { book: item })}
    >
      <View style={styles.bookContent}>
        <View style={styles.bookHeader}>
          <View style={styles.bookIconWrapper}>
            <Text style={styles.bookIcon}>📖</Text>
          </View>
          <View style={styles.bookInfo}>
            <Text style={styles.bookTitle}>{item.title}</Text>
            <Text style={styles.bookAuthor}>{item.author}</Text>
          </View>
        </View>

        <View style={styles.stockContainer}>
          <View style={[
            styles.stockBadge,
            item.availableQuantity > 0 ? styles.inStockBadge : styles.outOfStockBadge
          ]}>
            <Text style={styles.stockBadgeText}>
              {item.availableQuantity > 0 ? `📚 ${item.availableQuantity} exemplaire(s)` : '❌ Indisponible'}
            </Text>
          </View>
        </View>

        <View style={styles.badges}>
          {item.isForRent && (
            <View style={[styles.badge, styles.rentBadge]}>
              <Text style={styles.badgeIcon}>📍</Text>
              <Text style={styles.badgeText}>À emprunter</Text>
            </View>
          )}
          {item.isForSale && (
            <View style={[styles.badge, styles.saleBadge]}>
              <Text style={styles.badgeIcon}>💰</Text>
              <Text style={styles.badgeText}>À vendre</Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />
        <Text style={styles.detailLink}>Voir les détails →</Text>
      </View>
    </TouchableOpacity>
  );

  const getResultCountText = () => {
    if (searchText) return `${displayedBooks.length} résultat(s) trouvé(s)`;
    return `${pagination.total || 0} livre(s) disponible(s)`;
  };

  if (loading && allBooks.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement des livres...</Text>
      </View>
    );
  }

  if (error && allBooks.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>😕</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchBooks()}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Rechercher par titre ou auteur..."
            placeholderTextColor={colors.text.light}
            value={searchText}
            onChangeText={handleSearchChange}
            returnKeyType="search"
          />
          {searchText !== '' && (
            <TouchableOpacity onPress={clearSearch}>
              <Text style={styles.clearIcon}>✖️</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity
          style={[styles.filterButton, availableOnly && styles.filterButtonActive]}
          onPress={() => setAvailableOnly(!availableOnly)}
        >
          <Text style={[
            styles.filterButtonText,
            availableOnly && styles.filterButtonTextActive
          ]}>
            {availableOnly ? '✅ Disponibles' : '📋 Tous'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={displayedBooks}
        keyExtractor={(item) => item.id}
        renderItem={renderBook}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>
              {allBooks.length === 0 
                ? 'Aucun livre disponible' 
                : searchText 
                  ? 'Aucun livre ne correspond' 
                  : 'Aucun livre trouvé'}
            </Text>
          </View>
        }
        ListFooterComponent={
          loading && !searchText && allBooks.length > 0 ? (
            <ActivityIndicator style={styles.footerLoader} size="small" color={colors.primary} />
          ) : null
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />

      {/* Add Book FAB - Admin Only */}
      {isAdmin && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setAddModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      {/* Add Book Modal */}
      <Modal visible={addModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Ajouter un livre</Text>
            
            <TextInput style={styles.modalInput} placeholder="Titre *" value={newBook.title} onChangeText={(t) => setNewBook({...newBook, title: t})} />
            <TextInput style={styles.modalInput} placeholder="Auteur *" value={newBook.author} onChangeText={(t) => setNewBook({...newBook, author: t})} />
            <TextInput style={styles.modalInput} placeholder="ISBN * (10-13 chiffres)" value={newBook.isbn} onChangeText={(t) => setNewBook({...newBook, isbn: t})} keyboardType="numeric" />
            <TextInput style={styles.modalInput} placeholder="Description" value={newBook.description} onChangeText={(t) => setNewBook({...newBook, description: t})} multiline />
            <TextInput style={styles.modalInput} placeholder="Quantité" value={newBook.totalQuantity} onChangeText={(t) => setNewBook({...newBook, totalQuantity: t})} keyboardType="numeric" />
            
            <View style={styles.modalToggles}>
              <TouchableOpacity style={[styles.toggle, newBook.isForRent && styles.toggleActive]} onPress={() => setNewBook({...newBook, isForRent: !newBook.isForRent})}>
                <Text style={[styles.toggleText, newBook.isForRent && styles.toggleTextActive]}>📍 Empruntable</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toggle, newBook.isForSale && styles.toggleActive]} onPress={() => setNewBook({...newBook, isForSale: !newBook.isForSale})}>
                <Text style={[styles.toggleText, newBook.isForSale && styles.toggleTextActive]}>💰 Vendable</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setAddModalVisible(false)}>
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleAddBook} disabled={addingBook}>
                <Text style={styles.modalSaveText}>{addingBook ? '...' : 'Ajouter'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    paddingHorizontal: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    fontSize: typography.fontSize.lg,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
  },
  clearIcon: {
    fontSize: typography.fontSize.sm,
    color: colors.text.light,
    padding: 4,
  },
  filterButton: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    paddingHorizontal: 20,
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  filterButtonTextActive: {
    color: colors.text.white,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  bookCard: {
    backgroundColor: colors.background.secondary,
    marginBottom: 16,
    borderRadius: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  bookContent: {
    padding: 16,
  },
  bookHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bookIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  bookIcon: {
    fontSize: 26,
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  bookAuthor: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  stockContainer: {
    marginBottom: 12,
  },
  stockBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  inStockBadge: {
    backgroundColor: `${colors.success}20`,
  },
  outOfStockBadge: {
    backgroundColor: `${colors.danger}20`,
  },
  stockBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  rentBadge: {
    backgroundColor: `${colors.info}20`,
  },
  saleBadge: {
    backgroundColor: `${colors.success}20`,
  },
  badgeIcon: {
    fontSize: typography.fontSize.xs,
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 12,
  },
  detailLink: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: colors.background.primary,
  },
  loadingText: {
    marginTop: 16,
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorText: {
    fontSize: typography.fontSize.md,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: colors.text.white,
    fontSize: typography.fontSize.md,
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
  footerLoader: {
    paddingVertical: 20,
  },
  // FAB & Modal
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', marginTop: -2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.text.primary, marginBottom: 16, textAlign: 'center' },
  modalInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: colors.text.primary,
    marginBottom: 12,
  },
  modalToggles: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  toggle: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  toggleActive: { borderColor: colors.primary, backgroundColor: '#F0F4FF' },
  toggleText: { fontSize: 13, color: '#999' },
  toggleTextActive: { color: colors.primary, fontWeight: '600' },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalCancel: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#f0f0f0', alignItems: 'center' },
  modalCancelText: { color: '#666', fontWeight: '600', fontSize: 15 },
  modalSave: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center' },
  modalSaveText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});