import { Comment } from '../Comment'
import { Review } from '../Review'
import { User } from '../User'
import { Book } from '../Book'
import { sequelize } from '../../config/database'

describe('Comment Model', () => {
  let user: User
  let book: Book
  let review: Review

  beforeAll(async () => {
    await sequelize.sync({ force: true })
  })

  afterAll(async () => {
    await sequelize.close()
  })

  beforeEach(async () => {
    await Comment.destroy({ where: {} })
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

    review = await Review.create({
      userId: user.id,
      bookId: book.id,
      rating: 5,
      title: 'Great Book!',
      content: 'This is an amazing book that I really enjoyed reading.',
    })
  })

  describe('Model Creation', () => {
    it('should create a comment with valid data', async () => {
      const commentData = {
        reviewId: review.id,
        userId: user.id,
        content: 'I completely agree with your review!',
      }

      const comment = await Comment.create(commentData)

      expect(comment.id).toBeDefined()
      expect(comment.reviewId).toBe(review.id)
      expect(comment.userId).toBe(user.id)
      expect(comment.content).toBe(commentData.content)
      expect(comment.parentCommentId).toBeNull()
      expect(comment.likesCount).toBe(0)
    })

    it('should create a nested reply comment', async () => {
      const parentComment = await Comment.create({
        reviewId: review.id,
        userId: user.id,
        content: 'Great review!',
      })

      const replyData = {
        reviewId: review.id,
        userId: user.id,
        content: 'Thanks for the feedback!',
        parentCommentId: parentComment.id,
      }

      const reply = await Comment.create(replyData)

      expect(reply.parentCommentId).toBe(parentComment.id)
      expect(reply.isReply()).toBe(true)
    })
  })

  describe('Validations', () => {
    it('should require reviewId', async () => {
      const commentData = {
        userId: user.id,
        content: 'I completely agree with your review!',
      }

      await expect(Comment.create(commentData)).rejects.toThrow()
    })

    it('should require userId', async () => {
      const commentData = {
        reviewId: review.id,
        content: 'I completely agree with your review!',
      }

      await expect(Comment.create(commentData)).rejects.toThrow()
    })

    it('should require content', async () => {
      const commentData = {
        reviewId: review.id,
        userId: user.id,
      }

      await expect(Comment.create(commentData)).rejects.toThrow()
    })

    it('should validate content length', async () => {
      const longContentData = {
        reviewId: review.id,
        userId: user.id,
        content: 'a'.repeat(1001),
      }

      await expect(Comment.create(longContentData)).rejects.toThrow()
    })

    it('should validate likesCount is non-negative', async () => {
      const negativeLikesData = {
        reviewId: review.id,
        userId: user.id,
        content: 'Great review!',
        likesCount: -1,
      }

      await expect(Comment.create(negativeLikesData)).rejects.toThrow()
    })
  })

  describe('Static Validation Methods', () => {
    it('should validate content', () => {
      expect(Comment.validateContent('Valid comment content')).toBe(true)
      expect(Comment.validateContent('A')).toBe(true)
      expect(Comment.validateContent('a'.repeat(1000))).toBe(true)
      expect(Comment.validateContent('')).toBe(false)
      expect(Comment.validateContent('a'.repeat(1001))).toBe(false)
    })

    it('should validate comment data', () => {
      const validData = {
        content: 'This is a valid comment',
        reviewId: review.id,
        userId: user.id,
      }

      const result = Comment.validateCommentData(validData)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)

      const invalidData = {
        content: '',
        reviewId: '',
        userId: '',
      }

      const invalidResult = Comment.validateCommentData(invalidData)
      expect(invalidResult.isValid).toBe(false)
      expect(invalidResult.errors.length).toBeGreaterThan(0)
    })
  })

  describe('Instance Methods', () => {
    let comment: Comment

    beforeEach(async () => {
      comment = await Comment.create({
        reviewId: review.id,
        userId: user.id,
        content: 'Great review! I completely agree.',
      })
    })

    it('should check if user can edit comment', () => {
      expect(comment.canEdit(user.id)).toBe(true)
      expect(comment.canEdit('different-user-id')).toBe(false)
    })

    it('should check if comment is a reply', () => {
      expect(comment.isReply()).toBe(false)

      comment.parentCommentId = 'some-parent-id'
      expect(comment.isReply()).toBe(true)
    })

    it('should get replies count', async () => {
      const repliesCount = await comment.getRepliesCount()
      expect(repliesCount).toBe(0)
    })

    it('should detect inappropriate content', () => {
      comment.content = 'This is spam! Buy now!'
      expect(comment.containsInappropriateContent()).toBe(true)

      comment.content = 'This is a normal comment about the book.'
      expect(comment.containsInappropriateContent()).toBe(false)
    })

    it('should get comment depth', async () => {
      // Top-level comment
      const depth = await comment.getDepth()
      expect(depth).toBe(0)

      // Create a reply
      const reply = await Comment.create({
        reviewId: review.id,
        userId: user.id,
        content: 'Reply to comment',
        parentCommentId: comment.id,
      })

      const replyDepth = await reply.getDepth()
      expect(replyDepth).toBe(1)
    })

    it('should get nested replies', async () => {
      // Create some replies
      await Comment.create({
        reviewId: review.id,
        userId: user.id,
        content: 'First reply',
        parentCommentId: comment.id,
      })

      await Comment.create({
        reviewId: review.id,
        userId: user.id,
        content: 'Second reply',
        parentCommentId: comment.id,
      })

      const replies = await comment.getNestedReplies()
      expect(replies).toHaveLength(2)
    })
  })
})