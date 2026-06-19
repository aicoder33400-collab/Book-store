import { Request, Response, NextFunction } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { AppError } from '../utils/appError';
import logger from '../utils/logger';
import { ApiResponse } from '../utils/response';

export class ErrorMiddleware {
  static handleError = (
    err: Error | AppError,
    req: Request,
    res: Response,
    _next: NextFunction
  ) => {
    // Log error
    logger.error({
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
    });

    // Handle Prisma errors
    if (err instanceof PrismaClientKnownRequestError) {
      return ErrorMiddleware.handlePrismaError(err, res);
    }

    // Handle Joi validation errors
    if (err.name === 'ValidationError') {
      return res.status(400).json(
        ApiResponse.error('Validation Error', 400)
      );
    }

    // Handle custom AppError
    if (err instanceof AppError) {
      return res.status(err.statusCode).json(
        ApiResponse.error(err.message, err.statusCode)
      );
    }

    // Handle unknown errors
    console.error('Unhandled error:', err);
    
    // Ne pas exposer les détails internes en production
    const message = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message;
    
    return res.status(500).json(
      ApiResponse.error(message, 500)
    );
  };

  private static handlePrismaError(
    err: PrismaClientKnownRequestError,
    res: Response
  ) {
    switch (err.code) {
      case 'P2002':
        return res.status(409).json(
          ApiResponse.error(`A record with this ${err.meta?.target} already exists.`, 409)
        );
      case 'P2025':
        return res.status(404).json(
          ApiResponse.error('Record not found.', 404)
        );
      default:
        return res.status(400).json(
          ApiResponse.error(`Database error`, 400)
        );
    }
  }

  static notFound = (req: Request, _res: Response, next: NextFunction) => {
    const error = new AppError(`Can't find ${req.originalUrl} on this server!`, 404);
    next(error);
  };
}