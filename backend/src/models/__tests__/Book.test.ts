import { Book } from '../Book'
import { sequelize } from '../../config/database'

describe('Book Model', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true })
  })

  afterAll(async () => {
    await sequelize.close()
  })

  beforeEach(async () => {
    await Book.destroy({ where: {} })
  })

  describe('Model Creation', () => {
    it('should create a book with valid data', async () => {
      const bookData = {
        isbn: '9780547928227',
        title: 'The Hobbit',
        authors: ['J.R.R. Tolkien'],
        description: 'A classic fantasy adventure',
        publishedDate: new Date('1937-09-21'),
        publisher: 'Houghton Mifflin Harcourt',
        pageCount: 310,
        categories: ['Fantasy', 'Adventure'],
        coverImage: 'https://example.com/cover.jpg',
        googleBooksId: 'pD6arNyKyi8C',
      }

      const book = await Book.create(bookData)

      expect(book.id).toBeDefined()
      expect(book.isbn).toBe(bookData.isbn)
      expect(book.title).toBe(bookData.title)
      expect(book.authors).toEqual(bookData.authors)
      expect(parseFloat(book.averageRating.toString())).toBe(0)
      expect(book.ratingsCount).toBe(0)
    })

    it('should create a book with minimal required data', async () => {
      const bookData = {
        isbn: '9780547928227',
        title: 'The Hobbit',
        authors: ['J.R.R. Tolkien'],
        categories: [],
      }

      const book = await Book.create(bookData)

      expect(book.id).toBeDefined()
      expect(book.isbn).toBe(bookData.isbn)
      expect(book.title).toBe(bookData.title)
      expect(book.authors).toEqual(bookData.authors)
      expect(book.categories).toEqual([])
    })
  })

  describe('Validations', () => {
    it('should require isbn', async () => {
      const bookData = {
        title: 'The Hobbit',
        authors: ['J.R.R. Tolkien'],
        categories: [],
      }

      await expect(Book.create(bookData)).rejects.toThrow()
    })

    it('should require unique isbn', async () => {
      const bookData = {
        isbn: '9780547928227',
        title: 'The Hobbit',
        authors: ['J.R.R. Tolkien'],
        categories: [],
      }

      await Book.create(bookData)

      const duplicateBookData = {
        isbn: '9780547928227',
        title: 'Another Book',
        authors: ['Another Author'],
        categories: [],
      }

      await expect(Book.create(duplicateBookData)).rejects.toThrow()
    })

    it('should validate isbn length', async () => {
      const shortIsbnData = {
        isbn: '123456789',
        title: 'The Hobbit',
        authors: ['J.R.R. Tolkien'],
        categories: [],
      }

      await expect(Book.create(shortIsbnData)).rejects.toThrow()

      const longIsbnData = {
        isbn: '123456789012345678',
        title: 'The Hobbit',
        authors: ['J.R.R. Tolkien'],
        categories: [],
      }

      await expect(Book.create(longIsbnData)).rejects.toThrow()
    })

    it('should require title', async () => {
      const bookData = {
        isbn: '9780547928227',
        authors: ['J.R.R. Tolkien'],
        categories: [],
      }

      await expect(Book.create(bookData)).rejects.toThrow()
    })

    it('should validate title length', async () => {
      const longTitleData = {
        isbn: '9780547928227',
        title: 'a'.repeat(501),
        authors: ['J.R.R. Tolkien'],
        categories: [],
      }

      await expect(Book.create(longTitleData)).rejects.toThrow()
    })

    it('should require authors', async () => {
      const bookData = {
        isbn: '9780547928227',
        title: 'The Hobbit',
        categories: [],
      }

      await expect(Book.create(bookData)).rejects.toThrow()
    })

    it('should validate pageCount is positive', async () => {
      const negativePageCountData = {
        isbn: '9780547928227',
        title: 'The Hobbit',
        authors: ['J.R.R. Tolkien'],
        pageCount: -10,
        categories: [],
      }

      await expect(Book.create(negativePageCountData)).rejects.toThrow()

      const zeroPageCountData = {
        isbn: '9780547928227',
        title: 'The Hobbit',
        authors: ['J.R.R. Tolkien'],
        pageCount: 0,
        categories: [],
      }

      await expect(Book.create(zeroPageCountData)).rejects.toThrow()
    })

    it('should validate averageRating range', async () => {
      const negativeRatingData = {
        isbn: '9780547928227',
        title: 'The Hobbit',
        authors: ['J.R.R. Tolkien'],
        averageRating: -1,
        categories: [],
      }

      await expect(Book.create(negativeRatingData)).rejects.toThrow()

      const highRatingData = {
        isbn: '9780547928227',
        title: 'The Hobbit',
        authors: ['J.R.R. Tolkien'],
        averageRating: 6,
        categories: [],
      }

      await expect(Book.create(highRatingData)).rejects.toThrow()
    })

    it('should validate ratingsCount is non-negative', async () => {
      const negativeRatingsCountData = {
        isbn: '9780547928227',
        title: 'The Hobbit',
        authors: ['J.R.R. Tolkien'],
        ratingsCount: -1,
        categories: [],
      }

      await expect(Book.create(negativeRatingsCountData)).rejects.toThrow()
    })
  })

  describe('Static Validation Methods', () => {
    it('should validate ISBN-10', () => {
      expect(Book.validateISBN('0201530821')).toBe(true) // Known valid ISBN-10
      expect(Book.validateISBN('0-201-53082-1')).toBe(true)
      expect(Book.validateISBN('0 201 53082 1')).toBe(true)
      expect(Book.validateISBN('0201530822')).toBe(false) // wrong check digit
      expect(Book.validateISBN('020153082')).toBe(false) // too short
    })

    it('should validate ISBN-13', () => {
      expect(Book.validateISBN('9780547928227')).toBe(true)
      expect(Book.validateISBN('978-0-547-92822-7')).toBe(true)
      expect(Book.validateISBN('978 0 547 92822 7')).toBe(true)
      expect(Book.validateISBN('9780547928228')).toBe(false) // wrong check digit
      expect(Book.validateISBN('978054792822')).toBe(false) // too short
    })

    it('should reject invalid ISBN formats', () => {
      expect(Book.validateISBN('123')).toBe(false)
      expect(Book.validateISBN('abcdefghij')).toBe(false)
      expect(Book.validateISBN('')).toBe(false)
    })

    it('should validate title', () => {
      expect(Book.validateTitle('Valid Title')).toBe(true)
      expect(Book.validateTitle('A')).toBe(true)
      expect(Book.validateTitle('a'.repeat(500))).toBe(true)
      expect(Book.validateTitle('')).toBe(false)
      expect(Book.validateTitle('a'.repeat(501))).toBe(false)
    })

    it('should validate authors array', () => {
      expect(Book.validateAuthors(['Author One'])).toBe(true)
      expect(Book.validateAuthors(['Author One', 'Author Two'])).toBe(true)
      expect(Book.validateAuthors([])).toBe(false)
      expect(Book.validateAuthors([''])).toBe(false)
      expect(Book.validateAuthors(['Valid Author', ''])).toBe(false)
    })

    it('should validate rating', () => {
      expect(Book.validateRating(0)).toBe(true)
      expect(Book.validateRating(2.5)).toBe(true)
      expect(Book.validateRating(5)).toBe(true)
      expect(Book.validateRating(-1)).toBe(false)
      expect(Book.validateRating(6)).toBe(false)
    })
  })

  describe('Instance Methods', () => {
    let book: Book

    beforeEach(async () => {
      book = await Book.create({
        isbn: '9780547928227',
        title: 'The Hobbit',
        authors: ['J.R.R. Tolkien'],
        categories: ['Fantasy'],
      })
    })

    it('should update average rating when no reviews exist', async () => {
      await book.updateAverageRating()
      expect(parseFloat(book.averageRating.toString())).toBe(0)
      expect(book.ratingsCount).toBe(0)
    })
  })
})