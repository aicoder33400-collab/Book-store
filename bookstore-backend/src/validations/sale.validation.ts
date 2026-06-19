import Joi from 'joi';

export const saleValidation = {
  createSale: Joi.object({
    bookId: Joi.string().uuid().required(),
    quantity: Joi.number().integer().min(1).required(),
    totalPrice: Joi.number().positive().required(),
  }),

  getSales: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    bookId: Joi.string().uuid().optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
  }),
};