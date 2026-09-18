import api from './api';

export type LoanStatus =
  | 'REQUESTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'BORROWED'
  | 'RETURN_REQUESTED'
  | 'RETURNED'
  | 'LATE';

export type PrayerSlot = 'DOHR' | 'ASR' | 'MAGHREB';

export interface Loan {
  id: string;
  userId: string;
  copyId: string;
  borrowedAt: string;
  dueDate: string;
  returnedAt?: string | null;
  status: LoanStatus;
  pickupDate?: string | null;
  pickupPrayer?: PrayerSlot | null;
  returnPickupDate?: string | null;
  returnPickupPrayer?: PrayerSlot | null;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  };
  book?: {
    id: string;
    title: string;
    author: string;
    imageUrl?: string | null;
  };
  copy?: {
    id: string;
    copyNumber: number;
    book?: {
      id: string;
      title: string;
      author: string;
      imageUrl?: string | null;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export const loanService = {
  borrowBook: async (userId: string, bookId: string, dueDate: Date) => {
    const response = await api.post('/loans', {
      userId,
      bookId,
      dueDate: dueDate.toISOString(),
    });
    return response.data.data;
  },

  getUserLoans: async (): Promise<Loan[]> => {
    const response = await api.get('/loans/mine', { params: { limit: 100 } });
    const rawData = response.data.data || [];
    return rawData.map((loan: any) => ({
      ...loan,
      book: loan.book || loan.copy?.book,
    }));
  },

  getAllLoans: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    userId?: string;
  }): Promise<Loan[]> => {
    const response = await api.get('/loans', { params });
    const rawData = response.data.data || [];
    return rawData.map((loan: any) => ({
      ...loan,
      book: loan.book || loan.copy?.book,
    }));
  },

  getLoanById: async (id: string): Promise<Loan> => {
    const response = await api.get(`/loans/${id}`);
    const loan = response.data.data;
    return {
      ...loan,
      book: loan.book || loan.copy?.book,
    };
  },

  requestReturn: async (loanId: string) => {
    const response = await api.put(`/loans/${loanId}/request-return`);
    return response.data.data;
  },

  setPickupSlot: async (
    loanId: string,
    pickupDate: string,
    pickupPrayer: PrayerSlot,
  ) => {
    const response = await api.put(`/loans/${loanId}/set-pickup`, {
      pickupDate,
      pickupPrayer,
    });
    return response.data.data;
  },

  setReturnPickupSlot: async (
    loanId: string,
    returnPickupDate: string,
    returnPickupPrayer: PrayerSlot,
  ) => {
    const response = await api.put(`/loans/${loanId}/set-return-pickup`, {
      returnPickupDate,
      returnPickupPrayer,
    });
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

  confirmReturn: async (loanId: string) => {
    const response = await api.put(`/loans/${loanId}/confirm-return`);
    return response.data.data;
  },

  returnBook: async (loanId: string) => {
    const response = await api.put(`/loans/${loanId}/return`);
    return response.data.data;
  },
};

export default loanService;