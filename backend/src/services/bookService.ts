import axios from 'axios';
import { Book } from '../models/Book';
import { Op } from 'sequelize';
import { logger } from '../utils/logger';
import { redisClient } from '../config/database';

export interface GoogleBookItem {
    id: string;
    volumeInfo: {
        title: string;
        authors?: string[];
        description?: string;
        publishedDate?: string;
        publisher?: string;
        pageCount?: number;
        categories?: string[];
        imageLinks?: {
            thumbnail?: string;
            smallThumbnail?: string;
        };
        industryIdentifiers?: Array<{
            type: string;
            identifier: string;
        }>;
        averageRating?: number;
        ratingsCount?: number;
    };
}

export interface GoogleBooksResponse {
    totalItems: number;
    items?: GoogleBookItem[];
}

export interface BookSearchQuery {
    query: string;
    author?: string;
    title?: string;
    isbn?: string;
    category?: string;
    maxResults?: number;
    startIndex?: number;
}

export interface BookSearchResult {
    books: Book[];
    totalItems: number;
    hasMore: boolean;
}

class BookService {
    private readonly googleBooksApiKey: string;
    private readonly googleBooksBaseUrl = 'https://www.googleapis.com/books/v1/volumes';
    private readonly cacheExpiration = 3600; // 1 hour in seconds

    constructor() {
        this.googleBooksApiKey = process.env.GOOGLE_BOOKS_API_KEY || '';
        if (!this.googleBooksApiKey) {
            logger.warn('Google Books API key not configured');
        }
    }

    /**
     * Search books using Google Books API with local database fallback
     */
    async searchBooks(searchQuery: BookSearchQuery): Promise<BookSearchResult> {
        try {
            const cacheKey = `book_search:${JSON.stringify(searchQuery)}`;

            // Try to get from cache first
            const cachedResult = await this.getCachedResult(cacheKey);
            if (cachedResult) {
                return cachedResult;
            }

            // Search in local database first
            const localBooks = await this.searchLocalBooks(searchQuery);

            // If we have enough local results, return them
            if (localBooks.length >= (searchQuery.maxResults || 10)) {
                const result = {
                    books: localBooks.slice(0, searchQuery.maxResults || 10),
                    totalItems: localBooks.length,
                    hasMore: localBooks.length > (searchQuery.maxResults || 10)
                };
                await this.cacheResult(cacheKey, result);
                return result;
            }

            // Search Google Books API for additional results
            const googleBooks = await this.searchGoogleBooks(searchQuery);

            // Merge and deduplicate results
            const mergedBooks = await this.mergeAndSaveBooks(localBooks, googleBooks.items || []);

            const result = {
                books: mergedBooks.slice(0, searchQuery.maxResults || 10),
                totalItems: Math.max(localBooks.length, googleBooks.totalItems),
                hasMore: (searchQuery.startIndex || 0) + mergedBooks.length < googleBooks.totalItems
            };

            await this.cacheResult(cacheKey, result);
            return result;
        } catch (error) {
            logger.error('Error searching books:', error);
            throw new Error('Failed to search books');
        }
    }

    /**
     * Get book details by ID (local database or Google Books)
     */
    async getBookById(id: string): Promise<Book | null> {
        try {
            const cacheKey = `book:${id}`;

            // Try cache first
            const cachedBook = await this.getCachedResult(cacheKey);
            if (cachedBook) {
                return cachedBook;
            }

            // Try local database first
            let book = await Book.findByPk(id);

            if (!book) {
                // Try Google Books API
                const googleBook = await this.getGoogleBookById(id);
                if (googleBook) {
                    book = await this.saveGoogleBookToDatabase(googleBook);
                }
            }

            if (book) {
                await this.cacheResult(cacheKey, book, this.cacheExpiration);
            }

            return book;
        } catch (error) {
            logger.error(`Error getting book by ID ${id}:`, error);
            throw new Error('Failed to get book details');
        }
    }

