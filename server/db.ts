import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure pool with connection settings for better reliability
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of clients the pool should contain
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 5000 // Maximum time to wait for a connection from the pool
});

// Add error handling for connection issues
pool.on('error', (err: unknown) => {
  console.error('Unexpected error on idle database client', err);
  // Don't crash the server on connection errors
});

// Test database connection on startup and periodically
async function testDatabaseConnection() {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT NOW() as now');
      console.log('Database connection successful, timestamp:', result.rows[0].now);
    } finally {
      client.release();
    }
  } catch (err: unknown) {
    console.error('Database connection test failed:', err);
    // Schedule another attempt in 5 seconds
    setTimeout(testDatabaseConnection, 5000);
  }
}

// Run initial test
testDatabaseConnection();

// Set up a periodic connection test every 2 minutes
setInterval(testDatabaseConnection, 120000);

export const db = drizzle({ client: pool, schema });
