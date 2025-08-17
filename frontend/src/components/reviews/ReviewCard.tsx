import React, { useState } from 'react'
import axios from 'axios'
import { Review, User, ApiResponse } from '../../types'
import { useAuth } from '../../contexts/AuthContext'

interface ReviewCardProps {
  review: Review & { user?: User }
  onEdit?: (review: Review) => void
  onDelete?: (reviewId: string) => void
  onFlag?: (reviewId: string, reason: string) => void
  showBookInfo?: boolean
  className?: string
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  onEdit,
  onDelete,
  onFlag,
  showBookInfo = false,
  className = ''
}) => {
  const { user } = useAuth()
  const [showSpoilers, setShowSpoilers] = useState(false)
  const [showFlagModal, setShowFlagModal] = useState(false)
  const [flagReason, setFlagReason] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isFlagging, setIsFlagging] = useState(false)

  const isOwner = user?.id === review.userId
  const reviewUser = review.user

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="ml-1 text-sm text-gray-600">{rating}/5</span>
      </div>
    )
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    try {
      await axios.delete(`/reviews/${review.id}`)
      onDelete?.(review.id)
    } catch (error) {
      console.error('Failed to delete review:', error)
      alert('Failed to delete review. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleFlag = async () => {
    if (!flagReason.trim()) {
      alert('Please provide a reason for flagging this review.')
      return
    }

    setIsFlagging(true)
    try {
      await axios.post(`/reviews/${review.id}/flag`, { reason: flagReason })
      setShowFlagModal(false)
      setFlagReason('')
      onFlag?.(review.id, flagReason)
      alert('Review has been flagged for moderation. Thank you for your report.')
    } catch (error) {
      console.error('Failed to flag review:', error)
      alert('Failed to flag review. Please try again.')
    } finally {
      setIsFlagging(false)
    }
  }

  return (
    <>
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {/* User Avatar */}
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              {reviewUser?.avatar ? (
                <img
                  src={reviewUser.avatar}
                  alt={reviewUser.displayName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-gray-600 font-medium text-sm">
                  {reviewUser?.displayName?.charAt(0) || '?'}
                </span>
              )}
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900">
                {reviewUser?.displayName || 'Anonymous User'}
              </h4>
              <p className="text-sm text-gray-500">
                {formatDate(review.createdAt)}
              </p>
            </div>
          </div>

          {/* Actions Menu */}
          <div className="flex items-center space-x-2">
            {isOwner ? (
              <>
                <button
                  onClick={() => onEdit?.(review)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </>
            ) : (
              user && (
                <button
                  onClick={() => setShowFlagModal(true)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Report
                </button>
              )
            )}
          </div>
        </div>

        {/* Book Info (if showing) */}
        {showBookInfo && review.book && (
          <div className="flex items-center space-x-3 mb-4 p-3 bg-gray-50 rounded-lg">
            <img
              src={review.book.coverImage || '/placeholder-book-cover.png'}
              alt={`Cover of ${review.book.title}`}
              className="w-12 h-16 object-cover rounded"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = '/placeholder-book-cover.png'
              }}
            />
            <div>
              <h5 className="font-medium text-gray-900">{review.book.title}</h5>
              <p className="text-sm text-gray-600">
                by {review.book.authors.join(', ') || 'Unknown Author'}
              </p>
            </div>
          </div>
        )}

        {/* Rating and Title */}
        <div className="mb-3">
          {renderStars(review.rating)}
          <h3 className="text-lg font-semibold text-gray-900 mt-2">
            {review.title}
          </h3>
        </div>

        {/* Spoiler Warning */}
        {review.spoilerWarning && !showSpoilers && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-yellow-600 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm font-medium text-yellow-800">
                  This review contains spoilers
                </span>
              </div>
              <button
                onClick={() => setShowSpoilers(true)}
                className="text-sm text-yellow-700 hover:text-yellow-900 underline"
              >
                Show anyway
              </button>
            </div>
          </div>
        )}

        {/* Review Content */}
        {(!review.spoilerWarning || showSpoilers) && (
          <div className="mb-4">
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {review.content}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-4">
            <span>{review.likesCount} helpful</span>
            <span>{review.commentsCount} comments</span>
          </div>
          
          {review.updatedAt !== review.createdAt && (
            <span>Edited {formatDate(review.updatedAt)}</span>
          )}
        </div>
      </div>

      {/* Flag Modal */}
      {showFlagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Report Review
            </h3>
            
            <p className="text-sm text-gray-600 mb-4">
              Please let us know why you're reporting this review. We'll review it and take appropriate action.
            </p>

            <textarea
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              placeholder="Reason for reporting..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
              maxLength={500}
            />
            
            <p className="mt-1 text-xs text-gray-500">
              {flagReason.length}/500 characters
            </p>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowFlagModal(false)
                  setFlagReason('')
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={isFlagging}
              >
                Cancel
              </button>
              <button
                onClick={handleFlag}
                disabled={isFlagging || !flagReason.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isFlagging ? 'Reporting...' : 'Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}