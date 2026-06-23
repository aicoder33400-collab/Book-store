import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const adminController = new AdminController();

// All admin routes require authentication + ADMIN role
router.use(AuthMiddleware.protect);
router.use(AuthMiddleware.restrictTo('ADMIN'));

router.get('/dashboard', adminController.getDashboard);

export default router;