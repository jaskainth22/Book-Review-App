import { ReadingListEntry, ReadingStatus } from '../ReadingListEntry'
import { User } from '../User'
import { Book } from '../Book'
import { sequelize } from '../../config/database'

describe('ReadingListEntry Model', () => {
  let user: User
  let book: Book

  beforeAll(async () => {
    await sequelize.sync({ force: true })
  })

  afterAll(async () => {
    await sequelize.close()
  })

  beforeEach(async () => {
    await ReadingListEntry.destroy({ where: {} })
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
    it('should create a reading list entry with valid data', async () => {
      const entryData = {
        userId: user.id,
        bookId: book.id,
        status: 'want-to-read' as ReadingStatus,
      }

      const entry = await ReadingListEntry.create(entryData)

      expect(entry.id).toBeDefined()
      expect(entry.userId).toBe(user.id)
      expect(entry.bookId).toBe(book.id)
      expect(entry.status).toBe('want-to-read')
      expect(entry.dateAdded).toBeDefined()
      expect(entry.dateStarted).toBeNull()
      expect(entry.dateFinished).toBeNull()
      expect(entry.progress).toBeNull()
    })

    it('should create entry with progress for currently reading', async () => {
      const entryData = {
        userId: user.id,
        bookId: book.id,
        status: 'currently-reading' as ReadingStatus,
        progress: 50,
      }

      const entry = await ReadingListEntry.create(entryData)

      expect(entry.status).toBe('currently-reading')
      expect(entry.progress).toBe(50)
    })
  })

  describe('Validations', () => {
    it('should require userId', async () => {
      const entryData = {
        bookId: book.id,
        status: 'want-to-read' as ReadingStatus,
      }

      await expect(ReadingListEntry.create(entryData)).rejects.toThrow()
    })

    it('should require bookId', async () => {
      const entryData = {
        userId: user.id,
        status: 'want-to-read' as ReadingStatus,
      }

      await expect(ReadingListEntry.create(entryData)).rejects.toThrow()
    })

    it('should require status', async () => {
      const entryData = {
        userId: user.id,
        bookId: book.id,
      }

      await expect(ReadingListEntry.create(entryData)).rejects.toThrow()
    })

    it('should validate status enum', async () => {
      const entryData = {
        userId: user.id,
        bookId: book.id,
        status: 'invalid-status' as ReadingStatus,
      }

      await expect(ReadingListEntry.create(entryData)).rejects.toThrow()
    })

    it('should validate progress range', async () => {
      const negativeProgressData = {
        userId: user.id,
        bookId: book.id,
        status: 'currently-reading' as ReadingStatus,
        progress: -1,
      }

      await expect(ReadingListEntry.create(negativeProgressData)).rejects.toThrow()

      const highProgressData = {
        userId: user.id,
        bookId: book.id,
        status: 'currently-reading' as ReadingStatus,
        progress: 101,
      }

      await expect(ReadingListEntry.create(highProgressData)).rejects.toThrow()
    })

    it('should enforce unique user-book combination', async () => {
      const entryData = {
        userId: user.id,
        bookId: book.id,
        status: 'want-to-read' as ReadingStatus,
      }

      await ReadingListEntry.create(entryData)

      const duplicateEntryData = {
        userId: user.id,
        bookId: book.id,
        status: 'currently-reading' as ReadingStatus,
      }

      await expect(ReadingListEntry.create(duplicateEntryData)).rejects.toThrow()
    })
  })

  describe('Static Validation Methods', () => {
    it('should validate status', () => {
      expect(ReadingListEntry.validateStatus('want-to-read')).toBe(true)
      expect(ReadingListEntry.validateStatus('currently-reading')).toBe(true)
      expect(ReadingListEntry.validateStatus('read')).toBe(true)
      expect(ReadingListEntry.validateStatus('invalid-status')).toBe(false)
    })

    it('should validate progress', () => {
      expect(ReadingListEntry.validateProgress(0)).toBe(true)
      expect(ReadingListEntry.validateProgress(50)).toBe(true)
      expect(ReadingListEntry.validateProgress(100)).toBe(true)
      expect(ReadingListEntry.validateProgress(-1)).toBe(false)
      expect(ReadingListEntry.validateProgress(101)).toBe(false)
      expect(ReadingListEntry.validateProgress(50.5)).toBe(false) // not integer
    })

    it('should validate reading list data', () => {
      const validData = {
        userId: user.id,
        bookId: book.id,
        status: 'currently-reading' as ReadingStatus,
        progress: 50,
      }

      const result = ReadingListEntry.validateReadingListData(validData)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)

      const invalidData = {
        userId: '',
        bookId: '',
        status: 'invalid' as ReadingStatus,
        progress: 150,
      }

      const invalidResult = ReadingListEntry.validateReadingListData(invalidData)
      expect(invalidResult.isValid).toBe(false)
      expect(invalidResult.errors.length).toBeGreaterThan(0)
    })

    it('should reject progress for non-currently-reading status', () => {
      const invalidData = {
        userId: user.id,
        bookId: book.id,
        status: 'want-to-read' as ReadingStatus,
        progress: 50,
      }

      const result = ReadingListEntry.validateReadingListData(invalidData)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Progress can only be set for currently reading books')
    })
  })

  describe('Instance Methods', () => {
    let entry: ReadingListEntry

    beforeEach(async () => {
      entry = await ReadingListEntry.create({
        userId: user.id,
        bookId: book.id,
        status: 'want-to-read',
      })
    })

    it('should update status to currently reading', async () => {
      await entry.updateStatus('currently-reading')

      expect(entry.status).toBe('currently-reading')
      expect(entry.dateStarted).toBeDefined()
      expect(entry.progress).toBe(0)
    })

    it('should update status to read', async () => {
      await entry.updateStatus('read')

      expect(entry.status).toBe('read')
      expect(entry.dateFinished).toBeDefined()
      expect(entry.progress).toBe(100)
      expect(entry.dateStarted).toBeDefined()
    })

    it('should update progress for currently reading book', async () => {
      await entry.updateStatus('currently-reading')
      await entry.updateProgress(75)

      expect(entry.progress).toBe(75)
    })

    it('should automatically mark as read when progress reaches 100%', async () => {
      await entry.updateStatus('currently-reading')
      await entry.updateProgress(100)

      expect(entry.status).toBe('read')
      expect(entry.dateFinished).toBeDefined()
    })

    it('should throw error when updating progress for non-currently-reading book', async () => {
      await expect(entry.updateProgress(50)).rejects.toThrow(
        'Can only update progress for currently reading books'
      )
    })

    it('should throw error for invalid progress range', async () => {
      await entry.updateStatus('currently-reading')

      await expect(entry.updateProgress(-10)).rejects.toThrow(
        'Progress must be between 0 and 100'
      )

      await expect(entry.updateProgress(150)).rejects.toThrow(
        'Progress must be between 0 and 100'
      )
    })

    it('should calculate reading duration', async () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-10')

      entry.dateStarted = startDate
      entry.dateFinished = endDate

      const duration = entry.getReadingDuration()
      expect(duration).toBe(9) // 9 days
    })

    it('should return null for reading duration when dates are missing', () => {
      expect(entry.getReadingDuration()).toBeNull()

      entry.dateStarted = new Date()
      expect(entry.getReadingDuration()).toBeNull()
    })

    it('should check reading status', () => {
      entry.status = 'want-to-read'
      expect(entry.isWantToRead()).toBe(true)
      expect(entry.isCurrentlyReading()).toBe(false)
      expect(entry.isRead()).toBe(false)

      entry.status = 'currently-reading'
      expect(entry.isWantToRead()).toBe(false)
      expect(entry.isCurrentlyReading()).toBe(true)
      expect(entry.isRead()).toBe(false)

      entry.status = 'read'
      expect(entry.isWantToRead()).toBe(false)
      expect(entry.isCurrentlyReading()).toBe(false)
      expect(entry.isRead()).toBe(true)
    })
  })

  describe('Static Methods', () => {
    it('should get user reading stats', async () => {
      // Create multiple entries for the user
      await ReadingListEntry.create({
        userId: user.id,
        bookId: book.id,
        status: 'read',
      })

      const book2 = await Book.create({
        isbn: '9780061120084',
        title: 'To Kill a Mockingbird',
        authors: ['Harper Lee'],
        categories: ['Classic'],
      })

      await ReadingListEntry.create({
        userId: user.id,
        bookId: book2.id,
        status: 'currently-reading',
      })

      const book3 = await Book.create({
        isbn: '9780451524935',
        title: '1984',
        authors: ['George Orwell'],
        categories: ['Science Fiction'],
      })

      await ReadingListEntry.create({
        userId: user.id,
        bookId: book3.id,
        status: 'want-to-read',
      })

      const stats = await ReadingListEntry.getUserReadingStats(user.id)

      expect(stats.totalBooks).toBe(3)
      expect(stats.booksRead).toBe(1)
      expect(stats.booksCurrentlyReading).toBe(1)
      expect(stats.booksWantToRead).toBe(1)
    })
  })
})