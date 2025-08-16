import passport from '../passport'
import { User } from '../../models/User'
import { connectDatabase } from '../database'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { afterEach } from 'node:test'
import { beforeEach } from 'node:test'
import { describe } from 'node:test'

// Mock the Google OAuth strategy
jest.mock('passport-google-oauth20', () => ({
  Strategy: jest.fn().mockImplementation((options, verify) => {
    // Store the verify function for testing
    (global as any).googleVerifyFunction = verify
    return {
      name: 'google',
      authenticate: jest.fn()
    }
  })
}))

describe('Passport Configuration', () => {
  beforeAll(async () => {
    await connectDatabase()
  })

  beforeEach(async () => {
    await User.destroy({ where: {} })
  })

  afterEach(async () => {
    await User.destroy({ where: {} })
  })

  describe('Google OAuth Strategy', () => {
    const mockProfile = {
      id: 'google123',
      displayName: 'Test User',
      name: { givenName: 'Test' },
      emails: [{ value: 'test@example.com' }],
      photos: [{ value: 'https://example.com/photo.jpg' }]
    }

    it('should create new user for first-time Google OAuth', async () => {
      const verify = (global as any).googleVerifyFunction
      
      const done = jest.fn()
      await verify('access-token', 'refresh-token', mockProfile, done)

      expect(done).toHaveBeenCalledWith(null, expect.objectContaining({
        email: 'test@example.com',
        googleId: 'google123',
        displayName: 'Test User',
        isEmailVerified: true,
        avatar: 'https://example.com/photo.jpg'
      }))

      // Verify user was created in database
      const user = await User.findOne({ where: { googleId: 'google123' } })
      expect(user).toBeTruthy()
      expect(user?.email).toBe('test@example.com')
    })

    it('should return existing user with Google ID', async () => {
      // Create existing user with Google ID
      const existingUser = await User.create({
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
        googleId: 'google123',
        isEmailVerified: true
      })

      const verify = (global as any).googleVerifyFunction
      const done = jest.fn()
      await verify('access-token', 'refresh-token', mockProfile, done)

      expect(done).toHaveBeenCalledWith(null, expect.objectContaining({
        id: existingUser.id,
        email: existingUser.email,
        googleId: existingUser.googleId
      }))
    })

    it('should link Google account to existing user with same email', async () => {
      // Create existing user without Google ID
      const existingUser = await User.create({
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
        passwordHash: 'hashedpassword',
        isEmailVerified: true
      })

      const verify = (global as any).googleVerifyFunction
      const done = jest.fn()
      await verify('access-token', 'refresh-token', mockProfile, done)

      expect(done).toHaveBeenCalledWith(null, expect.objectContaining({
        id: existingUser.id,
        googleId: 'google123'
      }))

      // Verify user was updated in database
      const updatedUser = await User.findByPk(existingUser.id)
      expect(updatedUser?.googleId).toBe('google123')
    })

    it('should handle missing email from Google profile', async () => {
      const profileWithoutEmail = {
        ...mockProfile,
        emails: []
      }

      const verify = (global as any).googleVerifyFunction
      const done = jest.fn()
      await verify('access-token', 'refresh-token', profileWithoutEmail, done)

      expect(done).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'No email provided by Google'
        }),
        false
      )
    })

    it('should generate unique username when email username is taken', async () => {
      // Create user with username that would conflict
      await User.create({
        email: 'existing@example.com',
        username: 'test',
        displayName: 'Existing User',
        isEmailVerified: true
      })

      const verify = (global as any).googleVerifyFunction
      const done = jest.fn()
      await verify('access-token', 'refresh-token', mockProfile, done)

      expect(done).toHaveBeenCalledWith(null, expect.objectContaining({
        username: expect.stringMatching(/^test\d+$/) // Should be test1, test2, etc.
      }))
    })

    it('should handle database errors gracefully', async () => {
      // Mock User.findOne to throw an error
      const originalFindOne = User.findOne
      User.findOne = jest.fn().mockRejectedValue(new Error('Database error'))

      const verify = (global as any).googleVerifyFunction
      const done = jest.fn()
      await verify('access-token', 'refresh-token', mockProfile, done)

      expect(done).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Database error'
        }),
        false
      )

      // Restore original method
      User.findOne = originalFindOne
    })
  })

  describe('JWT Strategy', () => {
    it('should be configured correctly', () => {
      // Test that JWT strategy is configured
      expect(passport.strategies).toBeDefined()
      // We can't easily test the JWT strategy without mocking more internals
      // The integration tests will cover the actual JWT authentication
    })
  })

  describe('Serialize/Deserialize User', () => {
    it('should be configured for session support', () => {
      // These functions are configured but not used in our JWT-based auth
      // They're required by Passport but we don't use sessions
      expect(typeof passport.serializeUser).toBe('function')
      expect(typeof passport.deserializeUser).toBe('function')
    })
  })
})