import request from 'supertest';
import express from 'express';
import { BookController } from '../bookController';
import { bookService } from '../../services/bookService';
import { expect } from 'chai';
import { it } from 'node:test';
import { expect } from 'chai';
import { it } from 'node:test';
import { expect } from 'chai';
import { expect } from 'chai';
import { it } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import { expect } from 'chai';
import { expect } from 'chai';
import { it } from 'node:test';
import { expect } from 'chai';
import { it } from 'node:test';
import { expect } from 'chai';
import { expect } from 'chai';
import { expect } from 'chai';
import { it } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import { expect } from 'chai';
import { it } from 'node:test';
import { expect } from 'chai';
import { expect } from 'chai';
import { it } from 'node:test';
import { expect } from 'chai';
import { expect } from 'chai';
import { it } from 'node:test';
import { expect } from 'chai';
import { expect } from 'chai';
import { it } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import { expect } from 'chai';
import { expect } from 'chai';
import { it } from 'node:test';
import { expect } from 'chai';
import { it } from 'node:test';
import { expect } from 'chai';
import { expect } from 'chai';
import { it } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import { expect } from 'chai';
import { it } from 'node:test';
import { expect } from 'chai';
import { it } from 'node:test';
import { expect } from 'chai';
import { expect } from 'chai';
import { it } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import { expect } from 'chai';
import { it } from 'node:test';
import { expect } from 'chai';
import { expect } from 'chai';
import { it } from 'node:test';
import { expect } from 'chai';
import { expect } from 'chai';
import { it } from 'node:test';
import { expect } from 'chai';
import { it } from 'node:test';
import { expect } from 'chai';
import { expect } from 'chai';
import { it } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

// Mock the book service
jest.mock('../../services/bookService');
jest.mock('../../utils/logger');

const mockedBookService = bookService as jest.Mocked<typeof bookService>;

