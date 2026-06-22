import api from './api';

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  description?: string;
  totalQuantity: number;
  availableQuantity: number;
  isForSale: boolean;
  isForRent: boolean;
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
  status: string;
  message: string;
  data: Book[];
  pagination: Pagination;
}

export const bookService = {
  getAllBooks: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    availableOnly?: boolean;
  }) => {
    const response = await api.get<BooksResponse>('/books', { params });
    return response.data;
  },

  getBookById: async (id: string) => {
    const response = await api.get<{ status: string; data: Book }>(`/books/${id}`);
    return response.data.data;
  },
};