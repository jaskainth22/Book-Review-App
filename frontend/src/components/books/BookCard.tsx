import React from 'react';
import { Book } from '../../types';

interface BookCardProps {
  book: Book;
  onClick?: (book: Book) => void;
  showAddToList?: boolean;
  onAddToList?: (book: Book, status: 'want-to-read' | 'currently-reading' | 'read') => void;
  className?: string;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  onClick,
  showAddToList = false,
  onAddToList,
  className = ''
}) => {
  const handleCardClick = () => {
    if (onClick) {
      onClick(book);
    }
  };

  const handleAddToList = (status: 'want-to-read' | 'currently-reading' | 'read') => {
    if (onAddToList) {
      onAddToList(book, status);
    }
  };

  const formatAuthors = (authors: string[]) => {
    if (authors.length === 0) return 'Unknown Author';
    if (authors.length === 1) return authors[0];
    if (authors.length === 2) return authors.join(' and ');
    return `${authors[0]} and ${authors.length - 1} others`;
  };

  const formatRating = (rating: number, count: number) => {
    if (count === 0) return 'No ratings';
    return `${rating.toFixed(1)} (${count.toLocaleString()} ratings)`;
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden cursor-pointer ${className}`}
      onClick={handleCardClick}
    >
      <div className="flex p-4">
        {/* Book Cover */}
        <div className="flex-shrink-0 w-20 h-28 mr-4">
          {book.coverImage ? (
            <img
              src={book.coverImage}
              alt={`Cover of ${book.title}`}
              className="w-full h-full object-cover rounded"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder-book-cover.png';
              }}
            />
          ) : (
            <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
              <span className="text-gray-400 text-xs text-center">No Cover</span>
            </div>
          )}
        </div>

        {/* Book Details */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
            {book.title}
          </h3>
          
          <p className="text-sm text-gray-600 mb-2">
            by {formatAuthors(book.authors)}
          </p>

          {book.publishedDate && (
            <p className="text-xs text-gray-500 mb-2">
              Published {new Date(book.publishedDate).getFullYear()}
            </p>
          )}

          {/* Rating */}
          <div className="flex items-center mb-2">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`w-4 h-4 ${
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
            <span className="ml-2 text-sm text-gray-600">
              {formatRating(book.averageRating, book.ratingsCount)}
            </span>
          </div>

          {/* Description */}
          {book.description && (
            <p className="text-sm text-gray-700 line-clamp-2 mb-3">
              {book.description}
            </p>
          )}

          {/* Categories */}
          {book.categories && book.categories.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {book.categories.slice(0, 3).map((category, index) => (
                <span
                  key={index}
                  className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                >
                  {category}
                </span>
              ))}
              {book.categories.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{book.categories.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Add to List Buttons */}
          {showAddToList && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToList('want-to-read');
                }}
                className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200 transition-colors"
              >
                Want to Read
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToList('currently-reading');
                }}
                className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
              >
                Reading
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToList('read');
                }}
                className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
              >
                Read
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};