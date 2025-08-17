import React, { useState, useEffect } from 'react';
import { Book, Review } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface BookDetailProps {
  bookId: string;
  onClose?: () => void;
  onAddToList?: (book: Book, status: 'want-to-read' | 'currently-reading' | 'read') => void;
  onWriteReview?: (book: Book) => void;
}

export const BookDetail: React.FC<BookDetailProps> = ({
  bookId,
  onClose,
  onAddToList,
  onWriteReview
}) => {
  const { user } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    fetchBookDetails();
  }, [bookId]);

  const fetchBookDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/books/${bookId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch book details');
      }

      if (data.success) {
        setBook(data.data.book);
        // Fetch reviews after getting book details
        fetchReviews();
      } else {
        throw new Error(data.error?.message || 'Failed to fetch book details');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      // This would be implemented when review endpoints are available
      // const response = await fetch(`/api/books/${bookId}/reviews?limit=5`);
      // const data = await response.json();
      // if (data.success) {
      //   setReviews(data.data.reviews);
      // }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleAddToList = (status: 'want-to-read' | 'currently-reading' | 'read') => {
    if (book && onAddToList) {
      onAddToList(book, status);
    }
  };

  const handleWriteReview = () => {
    if (book && onWriteReview) {
      onWriteReview(book);
    }
  };

  const formatAuthors = (authors: string[]) => {
    if (authors.length === 0) return 'Unknown Author';
    if (authors.length === 1) return authors[0];
    if (authors.length === 2) return authors.join(' and ');
    return `${authors.slice(0, -1).join(', ')} and ${authors[authors.length - 1]}`;
  };

  const formatPublishedDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading book details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">Error Loading Book</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <div className="mt-4 flex justify-center space-x-3">
              <button
                onClick={fetchBookDetails}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Try Again
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!book) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Book Details</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Book Content */}
        <div className="p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Book Cover */}
            <div className="flex-shrink-0">
              <div className="w-48 h-72 mx-auto lg:mx-0">
                {book.coverImage ? (
                  <img
                    src={book.coverImage}
                    alt={`Cover of ${book.title}`}
                    className="w-full h-full object-cover rounded-lg shadow-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-book-cover.png';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400">No Cover Available</span>
                  </div>
                )}
              </div>
            </div>

            {/* Book Information */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{book.title}</h1>
              <p className="text-xl text-gray-600 mb-4">by {formatAuthors(book.authors)}</p>

              {/* Rating */}
              <div className="flex items-center mb-4">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-5 h-5 ${
                        star <= Math.round(book.averageRating)
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="ml-2 text-lg text-gray-600">
                  {book.averageRating > 0 
                    ? `${book.averageRating.toFixed(1)} (${book.ratingsCount.toLocaleString()} ratings)`
                    : 'No ratings yet'
                  }
                </span>
              </div>

              {/* Book Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {book.publisher && (
                  <div>
                    <span className="font-medium text-gray-700">Publisher:</span>
                    <span className="ml-2 text-gray-600">{book.publisher}</span>
                  </div>
                )}
                
                {book.publishedDate && (
                  <div>
                    <span className="font-medium text-gray-700">Published:</span>
                    <span className="ml-2 text-gray-600">{formatPublishedDate(book.publishedDate)}</span>
                  </div>
                )}
                
                {book.pageCount > 0 && (
                  <div>
                    <span className="font-medium text-gray-700">Pages:</span>
                    <span className="ml-2 text-gray-600">{book.pageCount.toLocaleString()}</span>
                  </div>
                )}
                
                {book.isbn && (
                  <div>
                    <span className="font-medium text-gray-700">ISBN:</span>
                    <span className="ml-2 text-gray-600">{book.isbn}</span>
                  </div>
                )}
              </div>

              {/* Categories */}
              {book.categories && book.categories.length > 0 && (
                <div className="mb-6">
                  <span className="font-medium text-gray-700">Categories:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {book.categories.map((category, index) => (
                      <span
                        key={index}
                        className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {user && (
                <div className="flex flex-wrap gap-3 mb-6">
                  <button
                    onClick={() => handleAddToList('want-to-read')}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    Want to Read
                  </button>
                  <button
                    onClick={() => handleAddToList('currently-reading')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Currently Reading
                  </button>
                  <button
                    onClick={() => handleAddToList('read')}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Read
                  </button>
                  <button
                    onClick={handleWriteReview}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                  >
                    Write Review
                  </button>
                </div>
              )}

              {/* Description */}
              {book.description && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700 leading-relaxed">{book.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Reviews Section */}
          <div className="mt-8 border-t pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Reviews</h3>
              {user && (
                <button
                  onClick={handleWriteReview}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Write a Review
                </button>
              )}
            </div>

            {reviewsLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b pb-4">
                    <div className="flex items-center mb-2">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`w-4 h-4 ${
                              star <= review.rating ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="ml-2 font-medium text-gray-900">{review.title}</span>
                    </div>
                    <p className="text-gray-700 text-sm">{review.content}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      by {review.user?.displayName || 'Anonymous'} • {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h4 className="mt-2 text-sm font-medium text-gray-900">No reviews yet</h4>
                <p className="mt-1 text-sm text-gray-500">
                  Be the first to review this book!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};