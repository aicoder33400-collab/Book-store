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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useBookStore } from '../../store/book.store';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { AppHeader } from '../../components/AppHeader';

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
      <StatusBar style="light" />
      <AppHeader title="📚 Catalogue" subtitle={getResultCountText()} />

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
    </View>
  );
};

// Styles (gardez ceux que vous aviez, enlevant les parties header/user)
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
    paddingBottom: 20,
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
});