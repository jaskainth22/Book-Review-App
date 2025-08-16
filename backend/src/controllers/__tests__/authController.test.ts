import request from 'supertest'
import express from 'express'
import { AuthController } from '../authController'
import { AuthService } from '../../services/authService'

// Mock the AuthService
jest.mock('../../services/authService')
const MockedAuthService = AuthService as jest.Mocked<typeof AuthService>

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  }
}))

const app = express()
app.use(express.json())

// Set up routes for testing
app.post('/register', AuthController.register)
app.post('/login', AuthController.login)
app.post('/refresh-token', AuthController.refreshToken)
app.post('/password-reset/request', AuthController.requestPasswordReset)
app.post('/password-reset/confirm', AuthController.resetPassword)
app.post('/verify-email', AuthController.verifyEmail)
app.get('/profile', (req, res, next) => {
  // Mock authentication middleware
  req.user = { id: '123', email: 'test@example.com' } as any
  next()
}, AuthController.getProfile)
app.post('/logout', (req, res, next) => {
  req.user = { id: '123', email: 'test@example.com' } as any
  next()
}, AuthController.logout)

describe('AuthController', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /register', () => {
    const validRegistrationData = {
      email: 'test@example.com',
      username: 'testuser',
      displayName: 'Test User',
      password: 'Password123'
    }

    it('should register user successfully', async () => {
      const mockUser = { id: '123', email: 'test@example.com', username: 'testuser' }
      MockedAuthService.register = jest.fn().mockResolvedValue(mockUser)
      MockedAuthService.generateEmailVerificationToken = jest.fn().mockReturnValue('verification-token')

      const response = await request(app)
        .post('/register')
        .send(validRegistrationData)

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data.user).toEqual(mockUser)
      expect(response.body.data.message).toContain('Registration successful')
    })

    it('should return 400 for invalid email', async () => {
      const invalidData = { ...validRegistrationData, email: 'invalid-email' }

      const response = await request(app)
        .post('/register')
        .send(invalidData)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for missing password', async () => {
      const invalidData = { ...validRegistrationData }
      delete (invalidData as any).password

      const response = await request(app)
        .post('/register')
        .send(invalidData)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return 409 for existing email', async () => {
      MockedAuthService.register = jest.fn().mockRejectedValue(new Error('User with this email already exists'))

      const response = await request(app)
        .post('/register')
        .send(validRegistrationData)

      expect(response.status).toBe(409)
      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('REGISTRATION_ERROR')
    })

    it('should return 500 for server error', async () => {
      MockedAuthService.register = jest.fn().mockRejectedValue(new Error('Database error'))

      const response = await request(app)
        .post('/register')
        .send(validRegistrationData)

      expect(response.status).toBe(500)
      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('REGISTRATION_ERROR')
    })
  })

  describe('POST /login', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'Password123'
    }

    it('should login user successfully', async () => {
      const mockAuthResult = {
        user: { id: '123', email: 'test@example.com' },
        token: 'access-token',
        refreshToken: 'refresh-token'
      }
      MockedAuthService.login = jest.fn().mockResolvedValue(mockAuthResult)

      const response = await request(app)
        .post('/login')
        .send(validLoginData)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockAuthResult)
    })

    it('should return 400 for invalid email format', async () => {
      const invalidData = { ...validLoginData, email: 'invalid-email' }

      const response = await request(app)
        .post('/login')
        .send(invalidData)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return 401 for invalid credentials', async () => {
      MockedAuthService.login = jest.fn().mockRejectedValue(new Error('Invalid credentials'))

      const response = await request(app)
        .post('/login')
        .send(validLoginData)

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('LOGIN_ERROR')
    })
  })

  describe('POST /refresh-token', () => {
    it('should refresh token successfully', async () => {
      const mockAuthResult = {
        user: { id: '123', email: 'test@example.com' },
        token: 'new-access-token',
        refreshToken: 'new-refresh-token'
      }
      MockedAuthService.refreshToken = jest.fn().mockResolvedValue(mockAuthResult)

      const response = await request(app)
        .post('/refresh-token')
        .send({ refreshToken: 'valid-refresh-token' })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockAuthResult)
    })

    it('should return 400 for missing refresh token', async () => {
      const response = await request(app)
        .post('/refresh-token')
        .send({})

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return 401 for invalid refresh token', async () => {
      MockedAuthService.refreshToken = jest.fn().mockRejectedValue(new Error('Invalid refresh token'))

      const response = await request(app)
        .post('/refresh-token')
        .send({ refreshToken: 'invalid-token' })

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('TOKEN_REFRESH_ERROR')
    })
  })

  describe('POST /password-reset/request', () => {
    it('should request password reset successfully', async () => {
      MockedAuthService.initiatePasswordReset = jest.fn().mockResolvedValue(undefined)

      const response = await request(app)
        .post('/password-reset/request')
        .send({ email: 'test@example.com' })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.message).toContain('password reset link has been sent')
    })

    it('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post('/password-reset/request')
        .send({ email: 'invalid-email' })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return success even for non-existent email (security)', async () => {
      MockedAuthService.initiatePasswordReset = jest.fn().mockResolvedValue(undefined)

      const response = await request(app)
        .post('/password-reset/request')
        .send({ email: 'nonexistent@example.com' })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })
  })

  describe('POST /password-reset/confirm', () => {
    it('should reset password successfully', async () => {
      MockedAuthService.resetPassword = jest.fn().mockResolvedValue(undefined)

      const response = await request(app)
        .post('/password-reset/confirm')
        .send({ token: 'valid-reset-token', password: 'NewPassword123' })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.message).toContain('Password has been reset successfully')
    })

    it('should return 400 for invalid password', async () => {
      const response = await request(app)
        .post('/password-reset/confirm')
        .send({ token: 'valid-token', password: 'weak' })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for invalid token', async () => {
      MockedAuthService.resetPassword = jest.fn().mockRejectedValue(new Error('Invalid or expired reset token'))

      const response = await request(app)
        .post('/password-reset/confirm')
        .send({ token: 'invalid-token', password: 'NewPassword123' })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('PASSWORD_RESET_ERROR')
    })
  })

  describe('POST /verify-email', () => {
    it('should verify email successfully', async () => {
      const mockUser = { id: '123', email: 'test@example.com', isEmailVerified: true }
      MockedAuthService.verifyEmail = jest.fn().mockResolvedValue(mockUser)

      const response = await request(app)
        .post('/verify-email')
        .send({ token: 'valid-verification-token' })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.user).toEqual(mockUser)
      expect(response.body.data.message).toContain('Email verified successfully')
    })

    it('should return 400 for missing token', async () => {
      const response = await request(app)
        .post('/verify-email')
        .send({})

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for invalid token', async () => {
      MockedAuthService.verifyEmail = jest.fn().mockRejectedValue(new Error('Invalid or expired verification token'))

      const response = await request(app)
        .post('/verify-email')
        .send({ token: 'invalid-token' })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('EMAIL_VERIFICATION_ERROR')
    })
  })

  describe('GET /profile', () => {
    it('should get user profile successfully', async () => {
      const response = await request(app)
        .get('/profile')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.user).toEqual({ id: '123', email: 'test@example.com' })
    })
  })

  describe('POST /logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/logout')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.message).toContain('Logged out successfully')
    })
  })
})