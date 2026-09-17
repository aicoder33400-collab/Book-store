import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Image,
  Dimensions,
  SafeAreaView,
  Modal,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import api from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/auth.store';
import { colors } from '../../theme/colors';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 32) / 2;

type RootStackParamList = {
  BookDetail: { book: any };
  BooksList: undefined;
  AddBook: undefined;
};

type BooksScreenNavigationProp = StackNavigationProp<RootStackParamList, 'BooksList'>;

// Options genre
const GENRES = [
  { label: 'Tous', value: 'TOUS' },
  { label: '📖 Roman', value: 'ROMAN' },
  { label: '📝 Poésie', value: 'POESIE' },
  { label: '🎭 Théâtre', value: 'THEATRE' },
  { label: '📜 Histoire', value: 'HISTOIRE' },
  { label: '🚀 Science-Fiction', value: 'SCIENCE_FICTION' },
  { label: '🧙 Fantastique', value: 'FANTASTIQUE' },
  { label: '🔍 Polar', value: 'POLAR' },
  { label: '🗺️ Aventure', value: 'AVENTURE' },
  { label: '👤 Biographie', value: 'BIOGRAPHIE' },
  { label: '📚 Essai', value: 'ESSAI' },
  { label: '🧠 Philosophie', value: 'PHILOSOPHIE' },
  { label: '🧒 Jeunesse', value: 'JEUNESSE' },
  { label: '🖼️ Bande dessinée', value: 'BANDE_DESSINEE' },
  { label: '🎨 Art', value: 'ART' },
  { label: '🍳 Cuisine', value: 'CUISINE' },
  { label: '✈️ Voyage', value: 'VOYAGE' },
  { label: '⚽ Sport', value: 'SPORT' },
  { label: '💪 Santé', value: 'SANTE' },
  { label: '🕌 Religion', value: 'RELIGION' },
  { label: '📦 Autre', value: 'AUTRE' },
];

// Options langue
const LANGUAGES = [
  { label: 'Toutes', value: 'TOUTES' },
  { label: '🇫🇷 Français', value: 'FRANCAIS' },
  { label: '🇬🇧 Anglais', value: 'ANGLAIS' },
  { label: '🇸🇦 Arabe', value: 'ARABE' },
  { label: '🇪🇸 Espagnol', value: 'ESPAGNOL' },
  { label: '🇩🇪 Allemand', value: 'ALLEMAND' },
  { label: '🇮🇹 Italien', value: 'ITALIEN' },
  { label: '🇵🇹 Portugais', value: 'PORTUGAIS' },
  { label: '🇷🇺 Russe', value: 'RUSSE' },
  { label: '🇨🇳 Chinois', value: 'CHINOIS' },
  { label: '🇯🇵 Japonais', value: 'JAPONAIS' },
  { label: '📦 Autre', value: 'AUTRE' },
];

// Labels
const GENRE_LABELS: Record<string, string> = {
  ROMAN: '📖 Roman',
  POESIE: '📝 Poésie',
  THEATRE: '🎭 Théâtre',
  HISTOIRE: '📜 Histoire',
  SCIENCE_FICTION: '🚀 Science-Fiction',
  FANTASTIQUE: '🧙 Fantastique',
  POLAR: '🔍 Polar',
  AVENTURE: '🗺️ Aventure',
  BIOGRAPHIE: '👤 Biographie',
  ESSAI: '📚 Essai',
  PHILOSOPHIE: '🧠 Philosophie',
  JEUNESSE: '🧒 Jeunesse',
  BANDE_DESSINEE: '🖼️ Bande dessinée',
  ART: '🎨 Art',
  CUISINE: '🍳 Cuisine',
  VOYAGE: '✈️ Voyage',
  SPORT: '⚽ Sport',
  SANTE: '💪 Santé',
  RELIGION: '🕌 Religion',
  AUTRE: '📦 Autre',
};

const LANGUAGE_LABELS: Record<string, string> = {
  FRANCAIS: '🇫🇷 Français',
  ANGLAIS: '🇬🇧 Anglais',
  ARABE: '🇸🇦 Arabe',
  ESPAGNOL: '🇪🇸 Espagnol',
  ALLEMAND: '🇩🇪 Allemand',
  ITALIEN: '🇮🇹 Italien',
  PORTUGAIS: '🇵🇹 Portugais',
  RUSSE: '🇷🇺 Russe',
  CHINOIS: '🇨🇳 Chinois',
  JAPONAIS: '🇯🇵 Japonais',
  AUTRE: '📦 Autre',
};

