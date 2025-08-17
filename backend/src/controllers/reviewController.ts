import { Request, Response } from 'express'
import { ReviewService } from '../services/reviewService'
import { ApiResponse } from '../types'

interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
    username: string
  }
}

export class ReviewController {
  /**
   * Create a new review
   * POST /api/reviews
   */
  static async createReview(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user
      if (!user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
          timestamp: new Date().toISOString(),
          path: req.path,
        } as ApiResponse)
        return
      }

      const reviewData = {
        ...req.body,
        userId: user.id,
      }

      const review = await ReviewService.createReview(reviewData)

      res.status(201).json({
        success: true,
        data: review,
        timestamp: new Date().toISOString(),
      } as ApiResponse)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      let statusCode = 500
      let errorCode = 'INTERNAL_SERVER_ERROR'

      if (errorMessage.includes('already has a review')) {
        statusCode = 409
        errorCode = 'REVIEW_ALREADY_EXISTS'
      } else if (errorMessage.includes('Validation failed')) {
        statusCode = 400
        errorCode = 'VALIDATION_ERROR'
      } else if (errorMessage.includes('not found')) {
        statusCode = 404
        errorCode = 'NOT_FOUND'
      }

      res.status(statusCode).json({
        success: false,
        error: {
          code: errorCode,
          message: errorMessage,
        },
        timestamp: new Date().toISOString(),
        path: req.path,
      } as ApiResponse)
    }
  }

  /**
   * Update an existing review
   * PUT /api/reviews/:id
   */
  static async updateReview(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user
      if (!user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
          timestamp: new Date().toISOString(),
          path: req.path,
        } as ApiResponse)
        return
      }

      const { id } = req.params
      const review = await ReviewService.updateReview(id, user.id, req.body)

      res.json({
        success: true,
        data: review,
        timestamp: new Date().toISOString(),
      } as ApiResponse)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      let statusCode = 500
      let errorCode = 'INTERNAL_SERVER_ERROR'

      if (errorMessage.includes('not authorized')) {
        statusCode = 403
        errorCode = 'FORBIDDEN'
      } else if (errorMessage.includes('not found')) {
        statusCode = 404
        errorCode = 'NOT_FOUND'
      } else if (errorMessage.includes('Validation failed')) {
        statusCode = 400
        errorCode = 'VALIDATION_ERROR'
      }

      res.status(statusCode).json({
        success: false,
        error: {
          code: errorCode,
          message: errorMessage,
        },
        timestamp: new Date().toISOString(),
        path: req.path,
      } as ApiResponse)
    }
  }

  /**
   * Delete a review
   * DELETE /api/reviews/:id
   */
  static async deleteReview(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user
      if (!user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
          timestamp: new Date().toISOString(),
          path: req.path,
        } as ApiResponse)
        return
      }

      const { id } = req.params
      await ReviewService.deleteReview(id, user.id)

      res.status(204).send()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      let statusCode = 500
      let errorCode = 'INTERNAL_SERVER_ERROR'

      if (errorMessage.includes('not authorized')) {
        statusCode = 403
        errorCode = 'FORBIDDEN'
      } else if (errorMessage.includes('not found')) {
        statusCode = 404
        errorCode = 'NOT_FOUND'
      }

      res.status(statusCode).json({
        success: false,
        error: {
          code: errorCode,
          message: errorMessage,
        },
        timestamp: new Date().toISOString(),
        path: req.path,
      } as ApiResponse)
    }
  }

  /**
   * Get a review by ID
   * GET /api/reviews/:id
   */
  static async getReview(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const review = await ReviewService.getReviewById(id)

      res.json({
        success: true,
        data: review,
        timestamp: new Date().toISOString(),
      } as ApiResponse)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      let statusCode = 500
      let errorCode = 'INTERNAL_SERVER_ERROR'

      if (errorMessage.includes('not found')) {
        statusCode = 404
        errorCode = 'NOT_FOUND'
      }

      res.status(statusCode).json({
        success: false,
        error: {
          code: errorCode,
          message: errorMessage,
        },
        timestamp: new Date().toISOString(),
        path: req.path,
      } as ApiResponse)
    }
  }

  /**
   * Get reviews with pagination and filtering
   * GET /api/reviews
   */
  static async getReviews(req: Request, res: Response): Promise<void> {
    try {
      const {
        page,
        limit,
        sortBy,
        sortOrder,
        bookId,
        userId,
        rating,
        minRating,
        maxRating,
        spoilerWarning,
      } = req.query as any

      const filters = {
        bookId,
        userId,
        rating: rating ? parseInt(rating) : undefined,
        minRating: minRating ? parseInt(minRating) : undefined,
        maxRating: maxRating ? parseInt(maxRating) : undefined,
        spoilerWarning: spoilerWarning !== undefined ? (typeof spoilerWarning === 'boolean' ? spoilerWarning : spoilerWarning === 'true') : undefined,
      }

      const pagination = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        sortBy: sortBy || 'createdAt',
        sortOrder: sortOrder || 'DESC',
      }

      const result = await ReviewService.getReviews(filters, pagination)

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      } as ApiResponse)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: errorMessage,
        },
        timestamp: new Date().toISOString(),
        path: req.path,
      } as ApiResponse)
    }
  }

  /**
   * Get reviews for a specific book
   * GET /api/books/:bookId/reviews
   */
  static async getBookReviews(req: Request, res: Response): Promise<void> {
    try {
      const { bookId } = req.params
      const {
        page,
        limit,
        sortBy,
        sortOrder,
      } = req.query as any

      const pagination = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        sortBy: sortBy || 'createdAt',
        sortOrder: sortOrder || 'DESC',
      }

      const result = await ReviewService.getReviewsByBook(bookId, pagination)

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      } as ApiResponse)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: errorMessage,
        },
        timestamp: new Date().toISOString(),
        path: req.path,
      } as ApiResponse)
    }
  }

  /**
   * Get reviews by a specific user
   * GET /api/users/:userId/reviews
   */
  static async getUserReviews(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params
      const {
        page,
        limit,
        sortBy,
        sortOrder,
      } = req.query as any

      const pagination = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        sortBy: sortBy || 'createdAt',
        sortOrder: sortOrder || 'DESC',
      }

      const result = await ReviewService.getReviewsByUser(userId, pagination)

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      } as ApiResponse)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: errorMessage,
        },
        timestamp: new Date().toISOString(),
        path: req.path,
      } as ApiResponse)
    }
  }

  /**
   * Search reviews
   * GET /api/reviews/search
   */
  static async searchReviews(req: Request, res: Response): Promise<void> {
    try {
      const {
        q,
        page,
        limit,
        sortBy,
        sortOrder,
      } = req.query as any

      if (!q) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Search query is required',
          },
          timestamp: new Date().toISOString(),
          path: req.path,
        } as ApiResponse)
        return
      }

      const pagination = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        sortBy: sortBy || 'createdAt',
        sortOrder: sortOrder || 'DESC',
      }

      const result = await ReviewService.searchReviews(q, pagination)

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      } as ApiResponse)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: errorMessage,
        },
        timestamp: new Date().toISOString(),
        path: req.path,
      } as ApiResponse)
    }
  }

  /**
   * Flag a review for moderation
   * POST /api/reviews/:id/flag
   */
  static async flagReview(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user
      if (!user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
          timestamp: new Date().toISOString(),
          path: req.path,
        } as ApiResponse)
        return
      }

      const { id } = req.params
      const { reason } = req.body

      await ReviewService.flagReviewForModeration(id, reason)

      res.json({
        success: true,
        data: { message: 'Review flagged for moderation' },
        timestamp: new Date().toISOString(),
      } as ApiResponse)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: errorMessage,
        },
        timestamp: new Date().toISOString(),
        path: req.path,
      } as ApiResponse)
    }
  }

  /**
   * Get user review statistics
   * GET /api/users/:userId/reviews/stats
   */
  static async getUserReviewStats(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params
      const stats = await ReviewService.getUserReviewStats(userId)

      res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      } as ApiResponse)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: errorMessage,
        },
        timestamp: new Date().toISOString(),
        path: req.path,
      } as ApiResponse)
    }
  }
}