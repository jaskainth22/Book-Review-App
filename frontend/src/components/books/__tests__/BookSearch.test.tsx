import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { BookSearch } from '../BookSearch';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

// Mock the useDebounce hook
vi.mock('../../../hooks/useDebounce', () => ({
  useDebounce: (value: any) => value // Return value immediately for testing
}));

// Mock fetch
global.fetch = vi.fn();

const mockSearchResponse = {
  success: true,
  data: {
    books: [
      {
        id: '1',
        title: 'Test Book 1',
        authors: ['Author 1'],
        averageRating: 4.0,
        ratingsCount: 100,
        coverImage: 'https://example.com/cover1.jpg',
        description: 'Description 1',
        categories: ['Fiction'],
        publishedDate: '2023-01-01',
        publisher: 'Publisher 1',
        pageCount: 200,
        isbn: '9781234567890',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      }
    ],
    pagination: {
      totalItems: 1,
      currentPage: 1,
      totalPages: 1,
      hasMore: false,
      itemsPerPage: 12
    }
  }
};

describe('BookSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input with placeholder', () => {
    render(<BookSearch />);
    
    expect(screen.getByPlaceholderText(/Search for books by title, author, or ISBN/)).toBeInTheDocument();
  });

  it('shows empty state initially', () => {
    render(<BookSearch />);
    
    expect(screen.getByText('Start searching')).toBeInTheDocument();
    expect(screen.getByText('Enter a book title, author name, or ISBN to find books.')).toBeInTheDocument();
  });

  it('performs search when query is entered', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSearchResponse
    } as any);

    render(<BookSearch />);
    
    const searchInput = screen.getByPlaceholderText(/Search for books/);
    fireEvent.change(searchInput, { target: { value: 'test' } });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/books/search?query=test&maxResults=12&startIndex=0');
    });

    await waitFor(() => {
      expect(screen.getByText('Test Book 1')).toBeInTheDocument();
    });
  });

  it('shows error state when search fails', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        error: { message: 'Search failed' }
      })
    } as any);

    render(<BookSearch />);
    
    const searchInput = screen.getByPlaceholderText(/Search for books/);
    fireEvent.change(searchInput, { target: { value: 'test' } });

    await waitFor(() => {
      expect(screen.getByText('Search Error')).toBeInTheDocument();
      expect(screen.getByText('Search failed')).toBeInTheDocument();
    });
  });

  it('applies custom className', () => {
    const { container } = render(<BookSearch className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});