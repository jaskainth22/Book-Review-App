import { Router } from 'express'
import { ReviewController } from '../controllers/reviewController'
import { authenticateToken } from '../middleware/auth'
import {
  validateRequest,
  validateQuery,
  createReviewSchema,
  updateReviewSchema,
  reviewQuerySchema,
  searchReviewsSchema,
  flagReviewSchema,
} from '../validation/reviewValidation'

const router = Router()

// Create a new review (requires authentication)
router.post(
  '/',
  authenticateToken,
  validateRequest(createReviewSchema),
  ReviewController.createReview
)

// Get reviews with pagination and filtering
router.get(
  '/',
  validateQuery(reviewQuerySchema),
  ReviewController.getReviews
)

// Search reviews
router.get(
  '/search',
  validateQuery(searchReviewsSchema),
  ReviewController.searchReviews
)

// Get a specific review by ID
router.get(
  '/:id',
  ReviewController.getReview
)

// Update a review (requires authentication and ownership)
router.put(
  '/:id',
  authenticateToken,
  validateRequest(updateReviewSchema),
  ReviewController.updateReview
)

// Delete a review (requires authentication and ownership)
router.delete(
  '/:id',
  authenticateToken,
  ReviewController.deleteReview
)

// Flag a review for moderation (requires authentication)
router.post(
  '/:id/flag',
  authenticateToken,
  validateRequest(flagReviewSchema),
  ReviewController.flagReview
)

export default router