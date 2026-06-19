import Joi from 'joi';

export const loanValidation = {
  borrowBook: Joi.object({
    userId: Joi.string().uuid().required(),
    bookId: Joi.string().uuid().required(),
    dueDate: Joi.date().iso().min('now').required(),
  }),

  getLoans: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    userId: Joi.string().uuid().optional(),
    bookId: Joi.string().uuid().optional(),
    status: Joi.string().valid('BORROWED', 'RETURNED', 'LATE').optional(),
  }),
};