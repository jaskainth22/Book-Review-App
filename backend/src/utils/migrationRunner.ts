import fs from 'fs'
import path from 'path'
import { Pool } from 'pg'
import { config } from '../config/config'

export class MigrationRunner {
  private pool: Pool

  constructor() {
    this.pool = new Pool({
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      user: config.database.user,
      password: config.database.password,
    })
  }

  async runMigrations(): Promise<void> {
    try {
      // Create migrations table if it doesn't exist
      await this.createMigrationsTable()

      // Get list of migration files
      const migrationsDir = path.join(__dirname, '../migrations')
      const migrationFiles = fs
        .readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort()

      console.log(`Found ${migrationFiles.length} migration files`)

      // Run each migration
      for (const file of migrationFiles) {
        await this.runMigration(file)
      }

      console.log('All migrations completed successfully')
    } catch (error) {
      console.error('Migration failed:', error)
      throw error
    }
  }

  private async createMigrationsTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
    await this.pool.query(query)
  }

  private async runMigration(filename: string): Promise<void> {
    // Check if migration has already been run
    const checkQuery = 'SELECT id FROM migrations WHERE filename = $1'
    const result = await this.pool.query(checkQuery, [filename])

    if (result.rows.length > 0) {
      console.log(`Migration ${filename} already executed, skipping`)
      return
    }

    console.log(`Running migration: ${filename}`)

    // Read migration file
    const migrationsDir = path.join(__dirname, '../migrations')
    const migrationPath = path.join(migrationsDir, filename)
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    // Execute migration in a transaction
    const client = await this.pool.connect()
    try {
      await client.query('BEGIN')
      
      // Execute the migration SQL
      await client.query(migrationSQL)
      
      // Record the migration as executed
      await client.query(
        'INSERT INTO migrations (filename) VALUES ($1)',
        [filename]
      )
      
      await client.query('COMMIT')
      console.log(`Migration ${filename} completed successfully`)
    } catch (error) {
      await client.query('ROLLBACK')
      console.error(`Migration ${filename} failed:`, error)
      throw error
    } finally {
      client.release()
    }
  }

  async close(): Promise<void> {
    await this.pool.end()
  }
}

// CLI runner
if (require.main === module) {
  const runner = new MigrationRunner()
  runner
    .runMigrations()
    .then(() => {
      console.log('Migrations completed')
      process.exit(0)
    })
    .catch(error => {
      console.error('Migration failed:', error)
      process.exit(1)
    })
    .finally(() => {
      runner.close()
    })
}