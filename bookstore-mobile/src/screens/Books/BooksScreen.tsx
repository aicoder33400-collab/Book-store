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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import api from '../../services/api';
import { colors } from '../../theme/colors';

type RootStackParamList = {
  BookDetail: { book: any };
  BooksList: undefined;
};

type BooksScreenNavigationProp = StackNavigationProp<RootStackParamList, 'BooksList'>;

export const BooksScreen = () => {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const navigation = useNavigation<BooksScreenNavigationProp>();

  const fetchBooks = async () => {
    try {
      const response = await api.get('/books', { params: { limit: 100 } });
      setBooks(response.data.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const filteredBooks = books.filter((book) =>
    book.title.toLowerCase().includes(search.toLowerCase()) ||
    book.author.toLowerCase().includes(search.toLowerCase())
  );

  const renderBook = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('BookDetail', { book: item })}
    >
      <View style={styles.cardContent}>
        <View style={styles.bookInfo}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.author}>✍️ {item.author}</Text>
          <Text style={styles.isbn}>ISBN: {item.isbn}</Text>
        </View>
        <View style={styles.rightInfo}>
          <View style={[styles.statusBadge, item.availableQuantity > 0 ? styles.available : styles.unavailable]}>
            <Text style={styles.statusText}>
              {item.availableQuantity > 0 ? '📖 Disponible' : '❌ Indisponible'}
            </Text>
          </View>
          <Text style={styles.stock}>📦 {item.availableQuantity}/{item.totalQuantity}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Rechercher un livre..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filteredBooks}
        keyExtractor={(item) => item.id}
        renderItem={renderBook}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBooks(); }} />}
        ListEmptyComponent={<Text style={styles.empty}>Aucun livre trouvé</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#1a1a2e',
  },
  list: { padding: 16 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookInfo: { flex: 1 },
  title: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 2 },
  author: { fontSize: 14, color: '#666', marginBottom: 2 },
  isbn: { fontSize: 12, color: '#999' },
  rightInfo: { alignItems: 'flex-end', marginLeft: 8 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  available: { backgroundColor: '#4CAF50' },
  unavailable: { backgroundColor: '#f44336' },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  stock: { fontSize: 12, color: '#666' },
});