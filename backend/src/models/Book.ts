import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  Unique,
  AllowNull,
  HasMany,
  Validate,
  Index,
} from 'sequelize-typescript'
import { Review } from './Review'
import { ReadingListEntry } from './ReadingListEntry'

@Table({
  tableName: 'books',
  timestamps: true,
  indexes: [
    {
      name: 'idx_books_isbn',
      fields: ['isbn'],
    },
    {
      name: 'idx_books_title',
      fields: ['title'],
    },
    {
      name: 'idx_books_authors',
      fields: ['authors'],
      using: 'gin',
    },
    {
      name: 'idx_books_categories',
      fields: ['categories'],
      using: 'gin',
    },
  ],
})
export class Book extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string

  @Unique
  @AllowNull(false)
  @Validate({
    len: [10, 17], // ISBN-10 or ISBN-13
  })
  @Column(DataType.STRING(17))
  isbn!: string

  @AllowNull(false)
  @Validate({
    len: [1, 500],
  })
  @Index
  @Column(DataType.STRING(500))
  title!: string

  @AllowNull(false)
  @Column(DataType.ARRAY(DataType.STRING))
  authors!: string[]

  @Column(DataType.TEXT)
  description?: string

  @Column(DataType.DATEONLY)
  publishedDate?: Date

  @Column(DataType.STRING(255))
  publisher?: string

  @Validate({
    min: 1,
  })
  @Column(DataType.INTEGER)
  pageCount?: number

  @Column(DataType.ARRAY(DataType.STRING))
  categories!: string[]

  @Column(DataType.TEXT)
  coverImage?: string

  @Default(0)
  @Validate({
    min: 0,
    max: 5,
  })
  @Column(DataType.DECIMAL(2, 1))
  averageRating!: number

  @Default(0)
  @Validate({
    min: 0,
  })
  @Column(DataType.INTEGER)
  ratingsCount!: number

  @Column(DataType.STRING(255))
  googleBooksId?: string

  @HasMany(() => Review)
  reviews!: Review[]

  @HasMany(() => ReadingListEntry)
  readingListEntries!: ReadingListEntry[]

  // Instance methods
  async updateAverageRating(): Promise<void> {
    const reviews = await this.$get('reviews')
    if (reviews && reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
      this.averageRating = totalRating / reviews.length
      this.ratingsCount = reviews.length
      await this.save()
    }
  }

  // Static validation methods
  static validateISBN(isbn: string): boolean {
    // Remove hyphens and spaces
    const cleanISBN = isbn.replace(/[-\s]/g, '')
    
    // Check if it's ISBN-10 or ISBN-13
    if (cleanISBN.length === 10) {
      return Book.validateISBN10(cleanISBN)
    } else if (cleanISBN.length === 13) {
      return Book.validateISBN13(cleanISBN)
    }
    
    return false
  }

  private static validateISBN10(isbn: string): boolean {
    let sum = 0
    for (let i = 0; i < 9; i++) {
      const digit = parseInt(isbn[i]!)
      if (isNaN(digit)) return false
      sum += digit * (10 - i)
    }
    
    const checkDigit = isbn[9]!
    const calculatedCheck = (11 - (sum % 11)) % 11
    const expectedCheck = calculatedCheck === 10 ? 'X' : calculatedCheck.toString()
    
    return checkDigit.toUpperCase() === expectedCheck
  }

  private static validateISBN13(isbn: string): boolean {
    let sum = 0
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(isbn[i]!)
      if (isNaN(digit)) return false
      sum += digit * (i % 2 === 0 ? 1 : 3)
    }
    
    const checkDigit = parseInt(isbn[12]!)
    const calculatedCheck = (10 - (sum % 10)) % 10
    
    return checkDigit === calculatedCheck
  }

  static validateTitle(title: string): boolean {
    return title.length >= 1 && title.length <= 500
  }

  static validateAuthors(authors: string[]): boolean {
    return authors.length > 0 && authors.every(author => author.length > 0)
  }

  static validateRating(rating: number): boolean {
    return rating >= 0 && rating <= 5
  }
}