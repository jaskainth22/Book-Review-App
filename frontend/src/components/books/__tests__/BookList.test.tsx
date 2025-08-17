import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { BookList } from '../BookList';
import { Book } from '../../../types';

const mockBooks: Book[] = [
  {
    id: '1',
    isbn: '9781234567890',
    title: 'Test Book 1',
    authors: ['Author 1'],
    description: 'Description 1',
    publishedDate: '2023-01-01',
    publisher: 'Publisher 1',
    pageCount: 200,
    categories: ['Fiction'],
    coverImage: 'https://example.com/cover1.jpg',
    averageRating: 4.0,
    ratingsCount: 100,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  },
  {
    id: '2',
    isbn: '9780987654321',
    title: 'Test Book 2',
    authors: ['Author 2'],
    description: 'Description 2',
    publishedDate: '2023-02-01',
    publisher: 'Publisher 2',
    pageCount: 300,
    categories: ['Non-Fiction'],
    coverImage: 'https://example.com/cover2.jpg',
    averageRating: 4.5,
    ratingsCount: 200,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  }
];

describe('BookList', () => {
  it('renders books correctly', () => {
    render(<BookList books={mockBooks} />);
    
    expect(screen.getByText('Test Book 1')).toBeInTheDocument();
    expect(screen.getByText('Test Book 2')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<BookList loading={true} />);
    
    expect(screen.getByText('Loading books...')).toBeInTheDocument();
  });

  it('shows error state', () => {
    render(<BookList error="Failed to load books" />);
    
    expect(screen.getByText('Error Loading Books')).toBeInTheDocument();
    expect(screen.getByText('Failed to load books')).toBeInTheDocument();
  });

  it('shows empty state when no books', () => {
    render(<BookList books={[]} />);
    
    expect(screen.getByText('No Books Found')).toBeInTheDocument();
    expect(screen.getByText('No books found')).toBeInTheDocument();
  });

  it('shows custom empty message', () => {
    render(<BookList books={[]} emptyMessage="Custom empty message" />);
    
    expect(screen.getByText('Custom empty message')).toBeInTheDocument();
  });

  it('shows title when provided', () => {
    render(<BookList books={mockBooks} title="My Books" />);
    
    expect(screen.getByText('My Books')).toBeInTheDocument();
  });

  it('shows sorting controls when enabled', () => {
    render(<BookList books={mockBooks} showSorting={true} />);
    
    expect(screen.getByText('Sort by:')).toBeInTheDocument();
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Author')).toBeInTheDocument();
    expect(screen.getByText('Rating')).toBeInTheDocument();
    expect(screen.getByText('Published')).toBeInTheDocument();
  });

  it('calls onSortChange when sort button is clicked', () => {
    const mockOnSortChange = vi.fn();
    render(
      <BookList 
        books={mockBooks} 
        showSorting={true} 
        onSortChange={mockOnSortChange}
      />
    );
    
    fireEvent.click(screen.getByText('Author'));
    expect(mockOnSortChange).toHaveBeenCalledWith('author', 'asc');
  });

  it('toggles sort order when same field is clicked', () => {
    const mockOnSortChange = vi.fn();
    render(
      <BookList 
        books={mockBooks} 
        showSorting={true} 
        sortBy="title"
        sortOrder="asc"
        onSortChange={mockOnSortChange}
      />
    );
    
    fireEvent.click(screen.getByText('Title'));
    expect(mockOnSortChange).toHaveBeenCalledWith('title', 'desc');
  });

  it('shows pagination when multiple pages', () => {
    render(
      <BookList 
        books={mockBooks} 
        currentPage={1}
        totalPages={3}
        onPageChange={vi.fn()}
      />
    );
    
    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('calls onPageChange when pagination buttons are clicked', () => {
    const mockOnPageChange = vi.fn();
    render(
      <BookList 
        books={mockBooks} 
        currentPage={2}
        totalPages={3}
        onPageChange={mockOnPageChange}
      />
    );
    
    fireEvent.click(screen.getByText('Previous'));
    expect(mockOnPageChange).toHaveBeenCalledWith(1);
    
    fireEvent.click(screen.getByText('Next'));
    expect(mockOnPageChange).toHaveBeenCalledWith(3);
    
    fireEvent.click(screen.getByText('1'));
    expect(mockOnPageChange).toHaveBeenCalledWith(1);
  });

  it('disables previous button on first page', () => {
    render(
      <BookList 
        books={mockBooks} 
        currentPage={1}
        totalPages={3}
        onPageChange={vi.fn()}
      />
    );
    
    const previousButton = screen.getByText('Previous');
    expect(previousButton).toBeDisabled();
  });

  it('disables next button on last page', () => {
    render(
      <BookList 
        books={mockBooks} 
        currentPage={3}
        totalPages={3}
        onPageChange={vi.fn()}
      />
    );
    
    const nextButton = screen.getByText('Next');
    expect(nextButton).toBeDisabled();
  });

  it('calls onBookSelect when book is clicked', () => {
    const mockOnBookSelect = vi.fn();
    render(<BookList books={mockBooks} onBookSelect={mockOnBookSelect} />);
    
    fireEvent.click(screen.getByText('Test Book 1'));
    expect(mockOnBookSelect).toHaveBeenCalledWith(mockBooks[0]);
  });

  it('shows add to list buttons when enabled', () => {
    render(<BookList books={mockBooks} showAddToList={true} />);
    
    expect(screen.getAllByText('Want to Read')).toHaveLength(2);
    expect(screen.getAllByText('Reading')).toHaveLength(2);
    expect(screen.getAllByText('Read')).toHaveLength(2);
  });

  it('calls onAddToList when add to list buttons are clicked', () => {
    const mockOnAddToList = vi.fn();
    render(
      <BookList 
        books={mockBooks} 
        showAddToList={true} 
        onAddToList={mockOnAddToList} 
      />
    );
    
    fireEvent.click(screen.getAllByText('Want to Read')[0]);
    expect(mockOnAddToList).toHaveBeenCalledWith(mockBooks[0], 'want-to-read');
  });

  it('applies custom className', () => {
    const { container } = render(<BookList books={mockBooks} className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('shows current sort field as active', () => {
    render(
      <BookList 
        books={mockBooks} 
        showSorting={true}
        sortBy="rating"
        sortOrder="desc"
      />
    );
    
    const ratingButton = screen.getByText('Rating').closest('button');
    expect(ratingButton).toHaveClass('bg-blue-100', 'text-blue-800');
  });

  it('does not show pagination for single page', () => {
    render(
      <BookList 
        books={mockBooks} 
        currentPage={1}
        totalPages={1}
        onPageChange={vi.fn()}
      />
    );
    
    expect(screen.queryByText('Previous')).not.toBeInTheDocument();
    expect(screen.queryByText('Next')).not.toBeInTheDocument();
  });

  it('renders custom empty icon', () => {
    const customIcon = <div data-testid="custom-icon">Custom Icon</div>;
    render(<BookList books={[]} emptyIcon={customIcon} />);
    
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('handles loading state with title', () => {
    render(<BookList loading={true} title="My Books" />);
    
    expect(screen.getByText('My Books')).toBeInTheDocument();
    expect(screen.getByText('Loading books...')).toBeInTheDocument();
  });

  it('does not show pagination when loading', () => {
    render(
      <BookList 
        loading={true} 
        currentPage={1}
        totalPages={3}
        onPageChange={vi.fn()}
      />
    );
    
    expect(screen.queryByText('Previous')).not.toBeInTheDocument();
    expect(screen.queryByText('Next')).not.toBeInTheDocument();
  });
});