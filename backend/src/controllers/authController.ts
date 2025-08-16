import { Request, Response } from 'express'
import passport from 'passport'
import { AuthService } from '../services/authService'
import { logger } from '../utils/logger'
import { User } from '../models/User'
import {
    registerSchema,
    loginSchema,
    passwordResetRequestSchema,
    passwordResetSchema,
    refreshTokenSchema,
    emailVerificationSchema
} from '../validation/authValidation'

export class AuthController {
    /**
     * Register a new user
     */
    static async register(req: Request, res: Response): Promise<void> {
        try {
            // Validate request body
            const { error, value } = registerSchema.validate(req.body)
            if (error) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: error.details[0].message,
                        details: error.details
                    }
                })
                return
            }

            const user = await AuthService.register(value)

            // Generate email verification token
            const verificationToken = AuthService.generateEmailVerificationToken(user)

            // TODO: Send verification email
            logger.info(`Email verification token for ${user.email}: ${verificationToken}`)

            res.status(201).json({
                success: true,
                data: {
                    user,
                    message: 'Registration successful. Please check your email to verify your account.'
                }
            })
        } catch (error) {
            logger.error('Registration error:', error)

            const message = error instanceof Error ? error.message : 'Registration failed'
            const statusCode = message.includes('already exists') || message.includes('already taken') ? 409 : 500

            res.status(statusCode).json({
                success: false,
                error: {
                    code: 'REGISTRATION_ERROR',
                    message
                }
            })
        }
    }

    /**
     * Login user
     */
    static async login(req: Request, res: Response): Promise<void> {
        try {
            // Validate request body
            const { error, value } = loginSchema.validate(req.body)
            if (error) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: error.details[0].message,
                        details: error.details
                    }
                })
                return
            }

            const authResult = await AuthService.login(value)

            res.status(200).json({
                success: true,
                data: authResult
            })
        } catch (error) {
            logger.error('Login error:', error)

            const message = error instanceof Error ? error.message : 'Login failed'
            const statusCode = message.includes('Invalid credentials') ? 401 : 500

            res.status(statusCode).json({
                success: false,
                error: {
                    code: 'LOGIN_ERROR',
                    message
                }
            })
        }
    }

    /**
     * Refresh access token
     */
    static async refreshToken(req: Request, res: Response): Promise<void> {
        try {
            // Validate request body
            const { error, value } = refreshTokenSchema.validate(req.body)
            if (error) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: error.details[0].message,
                        details: error.details
                    }
                })
                return
            }

            const authResult = await AuthService.refreshToken(value.refreshToken)

            res.status(200).json({
                success: true,
                data: authResult
            })
        } catch (error) {
            logger.error('Token refresh error:', error)

            const message = error instanceof Error ? error.message : 'Token refresh failed'
            const statusCode = message.includes('Invalid') || message.includes('expired') ? 401 : 500

            res.status(statusCode).json({
                success: false,
                error: {
                    code: 'TOKEN_REFRESH_ERROR',
                    message
                }
            })
        }
    }

    /**
     * Request password reset
     */
    static async requestPasswordReset(req: Request, res: Response): Promise<void> {
        try {
            // Validate request body
            const { error, value } = passwordResetRequestSchema.validate(req.body)
            if (error) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: error.details[0].message,
                        details: error.details
                    }
                })
                return
            }

            await AuthService.initiatePasswordReset(value.email)

            // Always return success for security (don't reveal if email exists)
            res.status(200).json({
                success: true,
                data: {
                    message: 'If an account with that email exists, a password reset link has been sent.'
                }
            })
        } catch (error) {
            logger.error('Password reset request error:', error)

            res.status(500).json({
                success: false,
                error: {
                    code: 'PASSWORD_RESET_REQUEST_ERROR',
                    message: 'Failed to process password reset request'
                }
            })
        }
    }

    /**
     * Reset password
     */
    static async resetPassword(req: Request, res: Response): Promise<void> {
        try {
            // Validate request body
            const { error, value } = passwordResetSchema.validate(req.body)
            if (error) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: error.details[0].message,
                        details: error.details
                    }
                })
                return
            }

            await AuthService.resetPassword(value.token, value.password)

            res.status(200).json({
                success: true,
                data: {
                    message: 'Password has been reset successfully'
                }
            })
        } catch (error) {
            logger.error('Password reset error:', error)

            const message = error instanceof Error ? error.message : 'Password reset failed'
            const statusCode = message.includes('Invalid') || message.includes('expired') ? 400 : 500

            res.status(statusCode).json({
                success: false,
                error: {
                    code: 'PASSWORD_RESET_ERROR',
                    message
                }
            })
        }
    }

    /**
     * Verify email
     */
    static async verifyEmail(req: Request, res: Response): Promise<void> {
        try {
            // Validate request body
            const { error, value } = emailVerificationSchema.validate(req.body)
            if (error) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: error.details[0].message,
                        details: error.details
                    }
                })
                return
            }

            const user = await AuthService.verifyEmail(value.token)

            res.status(200).json({
                success: true,
                data: {
                    user,
                    message: 'Email verified successfully'
                }
            })
        } catch (error) {
            logger.error('Email verification error:', error)

            const message = error instanceof Error ? error.message : 'Email verification failed'
            const statusCode = message.includes('Invalid') || message.includes('expired') ? 400 : 500

            res.status(statusCode).json({
                success: false,
                error: {
                    code: 'EMAIL_VERIFICATION_ERROR',
                    message
                }
            })
        }
    }

    /**
     * Get current user profile
     */
    static async getProfile(req: Request, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: {
                        code: 'AUTHENTICATION_REQUIRED',
                        message: 'Authentication required'
                    }
                })
                return
            }

            res.status(200).json({
                success: true,
                data: {
                    user: req.user
                }
            })
        } catch (error) {
            logger.error('Get profile error:', error)

            res.status(500).json({
                success: false,
                error: {
                    code: 'PROFILE_ERROR',
                    message: 'Failed to get user profile'
                }
            })
        }
    }

    /**
     * Logout user (client-side token removal)
     */
    static async logout(req: Request, res: Response): Promise<void> {
        try {
            // In a JWT-based system, logout is typically handled client-side
            // by removing the token from storage. However, we can log the event.
            if (req.user) {
                logger.info(`User logged out: ${(req.user as any).email}`)
            }

            res.status(200).json({
                success: true,
                data: {
                    message: 'Logged out successfully'
                }
            })
        } catch (error) {
            logger.error('Logout error:', error)

            res.status(500).json({
                success: false,
                error: {
                    code: 'LOGOUT_ERROR',
                    message: 'Logout failed'
                }
            })
        }
    }

    /**
     * Initiate Google OAuth authentication
     */
    static googleAuth = passport.authenticate('google', {
        scope: ['profile', 'email']
    })

    /**
     * Handle Google OAuth callback
     */
    static async googleCallback(req: Request, res: Response): Promise<void> {
        try {
            const user = req.user as User
            if (!user) {
                // Redirect to frontend with error
                const errorUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/error?message=Authentication failed`
                res.redirect(errorUrl)
                return
            }

            // Generate tokens
            const authResult = await AuthService.googleOAuth(user)

            // Redirect to frontend with tokens
            const successUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/success?token=${authResult.token}&refreshToken=${authResult.refreshToken}`
            res.redirect(successUrl)
        } catch (error) {
            logger.error('Google OAuth callback error:', error)
            
            const errorUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/error?message=Authentication failed`
            res.redirect(errorUrl)
        }
    }

    /**
     * Link Google account to existing user
     */
    static async linkGoogleAccount(req: Request, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: {
                        code: 'AUTHENTICATION_REQUIRED',
                        message: 'Authentication required'
                    }
                })
                return
            }

            const { googleId } = req.body
            if (!googleId) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Google ID is required'
                    }
                })
                return
            }

            const user = await AuthService.linkGoogleAccount((req.user as User).id, googleId)

            res.status(200).json({
                success: true,
                data: {
                    user,
                    message: 'Google account linked successfully'
                }
            })
        } catch (error) {
            logger.error('Link Google account error:', error)

            const message = error instanceof Error ? error.message : 'Failed to link Google account'
            const statusCode = message.includes('already linked') ? 409 : 500

            res.status(statusCode).json({
                success: false,
                error: {
                    code: 'GOOGLE_LINK_ERROR',
                    message
                }
            })
        }
    }

    /**
     * Unlink Google account from user
     */
    static async unlinkGoogleAccount(req: Request, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: {
                        code: 'AUTHENTICATION_REQUIRED',
                        message: 'Authentication required'
                    }
                })
                return
            }

            const user = await AuthService.unlinkGoogleAccount((req.user as User).id)

            res.status(200).json({
                success: true,
                data: {
                    user,
                    message: 'Google account unlinked successfully'
                }
            })
        } catch (error) {
            logger.error('Unlink Google account error:', error)

            const message = error instanceof Error ? error.message : 'Failed to unlink Google account'
            const statusCode = message.includes('No Google account') || message.includes('Cannot unlink') ? 400 : 500

            res.status(statusCode).json({
                success: false,
                error: {
                    code: 'GOOGLE_UNLINK_ERROR',
                    message
                }
            })
        }
    }
}