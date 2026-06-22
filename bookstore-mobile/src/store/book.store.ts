import { create } from 'zustand';
import { bookService, Book } from '../services/book.service';

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface BookState {
  books: Book[];
  loading: boolean;
  error: string | null;
  pagination: Pagination;
  searchQuery: string;
  availableOnly: boolean;
  
  fetchBooks: (page?: number, search?: string, available?: boolean) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setAvailableOnly: (value: boolean) => void;
  resetSearch: () => void;
}

export const useBookStore = create<BookState>((set, get) => ({
  books: [],
  loading: false,
  error: null,
  pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
  searchQuery: '',
  availableOnly: false,

  fetchBooks: async (page = 1, search?: string, available?: boolean) => {
    set({ loading: true, error: null });
    try {
      // Utiliser les paramètres passés, sinon ceux du store
      const searchTerm = search !== undefined ? search : get().searchQuery;
      const availableOnlyFlag = available !== undefined ? available : get().availableOnly;
      
      const response = await bookService.getAllBooks({
        page,
        limit: 10,
        search: searchTerm || undefined,
        availableOnly: availableOnlyFlag || undefined,
      });
      
      set({
        books: response.data,
        pagination: {
          page: response.pagination.page,
          limit: response.pagination.limit,
          total: response.pagination.total || 0,
          totalPages: response.pagination.totalPages || 0,
        },
        loading: false,
      });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Erreur de chargement',
        loading: false 
      });
    }
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
    // Ne pas appeler fetchBooks ici - on utilise la recherche locale dans le screen
  },

  setAvailableOnly: (value: boolean) => {
    set({ availableOnly: value });
    // Appeler fetchBooks avec le nouveau filtre
    get().fetchBooks(1, get().searchQuery, value);
  },
  
  resetSearch: () => {
    set({ searchQuery: '' });
    get().fetchBooks(1, '', get().availableOnly);
  },
}));