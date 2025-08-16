import { sequelize, connectDatabase } from '../config/database'
import { User, Book, Review, Comment, ReadingListEntry } from '../models'
import bcrypt from 'bcryptjs'

export class DatabaseSeeder {
  async seed(): Promise<void> {
    try {
      console.log('Starting database seeding...')

      // Connect to database
      await connectDatabase()

      // Clear existing data in development
      if (process.env.NODE_ENV === 'development') {
        await this.clearData()
      }

      // Seed users
      const users = await this.seedUsers()
      console.log(`Seeded ${users.length} users`)

      // Seed books
      const books = await this.seedBooks()
      console.log(`Seeded ${books.length} books`)

      // Seed reviews
      const reviews = await this.seedReviews(users, books)
      console.log(`Seeded ${reviews.length} reviews`)

      // Seed comments
      const comments = await this.seedComments(users, reviews)
      console.log(`Seeded ${comments.length} comments`)

      // Seed reading list entries
      const readingListEntries = await this.seedReadingListEntries(users, books)
      console.log(`Seeded ${readingListEntries.length} reading list entries`)

      console.log('Database seeding completed successfully!')
    } catch (error) {
      console.error('Database seeding failed:', error)
      throw error
    }
  }

  private async clearData(): Promise<void> {
    console.log('Clearing existing data...')
    await Comment.destroy({ where: {} })
    await Review.destroy({ where: {} })
    await ReadingListEntry.destroy({ where: {} })
    await Book.destroy({ where: {} })
    await User.destroy({ where: {} })
  }

  private async seedUsers(): Promise<User[]> {
    const userData = [
      {
        email: 'john.doe@example.com',
        username: 'johndoe',
        displayName: 'John Doe',
        passwordHash: await bcrypt.hash('password123', 12),
        bio: 'Avid reader of science fiction and fantasy novels.',
        isEmailVerified: true,
      },
      {
        email: 'jane.smith@example.com',
        username: 'janesmith',
        displayName: 'Jane Smith',
        passwordHash: await bcrypt.hash('password123', 12),
        bio: 'Love mystery and thriller books. Always looking for the next page-turner!',
        isEmailVerified: true,
      },
      {
        email: 'bob.wilson@example.com',
        username: 'bobwilson',
        displayName: 'Bob Wilson',
        passwordHash: await bcrypt.hash('password123', 12),
        bio: 'Non-fiction enthusiast. History, science, and biographies are my favorites.',
        isEmailVerified: true,
      },
      {
        email: 'alice.brown@example.com',
        username: 'alicebrown',
        displayName: 'Alice Brown',
        passwordHash: await bcrypt.hash('password123', 12),
        bio: 'Romance and contemporary fiction reader. Book club organizer.',
        isEmailVerified: true,
        privacySettings: {
          profileVisibility: 'private',
          showReadingActivity: false,
          showReviews: true,
          allowFollowers: true,
        },
      },
    ]

    return User.bulkCreate(userData)
  }

  private async seedBooks(): Promise<Book[]> {
    const bookData = [
      {
        isbn: '9780547928227',
        title: 'The Hobbit',
        authors: ['J.R.R. Tolkien'],
        description: 'A classic fantasy adventure about Bilbo Baggins and his unexpected journey.',
        publishedDate: new Date('1937-09-21'),
        publisher: 'Houghton Mifflin Harcourt',
        pageCount: 310,
        categories: ['Fantasy', 'Adventure', 'Classic'],
        coverImage: 'https://example.com/hobbit-cover.jpg',
        googleBooksId: 'pD6arNyKyi8C',
      },
      {
        isbn: '9780061120084',
        title: 'To Kill a Mockingbird',
        authors: ['Harper Lee'],
        description: 'A gripping tale of racial injustice and childhood innocence in the American South.',
        publishedDate: new Date('1960-07-11'),
        publisher: 'Harper Perennial Modern Classics',
        pageCount: 376,
        categories: ['Classic', 'Fiction', 'Drama'],
        coverImage: 'https://example.com/mockingbird-cover.jpg',
        googleBooksId: 'PGR2AwAAQBAJ',
      },
      {
        isbn: '9780451524935',
        title: '1984',
        authors: ['George Orwell'],
        description: 'A dystopian social science fiction novel about totalitarian control.',
        publishedDate: new Date('1949-06-08'),
        publisher: 'Signet Classics',
        pageCount: 328,
        categories: ['Science Fiction', 'Dystopian', 'Classic'],
        coverImage: 'https://example.com/1984-cover.jpg',
        googleBooksId: 'kotPYEqx7kMC',
      },
      {
        isbn: '9780316769174',
        title: 'The Catcher in the Rye',
        authors: ['J.D. Salinger'],
        description: 'A controversial novel about teenage rebellion and alienation.',
        publishedDate: new Date('1951-07-16'),
        publisher: 'Little, Brown and Company',
        pageCount: 277,
        categories: ['Classic', 'Coming of Age', 'Fiction'],
        coverImage: 'https://example.com/catcher-cover.jpg',
        googleBooksId: 'PCDengEACAAJ',
      },
      {
        isbn: '9780525478812',
        title: 'The Seven Husbands of Evelyn Hugo',
        authors: ['Taylor Jenkins Reid'],
        description: 'A captivating novel about a reclusive Hollywood icon finally ready to tell her story.',
        publishedDate: new Date('2017-06-13'),
        publisher: 'Atria Books',
        pageCount: 400,
        categories: ['Contemporary Fiction', 'Romance', 'Historical Fiction'],
        coverImage: 'https://example.com/evelyn-hugo-cover.jpg',
        googleBooksId: 'EvUhDwAAQBAJ',
      },
    ]

    return Book.bulkCreate(bookData)
  }

