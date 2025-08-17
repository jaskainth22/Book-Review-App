import { Sequelize } from 'sequelize-typescript'
import { createClient } from 'redis'
import { config } from './config'
import { User } from '../models/User'
import { Book } from '../models/Book'
import { Review } from '../models/Review'
import { Comment } from '../models/Comment'
import { ReadingListEntry } from '../models/ReadingListEntry'
import { logger } from '../utils/logger'

export const sequelize = new Sequelize({
  database: config.database.name,
  dialect: 'postgres',
  host: config.database.host,
  port: config.database.port,
  username: config.database.user,
  password: config.database.password,
  models: [User, Book, Review, Comment, ReadingListEntry],
  logging: config.nodeEnv === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
  },
})

// Redis client configuration
export const redisClient = createClient({
  socket: {
    host: config.redis.host,
    port: config.redis.port,
  },
  password: config.redis.password || undefined,
})

// Initialize Redis connection
const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect()
    logger.info('Redis connection established successfully.')
  } catch (error) {
    logger.error('Unable to connect to Redis:', error)
    // Don't throw error - Redis is optional for basic functionality
  }
}

// Initialize Redis connection
if (config.nodeEnv !== 'test') {
  connectRedis()
}

export const connectDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate()
    console.log('Database connection established successfully.')
    
    // Only sync in test environment, use migrations for development/production
    if (config.nodeEnv === 'test') {
      await sequelize.sync({ force: true })
      console.log('Database synchronized.')
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error)
    throw error
  }
}

export const closeDatabaseConnection = async (): Promise<void> => {
  try {
    await sequelize.close()
    console.log('Database connection closed.')
  } catch (error) {
    console.error('Error closing database connection:', error)
    throw error
  }
}