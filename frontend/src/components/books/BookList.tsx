import React, { useState, useEffect } from 'react';
import { Book } from '../../types';
import { BookCard } from './BookCard';

interface BookListProps {
  books?: Book[];
  loading?: boolean;
  error?: string | null;
  onBookSelect?: (book: Book) => void;
  onAddToList?: (book: Book, status: 'want-to-read' | 'currently-reading' | 'read') => void;
  showAddToList?: boolean;
  title?: string;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  className?: string;
  // Pagination props
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  // Sorting props
  sortBy?: 'title' | 'author' | 'rating' | 'published';
  sortOrder?: 'asc' | 'desc';
  onSortChange?: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  showSorting?: boolean;
}

export const BookList: React.FC<BookListProps> = ({
  books = [],
  loading = false,
  error = null,
  onBookSelect,
  onAddToList,
  showAddToList = false,
  title,
  emptyMessage = "No books found",
  emptyIcon,
  className = '',
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  sortBy = 'title',
  sortOrder = 'asc',
  onSortChange,
  showSorting = false
}) => {
  const [localSortBy, setLocalSortBy] = useState(sortBy);
  const [localSortOrder, setLocalSortOrder] = useState(sortOrder);

  useEffect(() => {
    setLocalSortBy(sortBy);
    setLocalSortOrder(sortOrder);
  }, [sortBy, sortOrder]);

  const handleSortChange = (newSortBy: string) => {
    let newSortOrder: 'asc' | 'desc' = 'asc';
    
    // If clicking the same sort field, toggle order
    if (newSortBy === localSortBy) {
      newSortOrder = localSortOrder === 'asc' ? 'desc' : 'asc';
    }
    
    setLocalSortBy(newSortBy);
    setLocalSortOrder(newSortOrder);
    
    if (onSortChange) {
      onSortChange(newSortBy, newSortOrder);
    }
  };

  const getSortIcon = (field: string) => {
    if (localSortBy !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    return localSortOrder === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
      </svg>
    );
  };

  const defaultEmptyIcon = (
    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );

  return (
    <div className={`w-full ${className}`}>
      {/* Header */}
      {(title || showSorting) && (
        <div className="flex justify-between items-center mb-6">
          {title && (
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          )}
          
          {showSorting && (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Sort by:</span>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleSortChange('title')}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm ${
                    localSortBy === 'title'
                      ? 'bg-blue-100 text-blue-800'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span>Title</span>
                  {getSortIcon('title')}
                </button>
                
                <button
                  onClick={() => handleSortChange('author')}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm ${
                    localSortBy === 'author'
                      ? 'bg-blue-100 text-blue-800'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span>Author</span>
                  {getSortIcon('author')}
                </button>
                
                <button
                  onClick={() => handleSortChange('rating')}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm ${
                    localSortBy === 'rating'
                      ? 'bg-blue-100 text-blue-800'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span>Rating</span>
                  {getSortIcon('rating')}
                </button>
                
                <button
                  onClick={() => handleSortChange('published')}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm ${
                    localSortBy === 'published'
                      ? 'bg-blue-100 text-blue-800'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span>Published</span>
                  {getSortIcon('published')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading books...</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Books</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Books Grid */}
      {!loading && !error && books.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {books.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onClick={onBookSelect}
                showAddToList={showAddToList}
                onAddToList={onAddToList}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && onPageChange && (
            <div className="flex justify-center items-center space-x-2">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {/* Page Numbers */}
              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                let pageNum;
                
                if (totalPages <= 7) {
                  pageNum = i + 1;
                } else {
                  // Show first page, current page area, and last page
                  if (currentPage <= 4) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 3) {
                    pageNum = totalPages - 6 + i;
                  } else {
                    pageNum = currentPage - 3 + i;
                  }
                }
                
                if (pageNum < 1 || pageNum > totalPages) return null;
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      pageNum === currentPage
                        ? 'text-blue-600 bg-blue-50 border border-blue-300'
                        : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              {totalPages > 7 && currentPage < totalPages - 3 && (
                <>
                  <span className="px-2 text-gray-500">...</span>
                  <button
                    onClick={() => onPageChange(totalPages)}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    {totalPages}
                  </button>
                </>
              )}
              
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!loading && !error && books.length === 0 && (
        <div className="text-center py-12">
          {emptyIcon || defaultEmptyIcon}
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Books Found</h3>
          <p className="mt-1 text-sm text-gray-500">{emptyMessage}</p>
        </div>
      )}
    </div>
  );
};