    /**
     * Get book details by ISBN
     */
    async getBookByIsbn(isbn: string): Promise<Book | null> {
        try {
            const cacheKey = `book_isbn:${isbn}`;

            // Try cache first
            const cachedBook = await this.getCachedResult(cacheKey);
            if (cachedBook) {
                return cachedBook;
            }

            // Try local database first
            let book = await Book.findOne({ where: { isbn } });

            if (!book) {
                // Search Google Books by ISBN
                const searchResult = await this.searchGoogleBooks({ query: `isbn:${isbn}`, maxResults: 1 });
                if (searchResult.items && searchResult.items.length > 0) {
                    book = await this.saveGoogleBookToDatabase(searchResult.items[0]);
                }
            }

            if (book) {
                await this.cacheResult(cacheKey, book, this.cacheExpiration);
            }

            return book;
        } catch (error) {
            logger.error(`Error getting book by ISBN ${isbn}:`, error);
            throw new Error('Failed to get book by ISBN');
        }
    }

    /**
     * Add or update a book in the database
     */
    async addOrUpdateBook(bookData: Partial<Book>): Promise<Book> {
        try {
            if (bookData.isbn) {
                const existingBook = await Book.findOne({ where: { isbn: bookData.isbn } });
                if (existingBook) {
                    await existingBook.update(bookData);
                    await this.invalidateBookCache(existingBook.id);
                    return existingBook;
                }
            }

            const book = await Book.create(bookData as any);
            await this.invalidateBookCache(book.id);
            return book;
        } catch (error) {
            logger.error('Error adding/updating book:', error);
            throw new Error('Failed to add or update book');
        }
    }

    /**
     * Search local database for books
     */
    private async searchLocalBooks(searchQuery: BookSearchQuery): Promise<Book[]> {
        const whereConditions: any = {};

        if (searchQuery.query) {
            whereConditions[Op.or] = [
                { title: { [Op.iLike]: `%${searchQuery.query}%` } },
                { authors: { [Op.contains]: [searchQuery.query] } },
                { description: { [Op.iLike]: `%${searchQuery.query}%` } }
            ];
        }

        if (searchQuery.author) {
            whereConditions.authors = { [Op.contains]: [searchQuery.author] };
        }

        if (searchQuery.title) {
            whereConditions.title = { [Op.iLike]: `%${searchQuery.title}%` };
        }

        if (searchQuery.isbn) {
            whereConditions.isbn = searchQuery.isbn;
        }

        if (searchQuery.category) {
            whereConditions.categories = { [Op.contains]: [searchQuery.category] };
        }

        return await Book.findAll({
            where: whereConditions,
            limit: searchQuery.maxResults || 10,
            offset: searchQuery.startIndex || 0,
            order: [['averageRating', 'DESC'], ['ratingsCount', 'DESC']]
        });
    }

    /**
     * Search Google Books API
     */
    private async searchGoogleBooks(searchQuery: BookSearchQuery): Promise<GoogleBooksResponse> {
        if (!this.googleBooksApiKey) {
            return { totalItems: 0, items: [] };
        }

        try {
            let query = searchQuery.query || '';

            if (searchQuery.author) {
                query += `+inauthor:${searchQuery.author}`;
            }

            if (searchQuery.title) {
                query += `+intitle:${searchQuery.title}`;
            }

            if (searchQuery.isbn) {
                query = `isbn:${searchQuery.isbn}`;
            }

            if (searchQuery.category) {
                query += `+subject:${searchQuery.category}`;
            }

            const response = await axios.get(this.googleBooksBaseUrl, {
                params: {
                    q: query,
                    key: this.googleBooksApiKey,
                    maxResults: searchQuery.maxResults || 10,
                    startIndex: searchQuery.startIndex || 0,
                    printType: 'books',
                    orderBy: 'relevance'
                },
                timeout: 5000
            });

            return response.data as GoogleBooksResponse;
        } catch (error) {
            logger.error('Error searching Google Books API:', error);
            return { totalItems: 0, items: [] };
        }
    }

    /**
     * Get book from Google Books API by ID
     */
    private async getGoogleBookById(id: string): Promise<GoogleBookItem | null> {
        if (!this.googleBooksApiKey) {
            return null;
        }

        try {
            const response = await axios.get(`${this.googleBooksBaseUrl}/${id}`, {
                params: { key: this.googleBooksApiKey },
                timeout: 5000
            });

            return response.data as GoogleBookItem;
        } catch (error) {
            logger.error(`Error getting Google Book by ID ${id}:`, error);
            return null;
        }
    }

