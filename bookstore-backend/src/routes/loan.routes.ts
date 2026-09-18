import { Router } from 'express';
import { LoanController } from '../controllers/loan.controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { ValidationMiddleware } from '../middlewares/validation.middleware';
import { loanValidation } from '../validations/loan.validation';

const router = Router();
const loanController = new LoanController();

// All routes require authentication
router.use(AuthMiddleware.protect);

// USER peut emprunter
router.post(
  '/',
  AuthMiddleware.restrictTo('ADMIN', 'STAFF', 'USER'),
  ValidationMiddleware.validate(loanValidation.borrowBook),
  loanController.borrowBook
);

// 🔥 USER peut demander le retour
router.put(
  '/:id/request-return',
  AuthMiddleware.restrictTo('ADMIN', 'STAFF', 'USER'),
  loanController.requestReturn
);

// 🔥 USER choisit un créneau de retrait
router.put(
  '/:id/set-pickup',
  AuthMiddleware.restrictTo('ADMIN', 'STAFF', 'USER'),
  loanController.setPickupSlot
);

router.put(
  '/:id/set-return-pickup',
  AuthMiddleware.restrictTo('ADMIN', 'STAFF', 'USER'),
  loanController.setReturnPickupSlot
);

// 🔥 ADMIN/STAFF confirme le retour
router.put(
  '/:id/confirm-return',
  AuthMiddleware.restrictTo('ADMIN', 'STAFF'),
  loanController.confirmReturn
);

// User's own loans
router.get(
  '/mine',
  AuthMiddleware.protect,
  loanController.getMyLoans
);

// View loans (accessible to all authenticated users)
router.get(
  '/',
  AuthMiddleware.restrictTo('ADMIN', 'STAFF'),
  loanController.getAllLoans
);

router.get(
  '/:id',
  AuthMiddleware.restrictTo('ADMIN', 'STAFF'),
  loanController.getLoanById
);

// Admin: approve/reject requests
router.put(
  '/:id/approve',
  AuthMiddleware.restrictTo('ADMIN'),
  loanController.approveRequest
);

router.put(
  '/:id/reject',
  AuthMiddleware.restrictTo('ADMIN'),
  loanController.rejectRequest
);

router.put(
  '/:id/hand-over',
  AuthMiddleware.restrictTo('ADMIN'),
  loanController.handOverBook
);

// Admin: delete loan record
router.delete(
  '/:id',
  AuthMiddleware.restrictTo('ADMIN'),
  loanController.deleteLoan
);

export default router;
