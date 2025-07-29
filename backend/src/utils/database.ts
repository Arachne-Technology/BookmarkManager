// Import PostgreSQL connection pool from node-postgres (pg) library
import { Pool } from 'pg';

// Global connection pool instance - shared across the application
let pool: Pool;

/**
 * Initializes and configures the PostgreSQL connection pool
 * This function should be called once during application startup
 * Uses singleton pattern to ensure only one pool instance exists
 * 
 * @returns Configured PostgreSQL connection pool
 */
export function setupDatabase(): Pool {
  // Return existing pool if already initialized
  if (pool) {
    return pool;
  }

  // Validate that database connection string is provided
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  // Create new connection pool with optimized settings
  pool = new Pool({
    connectionString: databaseUrl,    // Full database connection string
    max: 20,                         // Maximum number of connections in pool
    idleTimeoutMillis: 30000,        // Close idle connections after 30 seconds
    connectionTimeoutMillis: 2000,   // Wait up to 2 seconds for connection
  });

  // Handle unexpected database errors
  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1); // Exit application on critical database errors
  });

  return pool;
}

/**
 * Returns the initialized database connection pool
 * Throws error if database hasn't been set up yet
 * 
 * @returns Active PostgreSQL connection pool
 */
export function getDatabase(): Pool {
  if (!pool) {
    throw new Error('Database not initialized. Call setupDatabase() first.');
  }
  return pool;
}