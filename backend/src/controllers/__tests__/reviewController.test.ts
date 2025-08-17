import { Request, Response } from 'express'
import { ReviewController } from '../reviewController'
import { ReviewService } from '../../services/reviewService'

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

const MockedReviewService = ReviewService as jest.Mocked<typeof ReviewService>

describe('ReviewController', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let mockJson: jest.Mock
  let mockStatus: jest.Mock
  let mockSend: jest.Mock

  beforeEach(() => {
    mockJson = jest.fn()
    mockStatus = jest.fn().mockReturnThis()
    mockSend = jest.fn()

    mockResponse = {
      json: mockJson,
      status: mockStatus,
      send: mockSend,
    }

    mockRequest = {
      body: {},
      params: {},
      query: {},
      path: '/api/reviews',
    }

    jest.clearAllMocks()
  })

  describe('createReview', () => {
    const mockUser = { id: 'user-123', email: 'test@example.com', username: 'testuser' }
    const mockReviewData = {
      bookId: 'book-123',
      rating: 5,
      title: 'Great book!',
      content: 'This is an amazing book with great characters.',
    }
    const mockCreatedReview = {
      id: 'review-123',
      ...mockReviewData,
      userId: mockUser.id,
      likesCount: 0,
      commentsCount: 0,
    }

    it('should create a review successfully', async () => {
      mockRequest.user = mockUser
      mockRequest.body = mockReviewData
      MockedReviewService.createReview.mockResolvedValue(mockCreatedReview as any)

      await ReviewController.createReview(mockRequest as any, mockResponse as Response)

      expect(MockedReviewService.createReview).toHaveBeenCalledWith({
        ...mockReviewData,
        userId: mockUser.id,
      })
      expect(mockStatus).toHaveBeenCalledWith(201)
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockCreatedReview,
        timestamp: expect.any(String),
      })
    })

    it('should return 401 if user not authenticated', async () => {
      mockRequest.user = undefined
      mockRequest.body = mockReviewData

      await ReviewController.createReview(mockRequest as any, mockResponse as Response)

      expect(MockedReviewService.createReview).not.toHaveBeenCalled()
      expect(mockStatus).toHaveBeenCalledWith(401)
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        timestamp: expect.any(String),
        path: '/api/reviews',
      })
    })

    it('should return 409 if user already has a review for the book', async () => {
      mockRequest.user = mockUser
      mockRequest.body = mockReviewData
      MockedReviewService.createReview.mockRejectedValue(new Error('User already has a review for this book'))

      await ReviewController.createReview(mockRequest as any, mockResponse as Response)

      expect(mockStatus).toHaveBeenCalledWith(409)
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'REVIEW_ALREADY_EXISTS',
          message: 'User already has a review for this book',
        },
        timestamp: expect.any(String),
        path: '/api/reviews',
      })
    })

    it('should return 400 for validation errors', async () => {
      mockRequest.user = mockUser
      mockRequest.body = mockReviewData
      MockedReviewService.createReview.mockRejectedValue(new Error('Validation failed: Rating is required'))

      await ReviewController.createReview(mockRequest as any, mockResponse as Response)

      expect(mockStatus).toHaveBeenCalledWith(400)
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed: Rating is required',
        },
        timestamp: expect.any(String),
        path: '/api/reviews',
      })
    })

    it('should return 404 if book not found', async () => {
      mockRequest.user = mockUser
      mockRequest.body = mockReviewData
      MockedReviewService.createReview.mockRejectedValue(new Error('Book not found'))

      await ReviewController.createReview(mockRequest as any, mockResponse as Response)

      expect(mockStatus).toHaveBeenCalledWith(404)
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Book not found',
        },
        timestamp: expect.any(String),
        path: '/api/reviews',
      })
    })
  })

  describe('updateReview', () => {
    const mockUser = { id: 'user-123', email: 'test@example.com', username: 'testuser' }
    const mockUpdateData = {
      rating: 4,
      title: 'Updated title',
      content: 'Updated content',
    }
    const mockUpdatedReview = {
      id: 'review-123',
      userId: mockUser.id,
      ...mockUpdateData,
    }

    it('should update a review successfully', async () => {
      mockRequest.user = mockUser
      mockRequest.params = { id: 'review-123' }
      mockRequest.body = mockUpdateData
      MockedReviewService.updateReview.mockResolvedValue(mockUpdatedReview as any)

      await ReviewController.updateReview(mockRequest as any, mockResponse as Response)

      expect(MockedReviewService.updateReview).toHaveBeenCalledWith('review-123', mockUser.id, mockUpdateData)
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedReview,
        timestamp: expect.any(String),
      })
    })

    it('should return 401 if user not authenticated', async () => {
      mockRequest.user = undefined
      mockRequest.params = { id: 'review-123' }
      mockRequest.body = mockUpdateData

      await ReviewController.updateReview(mockRequest as any, mockResponse as Response)

      expect(MockedReviewService.updateReview).not.toHaveBeenCalled()
      expect(mockStatus).toHaveBeenCalledWith(401)
    })

    it('should return 403 if user not authorized', async () => {
      mockRequest.user = mockUser
      mockRequest.params = { id: 'review-123' }
      mockRequest.body = mockUpdateData
      MockedReviewService.updateReview.mockRejectedValue(new Error('User not authorized to edit this review'))

      await ReviewController.updateReview(mockRequest as any, mockResponse as Response)

      expect(mockStatus).toHaveBeenCalledWith(403)
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'User not authorized to edit this review',
        },
        timestamp: expect.any(String),
        path: '/api/reviews',
      })
    })

    it('should return 404 if review not found', async () => {
      mockRequest.user = mockUser
      mockRequest.params = { id: 'review-123' }
      mockRequest.body = mockUpdateData
      MockedReviewService.updateReview.mockRejectedValue(new Error('Review not found'))

      await ReviewController.updateReview(mockRequest as any, mockResponse as Response)

      expect(mockStatus).toHaveBeenCalledWith(404)
    })
  })

  describe('deleteReview', () => {
    const mockUser = { id: 'user-123', email: 'test@example.com', username: 'testuser' }

    it('should delete a review successfully', async () => {
      mockRequest.user = mockUser
      mockRequest.params = { id: 'review-123' }
      MockedReviewService.deleteReview.mockResolvedValue()

      await ReviewController.deleteReview(mockRequest as any, mockResponse as Response)

      expect(MockedReviewService.deleteReview).toHaveBeenCalledWith('review-123', mockUser.id)
      expect(mockStatus).toHaveBeenCalledWith(204)
      expect(mockSend).toHaveBeenCalled()
    })

    it('should return 401 if user not authenticated', async () => {
      mockRequest.user = undefined
      mockRequest.params = { id: 'review-123' }

      await ReviewController.deleteReview(mockRequest as any, mockResponse as Response)

      expect(MockedReviewService.deleteReview).not.toHaveBeenCalled()
      expect(mockStatus).toHaveBeenCalledWith(401)
    })

    it('should return 403 if user not authorized', async () => {
      mockRequest.user = mockUser
      mockRequest.params = { id: 'review-123' }
      MockedReviewService.deleteReview.mockRejectedValue(new Error('User not authorized to delete this review'))

      await ReviewController.deleteReview(mockRequest as any, mockResponse as Response)

      expect(mockStatus).toHaveBeenCalledWith(403)
    })
  })

  describe('getReview', () => {
    const mockReview = {
      id: 'review-123',
      userId: 'user-123',
      bookId: 'book-123',
      rating: 5,
      title: 'Great book!',
      content: 'Amazing story',
    }

    it('should get a review successfully', async () => {
      mockRequest.params = { id: 'review-123' }
      MockedReviewService.getReviewById.mockResolvedValue(mockReview as any)

      await ReviewController.getReview(mockRequest as Request, mockResponse as Response)

      expect(MockedReviewService.getReviewById).toHaveBeenCalledWith('review-123')
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockReview,
        timestamp: expect.any(String),
      })
    })

    it('should return 404 if review not found', async () => {
      mockRequest.params = { id: 'review-123' }
      MockedReviewService.getReviewById.mockRejectedValue(new Error('Review not found'))

      await ReviewController.getReview(mockRequest as Request, mockResponse as Response)

      expect(mockStatus).toHaveBeenCalledWith(404)
    })
  })

  describe('getReviews', () => {
    const mockReviewsResult = {
      reviews: [
        {
          id: 'review-1',
          userId: 'user-1',
          bookId: 'book-1',
          rating: 5,
          title: 'Great!',
          content: 'Amazing book',
          spoilerWarning: false,
          likesCount: 0,
          commentsCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'review-2',
          userId: 'user-2',
          bookId: 'book-2',
          rating: 4,
          title: 'Good',
          content: 'Nice story',
          spoilerWarning: false,
          likesCount: 0,
          commentsCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as any[],
      total: 2,
      page: 1,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    }

    it('should get reviews with default pagination', async () => {
      mockRequest.query = {}
      MockedReviewService.getReviews.mockResolvedValue(mockReviewsResult)

      await ReviewController.getReviews(mockRequest as Request, mockResponse as Response)

      expect(MockedReviewService.getReviews).toHaveBeenCalledWith(
        {
          bookId: undefined,
          userId: undefined,
          rating: undefined,
          minRating: undefined,
          maxRating: undefined,
          spoilerWarning: undefined,
        },
        {
          page: 1,
          limit: 10,
          sortBy: 'createdAt',
          sortOrder: 'DESC',
        }
      )
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockReviewsResult,
        timestamp: expect.any(String),
      })
    })

    it('should get reviews with custom filters and pagination', async () => {
      mockRequest.query = {
        page: '2',
        limit: '5',
        sortBy: 'rating',
        sortOrder: 'ASC',
        bookId: 'book-123',
        minRating: '3',
        maxRating: '5',
        spoilerWarning: 'true',
      }
      MockedReviewService.getReviews.mockResolvedValue(mockReviewsResult)

      await ReviewController.getReviews(mockRequest as Request, mockResponse as Response)

      expect(MockedReviewService.getReviews).toHaveBeenCalledWith(
        {
          bookId: 'book-123',
          userId: undefined,
          rating: undefined,
          minRating: 3,
          maxRating: 5,
          spoilerWarning: true,
        },
        {
          page: 2,
          limit: 5,
          sortBy: 'rating',
          sortOrder: 'ASC',
        }
      )
    })
  })

  describe('getBookReviews', () => {
    const mockReviewsResult = {
      reviews: [{
        id: 'review-1',
        userId: 'user-1',
        bookId: 'book-123',
        rating: 5,
        title: 'Great!',
        content: 'Amazing book',
        spoilerWarning: false,
        likesCount: 0,
        commentsCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }] as any[],
      total: 1,
      page: 1,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    }

    it('should get reviews for a specific book', async () => {
      mockRequest.params = { bookId: 'book-123' }
      mockRequest.query = { page: '1', limit: '10' }
      MockedReviewService.getReviewsByBook.mockResolvedValue(mockReviewsResult)

      await ReviewController.getBookReviews(mockRequest as Request, mockResponse as Response)

      expect(MockedReviewService.getReviewsByBook).toHaveBeenCalledWith('book-123', {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      })
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockReviewsResult,
        timestamp: expect.any(String),
      })
    })
  })

  describe('getUserReviews', () => {
    const mockReviewsResult = {
      reviews: [{
        id: 'review-1',
        userId: 'user-123',
        bookId: 'book-1',
        rating: 5,
        title: 'Great!',
        content: 'Amazing book',
        spoilerWarning: false,
        likesCount: 0,
        commentsCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }] as any[],
      total: 1,
      page: 1,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    }

    it('should get reviews for a specific user', async () => {
      mockRequest.params = { userId: 'user-123' }
      mockRequest.query = { page: '1', limit: '10' }
      MockedReviewService.getReviewsByUser.mockResolvedValue(mockReviewsResult)

      await ReviewController.getUserReviews(mockRequest as Request, mockResponse as Response)

      expect(MockedReviewService.getReviewsByUser).toHaveBeenCalledWith('user-123', {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      })
    })
  })

  describe('searchReviews', () => {
    const mockSearchResult = {
      reviews: [{
        id: 'review-1',
        userId: 'user-1',
        bookId: 'book-1',
        rating: 5,
        title: 'Amazing book',
        content: 'This book is truly amazing',
        spoilerWarning: false,
        likesCount: 0,
        commentsCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }] as any[],
      total: 1,
      page: 1,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    }

    it('should search reviews successfully', async () => {
      mockRequest.query = { q: 'amazing', page: '1', limit: '10' }
      MockedReviewService.searchReviews.mockResolvedValue(mockSearchResult)

      await ReviewController.searchReviews(mockRequest as Request, mockResponse as Response)

      expect(MockedReviewService.searchReviews).toHaveBeenCalledWith('amazing', {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      })
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockSearchResult,
        timestamp: expect.any(String),
      })
    })

    it('should return 400 if search query is missing', async () => {
      mockRequest.query = {}

      await ReviewController.searchReviews(mockRequest as Request, mockResponse as Response)

      expect(MockedReviewService.searchReviews).not.toHaveBeenCalled()
      expect(mockStatus).toHaveBeenCalledWith(400)
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Search query is required',
        },
        timestamp: expect.any(String),
        path: '/api/reviews',
      })
    })
  })

  describe('flagReview', () => {
    const mockUser = { id: 'user-123', email: 'test@example.com', username: 'testuser' }

    it('should flag a review successfully', async () => {
      mockRequest.user = mockUser
      mockRequest.params = { id: 'review-123' }
      mockRequest.body = { reason: 'Inappropriate content' }
      MockedReviewService.flagReviewForModeration.mockResolvedValue()

      await ReviewController.flagReview(mockRequest as any, mockResponse as Response)

      expect(MockedReviewService.flagReviewForModeration).toHaveBeenCalledWith('review-123', 'Inappropriate content')
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: { message: 'Review flagged for moderation' },
        timestamp: expect.any(String),
      })
    })

    it('should return 401 if user not authenticated', async () => {
      mockRequest.user = undefined
      mockRequest.params = { id: 'review-123' }
      mockRequest.body = { reason: 'Inappropriate content' }

      await ReviewController.flagReview(mockRequest as any, mockResponse as Response)

      expect(MockedReviewService.flagReviewForModeration).not.toHaveBeenCalled()
      expect(mockStatus).toHaveBeenCalledWith(401)
    })
  })

  describe('getUserReviewStats', () => {
    const mockStats = {
      totalReviews: 5,
      averageRating: 4.2,
      ratingDistribution: { 1: 0, 2: 0, 3: 1, 4: 2, 5: 2 },
    }

    it('should get user review statistics', async () => {
      mockRequest.params = { userId: 'user-123' }
      MockedReviewService.getUserReviewStats.mockResolvedValue(mockStats)

      await ReviewController.getUserReviewStats(mockRequest as Request, mockResponse as Response)

      expect(MockedReviewService.getUserReviewStats).toHaveBeenCalledWith('user-123')
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockStats,
        timestamp: expect.any(String),
      })
    })
  })
})