import { Pool } from 'pg';

let pool: Pool;

export function setupDatabase(): Pool {
  if (pool) {
    return pool;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  pool = new Pool({
    connectionString: databaseUrl,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
  });

  return pool;
}

export function getDatabase(): Pool {
  if (!pool) {
    throw new Error('Database not initialized. Call setupDatabase() first.');
  }
  return pool;
}