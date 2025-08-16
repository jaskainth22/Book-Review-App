// Common types used across the application

export interface User {
  id: string
  email: string
  username: string
  displayName: string
  avatar?: string
  bio?: string
  isEmailVerified: boolean
  googleId?: string
  createdAt: Date
  updatedAt: Date
  privacySettings: PrivacySettings
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private'
  showReadingActivity: boolean
  showReviews: boolean
  allowFollowers: boolean
}

export interface Book {
  id: string
  isbn: string
  title: string
  authors: string[]
  description: string
  publishedDate: Date
  publisher: string
  pageCount: number
  categories: string[]
  coverImage: string
  averageRating: number
  ratingsCount: number
  googleBooksId?: string
  createdAt: Date
  updatedAt: Date
}

export interface Review {
  id: string
  userId: string
  bookId: string
  rating: number // 1-5
  title: string
  content: string
  spoilerWarning: boolean
  likesCount: number
  commentsCount: number
  createdAt: Date
  updatedAt: Date
}

export interface Comment {
  id: string
  reviewId: string
  userId: string
  content: string
  parentCommentId?: string // for nested replies
  likesCount: number
  createdAt: Date
  updatedAt: Date
}

export interface ReadingListEntry {
  id: string
  userId: string
  bookId: string
  status: 'want-to-read' | 'currently-reading' | 'read'
  dateAdded: Date
  dateStarted?: Date
  dateFinished?: Date
  progress?: number // percentage for currently reading
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  timestamp: string
  path?: string
}