import Joi from 'joi';

export const bookValidation = {
  createBook: Joi.object({
    title: Joi.string().required().min(1).max(200),
    author: Joi.string().required().min(1).max(100),
    isbn: Joi.string().required().pattern(/^[0-9]{10,13}$/),
    description: Joi.string().max(1000).optional(),
    totalQuantity: Joi.number().integer().min(0).required(),
    isForSale: Joi.boolean().default(true),
    isForRent: Joi.boolean().default(true),
  }),

  updateBook: Joi.object({
    title: Joi.string().min(1).max(200).optional(),
    author: Joi.string().min(1).max(100).optional(),
    description: Joi.string().max(1000).optional(),
    totalQuantity: Joi.number().integer().min(0).optional(),
    isForSale: Joi.boolean().optional(),
    isForRent: Joi.boolean().optional(),
  }),
};