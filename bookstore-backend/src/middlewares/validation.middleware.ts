import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export class ValidationMiddleware {
  static validate(schema: Joi.ObjectSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const { error } = schema.validate(req.body, { abortEarly: false });
      
      if (error) {
        const errors = error.details.map((detail) => detail.message);
        res.status(400).json({
          status: 'error',
          message: 'Validation error',
          errors,
        });
        return;
      }
      
      next();
    };
  }
}