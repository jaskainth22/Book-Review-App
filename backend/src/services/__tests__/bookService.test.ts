import { bookService } from '../bookService';
import { Book } from '../../models/Book';
import axios from 'axios';

// Mock dependencies
jest.mock('axios');
jest.mock('../../models/Book');
jest.mock('../../config/database', () => ({
  redisClient: {
    get: jest.fn(),
    setEx: jest.fn(),
    keys: jest.fn(),
    del: jest.fn()
  }
}));
jest.mock('../../utils/logger');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const MockedBook = Book as jest.MockedClass<typeof Book>;

describe('BookService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GOOGLE_BOOKS_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    delete process.env.GOOGLE_BOOKS_API_KEY;
  });

  describe('searchBooks', () => {
    it('should search books successfully', async () => {
      const mockBooks = [
        {
          id: '1',
          isbn: '9781234567890',
          title: 'Test Book 1',
          authors: ['Author 1'],
          description: 'Test description',
          averageRating: 4.5,
          ratingsCount: 100
        }
      ];

      MockedBook.findAll = jest.fn().mockResolvedValue(mockBooks);

      const result = await bookService.searchBooks({ query: 'test' });

      expect(MockedBook.findAll).toHaveBeenCalled();
      expect(result.books).toEqual(mockBooks);
      expect(result.totalItems).toBe(1);
    });

    it('should handle empty search results', async () => {
      MockedBook.findAll = jest.fn().mockResolvedValue([]);
      mockedAxios.get.mockResolvedValue({
        data: { totalItems: 0, items: [] }
      } as any);

      const result = await bookService.searchBooks({ query: 'nonexistent' });

      expect(result.books).toEqual([]);
      expect(result.totalItems).toBe(0);
    });

    it('should handle search with filters', async () => {
      MockedBook.findAll = jest.fn().mockResolvedValue([]);
      mockedAxios.get.mockResolvedValue({
        data: { totalItems: 0, items: [] }
      } as any);

      await bookService.searchBooks({
        query: 'test',
        author: 'John Doe',
        title: 'Test Title',
        category: 'Fiction'
      });

      expect(MockedBook.findAll).toHaveBeenCalledWith({
        where: expect.objectContaining({
          authors: { [Symbol.for('contains')]: ['John Doe'] },
          title: { [Symbol.for('iLike')]: '%Test Title%' },
          categories: { [Symbol.for('contains')]: ['Fiction'] }
        }),
        limit: 10,
        offset: 0,
        order: [['averageRating', 'DESC'], ['ratingsCount', 'DESC']]
      });
    });

    it('should handle database errors', async () => {
      MockedBook.findAll = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(bookService.searchBooks({ query: 'test' }))
        .rejects.toThrow('Failed to search books');
    });
  });

  describe('getBookById', () => {
    it('should return book from database', async () => {
      const mockBook = {
        id: '1',
        isbn: '9781234567890',
        title: 'Test Book',
        authors: ['Author'],
        description: 'Description'
      };

      MockedBook.findByPk = jest.fn().mockResolvedValue(mockBook);

      const result = await bookService.getBookById('1');

      expect(MockedBook.findByPk).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockBook);
    });

    it('should return null if book not found', async () => {
      MockedBook.findByPk = jest.fn().mockResolvedValue(null);
      mockedAxios.get.mockRejectedValue(new Error('Not found'));

      const result = await bookService.getBookById('nonexistent');

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      MockedBook.findByPk = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(bookService.getBookById('1'))
        .rejects.toThrow('Failed to get book details');
    });
  });

  describe('getBookByIsbn', () => {
    it('should return book from database by ISBN', async () => {
      const mockBook = {
        id: '1',
        isbn: '9781234567890',
        title: 'Test Book'
      };

      MockedBook.findOne = jest.fn().mockResolvedValue(mockBook);

      const result = await bookService.getBookByIsbn('9781234567890');

      expect(MockedBook.findOne).toHaveBeenCalledWith({
        where: { isbn: '9781234567890' }
      });
      expect(result).toEqual(mockBook);
    });

    it('should return null if book not found', async () => {
      MockedBook.findOne = jest.fn().mockResolvedValue(null);
      mockedAxios.get.mockResolvedValue({
        data: { totalItems: 0, items: [] }
      } as any);

      const result = await bookService.getBookByIsbn('9781234567890');

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      MockedBook.findOne = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(bookService.getBookByIsbn('9781234567890'))
        .rejects.toThrow('Failed to get book by ISBN');
    });
  });

  describe('addOrUpdateBook', () => {
    it('should update existing book if ISBN exists', async () => {
      const bookData = {
        isbn: '9781234567890',
        title: 'New Book',
        authors: ['Author'],
        description: 'Description'
      };

      const existingBook = { 
        id: '1', 
        update: jest.fn().mockResolvedValue(undefined)
      };
      
      MockedBook.findOne = jest.fn().mockResolvedValue(existingBook);

      const result = await bookService.addOrUpdateBook(bookData);

      expect(MockedBook.findOne).toHaveBeenCalledWith({
        where: { isbn: '9781234567890' }
      });
      expect(existingBook.update).toHaveBeenCalledWith(bookData);
      expect(result).toBe(existingBook);
    });

    it('should create new book if ISBN does not exist', async () => {
      const bookData = {
        isbn: '9781234567890',
        title: 'New Book',
        authors: ['Author'],
        description: 'Description'
      };

      const newBook = { id: '2', ...bookData };
      MockedBook.findOne = jest.fn().mockResolvedValue(null);
      MockedBook.create = jest.fn().mockResolvedValue(newBook);

      const result = await bookService.addOrUpdateBook(bookData);

      expect(MockedBook.create).toHaveBeenCalledWith(bookData);
      expect(result).toBe(newBook);
    });

    it('should handle books without ISBN', async () => {
      const bookDataWithoutIsbn = { 
        title: 'Book', 
        authors: ['Author'] 
      };
      
      const newBook = { id: '3', ...bookDataWithoutIsbn };
      MockedBook.create = jest.fn().mockResolvedValue(newBook);

      const result = await bookService.addOrUpdateBook(bookDataWithoutIsbn);

      expect(MockedBook.create).toHaveBeenCalledWith(bookDataWithoutIsbn);
      expect(result).toBe(newBook);
    });

    it('should handle database errors', async () => {
      MockedBook.findOne = jest.fn().mockRejectedValue(new Error('Database error'));
      MockedBook.create = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(bookService.addOrUpdateBook({ title: 'Test', authors: ['Author'] }))
        .rejects.toThrow('Failed to add or update book');
    });
  });

  describe('without Google Books API key', () => {
    it('should work with local database only when enough local results', async () => {
      // Mock enough local books to satisfy the request
      const mockLocalBooks = Array.from({ length: 10 }, (_, i) => ({ 
        id: `${i + 1}`, 
        title: `Local Book ${i + 1}` 
      }));
      
      MockedBook.findAll = jest.fn().mockResolvedValue(mockLocalBooks);

      const result = await bookService.searchBooks({ query: 'test', maxResults: 10 });

      expect(result.books).toHaveLength(10);
      expect(result.totalItems).toBe(10);
      // With enough local results, we don't need to call Google API
    });
  });
});