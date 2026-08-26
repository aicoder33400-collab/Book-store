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
import { colors } from '../../theme/colors';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 32) / 2;

type RootStackParamList = {
  BookDetail: { book: any };
  BooksList: undefined;
};

type BooksScreenNavigationProp = StackNavigationProp<RootStackParamList, 'BooksList'>;

// 🔥 Options de genre
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

// 🔥 Options de langue
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

// 🔥 Mapping des genres pour l'affichage (réutilisé)
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

  const fetchBooks = async () => {
    try {
      const response = await api.get('/books', { params: { limit: 100 } });
      
      // 🔥 Transformer les données pour ajouter availableQuantity
      const booksWithAvailability = response.data.data?.map((book: any) => ({
        ...book,
        // Calculer availableQuantity à partir des copies
        availableQuantity: book.availableQuantity !== undefined 
          ? book.availableQuantity 
          : book.copies?.filter((c: any) => c.status === 'AVAILABLE').length || 0,
        // Ajouter totalQuantity comme alias pour compatibilité
        totalQuantity: book.totalCopies || 0,
        // Ajouter les labels pour l'affichage
        genreLabel: GENRE_LABELS[book.genre] || book.genre || 'Non défini',
        languageLabel: LANGUAGE_LABELS[book.language] || book.language || 'Non défini',
      })) || [];
      
      console.log('📚 Livres chargés:', booksWithAvailability.map((b: any) => ({
        title: b.title,
        availableQuantity: b.availableQuantity,
        totalCopies: b.totalCopies,
        copies: b.copies?.length || 0,
      })));
      
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
    fetchBooks();
  }, []);

  const applyFilters = (booksList: any[], searchText: string, genre: string, language: string) => {
    let filtered = booksList;

    // 🔥 Recherche par texte
    if (searchText.trim()) {
      const query = searchText.toLowerCase();
      filtered = filtered.filter(
        (book) =>
          book.title.toLowerCase().includes(query) ||
          book.author.toLowerCase().includes(query)
      );
    }

    // 🔥 Filtre par genre
    if (genre !== 'TOUS') {
      filtered = filtered.filter((book) => book.genre === genre);
    }

    // 🔥 Filtre par langue
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
              source={{ uri: `http://localhost:3000${item.imageUrl}` }} 
              style={styles.bookImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="book-outline" size={36} color="#ccc" />
            </View>
          )}
          {!isAvailable && (
            <View style={styles.unavailableBadge}>
              <Text style={styles.unavailableBadgeText}>Indisponible</Text>
            </View>
          )}
          {isAvailable && item.availableQuantity <= 2 && (
            <View style={styles.lowStockBadge}>
              <Text style={styles.lowStockBadgeText}>Plus que {item.availableQuantity}</Text>
            </View>
          )}
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.bookTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.bookAuthor} numberOfLines={1}>{item.author}</Text>
          <View style={styles.availabilityRow}>
            <View style={[styles.availabilityDot, isAvailable ? styles.availableDot : styles.unavailableDot]} />
            <Text style={[styles.availabilityText, isAvailable ? styles.availableText : styles.unavailableText]}>
              {isAvailable ? `Disponible (${item.availableQuantity})` : 'Indisponible'}
            </Text>
          </View>
          {/* 🔥 Afficher genre et langue */}
          <View style={styles.metaRow}>
            <Text style={styles.metaText} numberOfLines={1}>{item.genreLabel}</Text>
            <Text style={styles.metaText} numberOfLines={1}>{item.languageLabel}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* 🔥 Barre de recherche + Filtre */}
        <View style={styles.searchContainer}>
          <View style={styles.searchWrapper}>
            <Ionicons name="search-outline" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un livre..."
              placeholderTextColor="#999"
              value={search}
              onChangeText={handleSearch}
            />
          </View>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setFilterModalVisible(true)}
          >
            <Ionicons name="options-outline" size={24} color="#6C63FF" />
            {(selectedGenre !== 'TOUS' || selectedLanguage !== 'TOUTES') && (
              <View style={styles.filterBadge} />
            )}
          </TouchableOpacity>
        </View>

        {/* 🔥 Filtres actifs */}
        {(selectedGenre !== 'TOUS' || selectedLanguage !== 'TOUTES') && (
          <ScrollView horizontal style={styles.activeFilters} showsHorizontalScrollIndicator={false}>
            {selectedGenre !== 'TOUS' && (
              <TouchableOpacity
                style={styles.activeFilterChip}
                onPress={() => handleGenreChange('TOUS')}
              >
                <Text style={styles.activeFilterText}>
                  📚 {GENRES.find(g => g.value === selectedGenre)?.label || selectedGenre}
                </Text>
                <Ionicons name="close-circle" size={16} color="#6C63FF" />
              </TouchableOpacity>
            )}
            {selectedLanguage !== 'TOUTES' && (
              <TouchableOpacity
                style={styles.activeFilterChip}
                onPress={() => handleLanguageChange('TOUTES')}
              >
                <Text style={styles.activeFilterText}>
                  🌐 {LANGUAGES.find(l => l.value === selectedLanguage)?.label || selectedLanguage}
                </Text>
                <Ionicons name="close-circle" size={16} color="#6C63FF" />
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBooks(); }} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="book-outline" size={48} color="#ddd" />
              <Text style={styles.emptyText}>Aucun livre trouvé</Text>
            </View>
          }
        />
      </View>

      {/* 🔥 MODAL DE FILTRES */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🔍 Filtrer</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color="#999" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Genre */}
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

              {/* Langue */}
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
              <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
                <Text style={styles.resetButtonText}>Réinitialiser</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={() => setFilterModalVisible(false)}>
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
    backgroundColor: '#f8f9fc',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fc',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fc',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  searchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1a1a2e',
  },
  filterButton: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e94560',
  },
  activeFilters: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.2)',
  },
  activeFilterText: {
    fontSize: 12,
    color: '#6C63FF',
    marginRight: 4,
  },
  list: {
    padding: 8,
    paddingBottom: 80,
  },
  card: {
    flex: 1,
    maxWidth: CARD_WIDTH,
    margin: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: CARD_WIDTH * 1.3,
    backgroundColor: '#f5f6fa',
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
    backgroundColor: '#f5f6fa',
  },
  unavailableBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(244,67,54,0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  unavailableBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  lowStockBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255,152,0,0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  lowStockBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  cardContent: {
    padding: 12,
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 2,
  },
  bookAuthor: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
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
  availableDot: {
    backgroundColor: '#4CAF50',
  },
  unavailableDot: {
    backgroundColor: '#f44336',
  },
  availabilityText: {
    fontSize: 11,
    fontWeight: '500',
  },
  availableText: {
    color: '#4CAF50',
  },
  unavailableText: {
    color: '#f44336',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
    gap: 4,
  },
  metaText: {
    fontSize: 9,
    color: '#999',
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 8,
  },
  filterLabelTop: {
    marginTop: 16,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    borderColor: '#6C63FF',
  },
  filterChipText: {
    fontSize: 13,
    color: '#666',
  },
  filterChipTextActive: {
    color: '#6C63FF',
    fontWeight: '500',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#6C63FF',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
});