    /**
     * Merge local and Google Books results, saving new books to database
     */
    private async mergeAndSaveBooks(localBooks: Book[], googleBooks: GoogleBookItem[]): Promise<Book[]> {
        const localIsbns = new Set(localBooks.map(book => book.isbn).filter(Boolean));
        const mergedBooks = [...localBooks];

        for (const googleBook of googleBooks) {
            const isbn = this.extractIsbn(googleBook);

            // Skip if we already have this book locally
            if (isbn && localIsbns.has(isbn)) {
                continue;
            }

            try {
                const savedBook = await this.saveGoogleBookToDatabase(googleBook);
                mergedBooks.push(savedBook);
            } catch (error) {
                logger.error('Error saving Google Book to database:', error);
                // Continue with other books
            }
        }

        return mergedBooks;
    }

    /**
     * Save Google Book data to local database
     */
    private async saveGoogleBookToDatabase(googleBook: GoogleBookItem): Promise<Book> {
        const isbn = this.extractIsbn(googleBook);
        const bookData = {
            isbn: isbn || '',
            title: googleBook.volumeInfo.title || 'Unknown Title',
            authors: googleBook.volumeInfo.authors || [],
            description: googleBook.volumeInfo.description || '',
            publishedDate: googleBook.volumeInfo.publishedDate ? new Date(googleBook.volumeInfo.publishedDate) : null,
            publisher: googleBook.volumeInfo.publisher || '',
            pageCount: googleBook.volumeInfo.pageCount || 0,
            categories: googleBook.volumeInfo.categories || [],
            coverImage: googleBook.volumeInfo.imageLinks?.thumbnail || googleBook.volumeInfo.imageLinks?.smallThumbnail || '',
            averageRating: googleBook.volumeInfo.averageRating || 0,
            ratingsCount: googleBook.volumeInfo.ratingsCount || 0,
            googleBooksId: googleBook.id
        };

        // Check if book already exists by ISBN or Google Books ID
        if (isbn) {
            const existingBook = await Book.findOne({ where: { isbn } });
            if (existingBook) {
                await existingBook.update(bookData);
                return existingBook;
            }
        }

        const existingByGoogleId = await Book.findOne({ where: { googleBooksId: googleBook.id } });
        if (existingByGoogleId) {
            await existingByGoogleId.update(bookData);
            return existingByGoogleId;
        }

        return await Book.create(bookData as any);
    }

    /**
     * Extract ISBN from Google Book data
     */
    private extractIsbn(googleBook: GoogleBookItem): string | null {
        const identifiers = googleBook.volumeInfo.industryIdentifiers || [];

        // Prefer ISBN_13, then ISBN_10
        const isbn13 = identifiers.find(id => id.type === 'ISBN_13');
        if (isbn13) return isbn13.identifier;

        const isbn10 = identifiers.find(id => id.type === 'ISBN_10');
        if (isbn10) return isbn10.identifier;

        return null;
    }

    /**
     * Cache result in Redis
     */
    private async cacheResult(key: string, data: any, expiration: number = this.cacheExpiration): Promise<void> {
        try {
            if (redisClient) {
                await redisClient.setEx(key, expiration, JSON.stringify(data));
            }
        } catch (error) {
            logger.error('Error caching result:', error);
            // Don't throw - caching is not critical
        }
    }

    /**
     * Get cached result from Redis
     */
    private async getCachedResult(key: string): Promise<any | null> {
        try {
            if (redisClient) {
                const cached = await redisClient.get(key);
                return cached ? JSON.parse(cached) : null;
            }
            return null;
        } catch (error) {
            logger.error('Error getting cached result:', error);
            return null;
        }
    }

    /**
     * Invalidate book cache
     */
    private async invalidateBookCache(bookId: string): Promise<void> {
        try {
            if (redisClient) {
                const keys = await redisClient.keys(`book:${bookId}*`);
                if (keys.length > 0) {
                    await redisClient.del(keys);
                }
            }
        } catch (error) {
            logger.error('Error invalidating book cache:', error);
        }
    }
}

export const bookService = new BookService();