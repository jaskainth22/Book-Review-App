import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { BookSearch, BookDetail } from './components/books'
import { useState } from 'react'
import { Book } from './types'

const queryClient = new QueryClient()

function HomePage() {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)

  const handleBookSelect = (book: Book) => {
    setSelectedBook(book)
  }

  const handleCloseDetail = () => {
    setSelectedBook(null)
  }

  const handleAddToList = (book: Book, status: 'want-to-read' | 'currently-reading' | 'read') => {
    console.log(`Adding "${book.title}" to ${status} list`)
    // TODO: Implement actual add to list functionality
    alert(`Added "${book.title}" to ${status.replace('-', ' ')} list!`)
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Discover Your Next Great Read
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          Search through millions of books and find your perfect match
        </p>
      </div>

      <BookSearch
        onBookSelect={handleBookSelect}
        onAddToList={handleAddToList}
        showAddToList={true}
        className="max-w-4xl mx-auto"
      />

      {selectedBook && (
        <BookDetail
          bookId={selectedBook.id}
          onClose={handleCloseDetail}
          onAddToList={handleAddToList}
        />
      )}
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-6">
                  <Link to="/" className="text-2xl font-bold text-gray-900 hover:text-blue-600">
                    📚 Book Review Platform
                  </Link>
                  <nav className="flex space-x-6">
                    <Link to="/" className="text-gray-600 hover:text-gray-900">
                      Search Books
                    </Link>
                    <Link to="/about" className="text-gray-600 hover:text-gray-900">
                      About
                    </Link>
                  </nav>
                </div>
              </div>
            </header>
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
              <div className="px-4 py-6 sm:px-0">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/about" element={
                    <div className="text-center py-12">
                      <h2 className="text-3xl font-bold text-gray-900 mb-4">
                        About Book Review Platform
                      </h2>
                      <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        A modern platform for discovering, reviewing, and tracking your reading journey. 
                        Search through millions of books, read reviews from fellow readers, and build your personal library.
                      </p>
                    </div>
                  } />
                </Routes>
              </div>
            </main>
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App