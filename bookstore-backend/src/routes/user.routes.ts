import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { ValidationMiddleware } from '../middlewares/validation.middleware';
import { userValidation } from '../validations/user.validation';

const router = Router();
const userController = new UserController();

// All routes require authentication
router.use(AuthMiddleware.protect);

// Admin only routes
router.get('/', 
  AuthMiddleware.restrictTo('ADMIN'), 
  userController.getAllUsers
);

router.post('/', 
  AuthMiddleware.restrictTo('ADMIN'),
  ValidationMiddleware.validate(userValidation.createUser),
  userController.createUser
);

router.get('/:id', 
  AuthMiddleware.restrictTo('ADMIN'), 
  userController.getUserById
);

router.put('/:id', 
  AuthMiddleware.restrictTo('ADMIN'),
  ValidationMiddleware.validate(userValidation.updateUser),
  userController.updateUser
);

router.delete('/:id', 
  AuthMiddleware.restrictTo('ADMIN'), 
  userController.deleteUser
);

export default router;