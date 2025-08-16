import request from 'supertest'
import { User } from '../../models/User'
import { AuthService } from '../../services/authService'
import { connectDatabase } from '../../config/database'
import { logger } from '../../utils/logger'

// Mock passport configuration
jest.mock('../../config/passport', () => ({}))

// Mock passport authentication
jest.mock('passport', () => ({
  authenticate: jest.fn(() => (req: any, res: any, next: any) => {
    // Mock successful Google OAuth
    if (req.headers.mockuser) {
      req.user = JSON.parse(req.headers.mockuser as string)
    }
    next()
  }),
  initialize: jest.fn(() => (req: any, res: any, next: any) => next()),
  use: jest.fn(),
  serializeUser: jest.fn(),
  deserializeUser: jest.fn(),
}))

// Import app after mocking
import app from '../../server'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { beforeEach } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { afterEach } from 'node:test'
import { beforeEach } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { beforeEach } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { afterEach } from 'node:test'
import { beforeEach } from 'node:test'
import { describe } from 'node:test'

describe('Google OAuth Controller', () => {
  let testUser: User
  let authToken: string

  beforeAll(async () => {
    await connectDatabase()
  })

  beforeEach(async () => {
    // Clean up database
    await User.destroy({ where: {} })

    // Create test user
    testUser = await User.create({
      email: 'test@example.com',
      username: 'testuser',
      displayName: 'Test User',
      passwordHash: 'hashedpassword',
      isEmailVerified: true,
    })

    // Generate auth token
    authToken = AuthService.generateToken(testUser)
  })

  afterEach(async () => {
    await User.destroy({ where: {} })
  })

  describe('GET /api/auth/google', () => {
    it('should redirect to Google OAuth', async () => {
      const response = await request(app)
        .get('/api/auth/google')

      // The route should exist (even if mocked)
      expect(response.status).not.toBe(404)
    })
  })

  describe('GET /api/auth/google/callback', () => {
    it('should handle successful Google OAuth callback for new user', async () => {
      const mockGoogleUser = {
        email: 'newuser@example.com',
        username: 'newuser',
        displayName: 'New User',
        googleId: 'google123',
        isEmailVerified: true,
      }

      // Create the user that would be created by the Google strategy
      const googleUser = await User.create(mockGoogleUser)

      const response = await request(app)
        .get('/api/auth/google/callback')
        .set('mockuser', JSON.stringify(googleUser))

      expect(response.status).toBe(302) // Redirect
      expect(response.headers.location).toContain('/auth/success')
      expect(response.headers.location).toContain('token=')
      expect(response.headers.location).toContain('refreshToken=')
    })

    it('should handle successful Google OAuth callback for existing user', async () => {
      // Link Google ID to existing user
      testUser.googleId = 'google123'
      await testUser.save()

      const response = await request(app)
        .get('/api/auth/google/callback')
        .set('mockuser', JSON.stringify(testUser))

      expect(response.status).toBe(302) // Redirect
      expect(response.headers.location).toContain('/auth/success')
    })

    it('should handle failed Google OAuth callback', async () => {
      const response = await request(app)
        .get('/api/auth/google/callback')
        // No mockuser set, simulating failed auth

      expect(response.status).toBe(302) // Redirect
      expect(response.headers.location).toContain('/auth/error')
      expect(response.headers.location).toContain('Authentication%20failed')
    })
  })

  describe('POST /api/auth/google/link', () => {
    it('should link Google account to existing user', async () => {
      const response = await request(app)
        .post('/api/auth/google/link')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          googleId: 'google123'
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.user.googleId).toBe('google123')
      expect(response.body.data.message).toBe('Google account linked successfully')

      // Verify in database
      const updatedUser = await User.findByPk(testUser.id)
      expect(updatedUser?.googleId).toBe('google123')
    })

    it('should fail to link Google account without authentication', async () => {
      const response = await request(app)
        .post('/api/auth/google/link')
        .send({
          googleId: 'google123'
        })

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('MISSING_TOKEN')
    })

    it('should fail to link Google account without googleId', async () => {
      const response = await request(app)
        .post('/api/auth/google/link')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
      expect(response.body.error.message).toBe('Google ID is required')
    })

    it('should fail to link Google account already linked to another user', async () => {
      // Create another user with the Google ID
      const anotherUser = await User.create({
        email: 'another@example.com',
        username: 'anotheruser',
        displayName: 'Another User',
        googleId: 'google123',
        isEmailVerified: true,
      })

      const response = await request(app)
        .post('/api/auth/google/link')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          googleId: 'google123'
        })

      expect(response.status).toBe(409)
      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('GOOGLE_LINK_ERROR')
      expect(response.body.error.message).toContain('already linked to another user')
    })
  })

  describe('POST /api/auth/google/unlink', () => {
    beforeEach(async () => {
      // Link Google account to test user
      testUser.googleId = 'google123'
      await testUser.save()
    })

    it('should unlink Google account from user', async () => {
      const response = await request(app)
        .post('/api/auth/google/unlink')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.user.googleId).toBeNull()
      expect(response.body.data.message).toBe('Google account unlinked successfully')

      // Verify in database
      const updatedUser = await User.findByPk(testUser.id)
      expect(updatedUser?.googleId).toBeNull()
    })

    it('should fail to unlink Google account without authentication', async () => {
      const response = await request(app)
        .post('/api/auth/google/unlink')

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('MISSING_TOKEN')
    })

    it('should fail to unlink when no Google account is linked', async () => {
      // Remove Google ID
      testUser.googleId = null
      await testUser.save()

      const response = await request(app)
        .post('/api/auth/google/unlink')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('GOOGLE_UNLINK_ERROR')
      expect(response.body.error.message).toBe('No Google account linked')
    })

    it('should fail to unlink when user has no password', async () => {
      // Remove password hash
      testUser.passwordHash = null
      await testUser.save()

      const response = await request(app)
        .post('/api/auth/google/unlink')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('GOOGLE_UNLINK_ERROR')
      expect(response.body.error.message).toBe('Cannot unlink Google account without setting a password first')
    })
  })
})

