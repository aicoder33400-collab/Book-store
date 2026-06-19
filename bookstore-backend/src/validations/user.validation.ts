import Joi from 'joi';

export const userValidation = {
  createUser: Joi.object({
    name: Joi.string().required().min(2).max(100),
    email: Joi.string().required().email(),
    password: Joi.string().required().min(6),
    role: Joi.string().valid('ADMIN', 'STAFF').default('STAFF'),
  }),

  updateUser: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    email: Joi.string().email().optional(),
    password: Joi.string().min(6).optional(),
    role: Joi.string().valid('ADMIN', 'STAFF').optional(),
  }),
};