import Joi from 'joi'

// Validation schema for creating a review
export const createReviewSchema = Joi.object({
  bookId: Joi.string().uuid().required().messages({
    'string.guid': 'Book ID must be a valid UUID',
    'any.required': 'Book ID is required',
  }),
  rating: Joi.number().integer().min(1).max(5).required().messages({
    'number.base': 'Rating must be a number',
    'number.integer': 'Rating must be an integer',
    'number.min': 'Rating must be at least 1',
    'number.max': 'Rating must be at most 5',
    'any.required': 'Rating is required',
  }),
  title: Joi.string().min(1).max(200).required().messages({
    'string.base': 'Title must be a string',
    'string.min': 'Title must be at least 1 character long',
    'string.max': 'Title must be at most 200 characters long',
    'any.required': 'Title is required',
  }),
  content: Joi.string().min(10).max(5000).required().messages({
    'string.base': 'Content must be a string',
    'string.min': 'Content must be at least 10 characters long',
    'string.max': 'Content must be at most 5000 characters long',
    'any.required': 'Content is required',
  }),
  spoilerWarning: Joi.boolean().optional().messages({
    'boolean.base': 'Spoiler warning must be a boolean',
  }),
})

// Validation schema for updating a review
export const updateReviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).optional().messages({
    'number.base': 'Rating must be a number',
    'number.integer': 'Rating must be an integer',
    'number.min': 'Rating must be at least 1',
    'number.max': 'Rating must be at most 5',
  }),
  title: Joi.string().min(1).max(200).optional().messages({
    'string.base': 'Title must be a string',
    'string.min': 'Title must be at least 1 character long',
    'string.max': 'Title must be at most 200 characters long',
  }),
  content: Joi.string().min(10).max(5000).optional().messages({
    'string.base': 'Content must be a string',
    'string.min': 'Content must be at least 10 characters long',
    'string.max': 'Content must be at most 5000 characters long',
  }),
  spoilerWarning: Joi.boolean().optional().messages({
    'boolean.base': 'Spoiler warning must be a boolean',
  }),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
})

// Validation schema for review query parameters
export const reviewQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    'number.base': 'Page must be a number',
    'number.integer': 'Page must be an integer',
    'number.min': 'Page must be at least 1',
  }),
  limit: Joi.number().integer().min(1).max(100).default(10).messages({
    'number.base': 'Limit must be a number',
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit must be at most 100',
  }),
  sortBy: Joi.string().valid('createdAt', 'rating', 'likesCount').default('createdAt').messages({
    'any.only': 'Sort by must be one of: createdAt, rating, likesCount',
  }),
  sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC').messages({
    'any.only': 'Sort order must be either ASC or DESC',
  }),
  bookId: Joi.string().uuid().optional().messages({
    'string.guid': 'Book ID must be a valid UUID',
  }),
  userId: Joi.string().uuid().optional().messages({
    'string.guid': 'User ID must be a valid UUID',
  }),
  rating: Joi.number().integer().min(1).max(5).optional().messages({
    'number.base': 'Rating must be a number',
    'number.integer': 'Rating must be an integer',
    'number.min': 'Rating must be at least 1',
    'number.max': 'Rating must be at most 5',
  }),
  minRating: Joi.number().integer().min(1).max(5).optional().messages({
    'number.base': 'Minimum rating must be a number',
    'number.integer': 'Minimum rating must be an integer',
    'number.min': 'Minimum rating must be at least 1',
    'number.max': 'Minimum rating must be at most 5',
  }),
  maxRating: Joi.number().integer().min(1).max(5).optional().messages({
    'number.base': 'Maximum rating must be a number',
    'number.integer': 'Maximum rating must be an integer',
    'number.min': 'Maximum rating must be at least 1',
    'number.max': 'Maximum rating must be at most 5',
  }),
  spoilerWarning: Joi.alternatives().try(
    Joi.boolean(),
    Joi.string().valid('true', 'false').custom((value) => value === 'true')
  ).optional().messages({
    'alternatives.match': 'Spoiler warning must be a boolean or "true"/"false" string',
  }),
})

// Validation schema for search query
export const searchReviewsSchema = Joi.object({
  q: Joi.string().min(1).max(100).required().messages({
    'string.base': 'Search query must be a string',
    'string.min': 'Search query must be at least 1 character long',
    'string.max': 'Search query must be at most 100 characters long',
    'any.required': 'Search query is required',
  }),
  page: Joi.number().integer().min(1).default(1).messages({
    'number.base': 'Page must be a number',
    'number.integer': 'Page must be an integer',
    'number.min': 'Page must be at least 1',
  }),
  limit: Joi.number().integer().min(1).max(100).default(10).messages({
    'number.base': 'Limit must be a number',
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit must be at most 100',
  }),
  sortBy: Joi.string().valid('createdAt', 'rating', 'likesCount').default('createdAt').messages({
    'any.only': 'Sort by must be one of: createdAt, rating, likesCount',
  }),
  sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC').messages({
    'any.only': 'Sort order must be either ASC or DESC',
  }),
})

// Validation schema for moderation flag
export const flagReviewSchema = Joi.object({
  reason: Joi.string().min(1).max(500).required().messages({
    'string.base': 'Reason must be a string',
    'string.min': 'Reason must be at least 1 character long',
    'string.max': 'Reason must be at most 500 characters long',
    'any.required': 'Reason is required',
  }),
})

// Custom validation for rating range
export const validateRatingRange = (minRating?: number, maxRating?: number): boolean => {
  if (minRating && maxRating) {
    return minRating <= maxRating
  }
  return true
}

// Validation middleware function
export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    })

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }))

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: errors,
        },
        timestamp: new Date().toISOString(),
        path: req.path,
      })
    }

    req.body = value
    next()
  }
}

// Query validation middleware function
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    })

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }))

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Query validation failed',
          details: errors,
        },
        timestamp: new Date().toISOString(),
        path: req.path,
      })
    }

    req.query = value
    next()
  }
}