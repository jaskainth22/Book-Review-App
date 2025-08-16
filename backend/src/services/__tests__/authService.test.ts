import { AuthService } from '../authService'
import { User } from '../../models/User'
import jwt from 'jsonwebtoken'
import { config } from '../../config/config'
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
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { beforeEach } from 'node:test'
import { describe } from 'node:test'

// Mock the User model
jest.mock('../../models/User')
const MockedUser = User as jest.Mocked<typeof User>

// Mock jwt
jest.mock('jsonwebtoken')
const mockedJwt = jwt as jest.Mocked<typeof jwt>

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  }
}))

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('register', () => {
    const validUserData = {
      email: 'test@example.com',
      username: 'testuser',
      displayName: 'Test User',
      password: 'Password123'
    }

    it('should register a new user successfully', async () => {
      // Mock User validation methods
      MockedUser.validateEmail = jest.fn().mockReturnValue(true)
      MockedUser.validateUsername = jest.fn().mockReturnValue(true)
      MockedUser.validatePassword = jest.fn().mockReturnValue(true)
      
      // Mock User.findOne to return null (user doesn't exist)
      MockedUser.findOne = jest.fn().mockResolvedValue(null)
      
      // Mock User.create
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
        isEmailVerified: false
      }
      MockedUser.create = jest.fn().mockResolvedValue(mockUser)

      const result = await AuthService.register(validUserData)

      expect(MockedUser.findOne).toHaveBeenCalledTimes(2) // Check email and username
      expect(MockedUser.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
        passwordHash: 'Password123',
        isEmailVerified: false
      })
      expect(result).toEqual(mockUser)
    })

    it('should throw error for invalid email', async () => {
      MockedUser.validateEmail = jest.fn().mockReturnValue(false)
      const invalidData = { ...validUserData, email: 'invalid-email' }

      await expect(AuthService.register(invalidData)).rejects.toThrow('Invalid email format')
    })

    it('should throw error for invalid username', async () => {
      MockedUser.validateEmail = jest.fn().mockReturnValue(true)
      MockedUser.validateUsername = jest.fn().mockReturnValue(false)
      const invalidData = { ...validUserData, username: 'ab' } // Too short

      await expect(AuthService.register(invalidData)).rejects.toThrow('Username must be 3-50 characters')
    })

    it('should throw error for invalid password', async () => {
      MockedUser.validateEmail = jest.fn().mockReturnValue(true)
      MockedUser.validateUsername = jest.fn().mockReturnValue(true)
      MockedUser.validatePassword = jest.fn().mockReturnValue(false)
      const invalidData = { ...validUserData, password: 'weak' }

      await expect(AuthService.register(invalidData)).rejects.toThrow('Password must be at least 8 characters')
    })

    it('should throw error if email already exists', async () => {
      MockedUser.validateEmail = jest.fn().mockReturnValue(true)
      MockedUser.validateUsername = jest.fn().mockReturnValue(true)
      MockedUser.validatePassword = jest.fn().mockReturnValue(true)
      MockedUser.findOne = jest.fn().mockResolvedValueOnce({ id: '123' }) // Email exists

      await expect(AuthService.register(validUserData)).rejects.toThrow('User with this email already exists')
    })

    it('should throw error if username already exists', async () => {
      MockedUser.validateEmail = jest.fn().mockReturnValue(true)
      MockedUser.validateUsername = jest.fn().mockReturnValue(true)
      MockedUser.validatePassword = jest.fn().mockReturnValue(true)
      MockedUser.findOne = jest.fn()
        .mockResolvedValueOnce(null) // Email doesn't exist
        .mockResolvedValueOnce({ id: '123' }) // Username exists

      await expect(AuthService.register(validUserData)).rejects.toThrow('Username is already taken')
    })
  })

  describe('login', () => {
    const validCredentials = {
      email: 'test@example.com',
      password: 'Password123'
    }

    it('should login user successfully', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        validatePassword: jest.fn().mockResolvedValue(true)
      }
      MockedUser.findOne = jest.fn().mockResolvedValue(mockUser)
      
      // Mock token generation
      mockedJwt.sign = jest.fn()
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token')

      const result = await AuthService.login(validCredentials)

      expect(MockedUser.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' }
      })
      expect(mockUser.validatePassword).toHaveBeenCalledWith('Password123')
      expect(result).toEqual({
        user: mockUser,
        token: 'access-token',
        refreshToken: 'refresh-token'
      })
    })

    it('should throw error for missing email', async () => {
      const invalidCredentials = { email: '', password: 'Password123' }

      await expect(AuthService.login(invalidCredentials)).rejects.toThrow('Email and password are required')
    })

    it('should throw error for missing password', async () => {
      const invalidCredentials = { email: 'test@example.com', password: '' }

      await expect(AuthService.login(invalidCredentials)).rejects.toThrow('Email and password are required')
    })

    it('should throw error if user not found', async () => {
      MockedUser.findOne = jest.fn().mockResolvedValue(null)

      await expect(AuthService.login(validCredentials)).rejects.toThrow('Invalid credentials')
    })

    it('should throw error for invalid password', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        validatePassword: jest.fn().mockResolvedValue(false)
      }
      MockedUser.findOne = jest.fn().mockResolvedValue(mockUser)

      await expect(AuthService.login(validCredentials)).rejects.toThrow('Invalid credentials')
    })
  })

  describe('generateToken', () => {
    it('should generate JWT token', () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com'
      } as User

      mockedJwt.sign = jest.fn().mockReturnValue('jwt-token')

      const token = AuthService.generateToken(mockUser)

      expect(mockedJwt.sign).toHaveBeenCalledWith(
        { userId: '123', email: 'test@example.com' },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      )
      expect(token).toBe('jwt-token')
    })
  })

  describe('generateRefreshToken', () => {
    it('should generate refresh token', () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com'
      } as User

      mockedJwt.sign = jest.fn().mockReturnValue('refresh-token')

      const token = AuthService.generateRefreshToken(mockUser)

      expect(mockedJwt.sign).toHaveBeenCalledWith(
        { userId: '123', email: 'test@example.com' },
        config.jwt.refreshSecret,
        { expiresIn: config.jwt.refreshExpiresIn }
      )
      expect(token).toBe('refresh-token')
    })
  })

  describe('verifyToken', () => {
    it('should verify valid token', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      const mockDecoded = { userId: '123', email: 'test@example.com' }

      mockedJwt.verify = jest.fn().mockReturnValue(mockDecoded)
      MockedUser.findByPk = jest.fn().mockResolvedValue(mockUser)

      const result = await AuthService.verifyToken('valid-token')

      expect(mockedJwt.verify).toHaveBeenCalledWith('valid-token', config.jwt.secret)
      expect(MockedUser.findByPk).toHaveBeenCalledWith('123')
      expect(result).toEqual(mockUser)
    })

    it('should throw error for invalid token', async () => {
      mockedJwt.verify = jest.fn().mockImplementation(() => {
        throw new jwt.JsonWebTokenError('invalid token')
      })

      await expect(AuthService.verifyToken('invalid-token')).rejects.toThrow('Invalid token')
    })

    it('should throw error for expired token', async () => {
      mockedJwt.verify = jest.fn().mockImplementation(() => {
        throw new jwt.TokenExpiredError('token expired', new Date())
      })

      await expect(AuthService.verifyToken('expired-token')).rejects.toThrow('Token expired')
    })

    it('should throw error if user not found', async () => {
      const mockDecoded = { userId: '123', email: 'test@example.com' }

      mockedJwt.verify = jest.fn().mockReturnValue(mockDecoded)
      MockedUser.findByPk = jest.fn().mockResolvedValue(null)

      await expect(AuthService.verifyToken('valid-token')).rejects.toThrow('User not found')
    })
  })

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      const mockDecoded = { userId: '123', email: 'test@example.com' }

      mockedJwt.verify = jest.fn().mockReturnValue(mockDecoded)
      MockedUser.findByPk = jest.fn().mockResolvedValue(mockUser)
      mockedJwt.sign = jest.fn()
        .mockReturnValueOnce('new-access-token')
        .mockReturnValueOnce('new-refresh-token')

      const result = await AuthService.refreshToken('valid-refresh-token')

      expect(mockedJwt.verify).toHaveBeenCalledWith('valid-refresh-token', config.jwt.refreshSecret)
      expect(result).toEqual({
        user: mockUser,
        token: 'new-access-token',
        refreshToken: 'new-refresh-token'
      })
    })

    it('should throw error for invalid refresh token', async () => {
      mockedJwt.verify = jest.fn().mockImplementation(() => {
        throw new jwt.JsonWebTokenError('invalid token')
      })

      await expect(AuthService.refreshToken('invalid-token')).rejects.toThrow('Invalid refresh token')
    })
  })

  describe('initiatePasswordReset', () => {
    it('should initiate password reset for existing user', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      MockedUser.findOne = jest.fn().mockResolvedValue(mockUser)
      mockedJwt.sign = jest.fn().mockReturnValue('reset-token')

      await AuthService.initiatePasswordReset('test@example.com')

      expect(MockedUser.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' }
      })
      expect(mockedJwt.sign).toHaveBeenCalledWith(
        { userId: '123', email: 'test@example.com', type: 'password-reset' },
        config.jwt.secret,
        { expiresIn: '1h' }
      )
    })

    it('should not throw error for non-existent user', async () => {
      MockedUser.findOne = jest.fn().mockResolvedValue(null)

      await expect(AuthService.initiatePasswordReset('nonexistent@example.com')).resolves.not.toThrow()
    })
  })

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      MockedUser.validatePassword = jest.fn().mockReturnValue(true)
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        setPassword: jest.fn(),
        save: jest.fn()
      }
      const mockDecoded = {
        userId: '123',
        email: 'test@example.com',
        type: 'password-reset'
      }

      mockedJwt.verify = jest.fn().mockReturnValue(mockDecoded)
      MockedUser.findByPk = jest.fn().mockResolvedValue(mockUser)

      await AuthService.resetPassword('valid-reset-token', 'NewPassword123')

      expect(mockedJwt.verify).toHaveBeenCalledWith('valid-reset-token', config.jwt.secret)
      expect(mockUser.setPassword).toHaveBeenCalledWith('NewPassword123')
      expect(mockUser.save).toHaveBeenCalled()
    })

    it('should throw error for invalid token type', async () => {
      const mockDecoded = {
        userId: '123',
        email: 'test@example.com',
        type: 'invalid-type'
      }

      mockedJwt.verify = jest.fn().mockReturnValue(mockDecoded)

      await expect(AuthService.resetPassword('invalid-token', 'NewPassword123')).rejects.toThrow('Invalid reset token')
    })

    it('should throw error for invalid password', async () => {
      MockedUser.validatePassword = jest.fn().mockReturnValue(false)
      const mockDecoded = {
        userId: '123',
        email: 'test@example.com',
        type: 'password-reset'
      }

      mockedJwt.verify = jest.fn().mockReturnValue(mockDecoded)

      await expect(AuthService.resetPassword('valid-token', 'weak')).rejects.toThrow('Password must be at least 8 characters')
    })
  })

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        isEmailVerified: false,
        save: jest.fn()
      }
      const mockDecoded = {
        userId: '123',
        email: 'test@example.com',
        type: 'email-verification'
      }

      mockedJwt.verify = jest.fn().mockReturnValue(mockDecoded)
      MockedUser.findByPk = jest.fn().mockResolvedValue(mockUser)

      const result = await AuthService.verifyEmail('valid-verification-token')

      expect(mockedJwt.verify).toHaveBeenCalledWith('valid-verification-token', config.jwt.secret)
      expect(mockUser.isEmailVerified).toBe(true)
      expect(mockUser.save).toHaveBeenCalled()
      expect(result).toEqual(mockUser)
    })

    it('should throw error for invalid token type', async () => {
      const mockDecoded = {
        userId: '123',
        email: 'test@example.com',
        type: 'invalid-type'
      }

      mockedJwt.verify = jest.fn().mockReturnValue(mockDecoded)

      await expect(AuthService.verifyEmail('invalid-token')).rejects.toThrow('Invalid verification token')
    })
  })

  describe('generateEmailVerificationToken', () => {
    it('should generate email verification token', () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com'
      } as User

      mockedJwt.sign = jest.fn().mockReturnValue('verification-token')

      const token = AuthService.generateEmailVerificationToken(mockUser)

      expect(mockedJwt.sign).toHaveBeenCalledWith(
        { userId: '123', email: 'test@example.com', type: 'email-verification' },
        config.jwt.secret,
        { expiresIn: '24h' }
      )
      expect(token).toBe('verification-token')
    })
  })
})