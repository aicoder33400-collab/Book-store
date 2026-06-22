import api from './api';

export interface Sale {
  id: string;
  bookId: string;
  quantity: number;
  totalPrice: number;
  soldAt: string;
  book: {
    id: string;
    title: string;
    author: string;
    isbn: string;
  };
}

export const saleService = {
  createSale: async (bookId: string, quantity: number, totalPrice: number) => {
    const response = await api.post('/sales', { bookId, quantity, totalPrice });
    return response.data.data;
  },

  getAllSales: async (params?: { page?: number; limit?: number }) => {
    const response = await api.get('/sales', { params });
    return response.data;
  },

  getSalesStats: async () => {
    const response = await api.get('/sales/stats');
    return response.data.data;
  },
};