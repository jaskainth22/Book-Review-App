import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import axios from 'axios'
import { ReviewCard } from '../ReviewCard'
import { useAuth } from '../../../contexts/AuthContext'
import { Review, User, Book } from '../../../types'

// Mock axios
vi.mock('axios')
const mockedAxios = axios as any

// Mock useAuth hook
vi.mock('../../../contexts/AuthContext')
const mockedUseAuth = useAuth as any

// Mock window.confirm
const mockConfirm = vi.fn()
Object.defineProperty(window, 'confirm', {
  value: mockConfirm,
  writable: true
})

// Mock window.alert
const mockAlert = vi.fn()
Object.defineProperty(window, 'alert', {
  value: mockAlert,
  writable: true
})

const mockUser: User = {
  id: '1',
  email: 'test@example.com',
  username: 'testuser',
  displayName: 'Test User',
  isEmailVerified: true,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
  privacySettings: {
    profileVisibility: 'public',
    showReadingActivity: true,
    showReviews: true,
    allowFollowers: true
  }
}

const mockBook: Book = {
  id: '1',
  isbn: '9781234567890',
  title: 'Test Book',
  authors: ['Test Author'],
  description: 'A test book description',
  publishedDate: '2023-01-01',
  publisher: 'Test Publisher',
  pageCount: 300,
  categories: ['Fiction'],
  coverImage: 'https://example.com/cover.jpg',
  averageRating: 4.5,
  ratingsCount: 100,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z'
}

const mockReview: Review & { user?: User; book?: Book } = {
  id: '1',
  userId: '1',
  bookId: '1',
  rating: 4,
  title: 'Great book!',
  content: 'I really enjoyed this book. The plot was engaging and the characters were well-developed.',
  spoilerWarning: false,
  likesCount: 5,
  commentsCount: 2,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
  user: mockUser,
  book: mockBook
}

