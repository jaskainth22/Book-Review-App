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
  Validate,
  Unique,
} from 'sequelize-typescript'
import { User } from './User'
import { Book } from './Book'
import { Review } from './Review'

export type ReadingStatus = 'want-to-read' | 'currently-reading' | 'read'

@Table({
  tableName: 'reading_list_entries',
  timestamps: true,
  indexes: [
    {
      name: 'idx_reading_list_user_id',
      fields: ['user_id'],
    },
    {
      name: 'idx_reading_list_book_id',
      fields: ['book_id'],
    },
    {
      name: 'idx_reading_list_status',
      fields: ['status'],
    },
    {
      name: 'idx_reading_list_user_book',
      fields: ['user_id', 'book_id'],
      unique: true,
    },
  ],
})
export class ReadingListEntry extends Model {
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
    isIn: [['want-to-read', 'currently-reading', 'read']],
  })
  @Column(DataType.ENUM('want-to-read', 'currently-reading', 'read'))
  status!: ReadingStatus

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  dateAdded!: Date

  @Column(DataType.DATE)
  dateStarted?: Date

  @Column(DataType.DATE)
  dateFinished?: Date

  @Validate({
    min: 0,
    max: 100,
  })
  @Column(DataType.INTEGER)
  progress?: number

  @BelongsTo(() => User)
  user!: User

  @BelongsTo(() => Book)
  book!: Book

  // Instance methods
  async updateStatus(newStatus: ReadingStatus): Promise<void> {
    const now = new Date()
    
    // Update timestamps based on status change
    if (newStatus === 'currently-reading' && this.status !== 'currently-reading') {
      this.dateStarted = now
      this.progress = 0
    } else if (newStatus === 'read' && this.status !== 'read') {
      this.dateFinished = now
      this.progress = 100
      
      // Set dateStarted if it wasn't set before
      if (!this.dateStarted) {
        this.dateStarted = now
      }
    }
    
    this.status = newStatus
    await this.save()
  }

  async updateProgress(progressPercentage: number): Promise<void> {
    if (this.status !== 'currently-reading') {
      throw new Error('Can only update progress for currently reading books')
    }
    
    if (progressPercentage < 0 || progressPercentage > 100) {
      throw new Error('Progress must be between 0 and 100')
    }
    
    this.progress = progressPercentage
    
    // If progress reaches 100%, automatically mark as read
    if (progressPercentage === 100) {
      await this.updateStatus('read')
    } else {
      await this.save()
    }
  }

  // Calculate reading duration
  getReadingDuration(): number | null {
    if (!this.dateStarted || !this.dateFinished) return null
    
    const diffTime = this.dateFinished.getTime() - this.dateStarted.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) // days
  }

  // Check if book is currently being read
  isCurrentlyReading(): boolean {
    return this.status === 'currently-reading'
  }

  // Check if book has been read
  isRead(): boolean {
    return this.status === 'read'
  }

  // Check if book is on want-to-read list
  isWantToRead(): boolean {
    return this.status === 'want-to-read'
  }

  // Static validation methods
  static validateStatus(status: string): boolean {
    const validStatuses: ReadingStatus[] = ['want-to-read', 'currently-reading', 'read']
    return validStatuses.includes(status as ReadingStatus)
  }

  static validateProgress(progress: number): boolean {
    return Number.isInteger(progress) && progress >= 0 && progress <= 100
  }

  static validateReadingListData(data: {
    userId: string
    bookId: string
    status: ReadingStatus
    progress?: number
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.userId) {
      errors.push('User ID is required')
    }

    if (!data.bookId) {
      errors.push('Book ID is required')
    }

    if (!this.validateStatus(data.status)) {
      errors.push('Invalid reading status')
    }

    if (data.progress !== undefined && !this.validateProgress(data.progress)) {
      errors.push('Progress must be an integer between 0 and 100')
    }

    if (data.status !== 'currently-reading' && data.progress !== undefined) {
      errors.push('Progress can only be set for currently reading books')
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  // Get reading statistics for a user
  static async getUserReadingStats(userId: string): Promise<{
    totalBooks: number
    booksRead: number
    booksCurrentlyReading: number
    booksWantToRead: number
    averageRating?: number
  }> {
    const entries = await ReadingListEntry.findAll({
      where: { userId },
      include: [
        {
          model: Book,
          include: [
            {
              model: Review,
              where: { userId },
              required: false,
            },
          ],
        },
      ],
    })

    const stats = {
      totalBooks: entries.length,
      booksRead: entries.filter(entry => entry.status === 'read').length,
      booksCurrentlyReading: entries.filter(entry => entry.status === 'currently-reading').length,
      booksWantToRead: entries.filter(entry => entry.status === 'want-to-read').length,
      averageRating: undefined as number | undefined,
    }

    // Calculate average rating from user's reviews
    const reviewedBooks = entries.filter(entry => 
      entry.book.reviews && entry.book.reviews.length > 0
    )
    
    if (reviewedBooks.length > 0) {
      const totalRating = reviewedBooks.reduce((sum, entry) => 
        sum + entry.book.reviews[0]!.rating, 0
      )
      stats.averageRating = totalRating / reviewedBooks.length
    }

    return stats
  }
}