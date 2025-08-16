import { Sequelize } from 'sequelize-typescript'
import { config } from './config'
import { User } from '../models/User'
import { Book } from '../models/Book'
import { Review } from '../models/Review'
import { Comment } from '../models/Comment'
import { ReadingListEntry } from '../models/ReadingListEntry'

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