  private async seedReviews(users: User[], books: Book[]): Promise<Review[]> {
    const reviewData = [
      {
        userId: users[0].id,
        bookId: books[0].id,
        rating: 5,
        title: 'A Timeless Adventure',
        content: 'The Hobbit is a masterpiece that never gets old. Tolkien\'s world-building is incredible, and Bilbo\'s journey from a comfortable hobbit to a brave adventurer is beautifully told. The writing is engaging and the characters are memorable. A must-read for fantasy lovers!',
        spoilerWarning: false,
      },
      {
        userId: users[1].id,
        bookId: books[1].id,
        rating: 5,
        title: 'Powerful and Moving',
        content: 'To Kill a Mockingbird is a profound exploration of morality, justice, and human nature. Harper Lee\'s storytelling through Scout\'s eyes is both innocent and wise. The themes are as relevant today as they were when the book was written. Absolutely essential reading.',
        spoilerWarning: false,
      },
      {
        userId: users[2].id,
        bookId: books[2].id,
        rating: 4,
        title: 'Chillingly Relevant',
        content: 'Orwell\'s 1984 is a disturbing but necessary read. The concepts of Big Brother, thoughtcrime, and doublethink are terrifyingly prescient. While the pacing can be slow at times, the ideas presented are crucial for understanding modern society. A book that stays with you long after reading.',
        spoilerWarning: false,
      },
      {
        userId: users[0].id,
        bookId: books[3].id,
        rating: 3,
        title: 'Interesting but Dated',
        content: 'The Catcher in the Rye captures teenage angst well, but Holden\'s constant complaining can be exhausting. The stream-of-consciousness style is effective but not always engaging. It\'s an important piece of literature, but I found it hard to connect with the protagonist.',
        spoilerWarning: false,
      },
      {
        userId: users[3].id,
        bookId: books[4].id,
        rating: 5,
        title: 'Absolutely Captivating',
        content: 'This book had me completely hooked from the first page! Taylor Jenkins Reid has created such a complex and fascinating character in Evelyn Hugo. The story is full of surprises, glamour, and genuine emotion. I couldn\'t put it down and immediately wanted to read it again.',
        spoilerWarning: true,
      },
      {
        userId: users[1].id,
        bookId: books[0].id,
        rating: 4,
        title: 'Great Introduction to Fantasy',
        content: 'As someone new to fantasy, The Hobbit was the perfect starting point. It\'s not too complex or overwhelming, but still rich with imagination. The adventure is exciting and the characters are lovable. Definitely planning to read the Lord of the Rings trilogy next!',
        spoilerWarning: false,
      },
    ]

    return Review.bulkCreate(reviewData)
  }

