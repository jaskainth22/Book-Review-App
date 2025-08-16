// Common types used across the frontend application

export interface User {
  id: string
  email: string
  username: string
  displayName: string
  avatar?: string
  bio?: string
  isEmailVerified: boolean
  googleId?: string
  createdAt: string
  updatedAt: string
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
  publishedDate: string
  publisher: string
  pageCount: number
  categories: string[]
  coverImage: string
  averageRating: number
  ratingsCount: number
  googleBooksId?: string
  createdAt: string
  updatedAt: string
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
  createdAt: string
  updatedAt: string
  user?: User
  book?: Book
}

export interface Comment {
  id: string
  reviewId: string
  userId: string
  content: string
  parentCommentId?: string // for nested replies
  likesCount: number
  createdAt: string
  updatedAt: string
  user?: User
  replies?: Comment[]
}

export interface ReadingListEntry {
  id: string
  userId: string
  bookId: string
  status: 'want-to-read' | 'currently-reading' | 'read'
  dateAdded: string
  dateStarted?: string
  dateFinished?: string
  progress?: number // percentage for currently reading
  book?: Book
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

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (userData: RegisterData) => Promise<void>
  logout: () => void
  loading: boolean
}

export interface RegisterData {
  email: string
  password: string
  username: string
  displayName: string
}

export interface LoginData {
  email: string
  password: string
  rememberMe?: boolean
}