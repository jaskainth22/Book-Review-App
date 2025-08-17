import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { BookCard } from '../BookCard';
import { Book } from '../../../types';

const mockBook: Book = {
  id: '1',
  isbn: '9781234567890',
  title: 'Test Book Title',
  authors: ['John Doe', 'Jane Smith'],
  description: 'This is a test book description that should be displayed in the card.',
  publishedDate: '2023-01-15',
  publisher: 'Test Publisher',
  pageCount: 300,
  categories: ['Fiction', 'Mystery', 'Thriller'],
  coverImage: 'https://example.com/cover.jpg',
  averageRating: 4.2,
  ratingsCount: 150,
  googleBooksId: 'google-123',
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z'
};

describe('BookCard', () => {
  it('renders book information correctly', () => {
    render(<BookCard book={mockBook} />);
    
    expect(screen.getByText('Test Book Title')).toBeInTheDocument();
    expect(screen.getByText('by John Doe and Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Published 2023')).toBeInTheDocument();
    expect(screen.getByText('4.2 (150 ratings)')).toBeInTheDocument();
    expect(screen.getByText(/This is a test book description/)).toBeInTheDocument();
  });

  it('handles single author correctly', () => {
    const singleAuthorBook = { ...mockBook, authors: ['Single Author'] };
    render(<BookCard book={singleAuthorBook} />);
    
    expect(screen.getByText('by Single Author')).toBeInTheDocument();
  });

  it('handles multiple authors correctly', () => {
    const multipleAuthorsBook = { ...mockBook, authors: ['Author 1', 'Author 2', 'Author 3'] };
    render(<BookCard book={multipleAuthorsBook} />);
    
    expect(screen.getByText('by Author 1 and 2 others')).toBeInTheDocument();
  });

  it('handles unknown author', () => {
    const noAuthorBook = { ...mockBook, authors: [] };
    render(<BookCard book={noAuthorBook} />);
    
    expect(screen.getByText('by Unknown Author')).toBeInTheDocument();
  });

  it('handles no ratings', () => {
    const noRatingsBook = { ...mockBook, averageRating: 0, ratingsCount: 0 };
    render(<BookCard book={noRatingsBook} />);
    
    expect(screen.getByText('No ratings')).toBeInTheDocument();
  });

  it('displays categories with limit', () => {
    render(<BookCard book={mockBook} />);
    
    expect(screen.getByText('Fiction')).toBeInTheDocument();
    expect(screen.getByText('Mystery')).toBeInTheDocument();
    expect(screen.getByText('Thriller')).toBeInTheDocument();
  });

  it('shows "more categories" indicator when there are many categories', () => {
    const manyCategoriesBook = { 
      ...mockBook, 
      categories: ['Cat1', 'Cat2', 'Cat3', 'Cat4', 'Cat5'] 
    };
    render(<BookCard book={manyCategoriesBook} />);
    
    expect(screen.getByText('+2 more')).toBeInTheDocument();
  });

  it('calls onClick when card is clicked', () => {
    const mockOnClick = vi.fn();
    render(<BookCard book={mockBook} onClick={mockOnClick} />);
    
    fireEvent.click(screen.getByText('Test Book Title'));
    expect(mockOnClick).toHaveBeenCalledWith(mockBook);
  });

  it('shows add to list buttons when enabled', () => {
    const mockOnAddToList = vi.fn();
    render(
      <BookCard 
        book={mockBook} 
        showAddToList={true} 
        onAddToList={mockOnAddToList} 
      />
    );
    
    expect(screen.getByText('Want to Read')).toBeInTheDocument();
    expect(screen.getByText('Reading')).toBeInTheDocument();
    expect(screen.getByText('Read')).toBeInTheDocument();
  });

  it('calls onAddToList when add to list buttons are clicked', () => {
    const mockOnAddToList = vi.fn();
    render(
      <BookCard 
        book={mockBook} 
        showAddToList={true} 
        onAddToList={mockOnAddToList} 
      />
    );
    
    fireEvent.click(screen.getByText('Want to Read'));
    expect(mockOnAddToList).toHaveBeenCalledWith(mockBook, 'want-to-read');
    
    fireEvent.click(screen.getByText('Reading'));
    expect(mockOnAddToList).toHaveBeenCalledWith(mockBook, 'currently-reading');
    
    fireEvent.click(screen.getByText('Read'));
    expect(mockOnAddToList).toHaveBeenCalledWith(mockBook, 'read');
  });

  it('prevents event propagation when add to list buttons are clicked', () => {
    const mockOnClick = vi.fn();
    const mockOnAddToList = vi.fn();
    render(
      <BookCard 
        book={mockBook} 
        onClick={mockOnClick}
        showAddToList={true} 
        onAddToList={mockOnAddToList} 
      />
    );
    
    fireEvent.click(screen.getByText('Want to Read'));
    expect(mockOnClick).not.toHaveBeenCalled();
    expect(mockOnAddToList).toHaveBeenCalledWith(mockBook, 'want-to-read');
  });

  it('handles missing cover image', () => {
    const noCoverBook = { ...mockBook, coverImage: '' };
    render(<BookCard book={noCoverBook} />);
    
    expect(screen.getByText('No Cover')).toBeInTheDocument();
  });

  it('handles image load error', () => {
    render(<BookCard book={mockBook} />);
    
    const image = screen.getByAltText('Cover of Test Book Title');
    fireEvent.error(image);
    
    expect(image).toHaveAttribute('src', '/placeholder-book-cover.png');
  });

  it('applies custom className', () => {
    const { container } = render(<BookCard book={mockBook} className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('handles missing optional fields gracefully', () => {
    const minimalBook: Book = {
      id: '1',
      isbn: '',
      title: 'Minimal Book',
      authors: ['Author'],
      description: '',
      publishedDate: '',
      publisher: '',
      pageCount: 0,
      categories: [],
      coverImage: '',
      averageRating: 0,
      ratingsCount: 0,
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z'
    };
    
    render(<BookCard book={minimalBook} />);
    
    expect(screen.getByText('Minimal Book')).toBeInTheDocument();
    expect(screen.getByText('by Author')).toBeInTheDocument();
    expect(screen.getByText('No ratings')).toBeInTheDocument();
  });
});