import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import './config/passport'
import passport from 'passport'
import { config } from './config/config'
import { logger } from './utils/logger'
import { errorHandler } from './middleware/errorHandler'
import { connectDatabase } from './config/database'
import authRoutes from './routes/authRoutes'
import bookRoutes from './routes/bookRoutes'
import reviewRoutes from './routes/reviewRoutes'
import userRoutes from './routes/userRoutes'

const app = express()

// Security middleware
app.use(helmet())
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
})
app.use(limiter)

// General middleware
app.use(compression())
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Initialize Passport
app.use(passport.initialize())

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() })
})

// API routes
app.get('/api', (req, res) => {
  res.json({ message: 'Book Review Platform API' })
})

// Authentication routes
app.use('/api/auth', authRoutes)

// Book routes
app.use('/api/books', bookRoutes)

// Review routes
app.use('/api/reviews', reviewRoutes)

// User routes
app.use('/api/users', userRoutes)

// Error handling middleware
app.use(errorHandler)

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

const PORT = config.port || 5000

const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase()
    
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`)
      logger.info(`Environment: ${config.nodeEnv}`)
    })
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Start the server
if (require.main === module) {
  startServer()
}

export default app