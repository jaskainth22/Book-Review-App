import request from 'supertest'
import express from 'express'
import reviewRoutes from '../reviewRoutes'
import { ReviewService } from '../../services/reviewService'
import { authenticateToken } from '../../middleware/auth'

// Mock the ReviewService
jest.mock('../../services/reviewService', () => ({
  ReviewService: {
    createReview: jest.fn(),
    updateReview: jest.fn(),
    deleteReview: jest.fn(),
    getReviewById: jest.fn(),
    getReviews: jest.fn(),
    getReviewsByBook: jest.fn(),
    getReviewsByUser: jest.fn(),
    searchReviews: jest.fn(),
    flagReviewForModeration: jest.fn(),
    getUserReviewStats: jest.fn(),
  },
}))

// Mock the auth middleware
jest.mock('../../middleware/auth', () => ({
  authenticateToken: jest.fn(),
}))

const MockedReviewService = ReviewService as jest.Mocked<typeof ReviewService>
const mockedAuthenticateToken = authenticateToken as jest.MockedFunction<typeof authenticateToken>

const app = express()
app.use(express.json())
app.use('/api/reviews', reviewRoutes)

describe('Review Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock successful authentication by default
    mockedAuthenticateToken.mockImplementation(async (req: any, res: any, next: any) => {
      req.user = { id: 'user-123', email: 'test@example.com', username: 'testuser' }
      next()
    })
  })

  describe('POST /api/reviews', () => {
    const validReviewData = {
      bookId: '550e8400-e29b-41d4-a716-446655440000',
      rating: 5,
      title: 'Great book!',
      content: 'This is an amazing book with great characters and plot development.',
    }

    const mockCreatedReview = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      ...validReviewData,
      userId: '550e8400-e29b-41d4-a716-446655440002',
      likesCount: 0,
      commentsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    it('should create a review successfully', async () => {
      MockedReviewService.createReview.mockResolvedValue(mockCreatedReview as any)

      const response = await request(app)
        .post('/api/reviews')
        .send(validReviewData)

      expect(response.status).toBe(201)

      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          id: '550e8400-e29b-41d4-a716-446655440001',
          bookId: '550e8400-e29b-41d4-a716-446655440000',
          rating: 5,
          title: 'Great book!',
        }),
        timestamp: expect.any(String),
      })

      expect(MockedReviewService.createReview).toHaveBeenCalledWith({
        ...validReviewData,
        userId: 'user-123',
      })
    })

    it('should return 400 for invalid rating', async () => {
      const invalidData = { ...validReviewData, rating: 6 }

      const response = await request(app)
        .post('/api/reviews')
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
      expect(response.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'rating',
            message: expect.stringContaining('Rating must be at most 5'),
          }),
        ])
      )
    })

    it('should return 400 for missing required fields', async () => {
      const incompleteData = { rating: 5 }

      const response = await request(app)
        .post('/api/reviews')
        .send(incompleteData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
      expect(response.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'bookId' }),
          expect.objectContaining({ field: 'title' }),
          expect.objectContaining({ field: 'content' }),
        ])
      )
    })

    it('should return 400 for content too short', async () => {
      const invalidData = { ...validReviewData, content: 'Too short' }

      const response = await request(app)
        .post('/api/reviews')
        .send(invalidData)
        .expect(400)

      expect(response.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'content',
            message: expect.stringContaining('at least 10 characters'),
          }),
        ])
      )
    })

    it('should return 400 for title too long', async () => {
      const longTitle = 'a'.repeat(201)
      const invalidData = { ...validReviewData, title: longTitle }

      const response = await request(app)
        .post('/api/reviews')
        .send(invalidData)
        .expect(400)

      expect(response.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'title',
            message: expect.stringContaining('at most 200 characters'),
          }),
        ])
      )
    })

    it('should return 401 when not authenticated', async () => {
      mockedAuthenticateToken.mockImplementation(async (req: any, res: any, next: any) => {
        res.status(401).json({ error: 'Unauthorized' })
      })

      await request(app)
        .post('/api/reviews')
        .send(validReviewData)
        .expect(401)
    })
  })

  describe('GET /api/reviews', () => {
    const mockReviewsResult = {
      reviews: [
        {
          id: 'review-1',
          userId: 'user-1',
          bookId: 'book-1',
          rating: 5,
          title: 'Great book!',
          content: 'Amazing story',
          spoilerWarning: false,
          likesCount: 0,
          commentsCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          user: { username: 'user1' },
          book: { title: 'Test Book' },
        },
        {
          id: 'review-2',
          userId: 'user-2',
          bookId: 'book-2',
          rating: 4,
          title: 'Good read',
          content: 'Nice book',
          spoilerWarning: false,
          likesCount: 0,
          commentsCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          user: { username: 'user2' },
          book: { title: 'Another Book' },
        },
      ] as any[],
      total: 2,
      page: 1,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    }

    it('should get reviews with default pagination', async () => {
      MockedReviewService.getReviews.mockResolvedValue(mockReviewsResult)

      const response = await request(app)
        .get('/api/reviews')
        .expect(200)

      expect(response.body).toEqual({
        success: true,
        data: mockReviewsResult,
        timestamp: expect.any(String),
      })

      expect(MockedReviewService.getReviews).toHaveBeenCalledWith(
        expect.objectContaining({
          bookId: undefined,
          userId: undefined,
          rating: undefined,
        }),
        expect.objectContaining({
          page: 1,
          limit: 10,
          sortBy: 'createdAt',
          sortOrder: 'DESC',
        })
      )
    })

    it('should get reviews with custom filters', async () => {
      MockedReviewService.getReviews.mockResolvedValue(mockReviewsResult)

      const response = await request(app)
        .get('/api/reviews')
        .query({
          page: 2,
          limit: 5,
          sortBy: 'rating',
          sortOrder: 'ASC',
          bookId: '550e8400-e29b-41d4-a716-446655440000',
          minRating: 3,
          maxRating: 5,
          spoilerWarning: true,
        })
        .expect(200)

      expect(MockedReviewService.getReviews).toHaveBeenCalledWith(
        expect.objectContaining({
          bookId: '550e8400-e29b-41d4-a716-446655440000',
          minRating: 3,
          maxRating: 5,
          spoilerWarning: true,
        }),
        expect.objectContaining({
          page: 2,
          limit: 5,
          sortBy: 'rating',
          sortOrder: 'ASC',
        })
      )
    })

    it('should return 400 for invalid query parameters', async () => {
      const response = await request(app)
        .get('/api/reviews')
        .query({
          page: 0, // Invalid: must be at least 1
          limit: 101, // Invalid: must be at most 100
          sortBy: 'invalid', // Invalid: not in allowed values
          rating: 6, // Invalid: must be between 1-5
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('GET /api/reviews/search', () => {
    const mockSearchResult = {
      reviews: [
        {
          id: 'review-1',
          userId: 'user-1',
          bookId: 'book-1',
          rating: 5,
          title: 'Amazing book',
          content: 'This book is truly amazing',
          spoilerWarning: false,
          likesCount: 0,
          commentsCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ] as any[],
      total: 1,
      page: 1,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    }

    it('should search reviews successfully', async () => {
      MockedReviewService.searchReviews.mockResolvedValue(mockSearchResult)

      const response = await request(app)
        .get('/api/reviews/search')
        .query({ q: 'amazing', page: 1, limit: 10 })
        .expect(200)

      expect(response.body).toEqual({
        success: true,
        data: mockSearchResult,
        timestamp: expect.any(String),
      })

      expect(MockedReviewService.searchReviews).toHaveBeenCalledWith('amazing', {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      })
    })

    it('should return 400 for missing search query', async () => {
      const response = await request(app)
        .get('/api/reviews/search')
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
      expect(response.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'q',
            message: expect.stringContaining('required'),
          }),
        ])
      )
    })

    it('should return 400 for search query too long', async () => {
      const longQuery = 'a'.repeat(101)

      const response = await request(app)
        .get('/api/reviews/search')
        .query({ q: longQuery })
        .expect(400)

      expect(response.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'q',
            message: expect.stringContaining('at most 100 characters'),
          }),
        ])
      )
    })
  })

  describe('GET /api/reviews/:id', () => {
    const mockReview = {
      id: 'review-123',
      userId: 'user-123',
      bookId: 'book-123',
      rating: 5,
      title: 'Great book!',
      content: 'Amazing story with great characters.',
      user: { username: 'testuser' },
      book: { title: 'Test Book' },
    }

    it('should get a review by ID successfully', async () => {
      MockedReviewService.getReviewById.mockResolvedValue(mockReview as any)

      const response = await request(app)
        .get('/api/reviews/review-123')
        .expect(200)

      expect(response.body).toEqual({
        success: true,
        data: mockReview,
        timestamp: expect.any(String),
      })

      expect(MockedReviewService.getReviewById).toHaveBeenCalledWith('review-123')
    })

    it('should return 404 for non-existent review', async () => {
      MockedReviewService.getReviewById.mockRejectedValue(new Error('Review not found'))

      const response = await request(app)
        .get('/api/reviews/non-existent')
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('NOT_FOUND')
    })
  })

  describe('PUT /api/reviews/:id', () => {
    const updateData = {
      rating: 4,
      title: 'Updated title',
      content: 'Updated content with more details about the book.',
    }

    const mockUpdatedReview = {
      id: 'review-123',
      userId: 'user-123',
      ...updateData,
    }

    it('should update a review successfully', async () => {
      MockedReviewService.updateReview.mockResolvedValue(mockUpdatedReview as any)

      const response = await request(app)
        .put('/api/reviews/review-123')
        .send(updateData)
        .expect(200)

      expect(response.body).toEqual({
        success: true,
        data: mockUpdatedReview,
        timestamp: expect.any(String),
      })

      expect(MockedReviewService.updateReview).toHaveBeenCalledWith('review-123', 'user-123', updateData)
    })

    it('should return 400 for invalid update data', async () => {
      const invalidData = { rating: 6 } // Invalid rating

      const response = await request(app)
        .put('/api/reviews/review-123')
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for empty update data', async () => {
      const response = await request(app)
        .put('/api/reviews/review-123')
        .send({})
        .expect(400)

      expect(response.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: expect.stringContaining('At least one field must be provided'),
          }),
        ])
      )
    })

    it('should return 401 when not authenticated', async () => {
      mockedAuthenticateToken.mockImplementation(async (req: any, res: any, next: any) => {
        res.status(401).json({ error: 'Unauthorized' })
      })

      await request(app)
        .put('/api/reviews/review-123')
        .send(updateData)
        .expect(401)
    })
  })

  describe('DELETE /api/reviews/:id', () => {
    it('should delete a review successfully', async () => {
      MockedReviewService.deleteReview.mockResolvedValue()

      const response = await request(app)
        .delete('/api/reviews/review-123')
        .expect(204)

      expect(response.body).toEqual({})
      expect(MockedReviewService.deleteReview).toHaveBeenCalledWith('review-123', 'user-123')
    })

    it('should return 401 when not authenticated', async () => {
      mockedAuthenticateToken.mockImplementation(async (req: any, res: any, next: any) => {
        res.status(401).json({ error: 'Unauthorized' })
      })

      await request(app)
        .delete('/api/reviews/review-123')
        .expect(401)
    })
  })

  describe('POST /api/reviews/:id/flag', () => {
    const flagData = { reason: 'Inappropriate content' }

    it('should flag a review successfully', async () => {
      MockedReviewService.flagReviewForModeration.mockResolvedValue()

      const response = await request(app)
        .post('/api/reviews/review-123/flag')
        .send(flagData)
        .expect(200)

      expect(response.body).toEqual({
        success: true,
        data: { message: 'Review flagged for moderation' },
        timestamp: expect.any(String),
      })

      expect(MockedReviewService.flagReviewForModeration).toHaveBeenCalledWith('review-123', 'Inappropriate content')
    })

    it('should return 400 for missing reason', async () => {
      const response = await request(app)
        .post('/api/reviews/review-123/flag')
        .send({})
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
      expect(response.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'reason',
            message: expect.stringContaining('required'),
          }),
        ])
      )
    })

    it('should return 400 for reason too long', async () => {
      const longReason = 'a'.repeat(501)

      const response = await request(app)
        .post('/api/reviews/review-123/flag')
        .send({ reason: longReason })
        .expect(400)

      expect(response.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'reason',
            message: expect.stringContaining('at most 500 characters'),
          }),
        ])
      )
    })

    it('should return 401 when not authenticated', async () => {
      mockedAuthenticateToken.mockImplementation(async (req: any, res: any, next: any) => {
        res.status(401).json({ error: 'Unauthorized' })
      })

      await request(app)
        .post('/api/reviews/review-123/flag')
        .send(flagData)
        .expect(401)
    })
  })
})