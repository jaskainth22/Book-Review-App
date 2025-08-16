# Book Review Platform

A modern book review platform similar to Goodreads, built with React, Node.js, and PostgreSQL.

## Features

- User authentication (email/password and Google OAuth)
- Book search and discovery using Google Books API
- Review and rating system
- Comment system for reviews
- Reading list management (want to read, currently reading, read)
- User profiles and social features
- Personalized book recommendations
- Account settings and privacy controls

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- React Router for navigation
- React Query for state management
- Tailwind CSS for styling
- Vitest for testing

### Backend
- Node.js with Express.js
- TypeScript
- PostgreSQL database
- Redis for caching
- JWT authentication
- Passport.js for OAuth
- Jest for testing

### Infrastructure
- Docker for containerization
- Docker Compose for development environment

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- PostgreSQL (if running locally)
- Redis (if running locally)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd book-review-platform
```

2. Copy environment files:
```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

3. Update environment variables in the `.env` files with your actual values.

### Development with Docker (Recommended)

1. Start the development environment:
```bash
docker-compose -f docker-compose.dev.yml up -d
```

This will start:
- PostgreSQL database on port 5432
- Redis cache on port 6379
- Backend API on port 5000

2. Install frontend dependencies and start the frontend:
```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at http://localhost:3000

### Development without Docker

1. Start PostgreSQL and Redis services locally

2. Install and start the backend:
```bash
cd backend
npm install
npm run dev
```

3. Install and start the frontend:
```bash
cd frontend
npm install
npm run dev
```

### Running Tests

Frontend tests:
```bash
cd frontend
npm run test
```

Backend tests:
```bash
cd backend
npm run test
```

Run all tests:
```bash
npm run test
```

### Linting and Formatting

Lint all code:
```bash
npm run lint
```

Format all code:
```bash
npm run format
```

## Project Structure

```
book-review-platform/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API service functions
│   │   ├── types/          # TypeScript type definitions
│   │   ├── utils/          # Utility functions
│   │   └── test/           # Test utilities and setup
│   ├── public/             # Static assets
│   └── package.json
├── backend/                 # Node.js backend API
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── services/       # Business logic services
│   │   ├── models/         # Database models
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── config/         # Configuration files
│   │   ├── utils/          # Utility functions
│   │   └── test/           # Test files
│   └── package.json
├── database/               # Database scripts and migrations
├── docker-compose.yml      # Production Docker setup
├── docker-compose.dev.yml  # Development Docker setup
└── README.md
```

## API Documentation

The API documentation will be available at http://localhost:5000/api-docs when the server is running.

## Environment Variables

### Backend (.env)
- `NODE_ENV`: Environment (development/production)
- `PORT`: Server port (default: 5000)
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`: Database configuration
- `REDIS_HOST`, `REDIS_PORT`: Redis configuration
- `JWT_SECRET`, `JWT_REFRESH_SECRET`: JWT secrets
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: Google OAuth credentials
- `GOOGLE_BOOKS_API_KEY`: Google Books API key

### Frontend (.env)
- `VITE_API_URL`: Backend API URL
- `VITE_GOOGLE_CLIENT_ID`: Google OAuth client ID

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.