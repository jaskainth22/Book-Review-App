import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import axios from 'axios'
import { ReviewList } from '../ReviewList'
import { Review, User, Book, PaginatedResponse } from '../../../types'

// Mock axios
vi.mock('axios')
const mockedAxios = axios as any

// Mock ReviewCard component
vi.mock('../ReviewCard', () => ({
  ReviewCard: ({ review, onEdit, onDelete, onFlag, showBookInfo }: any) => (
    <div data-testid={`review-${review.id}`}>
      <h3>{review.title}</h3>
      <p>{review.content}</p>
      {showBookInfo && review.book && <span>Book: {review.book.title}</span>}
      <button onClick={() => onEdit?.(review)}>Edit</button>
      <button onClick={() => onDelete?.(review.id)}>Delete</button>
      <button onClick={() => onFlag?.(review.id, 'test reason')}>Flag</button>
    </div>
  )
}))

// Mock ReviewForm component
vi.mock('../ReviewForm', () => ({
  ReviewForm: ({ book, existingReview, onSubmit, onCancel }: any) => (
    <div data-testid="review-form">
      <h2>Edit Review for {book.title}</h2>
      <button onClick={() => onSubmit?.(existingReview)}>Submit</button>
      <button onClick={() => onCancel?.()}>Cancel</button>
    </div>
  )
}))

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

const mockReviews: (Review & { user?: User; book?: Book })[] = [
  {
    id: '1',
    userId: '1',
    bookId: '1',
    rating: 4,
    title: 'Great book!',
    content: 'I really enjoyed this book.',
    spoilerWarning: false,
    likesCount: 5,
    commentsCount: 2,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    user: mockUser,
    book: mockBook
  },
  {
    id: '2',
    userId: '2',
    bookId: '1',
    rating: 3,
    title: 'Okay book',
    content: 'It was alright.',
    spoilerWarning: false,
    likesCount: 2,
    commentsCount: 1,
    createdAt: '2023-01-02T00:00:00Z',
    updatedAt: '2023-01-02T00:00:00Z',
    user: { ...mockUser, id: '2', displayName: 'Other User' },
    book: mockBook
  }
]

const mockPaginatedResponse: PaginatedResponse<Review & { user?: User; book?: Book }> = {
  data: mockReviews,
  pagination: {
    page: 1,
    limit: 10,
    total: 2,
    totalPages: 1
  }
}

describe('ReviewList', () => {
  beforeEach(() => {
    mockedAxios.get.mockResolvedValue({
      data: {
        success: true,
        data: mockPaginatedResponse
      }
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders reviews list', async () => {
    render(<ReviewList />)
    
    await waitFor(() => {
      expect(screen.getByText(/Reviews/)).toBeInTheDocument()
      expect(screen.getByTestId('review-1')).toBeInTheDocument()
      expect(screen.getByTestId('review-2')).toBeInTheDocument()
    })
  })

  it('renders with initial reviews without fetching', () => {
    render(<ReviewList initialReviews={mockReviews} />)
    
    expect(screen.getByText(/Reviews/)).toBeInTheDocument()
    expect(screen.getByTestId('review-1')).toBeInTheDocument()
    expect(screen.getByTestId('review-2')).toBeInTheDocument()
    expect(mockedAxios.get).not.toHaveBeenCalled()
  })

  it('shows loading state', () => {
    mockedAxios.get.mockImplementation(() => new Promise(() => {})) // Never resolves
    
    render(<ReviewList />)
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('shows error state', async () => {
    mockedAxios.get.mockRejectedValueOnce({
      response: {
        data: {
          error: {
            message: 'Failed to fetch reviews'
          }
        }
      }
    })
    
    render(<ReviewList />)
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load reviews. Please try again.')).toBeInTheDocument()
      expect(screen.getByText('Try again')).toBeInTheDocument()
    })
  })

  it('shows empty state when no reviews', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          data: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0
          }
        }
      }
    })
    
    render(<ReviewList />)
    
    await waitFor(() => {
      expect(screen.getByText('No reviews found')).toBeInTheDocument()
    })
  })

  it('toggles filters visibility', async () => {
    const user = userEvent.setup()
    render(<ReviewList initialReviews={mockReviews} />)
    
    expect(screen.queryByText('Sort by')).not.toBeInTheDocument()
    
    await user.click(screen.getByText('Filters'))
    
    expect(screen.getByText('Sort by')).toBeInTheDocument()
  })

  it('enters edit mode when review is edited', async () => {
    const user = userEvent.setup()
    render(<ReviewList initialReviews={mockReviews} />)
    
    await user.click(screen.getAllByText('Edit')[0])
    
    expect(screen.getByTestId('review-form')).toBeInTheDocument()
    expect(screen.getByText('Edit Review for Test Book')).toBeInTheDocument()
  })

  it('exits edit mode when cancel is clicked', async () => {
    const user = userEvent.setup()
    render(<ReviewList initialReviews={mockReviews} />)
    
    await user.click(screen.getAllByText('Edit')[0])
    expect(screen.getByTestId('review-form')).toBeInTheDocument()
    
    await user.click(screen.getByText('Cancel'))
    expect(screen.queryByTestId('review-form')).not.toBeInTheDocument()
  })
})