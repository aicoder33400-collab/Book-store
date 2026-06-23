import { create } from 'zustand';
import { adminService, DashboardStats, LoanRequest } from '../services/admin.service';

interface DashboardState {
  stats: DashboardStats | null;
  pendingRequests: LoanRequest[];
  approvedLoans: LoanRequest[];
  loading: boolean;
  error: string | null;

  fetchDashboard: () => Promise<void>;
  approveRequest: (loanId: string) => Promise<void>;
  rejectRequest: (loanId: string) => Promise<void>;
  handOverBook: (loanId: string) => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  stats: null,
  pendingRequests: [],
  approvedLoans: [],
  loading: false,
  error: null,

  fetchDashboard: async () => {
    set({ loading: true, error: null });
    try {
      const [stats, pendingRequests, approvedLoans] = await Promise.all([
        adminService.getDashboard(),
        adminService.getPendingRequests(),
        adminService.getApprovedLoans(),
      ]);
      set({ stats, pendingRequests, approvedLoans, loading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to load dashboard', loading: false });
    }
  },

  approveRequest: async (loanId: string) => {
    await adminService.approveRequest(loanId);
    get().fetchDashboard(); // Refresh
  },

  rejectRequest: async (loanId: string) => {
    await adminService.rejectRequest(loanId);
    get().fetchDashboard();
  },

  handOverBook: async (loanId: string) => {
    await adminService.handOverBook(loanId);
    get().fetchDashboard();
  },
}));