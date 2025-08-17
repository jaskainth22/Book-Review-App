import { Router } from 'express';
import { bookController } from '../controllers/bookController';
import { authenticateToken } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting for book search to prevent API abuse
const searchRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many search requests. Please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting for book creation/updates
const modifyRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 requests per 5 minutes
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many book modification requests. Please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Public routes (no authentication required)
router.get('/search', searchRateLimit, bookController.searchBooks.bind(bookController));
router.get('/popular', searchRateLimit, bookController.getPopularBooks.bind(bookController));
router.get('/isbn/:isbn', bookController.getBookByIsbn.bind(bookController));
router.get('/:id', bookController.getBookById.bind(bookController));

// Protected routes (authentication required)
router.post('/', authenticateToken, modifyRateLimit, bookController.addBook.bind(bookController));
router.put('/:id', authenticateToken, modifyRateLimit, bookController.updateBook.bind(bookController));

export default router;