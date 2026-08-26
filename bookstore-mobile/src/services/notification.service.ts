import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Notification {
  id: string;
  type: 'loan_approved' | 'loan_rejected' | 'loan_handed_over' | 'return_confirmed' | 'return_requested';
  message: string;
  title: string;
  read: boolean;
  createdAt: string;
  loanId?: string;
}

const STORAGE_KEY = '@notifications_read';

export const notificationService = {
  getReadNotificationIds: async (): Promise<Set<string>> => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        return new Set(JSON.parse(stored));
      }
      return new Set();
    } catch (error) {
      console.error('Erreur getReadNotificationIds:', error);
      return new Set();
    }
  },

  markAsRead: async (notificationId: string): Promise<void> => {
    try {
      const readIds = await notificationService.getReadNotificationIds();
      readIds.add(notificationId);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(readIds)));
    } catch (error) {
      console.error('Erreur markAsRead:', error);
    }
  },

  markAllAsRead: async (notificationIds: string[]): Promise<void> => {
    try {
      const readIds = await notificationService.getReadNotificationIds();
      notificationIds.forEach(id => readIds.add(id));
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(readIds)));
    } catch (error) {
      console.error('Erreur markAllAsRead:', error);
    }
  },

  getNotifications: async (): Promise<Notification[]> => {
    try {
      const readIds = await notificationService.getReadNotificationIds();
      const response = await api.get('/loans/mine');
      const loans = response.data.data;
      
      const notifications: Notification[] = [];
      
      loans.forEach((loan: any) => {
        // Demande approuvée
        if (loan.status === 'APPROVED') {
          notifications.push({
            id: `${loan.id}-approved`,
            type: 'loan_approved',
            title: '✅ Demande approuvée !',
            message: `Votre demande pour "${loan.book?.title}" a été approuvée.`,
            read: readIds.has(`${loan.id}-approved`),
            createdAt: loan.updatedAt,
            loanId: loan.id,
          });
        }
        
        // Demande refusée
        if (loan.status === 'REJECTED') {
          notifications.push({
            id: `${loan.id}-rejected`,
            type: 'loan_rejected',
            title: '❌ Demande refusée',
            message: `Votre demande pour "${loan.book?.title}" a été refusée.`,
            read: readIds.has(`${loan.id}-rejected`),
            createdAt: loan.updatedAt,
            loanId: loan.id,
          });
        }
        
        // Livre emprunté (remis)
        if (loan.status === 'BORROWED') {
          notifications.push({
            id: `${loan.id}-borrowed`,
            type: 'loan_handed_over',
            title: '📖 Livre emprunté !',
            message: `Vous avez emprunté "${loan.book?.title}".`,
            read: readIds.has(`${loan.id}-borrowed`),
            createdAt: loan.borrowedAt || loan.updatedAt,
            loanId: loan.id,
          });
        }
        
        // Retour confirmé
        if (loan.status === 'RETURNED') {
          notifications.push({
            id: `${loan.id}-returned`,
            type: 'return_confirmed',
            title: '↩️ Retour confirmé !',
            message: `Votre retour pour "${loan.book?.title}" a été confirmé.`,
            read: readIds.has(`${loan.id}-returned`),
            createdAt: loan.returnedAt || loan.updatedAt,
            loanId: loan.id,
          });
        }
      });
      
      notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      return notifications;
    } catch (error) {
      console.error('Erreur getNotifications:', error);
      return [];
    }
  },
  
  getUnreadCount: async (): Promise<number> => {
    const notifications = await notificationService.getNotifications();
    return notifications.filter(n => !n.read).length;
  },
};