describe('Google OAuth Service', () => {
  let testUser: User

  beforeAll(async () => {
    await connectDatabase()
  })

  beforeEach(async () => {
    await User.destroy({ where: {} })

    testUser = await User.create({
      email: 'test@example.com',
      username: 'testuser',
      displayName: 'Test User',
      passwordHash: 'hashedpassword',
      isEmailVerified: true,
    })
  })

  afterEach(async () => {
    await User.destroy({ where: {} })
  })

  describe('googleOAuth', () => {
    it('should generate tokens for Google OAuth user', async () => {
      const result = await AuthService.googleOAuth(testUser)

      expect(result.user).toEqual(testUser)
      expect(result.token).toBeDefined()
      expect(result.refreshToken).toBeDefined()
      expect(typeof result.token).toBe('string')
      expect(typeof result.refreshToken).toBe('string')
    })
  })

  describe('linkGoogleAccount', () => {
    it('should link Google account to user', async () => {
      const result = await AuthService.linkGoogleAccount(testUser.id, 'google123')

      expect(result.googleId).toBe('google123')
      expect(result.id).toBe(testUser.id)
    })

    it('should throw error for non-existent user', async () => {
      await expect(
        AuthService.linkGoogleAccount('00000000-0000-0000-0000-000000000000', 'google123')
      ).rejects.toThrow('User not found')
    })

    it('should throw error when Google ID is already linked to another user', async () => {
      const anotherUser = await User.create({
        email: 'another@example.com',
        username: 'anotheruser',
        displayName: 'Another User',
        googleId: 'google123',
        isEmailVerified: true,
      })

      await expect(
        AuthService.linkGoogleAccount(testUser.id, 'google123')
      ).rejects.toThrow('This Google account is already linked to another user')
    })
  })

  describe('unlinkGoogleAccount', () => {
    beforeEach(async () => {
      testUser.googleId = 'google123'
      await testUser.save()
    })

    it('should unlink Google account from user', async () => {
      const result = await AuthService.unlinkGoogleAccount(testUser.id)

      expect(result.googleId).toBeNull()
      expect(result.id).toBe(testUser.id)
    })

    it('should throw error for non-existent user', async () => {
      await expect(
        AuthService.unlinkGoogleAccount('00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow('User not found')
    })

    it('should throw error when no Google account is linked', async () => {
      testUser.googleId = null
      await testUser.save()

      await expect(
        AuthService.unlinkGoogleAccount(testUser.id)
      ).rejects.toThrow('No Google account linked')
    })

    it('should throw error when user has no password', async () => {
      testUser.passwordHash = null
      await testUser.save()

      await expect(
        AuthService.unlinkGoogleAccount(testUser.id)
      ).rejects.toThrow('Cannot unlink Google account without setting a password first')
    })
  })
})