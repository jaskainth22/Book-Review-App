import jwt, { SignOptions } from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { User } from '../models/User'
import { config } from '../config/config'
import { logger } from '../utils/logger'

export interface RegisterData {
  email: string
  username: string
  displayName: string
  password: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthResult {
  user: User
  token: string
  refreshToken: string
}

export interface TokenPayload {
  userId: string
  email: string
  iat?: number
  exp?: number
}

export interface GoogleOAuthData {
  googleId: string
  email: string
  displayName: string
  avatar?: string
}

export class AuthService {
  private static readonly JWT_SECRET = config.jwt.secret || 'fallback-secret'
  private static readonly JWT_REFRESH_SECRET = config.jwt.refreshSecret || 'fallback-refresh-secret'
  private static readonly JWT_EXPIRES_IN = config.jwt.expiresIn || '24h'
  private static readonly JWT_REFRESH_EXPIRES_IN = config.jwt.refreshExpiresIn || '7d'

  /**
   * Register a new user
   */
  static async register(userData: RegisterData): Promise<User> {
    const { email, username, displayName, password } = userData

    // Validate input
    if (!User.validateEmail(email)) {
      throw new Error('Invalid email format')
    }

    if (!User.validateUsername(username)) {
      throw new Error('Username must be 3-50 characters and contain only letters, numbers, and underscores')
    }

    if (!User.validatePassword(password)) {
      throw new Error('Password must be at least 8 characters with uppercase, lowercase, and number')
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        email: email.toLowerCase()
      }
    })

    if (existingUser) {
      throw new Error('User with this email already exists')
    }

    // Check if username is taken
    const existingUsername = await User.findOne({
      where: {
        username: username.toLowerCase()
      }
    })

    if (existingUsername) {
      throw new Error('Username is already taken')
    }

    // Create user
    const user = await User.create({
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      displayName,
      passwordHash: password, // Will be hashed by the model hook
      isEmailVerified: false
    })

