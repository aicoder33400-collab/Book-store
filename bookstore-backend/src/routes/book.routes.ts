import { Router } from 'express';
import { BookController } from '../controllers/book.controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { ValidationMiddleware } from '../middlewares/validation.middleware';
import { bookValidation } from '../validations/book.validation';

const router = Router();
const bookController = new BookController();

// Routes publiques
router.get('/', bookController.getAllBooks);
router.get('/:id', bookController.getBookById);

// Routes protégées
router.use(AuthMiddleware.protect);

router.post(
  '/',
  AuthMiddleware.restrictTo('ADMIN', 'STAFF'),
  ValidationMiddleware.validate(bookValidation.createBook),
  bookController.createBook
);

router.put(
  '/:id',
  AuthMiddleware.restrictTo('ADMIN', 'STAFF'),
  ValidationMiddleware.validate(bookValidation.updateBook),
  bookController.updateBook
);

router.delete(
  '/:id',
  AuthMiddleware.restrictTo('ADMIN', 'STAFF'),
  bookController.deleteBook
);

// 🔥 Upload d'image en base64 (pas besoin de multer)
router.post(
  '/upload-image',
  AuthMiddleware.restrictTo('ADMIN', 'STAFF'),
  bookController.uploadImage
);

export default router;
