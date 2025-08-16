import { Review } from '../Review'
import { User } from '../User'
import { Book } from '../Book'
import { sequelize } from '../../config/database'

describe('Review Model', () => {
  let user: User
  let book: Book

  beforeAll(async () => {
    await sequelize.sync({ force: true })
  })

  afterAll(async () => {
    await sequelize.close()
  })

  beforeEach(async () => {
    await Review.destroy({ where: {} })
    await User.destroy({ where: {} })
    await Book.destroy({ where: {} })

    user = await User.create({
      email: 'test@example.com',
      username: 'testuser',
      displayName: 'Test User',
    })

    book = await Book.create({
      isbn: '9780547928227',
      title: 'The Hobbit',
      authors: ['J.R.R. Tolkien'],
      categories: ['Fantasy'],
    })
  })

  describe('Model Creation', () => {
    it('should create a review with valid data', async () => {
      const reviewData = {
        userId: user.id,
        bookId: book.id,
        rating: 5,
        title: 'Great Book!',
        content: 'This is an amazing book that I really enjoyed reading. The characters are well-developed.',
        spoilerWarning: false,
      }

      const review = await Review.create(reviewData)

      expect(review.id).toBeDefined()
      expect(review.userId).toBe(user.id)
      expect(review.bookId).toBe(book.id)
      expect(review.rating).toBe(5)
      expect(review.title).toBe(reviewData.title)
      expect(review.content).toBe(reviewData.content)
      expect(review.spoilerWarning).toBe(false)
      expect(review.likesCount).toBe(0)
      expect(review.commentsCount).toBe(0)
    })
  })

  describe('Validations', () => {
    it('should require userId', async () => {
      const reviewData = {
        bookId: book.id,
        rating: 5,
        title: 'Great Book!',
        content: 'This is an amazing book that I really enjoyed reading.',
      }

      await expect(Review.create(reviewData)).rejects.toThrow()
    })

    it('should require bookId', async () => {
      const reviewData = {
        userId: user.id,
        rating: 5,
        title: 'Great Book!',
        content: 'This is an amazing book that I really enjoyed reading.',
      }

      await expect(Review.create(reviewData)).rejects.toThrow()
    })

    it('should require rating', async () => {
      const reviewData = {
        userId: user.id,
        bookId: book.id,
        title: 'Great Book!',
        content: 'This is an amazing book that I really enjoyed reading.',
      }

      await expect(Review.create(reviewData)).rejects.toThrow()
    })

    it('should validate rating range', async () => {
      const lowRatingData = {
        userId: user.id,
        bookId: book.id,
        rating: 0,
        title: 'Great Book!',
        content: 'This is an amazing book that I really enjoyed reading.',
      }

      await expect(Review.create(lowRatingData)).rejects.toThrow()

      const highRatingData = {
        userId: user.id,
        bookId: book.id,
        rating: 6,
        title: 'Great Book!',
        content: 'This is an amazing book that I really enjoyed reading.',
      }

      await expect(Review.create(highRatingData)).rejects.toThrow()
    })

    it('should require title', async () => {
      const reviewData = {
        userId: user.id,
        bookId: book.id,
        rating: 5,
        content: 'This is an amazing book that I really enjoyed reading.',
      }

      await expect(Review.create(reviewData)).rejects.toThrow()
    })

    it('should validate title length', async () => {
      const longTitleData = {
        userId: user.id,
        bookId: book.id,
        rating: 5,
        title: 'a'.repeat(201),
        content: 'This is an amazing book that I really enjoyed reading.',
      }

      await expect(Review.create(longTitleData)).rejects.toThrow()
    })

    it('should require content', async () => {
      const reviewData = {
        userId: user.id,
        bookId: book.id,
        rating: 5,
        title: 'Great Book!',
      }

      await expect(Review.create(reviewData)).rejects.toThrow()
    })

    it('should validate content length', async () => {
      const shortContentData = {
        userId: user.id,
        bookId: book.id,
        rating: 5,
        title: 'Great Book!',
        content: 'Too short',
      }

      await expect(Review.create(shortContentData)).rejects.toThrow()

      const longContentData = {
        userId: user.id,
        bookId: book.id,
        rating: 5,
        title: 'Great Book!',
        content: 'a'.repeat(5001),
      }

      await expect(Review.create(longContentData)).rejects.toThrow()
    })

    it('should validate likesCount is non-negative', async () => {
      const negativeLikesData = {
        userId: user.id,
        bookId: book.id,
        rating: 5,
        title: 'Great Book!',
        content: 'This is an amazing book that I really enjoyed reading.',
        likesCount: -1,
      }

      await expect(Review.create(negativeLikesData)).rejects.toThrow()
    })

    it('should validate commentsCount is non-negative', async () => {
      const negativeCommentsData = {
        userId: user.id,
        bookId: book.id,
        rating: 5,
        title: 'Great Book!',
        content: 'This is an amazing book that I really enjoyed reading.',
        commentsCount: -1,
      }

      await expect(Review.create(negativeCommentsData)).rejects.toThrow()
    })
  })

  describe('Static Validation Methods', () => {
    it('should validate rating', () => {
      expect(Review.validateRating(1)).toBe(true)
      expect(Review.validateRating(3)).toBe(true)
      expect(Review.validateRating(5)).toBe(true)
      expect(Review.validateRating(0)).toBe(false)
      expect(Review.validateRating(6)).toBe(false)
      expect(Review.validateRating(2.5)).toBe(false) // not integer
    })

    it('should validate title', () => {
      expect(Review.validateTitle('Valid Title')).toBe(true)
      expect(Review.validateTitle('A')).toBe(true)
      expect(Review.validateTitle('a'.repeat(200))).toBe(true)
      expect(Review.validateTitle('')).toBe(false)
      expect(Review.validateTitle('a'.repeat(201))).toBe(false)
    })

    it('should validate content', () => {
      expect(Review.validateContent('This is valid content for a review.')).toBe(true)
      expect(Review.validateContent('a'.repeat(10))).toBe(true)
      expect(Review.validateContent('a'.repeat(5000))).toBe(true)
      expect(Review.validateContent('Too short')).toBe(false)
      expect(Review.validateContent('a'.repeat(5001))).toBe(false)
    })

    it('should validate review data', () => {
      const validData = {
        rating: 4,
        title: 'Good Book',
        content: 'This is a good book with interesting characters and plot.',
      }

      const result = Review.validateReviewData(validData)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)

      const invalidData = {
        rating: 0,
        title: '',
        content: 'Short',
      }

      const invalidResult = Review.validateReviewData(invalidData)
      expect(invalidResult.isValid).toBe(false)
      expect(invalidResult.errors.length).toBeGreaterThan(0)
    })
  })

  describe('Instance Methods', () => {
    let review: Review

    beforeEach(async () => {
      review = await Review.create({
        userId: user.id,
        bookId: book.id,
        rating: 5,
        title: 'Great Book!',
        content: 'This is an amazing book that I really enjoyed reading. The characters are well-developed.',
      })
    })

    it('should check if user can edit review', () => {
      expect(review.canEdit(user.id)).toBe(true)
      expect(review.canEdit('different-user-id')).toBe(false)
    })

    it('should detect potential spoilers', () => {
      review.content = 'The ending was surprising when the main character dies.'
      expect(review.containsPotentialSpoilers()).toBe(true)

      review.content = 'This is a great book with wonderful characters.'
      expect(review.containsPotentialSpoilers()).toBe(false)
    })

    it('should update comments count', async () => {
      await review.updateCommentsCount()
      expect(review.commentsCount).toBe(0)
    })
  })
})