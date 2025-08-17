import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Review, User, Book, ApiResponse, PaginatedResponse } from '../../types'
import { ReviewCard } from './ReviewCard'
import { ReviewForm } from './ReviewForm'

interface ReviewListProps {
  bookId?: string
  userId?: string
  showBookInfo?: boolean
  initialReviews?: Review[]
  onReviewUpdate?: (reviews: Review[]) => void
  className?: string
}

interface ReviewFilters {
  sortBy: 'createdAt' | 'rating' | 'likesCount'
  sortOrder: 'ASC' | 'DESC'
  rating?: number
  minRating?: number
  maxRating?: number
  spoilerWarning?: boolean
}

export const ReviewList: React.FC<ReviewListProps> = ({
  bookId,
  userId,
  showBookInfo = false,
  initialReviews,
  onReviewUpdate,
  className = ''
}) => {
  const [reviews, setReviews] = useState<(Review & { user?: User; book?: Book })[]>(initialReviews || [])
  const [loading, setLoading] = useState(!initialReviews)
  const [error, setError] = useState<string | null>(null)
  const [editingReview, setEditingReview] = useState<Review | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalReviews, setTotalReviews] = useState(0)
  const [filters, setFilters] = useState<ReviewFilters>({
    sortBy: 'createdAt',
    sortOrder: 'DESC'
  })
  const [showFilters, setShowFilters] = useState(false)

  const pageSize = 10

  const fetchReviews = async (page: number = 1, newFilters?: ReviewFilters) => {
    setLoading(true)
    setError(null)

    try {
      const currentFilters = newFilters || filters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        sortBy: currentFilters.sortBy,
        sortOrder: currentFilters.sortOrder
      })

      if (bookId) params.append('bookId', bookId)
      if (userId) params.append('userId', userId)
      if (currentFilters.rating) params.append('rating', currentFilters.rating.toString())
      if (currentFilters.minRating) params.append('minRating', currentFilters.minRating.toString())
      if (currentFilters.maxRating) params.append('maxRating', currentFilters.maxRating.toString())
      if (currentFilters.spoilerWarning !== undefined) {
        params.append('spoilerWarning', currentFilters.spoilerWarning.toString())
      }

      const endpoint = bookId 
        ? `/books/${bookId}/reviews`
        : userId 
        ? `/users/${userId}/reviews`
        : '/reviews'

      const response = await axios.get<ApiResponse<PaginatedResponse<Review & { user?: User; book?: Book }>>>(
        `${endpoint}?${params}`
      )

      if (response.data.success && response.data.data) {
        const { data: reviewsData, pagination } = response.data.data
        setReviews(reviewsData)
        setCurrentPage(pagination.page)
        setTotalPages(pagination.totalPages)
        setTotalReviews(pagination.total)
        onReviewUpdate?.(reviewsData)
      } else {
        throw new Error(response.data.error?.message || 'Failed to fetch reviews')
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        setError(error.response.data.error.message)
      } else {
        setError('Failed to load reviews. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!initialReviews) {
      fetchReviews()
    }
  }, [bookId, userId, initialReviews])

  const handleFilterChange = (newFilters: Partial<ReviewFilters>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    setCurrentPage(1)
    fetchReviews(1, updatedFilters)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchReviews(page)
  }

  const handleReviewEdit = (review: Review) => {
    setEditingReview(review)
  }

  const handleReviewUpdate = (updatedReview: Review) => {
    setReviews(prev => prev.map(r => r.id === updatedReview.id ? { ...updatedReview, user: r.user, book: r.book } : r))
    setEditingReview(null)
    onReviewUpdate?.(reviews.map(r => r.id === updatedReview.id ? updatedReview : r))
  }

  const handleReviewDelete = (reviewId: string) => {
    setReviews(prev => prev.filter(r => r.id !== reviewId))
    setTotalReviews(prev => prev - 1)
    onReviewUpdate?.(reviews.filter(r => r.id !== reviewId))
    
    // Refresh the list to maintain pagination
    if (reviews.length === 1 && currentPage > 1) {
      handlePageChange(currentPage - 1)
    } else {
      fetchReviews(currentPage)
    }
  }

  const handleReviewFlag = (reviewId: string, reason: string) => {
    // Review flagged successfully - could show a toast notification
    console.log(`Review ${reviewId} flagged for: ${reason}`)
  }

  const renderPagination = () => {
    if (totalPages <= 1) return null

    const pages = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    return (
      <div className="flex items-center justify-center space-x-2 mt-8">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        {startPage > 1 && (
          <>
            <button
              onClick={() => handlePageChange(1)}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              1
            </button>
            {startPage > 2 && <span className="text-gray-500">...</span>}
          </>
        )}

        {pages.map(page => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`px-3 py-2 text-sm font-medium rounded-md ${
              page === currentPage
                ? 'text-white bg-blue-600 border border-blue-600'
                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {page}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="text-gray-500">...</span>}
            <button
              onClick={() => handlePageChange(totalPages)}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    )
  }

  if (editingReview && editingReview.book) {
    return (
      <ReviewForm
        book={editingReview.book}
        existingReview={editingReview}
        onSubmit={handleReviewUpdate}
        onCancel={() => setEditingReview(null)}
        className={className}
      />
    )
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Reviews{totalReviews > 0 ? ` (${totalReviews.toLocaleString()})` : ''}
          </h2>
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
          </svg>
          <span>Filters</span>
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort by
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange({ sortBy: e.target.value as any })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="createdAt">Date</option>
                <option value="rating">Rating</option>
                <option value="likesCount">Helpfulness</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order
              </label>
              <select
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange({ sortOrder: e.target.value as any })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="DESC">Newest first</option>
                <option value="ASC">Oldest first</option>
              </select>
            </div>

            {/* Rating Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rating
              </label>
              <select
                value={filters.rating || ''}
                onChange={(e) => handleFilterChange({ 
                  rating: e.target.value ? parseInt(e.target.value) : undefined 
                })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All ratings</option>
                <option value="5">5 stars</option>
                <option value="4">4 stars</option>
                <option value="3">3 stars</option>
                <option value="2">2 stars</option>
                <option value="1">1 star</option>
              </select>
            </div>
          </div>

          {/* Spoiler Filter */}
          <div className="mt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.spoilerWarning === false}
                onChange={(e) => handleFilterChange({ 
                  spoilerWarning: e.target.checked ? false : undefined 
                })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                Hide reviews with spoilers
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div data-testid="loading-spinner" className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={() => fetchReviews(currentPage)}
            className="mt-2 text-sm text-red-700 hover:text-red-900 underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Reviews List */}
      {!loading && !error && (
        <>
          {reviews.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 8h10m0 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m10 0v10a2 2 0 01-2 2H9a2 2 0 01-2-2V8m10 0H7"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No reviews found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {bookId 
                  ? 'Be the first to review this book!'
                  : 'No reviews match your current filters.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  onEdit={handleReviewEdit}
                  onDelete={handleReviewDelete}
                  onFlag={handleReviewFlag}
                  showBookInfo={showBookInfo}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {renderPagination()}
        </>
      )}
    </div>
  )
}