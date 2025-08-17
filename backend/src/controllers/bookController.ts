import { Request, Response } from 'express';
import { bookService, BookSearchQuery } from '../services/bookService';
import { logger } from '../utils/logger';
import Joi from 'joi';

// Validation schemas
const searchBooksSchema = Joi.object({
  query: Joi.string().min(1).max(200),
  author: Joi.string().max(100),
  title: Joi.string().max(200),
  isbn: Joi.string().pattern(/^[\d-X]+$/),
  category: Joi.string().max(50),
  maxResults: Joi.number().integer().min(1).max(40).default(10),
  startIndex: Joi.number().integer().min(0).default(0)
}).or('query', 'author', 'title', 'isbn', 'category');

const bookIdSchema = Joi.object({
  id: Joi.string().required()
});

const isbnSchema = Joi.object({
  isbn: Joi.string().pattern(/^[\d-X]+$/).required()
});

const addBookSchema = Joi.object({
  isbn: Joi.string().pattern(/^[\d-X]+$/),
  title: Joi.string().required().min(1).max(500),
  authors: Joi.array().items(Joi.string().max(100)).min(1).required(),
  description: Joi.string().max(5000).allow(''),
  publishedDate: Joi.date().iso(),
  publisher: Joi.string().max(200).allow(''),
  pageCount: Joi.number().integer().min(0),
  categories: Joi.array().items(Joi.string().max(50)),
  coverImage: Joi.string().uri().allow(''),
  averageRating: Joi.number().min(0).max(5),
  ratingsCount: Joi.number().integer().min(0)
});

export class BookController {
  /**
   * Search books
   * GET /api/books/search
   */
  async searchBooks(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = searchBooksSchema.validate(req.query);
      
      if (error) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid search parameters',
            details: error.details
          }
        });
        return;
      }

      const searchQuery: BookSearchQuery = value;
      const result = await bookService.searchBooks(searchQuery);

      res.json({
        success: true,
        data: {
          books: result.books,
          pagination: {
            totalItems: result.totalItems,
            currentPage: Math.floor((searchQuery.startIndex || 0) / (searchQuery.maxResults || 10)) + 1,
            totalPages: Math.ceil(result.totalItems / (searchQuery.maxResults || 10)),
            hasMore: result.hasMore,
            itemsPerPage: searchQuery.maxResults || 10
          }
        }
      });
    } catch (error) {
      logger.error('Error in searchBooks controller:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to search books'
        }
      });
    }
  }

  /**
   * Get book by ID
   * GET /api/books/:id
   */
  async getBookById(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = bookIdSchema.validate(req.params);
      
      if (error) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid book ID',
            details: error.details
          }
        });
        return;
      }

      const book = await bookService.getBookById(value.id);
      
      if (!book) {
        res.status(404).json({
          success: false,
          error: {
            code: 'BOOK_NOT_FOUND',
            message: 'Book not found'
          }
        });
        return;
      }

      res.json({
        success: true,
        data: { book }
      });
    } catch (error) {
      logger.error('Error in getBookById controller:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get book details'
        }
      });
    }
  }

  /**
   * Get book by ISBN
   * GET /api/books/isbn/:isbn
   */
  async getBookByIsbn(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = isbnSchema.validate(req.params);
      
      if (error) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid ISBN format',
            details: error.details
          }
        });
        return;
      }

      const book = await bookService.getBookByIsbn(value.isbn);
      
      if (!book) {
        res.status(404).json({
          success: false,
          error: {
            code: 'BOOK_NOT_FOUND',
            message: 'Book not found'
          }
        });
        return;
      }

      res.json({
        success: true,
        data: { book }
      });
    } catch (error) {
      logger.error('Error in getBookByIsbn controller:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get book by ISBN'
        }
      });
    }
  }

  /**
   * Add a new book
   * POST /api/books
   */
  async addBook(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = addBookSchema.validate(req.body);
      
      if (error) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid book data',
            details: error.details
          }
        });
        return;
      }

      const book = await bookService.addOrUpdateBook(value);

      res.status(201).json({
        success: true,
        data: { book },
        message: 'Book added successfully'
      });
    } catch (error) {
      logger.error('Error in addBook controller:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to add book'
        }
      });
    }
  }

  /**
   * Update a book
   * PUT /api/books/:id
   */
  async updateBook(req: Request, res: Response): Promise<void> {
    try {
      const { error: idError, value: idValue } = bookIdSchema.validate(req.params);
      
      if (idError) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid book ID',
            details: idError.details
          }
        });
        return;
      }

      const updateSchema = addBookSchema.fork(['title', 'authors'], (schema) => schema.optional());
      const { error: bodyError, value: bodyValue } = updateSchema.validate(req.body);
      
      if (bodyError) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid book data',
            details: bodyError.details
          }
        });
        return;
      }

      // Check if book exists
      const existingBook = await bookService.getBookById(idValue.id);
      if (!existingBook) {
        res.status(404).json({
          success: false,
          error: {
            code: 'BOOK_NOT_FOUND',
            message: 'Book not found'
          }
        });
        return;
      }

      const updatedBook = await bookService.addOrUpdateBook({
        ...bodyValue,
        id: idValue.id
      });

      res.json({
        success: true,
        data: { book: updatedBook },
        message: 'Book updated successfully'
      });
    } catch (error) {
      logger.error('Error in updateBook controller:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update book'
        }
      });
    }
  }

  /**
   * Get popular books
   * GET /api/books/popular
   */
  async getPopularBooks(req: Request, res: Response): Promise<void> {
    try {
      const { maxResults = 20, startIndex = 0 } = req.query;
      
      const searchQuery: BookSearchQuery = {
        query: '', // Empty query to get all books
        maxResults: Math.min(Number(maxResults), 40),
        startIndex: Number(startIndex)
      };

      const result = await bookService.searchBooks(searchQuery);

      res.json({
        success: true,
        data: {
          books: result.books,
          pagination: {
            totalItems: result.totalItems,
            currentPage: Math.floor(Number(startIndex) / Number(maxResults)) + 1,
            totalPages: Math.ceil(result.totalItems / Number(maxResults)),
            hasMore: result.hasMore,
            itemsPerPage: Number(maxResults)
          }
        }
      });
    } catch (error) {
      logger.error('Error in getPopularBooks controller:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get popular books'
        }
      });
    }
  }
}

export const bookController = new BookController();