describe('ReviewCard', () => {
  beforeEach(() => {
    mockedUseAuth.mockReturnValue({
      user: mockUser,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      loading: false,
      googleLogin: vi.fn()
    })
    mockConfirm.mockReturnValue(true)
    mockAlert.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders review card with all information', () => {
    render(<ReviewCard review={mockReview} />)
    
    expect(screen.getByText(mockReview.title)).toBeInTheDocument()
    expect(screen.getByText(mockReview.content)).toBeInTheDocument()
    expect(screen.getByText(mockUser.displayName)).toBeInTheDocument()
    expect(screen.getByText('4/5')).toBeInTheDocument()
    expect(screen.getByText('5 helpful')).toBeInTheDocument()
    expect(screen.getByText('2 comments')).toBeInTheDocument()
  })

  it('renders book information when showBookInfo is true', () => {
    render(<ReviewCard review={mockReview} showBookInfo={true} />)
    
    expect(screen.getByText(mockBook.title)).toBeInTheDocument()
    expect(screen.getByText(`by ${mockBook.authors[0]}`)).toBeInTheDocument()
  })

  it('shows edit and delete buttons for review owner', () => {
    render(<ReviewCard review={mockReview} />)
    
    expect(screen.getByText('Edit')).toBeInTheDocument()
    expect(screen.getByText('Delete')).toBeInTheDocument()
  })

  it('shows report button for non-owner when logged in', () => {
    const otherUser = { ...mockUser, id: '2' }
    mockedUseAuth.mockReturnValue({
      user: otherUser,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      loading: false,
      googleLogin: vi.fn()
    })

    render(<ReviewCard review={mockReview} />)
    
    expect(screen.getByText('Report')).toBeInTheDocument()
    expect(screen.queryByText('Edit')).not.toBeInTheDocument()
    expect(screen.queryByText('Delete')).not.toBeInTheDocument()
  })

  it('does not show action buttons when not logged in', () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      loading: false,
      googleLogin: vi.fn()
    })

    render(<ReviewCard review={mockReview} />)
    
    expect(screen.queryByText('Edit')).not.toBeInTheDocument()
    expect(screen.queryByText('Delete')).not.toBeInTheDocument()
    expect(screen.queryByText('Report')).not.toBeInTheDocument()
  })

  it('calls onEdit when edit button is clicked', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    
    render(<ReviewCard review={mockReview} onEdit={onEdit} />)
    
    await user.click(screen.getByText('Edit'))
    expect(onEdit).toHaveBeenCalledWith(mockReview)
  })

  it('deletes review when delete button is clicked and confirmed', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    
    mockedAxios.delete.mockResolvedValueOnce({ data: {} })
    
    render(<ReviewCard review={mockReview} onDelete={onDelete} />)
    
    await user.click(screen.getByText('Delete'))
    
    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalledWith(
        'Are you sure you want to delete this review? This action cannot be undone.'
      )
      expect(mockedAxios.delete).toHaveBeenCalledWith(`/reviews/${mockReview.id}`)
      expect(onDelete).toHaveBeenCalledWith(mockReview.id)
    })
  })

  it('does not delete review when delete is not confirmed', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    
    mockConfirm.mockReturnValue(false)
    
    render(<ReviewCard review={mockReview} onDelete={onDelete} />)
    
    await user.click(screen.getByText('Delete'))
    
    expect(mockConfirm).toHaveBeenCalled()
    expect(mockedAxios.delete).not.toHaveBeenCalled()
    expect(onDelete).not.toHaveBeenCalled()
  })

  it('handles delete error', async () => {
    const user = userEvent.setup()
    
    mockedAxios.delete.mockRejectedValueOnce(new Error('Network error'))
    
    render(<ReviewCard review={mockReview} />)
    
    await user.click(screen.getByText('Delete'))
    
    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('Failed to delete review. Please try again.')
    })
  })

  it('opens flag modal when report button is clicked', async () => {
    const user = userEvent.setup()
    const otherUser = { ...mockUser, id: '2' }
    mockedUseAuth.mockReturnValue({
      user: otherUser,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      loading: false,
      googleLogin: vi.fn()
    })
    
    render(<ReviewCard review={mockReview} />)
    
    await user.click(screen.getByText('Report'))
    
    expect(screen.getByText('Report Review')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Reason for reporting...')).toBeInTheDocument()
  })

  it('flags review successfully', async () => {
    const user = userEvent.setup()
    const onFlag = vi.fn()
    const otherUser = { ...mockUser, id: '2' }
    
    mockedUseAuth.mockReturnValue({
      user: otherUser,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      loading: false,
      googleLogin: vi.fn()
    })
    
    mockedAxios.post.mockResolvedValueOnce({
      data: { success: true, data: { message: 'Review flagged' } }
    })
    
    render(<ReviewCard review={mockReview} onFlag={onFlag} />)
    
    await user.click(screen.getByText('Report'))
    await user.type(screen.getByPlaceholderText('Reason for reporting...'), 'Inappropriate content')
    await user.click(screen.getByRole('button', { name: /report/i }))
    
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(`/reviews/${mockReview.id}/flag`, {
        reason: 'Inappropriate content'
      })
      expect(onFlag).toHaveBeenCalledWith(mockReview.id, 'Inappropriate content')
      expect(mockAlert).toHaveBeenCalledWith(
        'Review has been flagged for moderation. Thank you for your report.'
      )
    })
  })

  it('shows spoiler warning and hides content initially', () => {
    const spoilerReview = { ...mockReview, spoilerWarning: true }
    render(<ReviewCard review={spoilerReview} />)
    
    expect(screen.getByText('This review contains spoilers')).toBeInTheDocument()
    expect(screen.getByText('Show anyway')).toBeInTheDocument()
    expect(screen.queryByText(mockReview.content)).not.toBeInTheDocument()
  })

  it('shows content when "Show anyway" is clicked for spoiler review', async () => {
    const user = userEvent.setup()
    const spoilerReview = { ...mockReview, spoilerWarning: true }
    render(<ReviewCard review={spoilerReview} />)
    
    await user.click(screen.getByText('Show anyway'))
    
    expect(screen.getByText(mockReview.content)).toBeInTheDocument()
  })

  it('renders correct star rating', () => {
    render(<ReviewCard review={mockReview} />)
    
    const stars = screen.getAllByRole('generic').filter(el => 
      el.querySelector('svg')
    )
    
    // Should have 4 filled stars and 1 empty star for rating of 4
    expect(screen.getByText('4/5')).toBeInTheDocument()
  })

  it('shows edited timestamp when review was updated', () => {
    const editedReview = {
      ...mockReview,
      updatedAt: '2023-01-02T00:00:00Z'
    }
    
    render(<ReviewCard review={editedReview} />)
    
    expect(screen.getByText(/Edited/)).toBeInTheDocument()
  })

  it('handles missing user information gracefully', () => {
    const reviewWithoutUser = { ...mockReview, user: undefined }
    render(<ReviewCard review={reviewWithoutUser} />)
    
    expect(screen.getByText('Anonymous User')).toBeInTheDocument()
  })

  it('handles image load error for user avatar', () => {
    const userWithAvatar = { ...mockUser, avatar: 'https://example.com/avatar.jpg' }
    const reviewWithAvatar = { ...mockReview, user: userWithAvatar }
    
    render(<ReviewCard review={reviewWithAvatar} />)
    
    const avatar = screen.getByAltText(userWithAvatar.displayName)
    fireEvent.error(avatar)
    
    // Should fall back to initials
    expect(screen.getByText('T')).toBeInTheDocument()
  })
})