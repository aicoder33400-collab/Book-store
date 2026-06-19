import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { AppError } from '../utils/appError';

interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export class AuthMiddleware {
  static protect = async (req: Request, _res: Response, next: NextFunction) => {
    try {
      let token: string | undefined;

      // Get token from header
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
      }

      if (!token) {
        throw new AppError('You are not logged in. Please log in to access this resource.', 401);
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;

      // Check if user still exists
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, role: true, name: true },
      });

      if (!user) {
        throw new AppError('The user belonging to this token no longer exists.', 401);
      }

      // Attach user to request object
      req.user = user;
      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        next(new AppError('Invalid token. Please log in again.', 401));
      } else if (error instanceof jwt.TokenExpiredError) {
        next(new AppError('Your token has expired. Please log in again.', 401));
      } else {
        next(error);
      }
    }
  };

  static restrictTo = (...roles: string[]) => {
    return (req: Request, _res: Response, next: NextFunction) => {
      if (!req.user) {
        return next(new AppError('User not authenticated', 401));
      }

      if (!roles.includes(req.user.role)) {
        return next(new AppError('You do not have permission to perform this action.', 403));
      }

      next();
    };
  };
}