import request from 'supertest'
import app from '../../server'
import { User } from '../../models/User'
import { connectDatabase } from '../../config/database'
import { AuthService } from '../../services/authService'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { beforeEach } from 'node:test'
import { describe } from 'node:test'

// Mock the database connection
jest.mock('../../config/database')

// Mock JWT to avoid real token verification
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mocked-token'),
  verify: jest.fn().mockReturnValue({ userId: '123', email: 'test@example.com' })
}))

describe('Auth Routes Integration Tests', () => {
  beforeAll(async () => {
    // Mock database connection
    ;(connectDatabase as jest.Mock).mockResolvedValue(undefined)
  })

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset rate limiting between tests
    jest.clearAllTimers()
  })

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      // Mock User.findOne to return null (user doesn't exist)
      jest.spyOn(User, 'findOne').mockResolvedValue(null)
      
      // Mock User.create
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
        isEmailVerified: false,
        toJSON: () => ({
          id: '123',
          email: 'test@example.com',
          username: 'testuser',
          displayName: 'Test User',
          isEmailVerified: false
        })
      }
      jest.spyOn(User, 'create').mockResolvedValue(mockUser as any)

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          displayName: 'Test User',
          password: 'Password123'
        })

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data.user.email).toBe('test@example.com')
      expect(response.body.data.message).toContain('Registration successful')
    })

    it('should return validation error for invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          username: 'testuser',
          displayName: 'Test User',
          password: 'Password123'
        })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return validation error for weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          displayName: 'Test User',
          password: 'weak'
        })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should handle rate limiting', async () => {
      // Mock User.findOne to return null
      jest.spyOn(User, 'findOne').mockResolvedValue(null)
      jest.spyOn(User, 'create').mockResolvedValue({
        id: '123',
        email: 'test@example.com',
        toJSON: () => ({ id: '123', email: 'test@example.com' })
      } as any)

      const validData = {
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
        password: 'Password123'
      }

      // Make multiple requests to trigger rate limiting
      const requests = Array(6).fill(null).map((_, i) => 
        request(app)
          .post('/api/auth/register')
          .send({ ...validData, email: `test${i}@example.com`, username: `testuser${i}` })
      )

      const responses = await Promise.all(requests)
      
      // The 6th request should be rate limited
      const lastResponse = responses[responses.length - 1]
      expect(lastResponse.status).toBe(429)
      expect(lastResponse.body.error.code).toBe('RATE_LIMIT_EXCEEDED')
    })
  })

  describe('POST /api/auth/login', () => {
    it('should login user with valid credentials', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        validatePassword: jest.fn().mockResolvedValue(true),
        toJSON: () => ({ id: '123', email: 'test@example.com' })
      }
      
      jest.spyOn(User, 'findOne').mockResolvedValue(mockUser as any)
      jest.spyOn(AuthService, 'generateToken').mockReturnValue('access-token')
      jest.spyOn(AuthService, 'generateRefreshToken').mockReturnValue('refresh-token')

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123'
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.token).toBe('access-token')
      expect(response.body.data.refreshToken).toBe('refresh-token')
    })

    it('should return validation error for invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'Password123'
        })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return 401 for non-existent user', async () => {
      jest.spyOn(User, 'findOne').mockResolvedValue(null)

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123'
        })

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('LOGIN_ERROR')
    })

    it('should return 401 for invalid password', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        validatePassword: jest.fn().mockResolvedValue(false)
      }
      
      jest.spyOn(User, 'findOne').mockResolvedValue(mockUser as any)

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword123'
        })

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('LOGIN_ERROR')
    })
  })

  describe('POST /api/auth/refresh-token', () => {
    it('should refresh token successfully', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        toJSON: () => ({ id: '123', email: 'test@example.com' })
      }

      jest.spyOn(AuthService, 'verifyToken').mockResolvedValue(mockUser as any)
      jest.spyOn(AuthService, 'generateToken').mockReturnValue('new-access-token')
      jest.spyOn(AuthService, 'generateRefreshToken').mockReturnValue('new-refresh-token')
      jest.spyOn(User, 'findByPk').mockResolvedValue(mockUser as any)

      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({
          refreshToken: 'valid-refresh-token'
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.token).toBe('new-access-token')
      expect(response.body.data.refreshToken).toBe('new-refresh-token')
    })

    it('should return validation error for missing refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({})

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('POST /api/auth/password-reset/request', () => {
    it('should request password reset', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com'
      }
      
      jest.spyOn(User, 'findOne').mockResolvedValue(mockUser as any)

      const response = await request(app)
        .post('/api/auth/password-reset/request')
        .send({
          email: 'test@example.com'
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.message).toContain('password reset link has been sent')
    })

    it('should return validation error for invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/password-reset/request')
        .send({
          email: 'invalid-email'
        })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should handle rate limiting for password reset requests', async () => {
      jest.spyOn(User, 'findOne').mockResolvedValue({ id: '123', email: 'test@example.com' } as any)

      // Make multiple requests to trigger rate limiting
      const requests = Array(4).fill(null).map(() => 
        request(app)
          .post('/api/auth/password-reset/request')
          .send({ email: 'test@example.com' })
      )

      const responses = await Promise.all(requests)
      
      // The 4th request should be rate limited (limit is 3 per hour)
      const lastResponse = responses[responses.length - 1]
      expect(lastResponse.status).toBe(429)
      expect(lastResponse.body.error.code).toBe('RATE_LIMIT_EXCEEDED')
    })
  })

  describe('POST /api/auth/password-reset/confirm', () => {
    it('should reset password successfully', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        setPassword: jest.fn(),
        save: jest.fn()
      }
      
      jest.spyOn(User, 'findByPk').mockResolvedValue(mockUser as any)

      const response = await request(app)
        .post('/api/auth/password-reset/confirm')
        .send({
          token: 'valid-reset-token',
          password: 'NewPassword123'
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.message).toContain('Password has been reset successfully')
    })

    it('should return validation error for weak password', async () => {
      const response = await request(app)
        .post('/api/auth/password-reset/confirm')
        .send({
          token: 'valid-token',
          password: 'weak'
        })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('POST /api/auth/verify-email', () => {
    it('should verify email successfully', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        isEmailVerified: false,
        save: jest.fn(),
        toJSON: () => ({ id: '123', email: 'test@example.com', isEmailVerified: true })
      }
      
      jest.spyOn(User, 'findByPk').mockResolvedValue(mockUser as any)

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({
          token: 'valid-verification-token'
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.message).toContain('Email verified successfully')
    })

    it('should return validation error for missing token', async () => {
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({})

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('GET /api/auth/profile', () => {
    it('should get user profile when authenticated', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        toJSON: () => ({ id: '123', email: 'test@example.com' })
      }
      
      jest.spyOn(AuthService, 'verifyToken').mockResolvedValue(mockUser as any)

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer valid-token')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.user.email).toBe('test@example.com')
    })

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/auth/profile')

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('MISSING_TOKEN')
    })

    it('should return 401 for invalid token', async () => {
      jest.spyOn(AuthService, 'verifyToken').mockRejectedValue(new Error('Invalid token'))

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('INVALID_TOKEN')
    })
  })

  describe('POST /api/auth/logout', () => {
    it('should logout successfully when authenticated', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com'
      }
      
      jest.spyOn(AuthService, 'verifyToken').mockResolvedValue(mockUser as any)

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer valid-token')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.message).toContain('Logged out successfully')
    })

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .post('/api/auth/logout')

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('MISSING_TOKEN')
    })
  })
})