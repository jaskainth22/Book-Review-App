import { User } from '../User'
import { sequelize } from '../../config/database'
import bcrypt from 'bcryptjs'

describe('User Model', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true })
  })

  afterAll(async () => {
    await sequelize.close()
  })

  beforeEach(async () => {
    await User.destroy({ where: {} })
  })

  describe('Model Creation', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
        passwordHash: 'hashedpassword123',
      }

      const user = await User.create(userData)

      expect(user.id).toBeDefined()
      expect(user.email).toBe(userData.email)
      expect(user.username).toBe(userData.username)
      expect(user.displayName).toBe(userData.displayName)
      expect(user.isEmailVerified).toBe(false)
      expect(user.privacySettings).toEqual({
        profileVisibility: 'public',
        showReadingActivity: true,
        showReviews: true,
        allowFollowers: true,
      })
    })

    it('should hash password on creation', async () => {
      const plainPassword = 'password123'
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
        passwordHash: plainPassword,
      }

      const user = await User.create(userData)

      expect(user.passwordHash).not.toBe(plainPassword)
      expect(user.passwordHash?.startsWith('$2')).toBe(true)
    })

    it('should not hash already hashed password', async () => {
      const hashedPassword = await bcrypt.hash('password123', 12)
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
        passwordHash: hashedPassword,
      }

      const user = await User.create(userData)

      expect(user.passwordHash).toBe(hashedPassword)
    })
  })

  describe('Validations', () => {
    it('should require email', async () => {
      const userData = {
        username: 'testuser',
        displayName: 'Test User',
      }

      await expect(User.create(userData)).rejects.toThrow()
    })

    it('should require valid email format', async () => {
      const userData = {
        email: 'invalid-email',
        username: 'testuser',
        displayName: 'Test User',
      }

      await expect(User.create(userData)).rejects.toThrow()
    })

    it('should require unique email', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser1',
        displayName: 'Test User 1',
      }

      await User.create(userData)

      const duplicateUserData = {
        email: 'test@example.com',
        username: 'testuser2',
        displayName: 'Test User 2',
      }

      await expect(User.create(duplicateUserData)).rejects.toThrow()
    })

    it('should require username', async () => {
      const userData = {
        email: 'test@example.com',
        displayName: 'Test User',
      }

      await expect(User.create(userData)).rejects.toThrow()
    })

    it('should require unique username', async () => {
      const userData = {
        email: 'test1@example.com',
        username: 'testuser',
        displayName: 'Test User 1',
      }

      await User.create(userData)

      const duplicateUserData = {
        email: 'test2@example.com',
        username: 'testuser',
        displayName: 'Test User 2',
      }

      await expect(User.create(duplicateUserData)).rejects.toThrow()
    })

    it('should validate username length and format', async () => {
      const shortUsernameData = {
        email: 'test@example.com',
        username: 'ab',
        displayName: 'Test User',
      }

      await expect(User.create(shortUsernameData)).rejects.toThrow()

      const longUsernameData = {
        email: 'test@example.com',
        username: 'a'.repeat(51),
        displayName: 'Test User',
      }

      await expect(User.create(longUsernameData)).rejects.toThrow()
    })

    it('should require displayName', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
      }

      await expect(User.create(userData)).rejects.toThrow()
    })

    it('should validate displayName length', async () => {
      const longDisplayNameData = {
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'a'.repeat(101),
      }

      await expect(User.create(longDisplayNameData)).rejects.toThrow()
    })
  })

  describe('Instance Methods', () => {
    let user: User

    beforeEach(async () => {
      user = await User.create({
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
        passwordHash: 'password123',
      })
    })

    it('should validate correct password', async () => {
      const isValid = await user.validatePassword('password123')
      expect(isValid).toBe(true)
    })

    it('should reject incorrect password', async () => {
      const isValid = await user.validatePassword('wrongpassword')
      expect(isValid).toBe(false)
    })

    it('should return false for validatePassword when no passwordHash', async () => {
      user.passwordHash = null as any
      const isValid = await user.validatePassword('password123')
      expect(isValid).toBe(false)
    })

    it('should set password correctly', async () => {
      const newPassword = 'newpassword123'
      await user.setPassword(newPassword)

      const isValid = await user.validatePassword(newPassword)
      expect(isValid).toBe(true)
    })

    it('should exclude passwordHash from JSON serialization', () => {
      const json = user.toJSON()
      expect(json.passwordHash).toBeUndefined()
      expect(json.email).toBe(user.email)
      expect(json.username).toBe(user.username)
    })
  })

  describe('Static Validation Methods', () => {
    it('should validate email format', () => {
      expect(User.validateEmail('test@example.com')).toBe(true)
      expect(User.validateEmail('user.name+tag@domain.co.uk')).toBe(true)
      expect(User.validateEmail('invalid-email')).toBe(false)
      expect(User.validateEmail('test@')).toBe(false)
      expect(User.validateEmail('@example.com')).toBe(false)
    })

    it('should validate username format', () => {
      expect(User.validateUsername('validuser123')).toBe(true)
      expect(User.validateUsername('user_name')).toBe(true)
      expect(User.validateUsername('ab')).toBe(false) // too short
      expect(User.validateUsername('a'.repeat(51))).toBe(false) // too long
      expect(User.validateUsername('user-name')).toBe(false) // invalid character
      expect(User.validateUsername('user name')).toBe(false) // space
    })

    it('should validate password strength', () => {
      expect(User.validatePassword('Password123')).toBe(true)
      expect(User.validatePassword('StrongP@ss1')).toBe(true)
      expect(User.validatePassword('password')).toBe(false) // no uppercase or number
      expect(User.validatePassword('PASSWORD123')).toBe(false) // no lowercase
      expect(User.validatePassword('Password')).toBe(false) // no number
      expect(User.validatePassword('Pass123')).toBe(false) // too short
    })
  })
})