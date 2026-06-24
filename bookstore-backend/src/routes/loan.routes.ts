import { Router } from 'express';
import { LoanController } from '../controllers/loan.controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { ValidationMiddleware } from '../middlewares/validation.middleware';
import { loanValidation } from '../validations/loan.validation';

const router = Router();
const loanController = new LoanController();

// All routes require authentication
router.use(AuthMiddleware.protect);

// Staff and Admin can borrow/return books
router.post(
  '/',
  AuthMiddleware.restrictTo('ADMIN', 'STAFF', 'USER'),
  ValidationMiddleware.validate(loanValidation.borrowBook),
  loanController.borrowBook
);

router.put(
  '/:id/return',
  AuthMiddleware.restrictTo('ADMIN', 'STAFF'),
  loanController.returnBook
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