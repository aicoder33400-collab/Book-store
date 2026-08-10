// bookstore-backend/src/middlewares/auth.middleware.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/AppError';

const prisma = new PrismaClient();

export class AuthMiddleware {
  static protect = async (req: Request, res: Response, next: NextFunction) => {
    try {
      let token: string | undefined;

      // 1. Récupérer le token du header
      if (req.headers.authorization?.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
      }

      if (!token) {
        throw new AppError('Vous devez être connecté pour accéder à cette ressource', 401);
      }

      // 2. Vérifier le token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'secret-key'
      ) as { id: string };

      // 3. Vérifier que l'utilisateur existe
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user) {
        throw new AppError('Utilisateur non trouvé', 401);
      }

      // 4. Ajouter l'utilisateur à la requête
      // @ts-ignore - Ignorer l'erreur de typage
      req.user = user;

      next();
    } catch (error) {
      next(error);
    }
  };

  static restrictTo = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
      // @ts-ignore - req.user est ajouté par le middleware protect
      const user = req.user;
      
      if (!user) {
        return next(new AppError('Vous devez être connecté', 401));
      }

      // @ts-ignore - Accéder à la propriété role
      if (!roles.includes(user.role)) {
        return next(new AppError('Vous n\'avez pas les droits pour accéder à cette ressource', 403));
      }

      next();
    };
  };
}
