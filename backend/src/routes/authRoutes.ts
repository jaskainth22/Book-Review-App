import { Router } from 'express'
import passport from 'passport'
import { AuthController } from '../controllers/authController'
import { authenticateToken } from '../middleware/auth'
import rateLimit from 'express-rate-limit'

const router = Router()

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs for auth endpoints
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
})

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 password reset requests per hour
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many password reset requests, please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Public routes
router.post('/register', authLimiter, AuthController.register)
router.post('/login', authLimiter, AuthController.login)
router.post('/refresh-token', AuthController.refreshToken)
router.post('/password-reset/request', passwordResetLimiter, AuthController.requestPasswordReset)
router.post('/password-reset/confirm', AuthController.resetPassword)
router.post('/verify-email', AuthController.verifyEmail)

// Google OAuth routes
router.get('/google', AuthController.googleAuth)
router.get('/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/error?message=OAuth failed`,
    session: false 
  }),
  AuthController.googleCallback
)

// Protected routes
router.get('/profile', authenticateToken, AuthController.getProfile)
router.post('/logout', authenticateToken, AuthController.logout)
router.post('/google/link', authenticateToken, AuthController.linkGoogleAccount)
router.post('/google/unlink', authenticateToken, AuthController.unlinkGoogleAccount)

export default router