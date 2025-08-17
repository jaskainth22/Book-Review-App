import { Review } from '../models/Review'
import { Comment } from '../models/Comment'
import { User } from '../models/User'
import { Book } from '../models/Book'
import { Op, Transaction } from 'sequelize'
import { sequelize } from '../config/database'

export interface CreateReviewData {
  userId: string
  bookId: string
  rating: number
  title: string
  content: string
  spoilerWarning?: boolean
}

export interface UpdateReviewData {
  rating?: number
  title?: string
  content?: string
  spoilerWarning?: boolean
}

export interface ReviewFilters {
  bookId?: string
  userId?: string
  rating?: number
  minRating?: number
  maxRating?: number
  spoilerWarning?: boolean
}

export interface PaginationOptions {
  page: number
  limit: number
  sortBy?: 'createdAt' | 'rating' | 'likesCount'
  sortOrder?: 'ASC' | 'DESC'
}

export interface ReviewListResult {
  reviews: Review[]
  total: number
  page: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export class ReviewService {
  /**
   * Create a new review
   */
  static async createReview(data: CreateReviewData): Promise<Review> {
    const transaction = await sequelize.transaction()
    
    try {
      // Check if user already has a review for this book
      const existingReview = await Review.findOne({
        where: {
          userId: data.userId,
          bookId: data.bookId,
        },
        transaction,
      })

      if (existingReview) {
        throw new Error('User already has a review for this book')
      }

      // Validate review data
      const validation = Review.validateReviewData({
        rating: data.rating,
        title: data.title,
        content: data.content,
      })

      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
      }

      // Check if book exists
      const book = await Book.findByPk(data.bookId, { transaction })
      if (!book) {
        throw new Error('Book not found')
      }

      // Check if user exists
      const user = await User.findByPk(data.userId, { transaction })
      if (!user) {
        throw new Error('User not found')
      }

      // Auto-detect spoiler warning if not provided
      const spoilerWarning = data.spoilerWarning ?? this.detectSpoilers(data.content)

      // Create the review
      const review = await Review.create({
        userId: data.userId,
        bookId: data.bookId,
        rating: data.rating,
        title: data.title,
        content: data.content,
        spoilerWarning,
      }, { transaction })

      await transaction.commit()

      // Return review with user and book data
      return await this.getReviewById(review.id)
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  /**
   * Update an existing review
   */
  static async updateReview(reviewId: string, userId: string, data: UpdateReviewData): Promise<Review> {
    const transaction = await sequelize.transaction()
    
    try {
      const review = await Review.findByPk(reviewId, { transaction })
      
      if (!review) {
        throw new Error('Review not found')
      }

      if (!review.canEdit(userId)) {
        throw new Error('User not authorized to edit this review')
      }

      // Validate updated data
      const updateData = {
        rating: data.rating ?? review.rating,
        title: data.title ?? review.title,
        content: data.content ?? review.content,
      }

      const validation = Review.validateReviewData(updateData)
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
      }

      // Auto-detect spoiler warning if content changed
      const spoilerWarning = data.content 
        ? (data.spoilerWarning ?? this.detectSpoilers(data.content))
        : review.spoilerWarning

      // Update the review
      await review.update({
        ...data,
        spoilerWarning,
      }, { transaction })

      await transaction.commit()

      return await this.getReviewById(reviewId)
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  /**
   * Delete a review
   */
  static async deleteReview(reviewId: string, userId: string): Promise<void> {
    const transaction = await sequelize.transaction()
    
    try {
      const review = await Review.findByPk(reviewId, { transaction })
      
      if (!review) {
        throw new Error('Review not found')
      }

      if (!review.canEdit(userId)) {
        throw new Error('User not authorized to delete this review')
      }

      // Delete associated comments first
      await Comment.destroy({
        where: { reviewId },
        transaction,
      })

      // Delete the review
      await review.destroy({ transaction })

      await transaction.commit()
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  /**
   * Get a review by ID with user and book data
   */
  static async getReviewById(reviewId: string): Promise<Review> {
    const review = await Review.findByPk(reviewId, {
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
    })

    if (!review) {
      throw new Error('Review not found')
    }

    return review
  }

  /**
   * Get reviews with pagination and filtering
   */
  static async getReviews(
    filters: ReviewFilters = {},
    pagination: PaginationOptions
  ): Promise<ReviewListResult> {
    const { page, limit, sortBy = 'createdAt', sortOrder = 'DESC' } = pagination
    const offset = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (filters.bookId) where.bookId = filters.bookId
    if (filters.userId) where.userId = filters.userId
    if (filters.rating) where.rating = filters.rating
    if (filters.spoilerWarning !== undefined) where.spoilerWarning = filters.spoilerWarning
    
    if (filters.minRating || filters.maxRating) {
      where.rating = {}
      if (filters.minRating) where.rating[Op.gte] = filters.minRating
      if (filters.maxRating) where.rating[Op.lte] = filters.maxRating
    }

    const { count, rows } = await Review.findAndCountAll({
      where,
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
      order: [[sortBy, sortOrder]],
      limit,
      offset,
    })

    const totalPages = Math.ceil(count / limit)

    return {
      reviews: rows,
      total: count,
      page,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    }
  }

  /**
   * Get reviews for a specific book
   */
  static async getReviewsByBook(
    bookId: string,
    pagination: PaginationOptions
  ): Promise<ReviewListResult> {
    return this.getReviews({ bookId }, pagination)
  }

  /**
   * Get reviews by a specific user
   */
  static async getReviewsByUser(
    userId: string,
    pagination: PaginationOptions
  ): Promise<ReviewListResult> {
    return this.getReviews({ userId }, pagination)
  }

  /**
   * Calculate and update book rating aggregation
   */
  static async updateBookRatingAggregation(bookId: string): Promise<void> {
    const book = await Book.findByPk(bookId)
    if (book) {
      await book.updateAverageRating()
    }
  }

  /**
   * Flag a review for moderation
   */
  static async flagReviewForModeration(reviewId: string, reason: string): Promise<void> {
    // This is a placeholder for moderation functionality
    // In a real implementation, you would store moderation flags in a separate table
    console.log(`Review ${reviewId} flagged for moderation: ${reason}`)
    
    // For now, we'll just log the flag
    // TODO: Implement proper moderation system with database table
  }

  /**
   * Get review statistics for a user
   */
  static async getUserReviewStats(userId: string): Promise<{
    totalReviews: number
    averageRating: number
    ratingDistribution: { [key: number]: number }
  }> {
    const reviews = await Review.findAll({
      where: { userId },
      attributes: ['rating'],
    })

    const totalReviews = reviews.length
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
      : 0

    const ratingDistribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    reviews.forEach(review => {
      ratingDistribution[review.rating]++
    })

    return {
      totalReviews,
      averageRating: Math.round(averageRating * 100) / 100,
      ratingDistribution,
    }
  }

  /**
   * Detect potential spoilers in review content
   */
  private static detectSpoilers(content: string): boolean {
    const spoilerKeywords = [
      'ending', 'dies', 'death', 'killed', 'murder', 'twist',
      'surprise', 'reveal', 'secret', 'plot twist', 'spoiler',
      'finale', 'conclusion', 'climax', 'resolution'
    ]
    
    const contentLower = content.toLowerCase()
    return spoilerKeywords.some(keyword => contentLower.includes(keyword))
  }

  /**
   * Search reviews by content
   */
  static async searchReviews(
    query: string,
    pagination: PaginationOptions
  ): Promise<ReviewListResult> {
    const { page, limit, sortBy = 'createdAt', sortOrder = 'DESC' } = pagination
    const offset = (page - 1) * limit

    const { count, rows } = await Review.findAndCountAll({
      where: {
        [Op.or]: [
          { title: { [Op.iLike]: `%${query}%` } },
          { content: { [Op.iLike]: `%${query}%` } },
        ],
      },
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
      order: [[sortBy, sortOrder]],
      limit,
      offset,
    })

    const totalPages = Math.ceil(count / limit)

    return {
      reviews: rows,
      total: count,
      page,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    }
  }
}