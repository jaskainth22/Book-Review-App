import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
  ForeignKey,
  BelongsTo,
  HasMany,
  Validate,
  AfterCreate,
  AfterUpdate,
  AfterDestroy,
} from 'sequelize-typescript'
import { User } from './User'
import { Book } from './Book'
import { Comment } from './Comment'

@Table({
  tableName: 'reviews',
  timestamps: true,
  indexes: [
    {
      name: 'idx_reviews_user_id',
      fields: ['user_id'],
    },
    {
      name: 'idx_reviews_book_id',
      fields: ['book_id'],
    },
    {
      name: 'idx_reviews_rating',
      fields: ['rating'],
    },
    {
      name: 'idx_reviews_created_at',
      fields: ['created_at'],
    },
  ],
})
export class Review extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  userId!: string

  @ForeignKey(() => Book)
  @AllowNull(false)
  @Column(DataType.UUID)
  bookId!: string

  @AllowNull(false)
  @Validate({
    min: 1,
    max: 5,
    isInt: true,
  })
  @Column(DataType.INTEGER)
  rating!: number

  @AllowNull(false)
  @Validate({
    len: [1, 200],
  })
  @Column(DataType.STRING(200))
  title!: string

  @AllowNull(false)
  @Validate({
    len: [10, 5000],
  })
  @Column(DataType.TEXT)
  content!: string

  @Default(false)
  @Column(DataType.BOOLEAN)
  spoilerWarning!: boolean

  @Default(0)
  @Validate({
    min: 0,
  })
  @Column(DataType.INTEGER)
  likesCount!: number

  @Default(0)
  @Validate({
    min: 0,
  })
  @Column(DataType.INTEGER)
  commentsCount!: number

  @BelongsTo(() => User)
  user!: User

  @BelongsTo(() => Book)
  book!: Book

  @HasMany(() => Comment)
  comments!: Comment[]

  // Hooks to update book's average rating
  @AfterCreate
  @AfterUpdate
  @AfterDestroy
  static async updateBookRating(instance: Review): Promise<void> {
    const book = await Book.findByPk(instance.bookId)
    if (book) {
      await book.updateAverageRating()
    }
  }

  // Instance methods
  async updateCommentsCount(): Promise<void> {
    const comments = await this.$get('comments')
    this.commentsCount = comments ? comments.length : 0
    await this.save()
  }

  // Static validation methods
  static validateRating(rating: number): boolean {
    return Number.isInteger(rating) && rating >= 1 && rating <= 5
  }

  static validateTitle(title: string): boolean {
    return title.length >= 1 && title.length <= 200
  }

  static validateContent(content: string): boolean {
    return content.length >= 10 && content.length <= 5000
  }

  static validateReviewData(data: {
    rating: number
    title: string
    content: string
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!this.validateRating(data.rating)) {
      errors.push('Rating must be an integer between 1 and 5')
    }

    if (!this.validateTitle(data.title)) {
      errors.push('Title must be between 1 and 200 characters')
    }

    if (!this.validateContent(data.content)) {
      errors.push('Content must be between 10 and 5000 characters')
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  // Check if user can edit this review
  canEdit(userId: string): boolean {
    return this.userId === userId
  }

  // Check if review contains potential spoilers
  containsPotentialSpoilers(): boolean {
    const spoilerKeywords = [
      'ending', 'dies', 'death', 'killed', 'murder', 'twist',
      'surprise', 'reveal', 'secret', 'plot twist', 'spoiler'
    ]
    
    const contentLower = this.content.toLowerCase()
    return spoilerKeywords.some(keyword => contentLower.includes(keyword))
  }
}