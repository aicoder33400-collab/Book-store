import api from './api';

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  description?: string;
  totalCopies: number;
  totalQuantity?: number; // Alias pour compatibilité
  availableQuantity: number;
  isForRent: boolean;
  genre: string;
  language: string;
  imageUrl?: string;
  copies?: Array<{ id: string; status: string; copyNumber: number }>;
  genreLabel?: string;
  languageLabel?: string;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface BooksResponse {
  success: boolean;
  data: Book[];
  pagination?: Pagination;
  message?: string;
}

export const bookService = {
  getAllBooks: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    genre?: string;
    language?: string;
    availableOnly?: boolean;
  }) => {
    try {
      const response = await api.get('/books', { params });
      
      // Transformer les données pour ajouter availableQuantity
      const books = response.data.data?.map((book: any) => ({
        ...book,
        availableQuantity: book.availableQuantity !== undefined 
          ? book.availableQuantity 
          : book.copies?.filter((c: any) => c.status === 'AVAILABLE').length || 0,
        totalQuantity: book.totalCopies || 0,
      })) || [];
      
      return {
        ...response.data,
        data: books,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des livres:', error);
      throw error;
    }
  },

  getBookById: async (id: string) => {
    try {
      const response = await api.get(`/books/${id}`);
      
      const book = response.data.data;
      if (book) {
        book.availableQuantity = book.availableQuantity !== undefined 
          ? book.availableQuantity 
          : book.copies?.filter((c: any) => c.status === 'AVAILABLE').length || 0;
        book.totalQuantity = book.totalCopies || 0;
      }
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du livre:', error);
      throw error;
    }
  },
};