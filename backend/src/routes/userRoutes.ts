import { Router } from 'express'
import { ReviewController } from '../controllers/reviewController'
import { validateQuery, reviewQuerySchema } from '../validation/reviewValidation'

const router = Router()

// Get reviews by a specific user
router.get('/:userId/reviews', validateQuery(reviewQuerySchema), ReviewController.getUserReviews)

// Get user review statistics
router.get('/:userId/reviews/stats', ReviewController.getUserReviewStats)

export default router