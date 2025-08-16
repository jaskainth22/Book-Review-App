import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  Unique,
  AllowNull,
  HasMany,
  BeforeCreate,
  BeforeUpdate,
  Validate,
} from 'sequelize-typescript'
import bcrypt from 'bcryptjs'
import { Review } from './Review'
import { Comment } from './Comment'
import { ReadingListEntry } from './ReadingListEntry'

export interface PrivacySettings {
  profileVisibility: 'public' | 'private'
  showReadingActivity: boolean
  showReviews: boolean
  allowFollowers: boolean
}

@Table({
  tableName: 'users',
  timestamps: true,
})
export class User extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string

  @Unique
  @AllowNull(false)
  @Validate({
    isEmail: true,
  })
  @Column(DataType.STRING(255))
  email!: string

  @Unique
  @AllowNull(false)
  @Validate({
    len: [3, 50],
    isAlphanumeric: true,
  })
  @Column(DataType.STRING(50))
  username!: string

  @AllowNull(false)
  @Validate({
    len: [1, 100],
  })
  @Column(DataType.STRING(100))
  displayName!: string

  @Column(DataType.STRING(255))
  passwordHash?: string

  @Column(DataType.TEXT)
  avatar?: string

  @Column(DataType.TEXT)
  bio?: string

  @Default(false)
  @Column(DataType.BOOLEAN)
  isEmailVerified!: boolean

  @Unique
  @Column(DataType.STRING(255))
  googleId?: string

  @Default({
    profileVisibility: 'public',
    showReadingActivity: true,
    showReviews: true,
    allowFollowers: true,
  })
  @Column(DataType.JSONB)
  privacySettings!: PrivacySettings

  @HasMany(() => Review)
  reviews!: Review[]

  @HasMany(() => Comment)
  comments!: Comment[]

  @HasMany(() => ReadingListEntry)
  readingListEntries!: ReadingListEntry[]

  // Instance methods
  async validatePassword(password: string): Promise<boolean> {
    if (!this.passwordHash) return false
    return bcrypt.compare(password, this.passwordHash)
  }

  async setPassword(password: string): Promise<void> {
    this.passwordHash = await bcrypt.hash(password, 12)
  }

  // Hooks
  @BeforeCreate
  @BeforeUpdate
  static async hashPassword(instance: User): Promise<void> {
    if (instance.changed('passwordHash') && instance.passwordHash) {
      // Only hash if it's not already hashed (doesn't start with $2)
      if (!instance.passwordHash.startsWith('$2')) {
        instance.passwordHash = await bcrypt.hash(instance.passwordHash, 12)
      }
    }
  }

  // Validation methods
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  static validateUsername(username: string): boolean {
    const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/
    return usernameRegex.test(username)
  }

  static validatePassword(password: string): boolean {
    // At least 8 characters, one uppercase, one lowercase, one number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
    return passwordRegex.test(password)
  }

  // JSON serialization (exclude sensitive data)
  toJSON(): any {
    const values = { ...this.get() }
    delete values.passwordHash
    return values
  }
}