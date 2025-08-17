import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Review, Book, ApiResponse } from '../../types'
import { useAuth } from '../../contexts/AuthContext'

interface ReviewFormProps {
  book: Book
  existingReview?: Review
  onSubmit?: (review: Review) => void
  onCancel?: () => void
  className?: string
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  book,
  existingReview,
  onSubmit,
  onCancel,
  className = ''
}) => {
  const { user } = useAuth()
  const [rating, setRating] = useState(existingReview?.rating || 0)
  const [title, setTitle] = useState(existingReview?.title || '')
  const [content, setContent] = useState(existingReview?.content || '')
  const [spoilerWarning, setSpoilerWarning] = useState(existingReview?.spoilerWarning || false)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!existingReview

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError('You must be logged in to write a review')
      return
    }

    if (rating === 0) {
      setError('Please select a rating')
      return
    }

    if (!title.trim()) {
      setError('Please enter a review title')
      return
    }

    if (!content.trim()) {
      setError('Please enter your review')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const reviewData = {
        bookId: book.id,
        rating,
        title: title.trim(),
        content: content.trim(),
        spoilerWarning
      }

      let response: any

      if (isEditing && existingReview) {
        response = await axios.put<ApiResponse<Review>>(`/reviews/${existingReview.id}`, reviewData)
      } else {
        response = await axios.post<ApiResponse<Review>>('/reviews', reviewData)
      }

      if (response.data.success && response.data.data) {
        onSubmit?.(response.data.data)
      } else {
        throw new Error(response.data.error?.message || 'Failed to save review')
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        setError(error.response.data.error.message)
      } else {
        setError('Failed to save review. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStars = () => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`w-8 h-8 transition-colors ${
              star <= (hoveredRating || rating)
                ? 'text-yellow-400'
                : 'text-gray-300'
            } hover:text-yellow-400`}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            onClick={() => setRating(star)}
          >
            <svg
              className="w-full h-full"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600">
          {rating > 0 ? `${rating} star${rating !== 1 ? 's' : ''}` : 'Select rating'}
        </span>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {isEditing ? 'Edit Review' : 'Write a Review'}
        </h2>
        <div className="flex items-center space-x-4">
          <img
            src={book.coverImage || '/placeholder-book-cover.png'}
            alt={`Cover of ${book.title}`}
            className="w-12 h-16 object-cover rounded"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = '/placeholder-book-cover.png'
            }}
          />
          <div>
            <h3 className="font-medium text-gray-900">{book.title}</h3>
            <p className="text-sm text-gray-600">
              by {book.authors.join(', ') || 'Unknown Author'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating *
          </label>
          {renderStars()}
        </div>

        {/* Title */}
        <div>
          <label htmlFor="review-title" className="block text-sm font-medium text-gray-700 mb-2">
            Review Title *
          </label>
          <input
            type="text"
            id="review-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What did you think of this book?"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            maxLength={200}
          />
          <p className="mt-1 text-xs text-gray-500">
            {title.length}/200 characters
          </p>
        </div>

        {/* Content */}
        <div>
          <label htmlFor="review-content" className="block text-sm font-medium text-gray-700 mb-2">
            Review *
          </label>
          <textarea
            id="review-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts about this book..."
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
            maxLength={5000}
          />
          <p className="mt-1 text-xs text-gray-500">
            {content.length}/5000 characters
          </p>
        </div>

        {/* Spoiler Warning */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="spoiler-warning"
            checked={spoilerWarning}
            onChange={(e) => setSpoilerWarning(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="spoiler-warning" className="ml-2 block text-sm text-gray-700">
            This review contains spoilers
          </label>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting || rating === 0 || !title.trim() || !content.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : (isEditing ? 'Update Review' : 'Post Review')}
          </button>
        </div>
      </form>
    </div>
  )
}