  private async seedComments(users: User[], reviews: Review[]): Promise<Comment[]> {
    const commentData = [
      {
        reviewId: reviews[0].id,
        userId: users[1].id,
        content: 'I completely agree! The Hobbit was my gateway into fantasy literature too.',
      },
      {
        reviewId: reviews[0].id,
        userId: users[2].id,
        content: 'Have you read the Lord of the Rings trilogy? It\'s even better!',
      },
      {
        reviewId: reviews[1].id,
        userId: users[0].id,
        content: 'This book should be required reading in schools. So important.',
      },
      {
        reviewId: reviews[2].id,
        userId: users[3].id,
        content: 'The parallels to today\'s world are honestly scary. Great review!',
      },
      {
        reviewId: reviews[4].id,
        userId: users[0].id,
        content: 'You\'ve convinced me to add this to my reading list!',
      },
      {
        reviewId: reviews[4].id,
        userId: users[2].id,
        content: 'I loved this book too! The ending was so unexpected.',
      },
    ]

    // Add some nested replies
    const comments = await Comment.bulkCreate(commentData)
    
    const replyData = [
      {
        reviewId: reviews[0].id,
        userId: users[0].id,
        content: 'Yes! I\'m planning to start Fellowship of the Ring next week.',
        parentCommentId: comments[1].id,
      },
      {
        reviewId: reviews[4].id,
        userId: users[3].id,
        content: 'Right? I didn\'t see it coming at all!',
        parentCommentId: comments[5].id,
      },
    ]

    const replies = await Comment.bulkCreate(replyData)
    return [...comments, ...replies]
  }

  private async seedReadingListEntries(users: User[], books: Book[]): Promise<ReadingListEntry[]> {
    const readingListData = [
      // User 0 (John) reading list
      {
        userId: users[0].id,
        bookId: books[0].id,
        status: 'read' as const,
        dateAdded: new Date('2024-01-01'),
        dateStarted: new Date('2024-01-02'),
        dateFinished: new Date('2024-01-10'),
        progress: 100,
      },
      {
        userId: users[0].id,
        bookId: books[3].id,
        status: 'read' as const,
        dateAdded: new Date('2024-01-15'),
        dateStarted: new Date('2024-01-16'),
        dateFinished: new Date('2024-01-25'),
        progress: 100,
      },
      {
        userId: users[0].id,
        bookId: books[1].id,
        status: 'currently-reading' as const,
        dateAdded: new Date('2024-02-01'),
        dateStarted: new Date('2024-02-01'),
        progress: 65,
      },
      {
        userId: users[0].id,
        bookId: books[2].id,
        status: 'want-to-read' as const,
        dateAdded: new Date('2024-02-10'),
      },

      // User 1 (Jane) reading list
      {
        userId: users[1].id,
        bookId: books[1].id,
        status: 'read' as const,
        dateAdded: new Date('2024-01-05'),
        dateStarted: new Date('2024-01-06'),
        dateFinished: new Date('2024-01-20'),
        progress: 100,
      },
      {
        userId: users[1].id,
        bookId: books[0].id,
        status: 'read' as const,
        dateAdded: new Date('2024-01-25'),
        dateStarted: new Date('2024-01-26'),
        dateFinished: new Date('2024-02-05'),
        progress: 100,
      },
      {
        userId: users[1].id,
        bookId: books[4].id,
        status: 'want-to-read' as const,
        dateAdded: new Date('2024-02-15'),
      },

      // User 2 (Bob) reading list
      {
        userId: users[2].id,
        bookId: books[2].id,
        status: 'read' as const,
        dateAdded: new Date('2024-01-10'),
        dateStarted: new Date('2024-01-12'),
        dateFinished: new Date('2024-01-28'),
        progress: 100,
      },
      {
        userId: users[2].id,
        bookId: books[1].id,
        status: 'want-to-read' as const,
        dateAdded: new Date('2024-02-05'),
      },

      // User 3 (Alice) reading list
      {
        userId: users[3].id,
        bookId: books[4].id,
        status: 'read' as const,
        dateAdded: new Date('2024-01-20'),
        dateStarted: new Date('2024-01-21'),
        dateFinished: new Date('2024-02-01'),
        progress: 100,
      },
      {
        userId: users[3].id,
        bookId: books[0].id,
        status: 'currently-reading' as const,
        dateAdded: new Date('2024-02-10'),
        dateStarted: new Date('2024-02-12'),
        progress: 30,
      },
    ]

    return ReadingListEntry.bulkCreate(readingListData)
  }
}

// CLI runner
if (require.main === module) {
  const seeder = new DatabaseSeeder()
  seeder
    .seed()
    .then(() => {
      console.log('Seeding completed successfully')
      process.exit(0)
    })
    .catch(error => {
      console.error('Seeding failed:', error)
      process.exit(1)
    })
    .finally(async () => {
      await sequelize.close()
    })
}