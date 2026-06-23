import api from './api';

export interface DashboardStats {
  totalBooks: number;
  totalUsers: number;
  activeLoans: number;
  requestedLoans: number;
  approvedLoans: number;
  lateLoans: number;
  totalRevenue: number;
  recentSales: {
    id: string;
    quantity: number;
    totalPrice: number;
    soldAt: string;
    book: { title: string };
  }[];
}

export interface LoanRequest {
  id: string;
  userId: string;
  bookId: string;
  borrowedAt: string;
  dueDate: string;
  status: string;
  user: { id: string; name: string; email: string };
  book: { id: string; title: string; author: string; isbn: string };
}

export const adminService = {
  getDashboard: async () => {
    const response = await api.get<{ status: string; data: DashboardStats }>('/admin/dashboard');
    return response.data.data;
  },

  getPendingRequests: async () => {
    const response = await api.get('/loans?status=REQUESTED');
    return response.data.data;
  },

  getApprovedLoans: async () => {
    const response = await api.get('/loans?status=APPROVED');
    return response.data.data;
  },

  approveRequest: async (loanId: string) => {
    const response = await api.put(`/loans/${loanId}/approve`);
    return response.data.data;
  },

  rejectRequest: async (loanId: string) => {
    const response = await api.put(`/loans/${loanId}/reject`);
    return response.data.data;
  },

  handOverBook: async (loanId: string) => {
    const response = await api.put(`/loans/${loanId}/hand-over`);
    return response.data.data;
  },
};