    logger.info(`New user registered: ${user.email}`)
    return user
  }

  /**
   * Login user with email and password
   */
  static async login(credentials: LoginCredentials): Promise<AuthResult> {
    const { email, password } = credentials

    if (!email || !password) {
      throw new Error('Email and password are required')
    }

    // Find user by email
    const user = await User.findOne({
      where: {
        email: email.toLowerCase()
      }
    })

    if (!user) {
      throw new Error('Invalid credentials')
    }

    // Validate password
    const isValidPassword = await user.validatePassword(password)
    if (!isValidPassword) {
      throw new Error('Invalid credentials')
    }

    // Generate tokens
    const token = this.generateToken(user)
    const refreshToken = this.generateRefreshToken(user)

    logger.info(`User logged in: ${user.email}`)

    return {
      user,
      token,
      refreshToken
    }
  }

  /**
   * Generate JWT access token
   */
  static generateToken(user: User): string {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email
    }

    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN
    } as SignOptions)
  }

  /**
   * Generate JWT refresh token
   */
  static generateRefreshToken(user: User): string {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email
    }

    return jwt.sign(payload, this.JWT_REFRESH_SECRET, {
      expiresIn: this.JWT_REFRESH_EXPIRES_IN
    } as SignOptions)
  }

  /**
   * Verify JWT token
   */
  static async verifyToken(token: string): Promise<User> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as TokenPayload
      
      const user = await User.findByPk(decoded.userId)
      if (!user) {
        throw new Error('User not found')
      }

      return user
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token')
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expired')
      }
      throw error
    }
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshToken(refreshToken: string): Promise<AuthResult> {
    try {
      const decoded = jwt.verify(refreshToken, this.JWT_REFRESH_SECRET) as TokenPayload
      
      const user = await User.findByPk(decoded.userId)
      if (!user) {
        throw new Error('User not found')
      }

      // Generate new tokens
      const newToken = this.generateToken(user)
      const newRefreshToken = this.generateRefreshToken(user)

      return {
        user,
        token: newToken,
        refreshToken: newRefreshToken
      }
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid refresh token')
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token expired')
      }
      throw error
    }
  }

  /**
   * Initiate password reset
   */
  static async initiatePasswordReset(email: string): Promise<void> {
    const user = await User.findOne({
      where: {
        email: email.toLowerCase()
      }
    })

    if (!user) {
      // Don't reveal if email exists or not for security
      logger.info(`Password reset requested for non-existent email: ${email}`)
      return
    }

    // Generate password reset token
    const resetToken = jwt.sign(
      { userId: user.id, email: user.email, type: 'password-reset' },
      this.JWT_SECRET,
      { expiresIn: '1h' } as SignOptions
    )

    // In a real application, you would send this token via email
    // For now, we'll just log it
    logger.info(`Password reset token for ${user.email}: ${resetToken}`)
    
    // TODO: Implement email sending service
    // await emailService.sendPasswordResetEmail(user.email, resetToken)
  }

  /**
   * Reset password using reset token
   */
  static async resetPassword(resetToken: string, newPassword: string): Promise<void> {
    try {
      const decoded = jwt.verify(resetToken, this.JWT_SECRET) as any
      
      if (decoded.type !== 'password-reset') {
        throw new Error('Invalid reset token')
      }

      if (!User.validatePassword(newPassword)) {
        throw new Error('Password must be at least 8 characters with uppercase, lowercase, and number')
      }

      const user = await User.findByPk(decoded.userId)
      if (!user) {
        throw new Error('User not found')
      }

      // Update password
      await user.setPassword(newPassword)
      await user.save()

      logger.info(`Password reset completed for user: ${user.email}`)
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid or expired reset token')
      }
      throw error
    }
  }

  /**
   * Verify email using verification token
   */
  static async verifyEmail(verificationToken: string): Promise<User> {
    try {
      const decoded = jwt.verify(verificationToken, this.JWT_SECRET) as any
      
      if (decoded.type !== 'email-verification') {
        throw new Error('Invalid verification token')
      }

      const user = await User.findByPk(decoded.userId)
      if (!user) {
        throw new Error('User not found')
      }

      // Update email verification status
      user.isEmailVerified = true
      await user.save()

      logger.info(`Email verified for user: ${user.email}`)
      return user
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid or expired verification token')
      }
      throw error
    }
  }

  /**
   * Generate email verification token
   */
  static generateEmailVerificationToken(user: User): string {
    return jwt.sign(
      { userId: user.id, email: user.email, type: 'email-verification' },
      this.JWT_SECRET,
      { expiresIn: '24h' } as SignOptions
    )
  }

  /**
   * Handle Google OAuth authentication
   */
  static async googleOAuth(user: User): Promise<AuthResult> {
    // Generate tokens for the authenticated user
    const token = this.generateToken(user)
    const refreshToken = this.generateRefreshToken(user)

    logger.info(`Google OAuth successful for user: ${user.email}`)

    return {
      user,
      token,
      refreshToken
    }
  }

  /**
   * Link existing account with Google OAuth
   */
  static async linkGoogleAccount(userId: string, googleId: string): Promise<User> {
    const user = await User.findByPk(userId)
    if (!user) {
      throw new Error('User not found')
    }

    // Check if Google ID is already linked to another account
    const existingGoogleUser = await User.findOne({
      where: { googleId }
    })

    if (existingGoogleUser && existingGoogleUser.id !== userId) {
      throw new Error('This Google account is already linked to another user')
    }

    // Link the Google account
    user.googleId = googleId
    await user.save()

    logger.info(`Google account linked for user: ${user.email}`)
    return user
  }

  /**
   * Unlink Google account
   */
  static async unlinkGoogleAccount(userId: string): Promise<User> {
    const user = await User.findByPk(userId)
    if (!user) {
      throw new Error('User not found')
    }

    if (!user.googleId) {
      throw new Error('No Google account linked')
    }

    // Ensure user has a password before unlinking Google
    if (!user.passwordHash) {
      throw new Error('Cannot unlink Google account without setting a password first')
    }

    user.googleId = null
    await user.save()

    logger.info(`Google account unlinked for user: ${user.email}`)
    return user
  }
}