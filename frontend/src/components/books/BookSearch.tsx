import React, { useState, useEffect, useCallback } from 'react';
import { Book } from '../../types';
import { BookCard } from './BookCard';
import { useDebounce } from '../../hooks/useDebounce';

interface BookSearchProps {
  onBookSelect?: (book: Book) => void;
  onAddToList?: (book: Book, status: 'want-to-read' | 'currently-reading' | 'read') => void;
  showAddToList?: boolean;
  placeholder?: string;
  className?: string;
}

interface SearchFilters {
  author: string;
  category: string;
  sortBy: 'relevance' | 'rating' | 'published' | 'title';
}

interface SearchResult {
  books: Book[];
  pagination: {
    totalItems: number;
    currentPage: number;
    totalPages: number;
    hasMore: boolean;
    itemsPerPage: number;
  };
}

export const BookSearch: React.FC<BookSearchProps> = ({
  onBookSelect,
  onAddToList,
  showAddToList = false,
  placeholder = "Search for books by title, author, or ISBN...",
  className = ''
}) => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    author: '',
    category: '',
    sortBy: 'relevance'
  });
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const debouncedQuery = useDebounce(query, 300);
  const debouncedFilters = useDebounce(filters, 300);

  const searchBooks = useCallback(async (searchQuery: string, searchFilters: SearchFilters, page: number = 1) => {
    if (!searchQuery.trim() && !searchFilters.author.trim() && !searchFilters.category.trim()) {
      setResults(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      
      if (searchQuery.trim()) {
        params.append('query', searchQuery.trim());
      }
      
      if (searchFilters.author.trim()) {
        params.append('author', searchFilters.author.trim());
      }
      
      if (searchFilters.category.trim()) {
        params.append('category', searchFilters.category.trim());
      }
      
      params.append('maxResults', '12');
      params.append('startIndex', ((page - 1) * 12).toString());

      const response = await fetch(`/api/books/search?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to search books');
      }

      if (data.success) {
        setResults(data.data);
      } else {
        throw new Error(data.error?.message || 'Search failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while searching');
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Search when query or filters change
  useEffect(() => {
    setCurrentPage(1);
    searchBooks(debouncedQuery, debouncedFilters, 1);
  }, [debouncedQuery, debouncedFilters, searchBooks]);

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    searchBooks(query, filters, page);
  };

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      author: '',
      category: '',
      sortBy: 'relevance'
    });
  };

  const hasActiveFilters = filters.author || filters.category || filters.sortBy !== 'relevance';

  return (
    <div className={`w-full ${className}`}>
      {/* Search Input */}
      <div className="relative mb-4">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-3 pl-10 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`absolute inset-y-0 right-0 pr-3 flex items-center ${hasActiveFilters ? 'text-blue-600' : 'text-gray-400'} hover:text-blue-600`}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Author
              </label>
              <input
                type="text"
                value={filters.author}
                onChange={(e) => handleFilterChange('author', e.target.value)}
                placeholder="Filter by author"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <input
                type="text"
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                placeholder="Filter by category"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort by
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value as SearchFilters['sortBy'])}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="relevance">Relevance</option>
                <option value="rating">Rating</option>
                <option value="published">Publication Date</option>
                <option value="title">Title</option>
              </select>
            </div>
          </div>
          
          {hasActiveFilters && (
            <div className="mt-3">
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Searching...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Search Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {results && !loading && (
        <>
          {/* Results Header */}
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-600">
              {results.pagination.totalItems > 0 
                ? `Found ${results.pagination.totalItems.toLocaleString()} books`
                : 'No books found'
              }
            </p>
            {results.pagination.totalItems > 0 && (
              <p className="text-sm text-gray-500">
                Page {results.pagination.currentPage} of {results.pagination.totalPages}
              </p>
            )}
          </div>

          {/* Books Grid */}
          {results.books.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {results.books.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onClick={onBookSelect}
                  showAddToList={showAddToList}
                  onAddToList={onAddToList}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No books found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search terms or filters.
              </p>
            </div>
          )}

          {/* Pagination */}
          {results.pagination.totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {/* Page Numbers */}
              {Array.from({ length: Math.min(5, results.pagination.totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(
                  results.pagination.totalPages - 4,
                  currentPage - 2
                )) + i;
                
                if (pageNum > results.pagination.totalPages) return null;
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
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
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === results.pagination.totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Empty State for no query */}
      {!query && !filters.author && !filters.category && !loading && !results && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Start searching</h3>
          <p className="mt-1 text-sm text-gray-500">
            Enter a book title, author name, or ISBN to find books.
          </p>
        </div>
      )}
    </div>
  );
};