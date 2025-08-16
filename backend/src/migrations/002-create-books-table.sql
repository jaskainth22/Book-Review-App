-- Migration: Create books table
-- Created: 2024-01-01

CREATE TABLE IF NOT EXISTS books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    isbn VARCHAR(17) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    authors TEXT[] NOT NULL,
    description TEXT,
    published_date DATE,
    publisher VARCHAR(255),
    page_count INTEGER CHECK (page_count > 0),
    categories TEXT[] DEFAULT '{}',
    cover_image TEXT,
    average_rating DECIMAL(2,1) DEFAULT 0 CHECK (average_rating >= 0 AND average_rating <= 5),
    ratings_count INTEGER DEFAULT 0 CHECK (ratings_count >= 0),
    google_books_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn);
CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
CREATE INDEX IF NOT EXISTS idx_books_authors ON books USING gin(authors);
CREATE INDEX IF NOT EXISTS idx_books_categories ON books USING gin(categories);
CREATE INDEX IF NOT EXISTS idx_books_average_rating ON books(average_rating);
CREATE INDEX IF NOT EXISTS idx_books_google_books_id ON books(google_books_id);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_books_updated_at ON books;
CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON books
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();