describe('BookController', () => {
  let app: express.Application;
  let bookController: BookController;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    bookController = new BookController();
    jest.clearAllMocks();
  });

  describe('GET /search', () => {
    beforeEach(() => {
      app.get('/search', bookController.searchBooks.bind(bookController));
    });

    it('should return search results successfully', async () => {
      const mockResult = {
        books: [
          {
            id: '1',
            title: 'Test Book',
            authors: ['Author 1'],
            isbn: '9781234567890',
            averageRating: 4.5,
            ratingsCount: 100
          }
        ] as any[],
        totalItems: 1,
        hasMore: false
      };

      mockedBookService.searchBooks.mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/search')
        .query({ query: 'test book' })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          books: mockResult.books,
          pagination: {
            totalItems: 1,
            currentPage: 1,
            totalPages: 1,
            hasMore: false,
            itemsPerPage: 10
          }
        }
      });

      expect(mockedBookService.searchBooks).toHaveBeenCalledWith({
        query: 'test book',
        maxResults: 10,
        startIndex: 0
      });
    });

    it('should handle search with all parameters', async () => {
      const mockResult = {
        books: [] as any[],
        totalItems: 0,
        hasMore: false
      };

      mockedBookService.searchBooks.mockResolvedValue(mockResult);

      await request(app)
        .get('/search')
        .query({
          query: 'test',
          author: 'John Doe',
          title: 'Test Title',
          isbn: '1234567890',
          category: 'Fiction',
          maxResults: 20,
          startIndex: 10
        })
        .expect(200);

      expect(mockedBookService.searchBooks).toHaveBeenCalledWith({
        query: 'test',
        author: 'John Doe',
        title: 'Test Title',
        isbn: '1234567890',
        category: 'Fiction',
        maxResults: 20,
        startIndex: 10
      });
    });

    it('should return validation error for invalid parameters', async () => {
      const response = await request(app)
        .get('/search')
        .query({ maxResults: 'invalid' })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid search parameters',
          details: expect.any(Array)
        }
      });
    });

    it('should require at least one search parameter', async () => {
      const response = await request(app)
        .get('/search')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle service errors', async () => {
      mockedBookService.searchBooks.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/search')
        .query({ query: 'test' })
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to search books'
        }
      });
    });
  });

  describe('GET /:id', () => {
    beforeEach(() => {
      app.get('/:id', bookController.getBookById.bind(bookController));
    });

    it('should return book by ID successfully', async () => {
      const mockBook = {
        id: '1',
        title: 'Test Book',
        authors: ['Author 1'],
        isbn: '9781234567890'
      };

      mockedBookService.getBookById.mockResolvedValue(mockBook as any);

      const response = await request(app)
        .get('/1')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: { book: mockBook }
      });

      expect(mockedBookService.getBookById).toHaveBeenCalledWith('1');
    });

    it('should return 404 when book not found', async () => {
      mockedBookService.getBookById.mockResolvedValue(null);

      const response = await request(app)
        .get('/nonexistent')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'BOOK_NOT_FOUND',
          message: 'Book not found'
        }
      });
    });

    it('should handle service errors', async () => {
      mockedBookService.getBookById.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/1')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get book details'
        }
      });
    });
  });

  describe('GET /isbn/:isbn', () => {
    beforeEach(() => {
      app.get('/isbn/:isbn', bookController.getBookByIsbn.bind(bookController));
    });

    it('should return book by ISBN successfully', async () => {
      const mockBook = {
        id: '1',
        title: 'Test Book',
        isbn: '9781234567890'
      };

      mockedBookService.getBookByIsbn.mockResolvedValue(mockBook as any);

      const response = await request(app)
        .get('/isbn/9781234567890')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: { book: mockBook }
      });

      expect(mockedBookService.getBookByIsbn).toHaveBeenCalledWith('9781234567890');
    });

    it('should return 404 when book not found by ISBN', async () => {
      mockedBookService.getBookByIsbn.mockResolvedValue(null);

      const response = await request(app)
        .get('/isbn/9781234567890')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'BOOK_NOT_FOUND',
          message: 'Book not found'
        }
      });
    });

    it('should validate ISBN format', async () => {
      const response = await request(app)
        .get('/isbn/invalid-isbn')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /', () => {
    beforeEach(() => {
      app.post('/', bookController.addBook.bind(bookController));
    });

    it('should add book successfully', async () => {
      const bookData = {
        title: 'New Book',
        authors: ['Author 1'],
        isbn: '9781234567890',
        description: 'Test description',
        publishedDate: '2023-01-01',
        publisher: 'Test Publisher',
        pageCount: 300,
        categories: ['Fiction'],
        coverImage: 'https://example.com/cover.jpg'
      };

      const expectedBookData = {
        ...bookData,
        publishedDate: new Date('2023-01-01')
      };

      const mockBook = { id: '1', ...bookData };
      mockedBookService.addOrUpdateBook.mockResolvedValue(mockBook as any);

      const response = await request(app)
        .post('/')
        .send(bookData)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        data: { book: mockBook },
        message: 'Book added successfully'
      });

      expect(mockedBookService.addOrUpdateBook).toHaveBeenCalledWith(expectedBookData);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/')
        .send({ isbn: '9781234567890' }) // Missing title and authors
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should validate ISBN format', async () => {
      const response = await request(app)
        .post('/')
        .send({
          title: 'Test Book',
          authors: ['Author'],
          isbn: 'invalid-isbn'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle service errors', async () => {
      mockedBookService.addOrUpdateBook.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .post('/')
        .send({
          title: 'Test Book',
          authors: ['Author']
        })
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to add book'
        }
      });
    });
  });

  describe('PUT /:id', () => {
    beforeEach(() => {
      app.put('/:id', bookController.updateBook.bind(bookController));
    });

    it('should update book successfully', async () => {
      const updateData = {
        title: 'Updated Book',
        description: 'Updated description'
      };

      const existingBook = { id: '1', title: 'Old Title' };
      const updatedBook = { id: '1', ...updateData };

      mockedBookService.getBookById.mockResolvedValue(existingBook as any);
      mockedBookService.addOrUpdateBook.mockResolvedValue(updatedBook as any);

      const response = await request(app)
        .put('/1')
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: { book: updatedBook },
        message: 'Book updated successfully'
      });

      expect(mockedBookService.getBookById).toHaveBeenCalledWith('1');
      expect(mockedBookService.addOrUpdateBook).toHaveBeenCalledWith({
        ...updateData,
        id: '1'
      });
    });

    it('should return 404 when book not found', async () => {
      mockedBookService.getBookById.mockResolvedValue(null);

      const response = await request(app)
        .put('/nonexistent')
        .send({ title: 'Updated Title' })
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'BOOK_NOT_FOUND',
          message: 'Book not found'
        }
      });
    });

    it('should validate update data', async () => {
      const response = await request(app)
        .put('/1')
        .send({ isbn: 'invalid-isbn' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /popular', () => {
    beforeEach(() => {
      app.get('/popular', bookController.getPopularBooks.bind(bookController));
    });

    it('should return popular books successfully', async () => {
      const mockResult = {
        books: [
          { id: '1', title: 'Popular Book 1', averageRating: 4.8 },
          { id: '2', title: 'Popular Book 2', averageRating: 4.7 }
        ] as any[],
        totalItems: 2,
        hasMore: false
      };

      mockedBookService.searchBooks.mockResolvedValue(mockResult as any);

      const response = await request(app)
        .get('/popular')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          books: mockResult.books,
          pagination: {
            totalItems: 2,
            currentPage: 1,
            totalPages: 1,
            hasMore: false,
            itemsPerPage: 20
          }
        }
      });

      expect(mockedBookService.searchBooks).toHaveBeenCalledWith({
        query: '',
        maxResults: 20,
        startIndex: 0
      });
    });

    it('should handle pagination parameters', async () => {
      const mockResult = {
        books: [] as any[],
        totalItems: 100,
        hasMore: true
      };

      mockedBookService.searchBooks.mockResolvedValue(mockResult as any);

      await request(app)
        .get('/popular')
        .query({ maxResults: 10, startIndex: 20 })
        .expect(200);

      expect(mockedBookService.searchBooks).toHaveBeenCalledWith({
        query: '',
        maxResults: 10,
        startIndex: 20
      });
    });

    it('should limit maxResults to 40', async () => {
      const mockResult = {
        books: [] as any[],
        totalItems: 0,
        hasMore: false
      };

      mockedBookService.searchBooks.mockResolvedValue(mockResult as any);

      await request(app)
        .get('/popular')
        .query({ maxResults: 100 })
        .expect(200);

      expect(mockedBookService.searchBooks).toHaveBeenCalledWith({
        query: '',
        maxResults: 40,
        startIndex: 0
      });
    });
  });
});