import { Router } from 'express';
import { SaleController } from '../controllers/sale.controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { ValidationMiddleware } from '../middlewares/validation.middleware';
import { saleValidation } from '../validations/sale.validation';

const router = Router();
const saleController = new SaleController();

// All routes require authentication
router.use(AuthMiddleware.protect);

// Staff and Admin can manage sales
router.post(
  '/',
  AuthMiddleware.restrictTo('ADMIN', 'STAFF'),
  ValidationMiddleware.validate(saleValidation.createSale),
  saleController.createSale
);

router.get(
  '/',
  AuthMiddleware.restrictTo('ADMIN', 'STAFF'),
  saleController.getAllSales
);

router.get(
  '/stats',
  AuthMiddleware.restrictTo('ADMIN', 'STAFF'),
  saleController.getSalesStats
);

router.get(
  '/:id',
  AuthMiddleware.restrictTo('ADMIN', 'STAFF'),
  saleController.getSaleById
);

export default router;