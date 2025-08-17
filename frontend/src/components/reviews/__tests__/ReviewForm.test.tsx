import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import axios from 'axios'
import { ReviewForm } from '../ReviewForm'
import { useAuth } from '../../../contexts/AuthContext'
import { Book, Review, User } from '../../../types'
import { afterEach } from 'node:test'

// Mock axios
vi.mock('axios')
const mockedAxios = axios as any

// Mock useAuth hook
vi.mock('../../../contexts/AuthContext')
const mockedUseAuth = useAuth as any

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

const mockReview: Review = {
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
  updatedAt: '2023-01-01T00:00:00Z'
}

describe('ReviewForm', () => {
  beforeEach(() => {
    mockedUseAuth.mockReturnValue({
      user: mockUser,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      loading: false,
      googleLogin: vi.fn()
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders form for new review', () => {
    render(<ReviewForm book={mockBook} />)
    
    expect(screen.getByText('Write a Review')).toBeInTheDocument()
    expect(screen.getByText(mockBook.title)).toBeInTheDocument()
    expect(screen.getByText(`by ${mockBook.authors[0]}`)).toBeInTheDocument()
    expect(screen.getByLabelText(/rating/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/review title/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/review \*/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/spoilers/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /post review/i })).toBeInTheDocument()
  })

  it('renders form for editing existing review', () => {
    render(<ReviewForm book={mockBook} existingReview={mockReview} />)
    
    expect(screen.getByText('Edit Review')).toBeInTheDocument()
    expect(screen.getByDisplayValue(mockReview.title)).toBeInTheDocument()
    expect(screen.getByDisplayValue(mockReview.content)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /update review/i })).toBeInTheDocument()
  })

  it('allows user to select rating', async () => {
    const user = userEvent.setup()
    render(<ReviewForm book={mockBook} />)
    
    const stars = screen.getAllByRole('button').filter(button => 
      button.querySelector('svg')
    )
    
    await user.click(stars[3]) // Click 4th star (4 stars)
    
    expect(screen.getByText('4 stars')).toBeInTheDocument()
  })

  it('shows validation error when rating is not selected', async () => {
    const user = userEvent.setup()
    render(<ReviewForm book={mockBook} />)
    
    await user.type(screen.getByLabelText(/review title/i), 'Test Title')
    await user.type(screen.getByLabelText(/review \*/i), 'Test content')
    await user.click(screen.getByRole('button', { name: /post review/i }))
    
    expect(screen.getByText('Please select a rating')).toBeInTheDocument()
  })

  it('shows validation error when title is empty', async () => {
    const user = userEvent.setup()
    render(<ReviewForm book={mockBook} />)
    
    // Select rating
    const stars = screen.getAllByRole('button').filter(button => 
      button.querySelector('svg')
    )
    await user.click(stars[3])
    
    await user.type(screen.getByLabelText(/review \*/i), 'Test content')
    await user.click(screen.getByRole('button', { name: /post review/i }))
    
    expect(screen.getByText('Please enter a review title')).toBeInTheDocument()
  })

  it('shows validation error when content is empty', async () => {
    const user = userEvent.setup()
    render(<ReviewForm book={mockBook} />)
    
    // Select rating
    const stars = screen.getAllByRole('button').filter(button => 
      button.querySelector('svg')
    )
    await user.click(stars[3])
    
    await user.type(screen.getByLabelText(/review title/i), 'Test Title')
    await user.click(screen.getByRole('button', { name: /post review/i }))
    
    expect(screen.getByText('Please enter your review')).toBeInTheDocument()
  })

  it('submits new review successfully', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: mockReview
      }
    })
    
    render(<ReviewForm book={mockBook} onSubmit={onSubmit} />)
    
    // Fill form
    const stars = screen.getAllByRole('button').filter(button => 
      button.querySelector('svg')
    )
    await user.click(stars[3]) // 4 stars
    await user.type(screen.getByLabelText(/review title/i), 'Great book!')
    await user.type(screen.getByLabelText(/review \*/i), 'I really enjoyed this book.')
    
    await user.click(screen.getByRole('button', { name: /post review/i }))
    
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith('/reviews', {
        bookId: mockBook.id,
        rating: 4,
        title: 'Great book!',
        content: 'I really enjoyed this book.',
        spoilerWarning: false
      })
      expect(onSubmit).toHaveBeenCalledWith(mockReview)
    })
  })

  it('updates existing review successfully', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    
    mockedAxios.put.mockResolvedValueOnce({
      data: {
        success: true,
        data: { ...mockReview, title: 'Updated title' }
      }
    })
    
    render(<ReviewForm book={mockBook} existingReview={mockReview} onSubmit={onSubmit} />)
    
    // Update title
    const titleInput = screen.getByDisplayValue(mockReview.title)
    await user.clear(titleInput)
    await user.type(titleInput, 'Updated title')
    
    await user.click(screen.getByRole('button', { name: /update review/i }))
    
    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalledWith(`/reviews/${mockReview.id}`, {
        bookId: mockBook.id,
        rating: mockReview.rating,
        title: 'Updated title',
        content: mockReview.content,
        spoilerWarning: false
      })
      expect(onSubmit).toHaveBeenCalledWith({ ...mockReview, title: 'Updated title' })
    })
  })

  it('handles spoiler warning checkbox', async () => {
    const user = userEvent.setup()
    render(<ReviewForm book={mockBook} />)
    
    const spoilerCheckbox = screen.getByLabelText(/spoilers/i)
    expect(spoilerCheckbox).not.toBeChecked()
    
    await user.click(spoilerCheckbox)
    expect(spoilerCheckbox).toBeChecked()
  })

  it('shows character count for title and content', async () => {
    const user = userEvent.setup()
    render(<ReviewForm book={mockBook} />)
    
    expect(screen.getByText('0/200 characters')).toBeInTheDocument()
    expect(screen.getByText('0/5000 characters')).toBeInTheDocument()
    
    await user.type(screen.getByLabelText(/review title/i), 'Test')
    expect(screen.getByText('4/200 characters')).toBeInTheDocument()
  })

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    
    render(<ReviewForm book={mockBook} onCancel={onCancel} />)
    
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onCancel).toHaveBeenCalled()
  })

  it('shows error when user is not authenticated', async () => {
    const user = userEvent.setup()
    
    mockedUseAuth.mockReturnValue({
      user: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      loading: false,
      googleLogin: vi.fn()
    })
    
    render(<ReviewForm book={mockBook} />)
    
    // Fill form
    const stars = screen.getAllByRole('button').filter(button => 
      button.querySelector('svg')
    )
    await user.click(stars[3])
    await user.type(screen.getByLabelText(/review title/i), 'Test')
    await user.type(screen.getByLabelText(/review \*/i), 'Test content')
    
    await user.click(screen.getByRole('button', { name: /post review/i }))
    
    expect(screen.getByText('You must be logged in to write a review')).toBeInTheDocument()
  })

  it('handles API error', async () => {
    const user = userEvent.setup()
    
    mockedAxios.post.mockRejectedValueOnce({
      response: {
        data: {
          error: {
            message: 'Review already exists'
          }
        }
      }
    })
    
    render(<ReviewForm book={mockBook} />)
    
    // Fill form
    const stars = screen.getAllByRole('button').filter(button => 
      button.querySelector('svg')
    )
    await user.click(stars[3])
    await user.type(screen.getByLabelText(/review title/i), 'Test')
    await user.type(screen.getByLabelText(/review \*/i), 'Test content')
    
    await user.click(screen.getByRole('button', { name: /post review/i }))
    
    await waitFor(() => {
      expect(screen.getByText('Failed to save review. Please try again.')).toBeInTheDocument()
    })
  })
})