import api from './api';

export interface Loan {
  id: string;
  userId: string;
  bookId: string;
  borrowedAt: string;
  dueDate: string;
  returnedAt: string | null;
  status: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'BORROWED' | 'RETURNED' | 'LATE';
  book: {
    id: string;
    title: string;
    author: string;
    isbn: string;
  };
}

export const loanService = {
  borrowBook: async (userId: string, bookId: string, dueDate: Date) => {
    const response = await api.post('/loans', { userId, bookId, dueDate });
    return response.data.data;
  },

  returnBook: async (loanId: string) => {
    const response = await api.put(`/loans/${loanId}/return`);
    return response.data.data;
  },

  getUserLoans: async () => {
    const response = await api.get('/loans/mine');
    return response.data.data;
  },
};