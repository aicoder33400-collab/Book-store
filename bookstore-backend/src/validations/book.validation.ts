import Joi from 'joi';

export const bookValidation = {
  createBook: Joi.object({
    title: Joi.string().required().min(1).max(200),
    author: Joi.string().required().min(1).max(100),
    description: Joi.string().max(1000).allow('').optional(),
    totalCopies: Joi.number().integer().min(1).required(), // 🔥 Renommé
    totalQuantity: Joi.number().integer().min(1).optional(), // 🔥 Alias pour compatibilité
    genre: Joi.string().valid(
      'ROMAN', 'POESIE', 'THEATRE', 'HISTOIRE', 'SCIENCE_FICTION',
      'FANTASTIQUE', 'POLAR', 'AVENTURE', 'BIOGRAPHIE', 'ESSAI',
      'PHILOSOPHIE', 'JEUNESSE', 'BANDE_DESSINEE', 'ART', 'CUISINE',
      'VOYAGE', 'SPORT', 'SANTE', 'RELIGION', 'AUTRE'
    ).optional(),
    language: Joi.string().valid(
      'FRANCAIS', 'ANGLAIS', 'ARABE', 'ESPAGNOL', 'ALLEMAND',
      'ITALIEN', 'PORTUGAIS', 'RUSSE', 'CHINOIS', 'JAPONAIS', 'AUTRE'
    ).optional(),
    isForSale: Joi.boolean().default(false),
    isForRent: Joi.boolean().default(true),
  }),

  updateBook: Joi.object({
    title: Joi.string().min(1).max(200).optional(),
    author: Joi.string().min(1).max(100).optional(),
    description: Joi.string().max(1000).allow('').optional(),
    totalCopies: Joi.number().integer().min(1).optional(),
    totalQuantity: Joi.number().integer().min(1).optional(),
    genre: Joi.string().valid(
      'ROMAN', 'POESIE', 'THEATRE', 'HISTOIRE', 'SCIENCE_FICTION',
      'FANTASTIQUE', 'POLAR', 'AVENTURE', 'BIOGRAPHIE', 'ESSAI',
      'PHILOSOPHIE', 'JEUNESSE', 'BANDE_DESSINEE', 'ART', 'CUISINE',
      'VOYAGE', 'SPORT', 'SANTE', 'RELIGION', 'AUTRE'
    ).optional(),
    language: Joi.string().valid(
      'FRANCAIS', 'ANGLAIS', 'ARABE', 'ESPAGNOL', 'ALLEMAND',
      'ITALIEN', 'PORTUGAIS', 'RUSSE', 'CHINOIS', 'JAPONAIS', 'AUTRE'
    ).optional(),
    isForSale: Joi.boolean().optional(),
    isForRent: Joi.boolean().optional(),
  }),
};
