-- Migration: Create reading_list_entries table
-- Created: 2024-01-01

CREATE TYPE reading_status AS ENUM ('want-to-read', 'currently-reading', 'read');

CREATE TABLE IF NOT EXISTS reading_list_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    status reading_status NOT NULL,
    date_added TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date_started TIMESTAMP WITH TIME ZONE,
    date_finished TIMESTAMP WITH TIME ZONE,
    progress INTEGER CHECK (progress >= 0 AND progress <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one entry per user per book
    UNIQUE(user_id, book_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reading_list_user_id ON reading_list_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_list_book_id ON reading_list_entries(book_id);
CREATE INDEX IF NOT EXISTS idx_reading_list_status ON reading_list_entries(status);
CREATE INDEX IF NOT EXISTS idx_reading_list_date_added ON reading_list_entries(date_added);
CREATE INDEX IF NOT EXISTS idx_reading_list_user_book ON reading_list_entries(user_id, book_id);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_reading_list_entries_updated_at ON reading_list_entries;
CREATE TRIGGER update_reading_list_entries_updated_at BEFORE UPDATE ON reading_list_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();