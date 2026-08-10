import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Toutes les routes Admin nécessitent le rôle ADMIN
router.use(AuthMiddleware.protect);
router.use(AuthMiddleware.restrictTo('ADMIN'));

// Dashboard
router.get('/dashboard', AdminController.getDashboard);

// 🔥 Notifications
router.get('/notifications', AdminController.getNotifications);
router.put('/notifications/:id/read', AdminController.markNotificationRead);

export default router;
