// Mock the database and models before importing
jest.mock('../../config/database', () => ({
  sequelize: {
    transaction: jest.fn(),
  },
}))

jest.mock('../../models/Review')
jest.mock('../../models/Comment')
jest.mock('../../models/User')
jest.mock('../../models/Book')

import { ReviewService } from '../reviewService'
import { Review } from '../../models/Review'
import { Comment } from '../../models/Comment'
import { User } from '../../models/User'
import { Book } from '../../models/Book'
import { sequelize } from '../../config/database'

const MockedReview = Review as jest.MockedClass<typeof Review>
const MockedComment = Comment as jest.MockedClass<typeof Comment>
const MockedUser = User as jest.MockedClass<typeof User>
const MockedBook = Book as jest.MockedClass<typeof Book>
const mockedSequelize = sequelize as jest.Mocked<typeof sequelize>

describe('ReviewService', () => {
  let mockTransaction: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockTransaction = {
      commit: jest.fn(),
      rollback: jest.fn(),
    }
    
    mockedSequelize.transaction = jest.fn().mockResolvedValue(mockTransaction)
  })

  describe('createReview', () => {
    const mockReviewData = {
      userId: 'user-123',
      bookId: 'book-123',
      rating: 5,
      title: 'Great book!',
      content: 'This is an amazing book with great characters and plot.',
      spoilerWarning: false,
    }

    const mockUser = {
      id: 'user-123',
      username: 'testuser',
      displayName: 'Test User',
      avatar: null,
    }

    const mockBook = {
      id: 'book-123',
      title: 'Test Book',
      authors: ['Test Author'],
      coverImage: 'test-cover.jpg',
      updateAverageRating: jest.fn(),
    }

    const mockReview = {
      id: 'review-123',
      ...mockReviewData,
      likesCount: 0,
      commentsCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    it('should create a review successfully', async () => {
      MockedReview.findOne = jest.fn().mockResolvedValue(null)
      MockedReview.validateReviewData = jest.fn().mockReturnValue({ isValid: true, errors: [] })
      MockedBook.findByPk = jest.fn().mockResolvedValue(mockBook)
      MockedUser.findByPk = jest.fn().mockResolvedValue(mockUser)
      MockedReview.create = jest.fn().mockResolvedValue(mockReview)
      
      // Mock the getReviewById method to return the created review with relations
      const getReviewByIdSpy = jest.spyOn(ReviewService, 'getReviewById').mockResolvedValue({
        ...mockReview,
        user: mockUser,
        book: mockBook,
      } as any)

      const result = await ReviewService.createReview(mockReviewData)

      expect(MockedReview.findOne).toHaveBeenCalledWith({
        where: {
          userId: mockReviewData.userId,
          bookId: mockReviewData.bookId,
        },
        transaction: mockTransaction,
      })
      expect(MockedReview.validateReviewData).toHaveBeenCalledWith({
        rating: mockReviewData.rating,
        title: mockReviewData.title,
        content: mockReviewData.content,
      })
      expect(MockedBook.findByPk).toHaveBeenCalledWith(mockReviewData.bookId, { transaction: mockTransaction })
      expect(MockedUser.findByPk).toHaveBeenCalledWith(mockReviewData.userId, { transaction: mockTransaction })
      expect(MockedReview.create).toHaveBeenCalledWith({
        userId: mockReviewData.userId,
        bookId: mockReviewData.bookId,
        rating: mockReviewData.rating,
        title: mockReviewData.title,
        content: mockReviewData.content,
        spoilerWarning: false,
      }, { transaction: mockTransaction })
      expect(mockTransaction.commit).toHaveBeenCalled()
      expect(getReviewByIdSpy).toHaveBeenCalledWith(mockReview.id)
      expect(result).toEqual({
        ...mockReview,
        user: mockUser,
        book: mockBook,
      })
      
      // Clean up the spy
      getReviewByIdSpy.mockRestore()
    })

    it('should throw error if user already has a review for the book', async () => {
      MockedReview.findOne = jest.fn().mockResolvedValue(mockReview)

      await expect(ReviewService.createReview(mockReviewData)).rejects.toThrow(
        'User already has a review for this book'
      )
      expect(mockTransaction.rollback).toHaveBeenCalled()
    })

    it('should throw error if validation fails', async () => {
      MockedReview.findOne = jest.fn().mockResolvedValue(null)
      MockedReview.validateReviewData = jest.fn().mockReturnValue({
        isValid: false,
        errors: ['Rating must be between 1 and 5'],
      })

      await expect(ReviewService.createReview(mockReviewData)).rejects.toThrow(
        'Validation failed: Rating must be between 1 and 5'
      )
      expect(mockTransaction.rollback).toHaveBeenCalled()
    })

    it('should throw error if book not found', async () => {
      MockedReview.findOne = jest.fn().mockResolvedValue(null)
      MockedReview.validateReviewData = jest.fn().mockReturnValue({ isValid: true, errors: [] })
      MockedBook.findByPk = jest.fn().mockResolvedValue(null)

      await expect(ReviewService.createReview(mockReviewData)).rejects.toThrow('Book not found')
      expect(mockTransaction.rollback).toHaveBeenCalled()
    })

    it('should throw error if user not found', async () => {
      MockedReview.findOne = jest.fn().mockResolvedValue(null)
      MockedReview.validateReviewData = jest.fn().mockReturnValue({ isValid: true, errors: [] })
      MockedBook.findByPk = jest.fn().mockResolvedValue(mockBook)
      MockedUser.findByPk = jest.fn().mockResolvedValue(null)

      await expect(ReviewService.createReview(mockReviewData)).rejects.toThrow('User not found')
      expect(mockTransaction.rollback).toHaveBeenCalled()
    })

    it('should auto-detect spoiler warning', async () => {
      const spoilerContent = 'This book has a great ending where the main character dies'
      const spoilerReviewData = {
        ...mockReviewData,
        content: spoilerContent,
        spoilerWarning: undefined,
      }

      MockedReview.findOne = jest.fn().mockResolvedValue(null)
      MockedReview.validateReviewData = jest.fn().mockReturnValue({ isValid: true, errors: [] })
      MockedBook.findByPk = jest.fn().mockResolvedValue(mockBook)
      MockedUser.findByPk = jest.fn().mockResolvedValue(mockUser)
      MockedReview.create = jest.fn().mockResolvedValue(mockReview)
      
      const getReviewByIdSpy = jest.spyOn(ReviewService, 'getReviewById').mockResolvedValue({
        ...mockReview,
        user: mockUser,
        book: mockBook,
      } as any)

      await ReviewService.createReview(spoilerReviewData)

      expect(MockedReview.create).toHaveBeenCalledWith({
        userId: spoilerReviewData.userId,
        bookId: spoilerReviewData.bookId,
        rating: spoilerReviewData.rating,
        title: spoilerReviewData.title,
        content: spoilerReviewData.content,
        spoilerWarning: true, // Should be auto-detected
      }, { transaction: mockTransaction })
      
      // Clean up the spy
      getReviewByIdSpy.mockRestore()
    })
  })

  describe('updateReview', () => {
    const mockReview = {
      id: 'review-123',
      userId: 'user-123',
      bookId: 'book-123',
      rating: 4,
      title: 'Good book',
      content: 'This is a good book with interesting characters.',
      spoilerWarning: false,
      canEdit: jest.fn().mockReturnValue(true),
      update: jest.fn(),
    }

    const updateData = {
      rating: 5,
      title: 'Great book!',
      content: 'This is an amazing book with great characters and plot.',
    }

    it('should update a review successfully', async () => {
      MockedReview.findByPk = jest.fn().mockResolvedValue(mockReview)
      MockedReview.validateReviewData = jest.fn().mockReturnValue({ isValid: true, errors: [] })
      
      const getReviewByIdSpy = jest.spyOn(ReviewService, 'getReviewById').mockResolvedValue({
        ...mockReview,
        ...updateData,
      } as any)

      const result = await ReviewService.updateReview('review-123', 'user-123', updateData)

      expect(MockedReview.findByPk).toHaveBeenCalledWith('review-123', { transaction: mockTransaction })
      expect(mockReview.canEdit).toHaveBeenCalledWith('user-123')
      expect(MockedReview.validateReviewData).toHaveBeenCalledWith({
        rating: updateData.rating,
        title: updateData.title,
        content: updateData.content,
      })
      expect(mockReview.update).toHaveBeenCalledWith({
        ...updateData,
        spoilerWarning: false, // Auto-detected
      }, { transaction: mockTransaction })
      expect(mockTransaction.commit).toHaveBeenCalled()
      
      // Clean up the spy
      getReviewByIdSpy.mockRestore()
    })

    it('should throw error if review not found', async () => {
      MockedReview.findByPk = jest.fn().mockResolvedValue(null)

      await expect(ReviewService.updateReview('review-123', 'user-123', updateData)).rejects.toThrow(
        'Review not found'
      )
      expect(mockTransaction.rollback).toHaveBeenCalled()
    })

    it('should throw error if user not authorized', async () => {
      const unauthorizedReview = {
        ...mockReview,
        canEdit: jest.fn().mockReturnValue(false),
      }
      MockedReview.findByPk = jest.fn().mockResolvedValue(unauthorizedReview)

      await expect(ReviewService.updateReview('review-123', 'user-456', updateData)).rejects.toThrow(
        'User not authorized to edit this review'
      )
      expect(mockTransaction.rollback).toHaveBeenCalled()
    })

    it('should throw error if validation fails', async () => {
      MockedReview.findByPk = jest.fn().mockResolvedValue(mockReview)
      MockedReview.validateReviewData = jest.fn().mockReturnValue({
        isValid: false,
        errors: ['Title is too long'],
      })

      await expect(ReviewService.updateReview('review-123', 'user-123', updateData)).rejects.toThrow(
        'Validation failed: Title is too long'
      )
      expect(mockTransaction.rollback).toHaveBeenCalled()
    })
  })

  describe('deleteReview', () => {
    const mockReview = {
      id: 'review-123',
      userId: 'user-123',
      canEdit: jest.fn().mockReturnValue(true),
      destroy: jest.fn(),
    }

    it('should delete a review successfully', async () => {
      MockedReview.findByPk = jest.fn().mockResolvedValue(mockReview)
      MockedComment.destroy = jest.fn().mockResolvedValue(2) // 2 comments deleted

      await ReviewService.deleteReview('review-123', 'user-123')

      expect(MockedReview.findByPk).toHaveBeenCalledWith('review-123', { transaction: mockTransaction })
      expect(mockReview.canEdit).toHaveBeenCalledWith('user-123')
      expect(MockedComment.destroy).toHaveBeenCalledWith({
        where: { reviewId: 'review-123' },
        transaction: mockTransaction,
      })
      expect(mockReview.destroy).toHaveBeenCalledWith({ transaction: mockTransaction })
      expect(mockTransaction.commit).toHaveBeenCalled()
    })

    it('should throw error if review not found', async () => {
      MockedReview.findByPk = jest.fn().mockResolvedValue(null)

      await expect(ReviewService.deleteReview('review-123', 'user-123')).rejects.toThrow(
        'Review not found'
      )
      expect(mockTransaction.rollback).toHaveBeenCalled()
    })

    it('should throw error if user not authorized', async () => {
      const unauthorizedReview = {
        ...mockReview,
        canEdit: jest.fn().mockReturnValue(false),
      }
      MockedReview.findByPk = jest.fn().mockResolvedValue(unauthorizedReview)

      await expect(ReviewService.deleteReview('review-123', 'user-456')).rejects.toThrow(
        'User not authorized to delete this review'
      )
      expect(mockTransaction.rollback).toHaveBeenCalled()
    })
  })

  describe('getReviewById', () => {
    const mockReview = {
      id: 'review-123',
      userId: 'user-123',
      bookId: 'book-123',
      rating: 5,
      title: 'Great book!',
      content: 'This is an amazing book.',
      user: { id: 'user-123', username: 'testuser' },
      book: { id: 'book-123', title: 'Test Book' },
    }

    beforeEach(() => {
      // Clear any existing spies on ReviewService
      jest.restoreAllMocks()
    })

    it('should get a review by ID successfully', async () => {
      MockedReview.findByPk = jest.fn().mockResolvedValue(mockReview)

      const result = await ReviewService.getReviewById('review-123')

      expect(MockedReview.findByPk).toHaveBeenCalledWith('review-123', expect.objectContaining({
        include: expect.any(Array),
      }))
      expect(result).toEqual(mockReview)
    })

    it('should throw error if review not found', async () => {
      MockedReview.findByPk = jest.fn().mockResolvedValue(null)

      await expect(ReviewService.getReviewById('review-123')).rejects.toThrow('Review not found')
    })
  })

  describe('getReviews', () => {
    const mockReviews = [
      { id: 'review-1', rating: 5, title: 'Great!' },
      { id: 'review-2', rating: 4, title: 'Good' },
    ]

    const mockResult = {
      count: 2,
      rows: mockReviews,
    }

    it('should get reviews with pagination', async () => {
      MockedReview.findAndCountAll = jest.fn().mockResolvedValue(mockResult)

      const filters = { bookId: 'book-123' }
      const pagination = { page: 1, limit: 10, sortBy: 'createdAt' as const, sortOrder: 'DESC' as const }

      const result = await ReviewService.getReviews(filters, pagination)

      expect(MockedReview.findAndCountAll).toHaveBeenCalledWith({
        where: { bookId: 'book-123' },
        include: [
          {
            model: User,
            attributes: ['id', 'username', 'displayName', 'avatar'],
          },
          {
            model: Book,
            attributes: ['id', 'title', 'authors', 'coverImage'],
          },
        ],
        order: [['createdAt', 'DESC']],
        limit: 10,
        offset: 0,
      })

      expect(result).toEqual({
        reviews: mockReviews,
        total: 2,
        page: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      })
    })

    it('should handle rating range filters', async () => {
      MockedReview.findAndCountAll = jest.fn().mockResolvedValue(mockResult)

      const filters = { minRating: 3, maxRating: 5 }
      const pagination = { page: 1, limit: 10, sortBy: 'rating' as const, sortOrder: 'DESC' as const }

      await ReviewService.getReviews(filters, pagination)

      expect(MockedReview.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          rating: expect.any(Object),
        }),
        include: expect.any(Array),
        order: [['rating', 'DESC']],
        limit: 10,
        offset: 0,
      }))
    })
  })

  describe('getUserReviewStats', () => {
    const mockReviews = [
      { rating: 5 },
      { rating: 4 },
      { rating: 5 },
      { rating: 3 },
      { rating: 4 },
    ]

    it('should calculate user review statistics', async () => {
      MockedReview.findAll = jest.fn().mockResolvedValue(mockReviews)

      const result = await ReviewService.getUserReviewStats('user-123')

      expect(MockedReview.findAll).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        attributes: ['rating'],
      })

      expect(result).toEqual({
        totalReviews: 5,
        averageRating: 4.2,
        ratingDistribution: {
          1: 0,
          2: 0,
          3: 1,
          4: 2,
          5: 2,
        },
      })
    })

    it('should handle user with no reviews', async () => {
      MockedReview.findAll = jest.fn().mockResolvedValue([])

      const result = await ReviewService.getUserReviewStats('user-123')

      expect(result).toEqual({
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
        },
      })
    })
  })

  describe('searchReviews', () => {
    const mockReviews = [
      { id: 'review-1', title: 'Amazing book', content: 'Great story' },
      { id: 'review-2', title: 'Good read', content: 'Amazing characters' },
    ]

    const mockResult = {
      count: 2,
      rows: mockReviews,
    }

    it('should search reviews by query', async () => {
      MockedReview.findAndCountAll = jest.fn().mockResolvedValue(mockResult)

      const pagination = { page: 1, limit: 10, sortBy: 'createdAt' as const, sortOrder: 'DESC' as const }
      const result = await ReviewService.searchReviews('amazing', pagination)

      expect(MockedReview.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.any(Object),
        include: expect.any(Array),
        order: [['createdAt', 'DESC']],
        limit: 10,
        offset: 0,
      }))

      expect(result).toEqual({
        reviews: mockReviews,
        total: 2,
        page: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      })
    })
  })

  describe('flagReviewForModeration', () => {
    it('should flag a review for moderation', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      await ReviewService.flagReviewForModeration('review-123', 'Inappropriate content')

      expect(consoleSpy).toHaveBeenCalledWith('Review review-123 flagged for moderation: Inappropriate content')
      
      consoleSpy.mockRestore()
    })
  })

  describe('updateBookRatingAggregation', () => {
    it('should update book rating aggregation', async () => {
      const mockBook = {
        updateAverageRating: jest.fn(),
      }
      MockedBook.findByPk = jest.fn().mockResolvedValue(mockBook)

      await ReviewService.updateBookRatingAggregation('book-123')

      expect(MockedBook.findByPk).toHaveBeenCalledWith('book-123')
      expect(mockBook.updateAverageRating).toHaveBeenCalled()
    })

    it('should handle book not found', async () => {
      MockedBook.findByPk = jest.fn().mockResolvedValue(null)

      await expect(ReviewService.updateBookRatingAggregation('book-123')).resolves.not.toThrow()
    })
  })
})