import 'reflect-metadata'

// Set test environment
process.env.NODE_ENV = 'test'
process.env.DB_NAME = 'book_review_platform_test'

// Global test setup
beforeAll(async () => {
  // Test environment is set up in individual test files
  // to allow for proper database isolation
})

afterAll(async () => {
  // Cleanup is handled in individual test files
})

beforeEach(() => {
  // Reset mocks, clear test data, etc.
})

afterEach(() => {
  // Cleanup after each test
})