export const BooksScreen = () => {
  const [books, setBooks] = useState<any[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('TOUS');
  const [selectedLanguage, setSelectedLanguage] = useState('TOUTES');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const navigation = useNavigation<BooksScreenNavigationProp>();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'STAFF';

  const fetchBooks = async () => {
    try {
      const response = await api.get('/books', { params: { limit: 100 } });

      const booksWithAvailability = response.data.data?.map((book: any) => ({
        ...book,
        availableQuantity:
          book.availableQuantity !== undefined
            ? book.availableQuantity
            : book.copies?.filter((c: any) => c.status === 'AVAILABLE').length || 0,
        totalQuantity: book.totalCopies || 0,
        genreLabel: GENRE_LABELS[book.genre] || book.genre || 'Non défini',
        languageLabel: LANGUAGE_LABELS[book.language] || book.language || 'Non défini',
      })) || [];

      setBooks(booksWithAvailability);
      applyFilters(booksWithAvailability, search, selectedGenre, selectedLanguage);
    } catch (error) {
      console.error('Erreur fetchBooks:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchBooks();
    });
    return unsubscribe;
  }, [navigation]);

  const applyFilters = (
    booksList: any[],
    searchText: string,
    genre: string,
    language: string
  ) => {
    let filtered = booksList;

    if (searchText.trim()) {
      const query = searchText.toLowerCase();
      filtered = filtered.filter(
        (book) =>
          book.title.toLowerCase().includes(query) ||
          book.author.toLowerCase().includes(query)
      );
    }

    if (genre !== 'TOUS') {
      filtered = filtered.filter((book) => book.genre === genre);
    }

    if (language !== 'TOUTES') {
      filtered = filtered.filter((book) => book.language === language);
    }

    setFilteredBooks(filtered);
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    applyFilters(books, text, selectedGenre, selectedLanguage);
  };

  const handleGenreChange = (genre: string) => {
    setSelectedGenre(genre);
    applyFilters(books, search, genre, selectedLanguage);
  };

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    applyFilters(books, search, selectedGenre, language);
  };

  const resetFilters = () => {
    setSelectedGenre('TOUS');
    setSelectedLanguage('TOUTES');
    setSearch('');
    setFilteredBooks(books);
    setFilterModalVisible(false);
  };

  const renderBook = ({ item }: { item: any }) => {
    const isAvailable = (item.availableQuantity || 0) > 0;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('BookDetail', { book: item })}
        activeOpacity={0.85}
      >
        <View style={styles.imageContainer}>
          {item.imageUrl ? (
            <Image
              source={{ uri: `https://51-77-244-126.sslip.io${item.imageUrl}` }}
              style={styles.bookImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="book-outline" size={36} color={colors.text.light} />
            </View>
          )}
          {!isAvailable && (
            <View style={styles.unavailableBadge}>
              <Text style={styles.unavailableBadgeText}>Indisponible</Text>
            </View>
          )}
          {isAdmin && isAvailable && item.availableQuantity <= 2 && (
            <View style={styles.lowStockBadge}>
              <Text style={styles.lowStockBadgeText}>Plus que {item.availableQuantity}</Text>
            </View>
          )}
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.bookTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.bookAuthor} numberOfLines={1}>
            {item.author}
          </Text>
          <View style={styles.availabilityRow}>
            <View
              style={[
                styles.availabilityDot,
                isAvailable ? styles.availableDot : styles.unavailableDot,
              ]}
            />
            <Text
              style={[
                styles.availabilityText,
                isAvailable ? styles.availableText : styles.unavailableText,
              ]}
            >
              {isAvailable
                ? isAdmin
                  ? `Disponible (${item.availableQuantity})`
                  : 'Disponible'
                : 'Indisponible'}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaText} numberOfLines={1}>
              {item.genreLabel}
            </Text>
          </View>
          {isAdmin && (
            <Text style={styles.stockText}>
              📦 {item.availableQuantity}/{item.totalQuantity}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Barre de recherche */}
        <View style={styles.searchContainer}>
          <View style={styles.searchWrapper}>
            <Ionicons name="search-outline" size={18} color={colors.text.light} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un livre..."
              placeholderTextColor={colors.text.light}
              value={search}
              onChangeText={handleSearch}
            />
          </View>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setFilterModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="options-outline" size={22} color={colors.primary} />
            {(selectedGenre !== 'TOUS' || selectedLanguage !== 'TOUTES') && (
              <View style={styles.filterBadge} />
            )}
          </TouchableOpacity>
        </View>

        {/* Filtres actifs */}
        {(selectedGenre !== 'TOUS' || selectedLanguage !== 'TOUTES') && (
          <ScrollView
            horizontal
            style={styles.activeFilters}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.activeFiltersContent}
          >
            {selectedGenre !== 'TOUS' && (
              <TouchableOpacity
                style={styles.activeFilterChip}
                onPress={() => handleGenreChange('TOUS')}
                activeOpacity={0.8}
              >
                <Text style={styles.activeFilterText}>
                  {GENRES.find((g) => g.value === selectedGenre)?.label || selectedGenre}
                </Text>
                <Ionicons name="close-circle" size={16} color={colors.primary} />
              </TouchableOpacity>
            )}
            {selectedLanguage !== 'TOUTES' && (
              <TouchableOpacity
                style={styles.activeFilterChip}
                onPress={() => handleLanguageChange('TOUTES')}
                activeOpacity={0.8}
              >
                <Text style={styles.activeFilterText}>
                  {LANGUAGES.find((l) => l.value === selectedLanguage)?.label || selectedLanguage}
                </Text>
                <Ionicons name="close-circle" size={16} color={colors.primary} />
              </TouchableOpacity>
            )}
          </ScrollView>
        )}

        <FlatList
          data={filteredBooks}
          keyExtractor={(item) => item.id}
          renderItem={renderBook}
          numColumns={2}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchBooks();
              }}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="book-outline" size={48} color={colors.text.light} />
              <Text style={styles.emptyText}>Aucun livre trouvé</Text>
            </View>
          }
        />

        {/* Bouton flottant + pour Admin/Staff */}
        {isAdmin && (
          <TouchableOpacity
            style={styles.fab}
            onPress={() => navigation.navigate('AddBook')}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={30} color={colors.text.white} />
          </TouchableOpacity>
        )}
      </View>

      {/* Modal Filtres */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Filtrer</Text>
                <Text style={styles.modalSubtitle}>Affinez votre recherche</Text>
              </View>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.filterLabel}>📚 Genre</Text>
              <View style={styles.filterOptions}>
                {GENRES.map((genre) => (
                  <TouchableOpacity
                    key={genre.value}
                    style={[
                      styles.filterChip,
                      selectedGenre === genre.value && styles.filterChipActive,
                    ]}
                    onPress={() => handleGenreChange(genre.value)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedGenre === genre.value && styles.filterChipTextActive,
                      ]}
                    >
                      {genre.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.filterLabel, styles.filterLabelTop]}>🌐 Langue</Text>
              <View style={styles.filterOptions}>
                {LANGUAGES.map((lang) => (
                  <TouchableOpacity
                    key={lang.value}
                    style={[
                      styles.filterChip,
                      selectedLanguage === lang.value && styles.filterChipActive,
                    ]}
                    onPress={() => handleLanguageChange(lang.value)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedLanguage === lang.value && styles.filterChipTextActive,
                      ]}
                    >
                      {lang.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={resetFilters}
                activeOpacity={0.8}
              >
                <Text style={styles.resetButtonText}>Réinitialiser</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setFilterModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.applyButtonText}>Appliquer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },

  // Recherche
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 10,
  },
  searchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 14,
    color: colors.text.primary,
  },
  filterButton: {
    padding: 12,
    backgroundColor: colors.background.secondary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.secondary,
  },

  // Filtres actifs
  activeFilters: {
    maxHeight: 44,
  },
  activeFiltersContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 6,
  },
  activeFilterText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },

  // Liste et cartes
  list: {
    padding: 8,
    paddingBottom: 100,
  },
  card: {
    flex: 1,
    maxWidth: CARD_WIDTH,
    margin: 8,
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: CARD_WIDTH * 1.3,
    backgroundColor: colors.background.primary,
    position: 'relative',
  },
  bookImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  unavailableBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.danger,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  unavailableBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  lowStockBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.warning,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  lowStockBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  cardContent: {
    padding: 12,
  },
  bookTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 2,
  },
  bookAuthor: {
    fontSize: 11,
    color: colors.text.secondary,
    marginBottom: 6,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  availabilityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  availableDot: { backgroundColor: colors.success },
  unavailableDot: { backgroundColor: colors.danger },
  availabilityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  availableText: { color: colors.success },
  unavailableText: { color: colors.danger },
  metaRow: {
    flexDirection: 'row',
    marginTop: 2,
  },
  metaText: {
    fontSize: 9,
    color: colors.text.light,
    flex: 1,
  },
  stockText: {
    fontSize: 10,
    color: colors.text.light,
    marginTop: 2,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 15,
    color: colors.text.secondary,
    marginTop: 12,
    fontWeight: '500',
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: colors.secondary,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 61, 40, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  filterLabelTop: {
    marginTop: 20,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: colors.text.white,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  resetButtonText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 14,
    color: colors.text.white,
    fontWeight: '700',
  },
});
