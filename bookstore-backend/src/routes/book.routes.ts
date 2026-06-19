import { Router } from 'express';
import { BookController } from '../controllers/book.controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { ValidationMiddleware } from '../middlewares/validation.middleware';
import { bookValidation } from '../validations/book.validation';

const router = Router();
const bookController = new BookController();

// All routes require authentication
router.use(AuthMiddleware.protect);

// Public routes (authenticated users)
router.get('/', bookController.getAllBooks);
router.get('/:id', bookController.getBookById);

// Admin only routes
router.post(
  '/',
  AuthMiddleware.restrictTo('ADMIN'),
  ValidationMiddleware.validate(bookValidation.createBook),
  bookController.createBook
);

router.put(
  '/:id',
  AuthMiddleware.restrictTo('ADMIN'),
  ValidationMiddleware.validate(bookValidation.updateBook),
  bookController.updateBook
);

router.delete(
  '/:id',
  AuthMiddleware.restrictTo('ADMIN'),
  bookController.deleteBook
);

export default router;