import request from 'supertest';
import express from 'express';
import bookRoutes from '../bookRoutes';
import { bookService } from '../../services/bookService';
import { authenticateToken } from '../../middleware/auth';
import { BookController } from '../../controllers/bookController';

// Mock dependencies
jest.mock('../../services/bookService');
jest.mock('../../middleware/auth');
jest.mock('../../utils/logger');

const mockedBookService = bookService as jest.Mocked<typeof bookService>;
const mockedAuthenticateToken = authenticateToken as jest.MockedFunction<typeof authenticateToken>;

describe('Book Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/books', bookRoutes);
    jest.clearAllMocks();

    // Mock authentication middleware to pass by default
    mockedAuthenticateToken.mockImplementation(async (req, res, next) => {
      (req as any).user = { id: 'user1', email: 'test@example.com' };
      next();
    });
  });

  describe('GET /api/books/search', () => {
    it('should search books successfully', async () => {
      const mockResult = {
        books: [
          {
            id: '1',
            title: 'Test Book',
            authors: ['Author 1'],
            isbn: '9781234567890',
            averageRating: 4.5
          }
        ] as any[],
        totalItems: 1,
        hasMore: false
      };

      mockedBookService.searchBooks.mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/books/search')
        .query({ query: 'test book' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books).toEqual(mockResult.books);
      expect(mockedBookService.searchBooks).toHaveBeenCalledWith({
        query: 'test book',
        maxResults: 10,
        startIndex: 0
      });
    });

    it('should handle search with multiple parameters', async () => {
      const mockResult = {
        books: [] as any[],
        totalItems: 0,
        hasMore: false
      };

      mockedBookService.searchBooks.mockResolvedValue(mockResult);

      await request(app)
        .get('/api/books/search')
        .query({
          query: 'javascript',
          author: 'Douglas Crockford',
          category: 'Programming',
          maxResults: 20
        })
        .expect(200);

      expect(mockedBookService.searchBooks).toHaveBeenCalledWith({
        query: 'javascript',
        author: 'Douglas Crockford',
        category: 'Programming',
        maxResults: 20,
        startIndex: 0
      });
    });

    it('should validate search parameters', async () => {
      const response = await request(app)
        .get('/api/books/search')
        .query({ maxResults: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should require at least one search parameter', async () => {
      const response = await request(app)
        .get('/api/books/search')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/books/popular', () => {
    it('should get popular books successfully', async () => {
      const mockResult = {
        books: [
          { id: '1', title: 'Popular Book 1', averageRating: 4.8 },
          { id: '2', title: 'Popular Book 2', averageRating: 4.7 }
        ] as any[],
        totalItems: 2,
        hasMore: false
      };

      mockedBookService.searchBooks.mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/books/popular')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books).toEqual(mockResult.books);
      expect(mockedBookService.searchBooks).toHaveBeenCalledWith({
        query: '',
        maxResults: 20,
        startIndex: 0
      });
    });

    it('should handle pagination for popular books', async () => {
      const mockResult = {
        books: [] as any[],
        totalItems: 100,
        hasMore: true
      };

      mockedBookService.searchBooks.mockResolvedValue(mockResult);

      await request(app)
        .get('/api/books/popular')
        .query({ maxResults: 10, startIndex: 20 })
        .expect(200);

      expect(mockedBookService.searchBooks).toHaveBeenCalledWith({
        query: '',
        maxResults: 10,
        startIndex: 20
      });
    });
  });

  describe('GET /api/books/isbn/:isbn', () => {
    it('should get book by ISBN successfully', async () => {
      const mockBook = {
        id: '1',
        title: 'Test Book',
        isbn: '9781234567890',
        authors: ['Author 1']
      };

      mockedBookService.getBookByIsbn.mockResolvedValue(mockBook as any);

      const response = await request(app)
        .get('/api/books/isbn/9781234567890')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.book).toEqual(mockBook);
      expect(mockedBookService.getBookByIsbn).toHaveBeenCalledWith('9781234567890');
    });

    it('should return 404 for non-existent ISBN', async () => {
      mockedBookService.getBookByIsbn.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/books/isbn/9781234567890')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('BOOK_NOT_FOUND');
    });

    it('should validate ISBN format', async () => {
      const response = await request(app)
        .get('/api/books/isbn/invalid-isbn')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/books/:id', () => {
    it('should get book by ID successfully', async () => {
      const mockBook = {
        id: '1',
        title: 'Test Book',
        authors: ['Author 1']
      };

      mockedBookService.getBookById.mockResolvedValue(mockBook as any);

      const response = await request(app)
        .get('/api/books/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.book).toEqual(mockBook);
      expect(mockedBookService.getBookById).toHaveBeenCalledWith('1');
    });

    it('should return 404 for non-existent book', async () => {
      mockedBookService.getBookById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/books/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('BOOK_NOT_FOUND');
    });
  });

  describe('POST /api/books', () => {
    it('should add book successfully when authenticated', async () => {
      const bookData = {
        title: 'New Book',
        authors: ['Author 1'],
        isbn: '9781234567890',
        description: 'Test description'
      };

      const mockBook = { id: '1', ...bookData };
      mockedBookService.addOrUpdateBook.mockResolvedValue(mockBook as any);

      const response = await request(app)
        .post('/api/books')
        .send(bookData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.book).toEqual(mockBook);
      expect(response.body.message).toBe('Book added successfully');
      expect(mockedBookService.addOrUpdateBook).toHaveBeenCalledWith(bookData);
    });

    it('should require authentication', async () => {
      // Mock authentication to fail
      mockedAuthenticateToken.mockImplementation(async (req, res, next) => {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        });
      });

      const response = await request(app)
        .post('/api/books')
        .send({
          title: 'New Book',
          authors: ['Author 1']
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should validate book data', async () => {
      const response = await request(app)
        .post('/api/books')
        .send({ isbn: '9781234567890' }) // Missing required fields
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PUT /api/books/:id', () => {
    it('should update book successfully when authenticated', async () => {
      const updateData = {
        title: 'Updated Book',
        description: 'Updated description'
      };

      const existingBook = { id: '1', title: 'Old Title' };
      const updatedBook = { id: '1', ...updateData };

      mockedBookService.getBookById.mockResolvedValue(existingBook as any);
      mockedBookService.addOrUpdateBook.mockResolvedValue(updatedBook as any);

      const response = await request(app)
        .put('/api/books/1')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.book).toEqual(updatedBook);
      expect(response.body.message).toBe('Book updated successfully');
    });

    it('should require authentication', async () => {
      // Mock authentication to fail
      mockedAuthenticateToken.mockImplementation(async (req, res, next) => {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        });
      });

      const response = await request(app)
        .put('/api/books/1')
        .send({ title: 'Updated Title' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 404 for non-existent book', async () => {
      mockedBookService.getBookById.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/books/nonexistent')
        .send({ title: 'Updated Title' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('BOOK_NOT_FOUND');
    });
  });

  describe('Rate limiting', () => {
    it('should apply rate limiting to search endpoints', async () => {
      const mockResult = {
        books: [] as any[],
        totalItems: 0,
        hasMore: false
      };

      mockedBookService.searchBooks.mockResolvedValue(mockResult);

      // Make multiple requests to test rate limiting
      const requests = Array(35).fill(null).map(() =>
        request(app)
          .get('/api/books/search')
          .query({ query: 'test' })
      );

      const responses = await Promise.all(requests);

      // Some requests should be rate limited (429 status)
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should apply rate limiting to modification endpoints', async () => {
      const mockBook = {
        id: '1',
        title: 'Test Book',
        authors: ['Author']
      };

      mockedBookService.addOrUpdateBook.mockResolvedValue(mockBook as any);

      // Make multiple requests to test rate limiting
      const requests = Array(15).fill(null).map(() =>
        request(app)
          .post('/api/books')
          .send({
            title: 'Test Book',
            authors: ['Author']
          })
      );

      const responses = await Promise.all(requests);

      // Some requests should be rate limited (429 status)
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Error handling', () => {
    let errorApp: express.Application;
    let bookController: BookController;

    beforeEach(() => {
      // Create a fresh app instance without rate limiting for error tests
      errorApp = express();
      errorApp.use(express.json());
      bookController = new BookController();
      
      // Create routes without rate limiting
      const router = express.Router();
      router.get('/search', bookController.searchBooks.bind(bookController));
      router.get('/:id', bookController.getBookById.bind(bookController));
      errorApp.use('/api/books', router);
      
      jest.clearAllMocks();
    });

    it('should handle service errors gracefully', async () => {
      mockedBookService.searchBooks.mockRejectedValue(new Error('Service error'));

      const response = await request(errorApp)
        .get('/api/books/search')
        .query({ query: 'test' })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INTERNAL_ERROR');
    });

    it('should handle database connection errors', async () => {
      mockedBookService.getBookById.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(errorApp)
        .get('/api/books/1')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INTERNAL_ERROR');
    });
  });
});