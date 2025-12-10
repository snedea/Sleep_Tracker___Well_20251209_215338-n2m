import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../models/schema.js';
import path from 'path';
import fs from 'fs';

// Get database path from environment or use default
const dbPath = process.env.DATABASE_URL || './data/sleep-tracker.db';

// Ensure the data directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Create SQLite database connection
const sqlite = new Database(dbPath);

// Enable foreign keys
sqlite.pragma('foreign_keys = ON');

// Enable WAL mode for better concurrent access
sqlite.pragma('journal_mode = WAL');

// Create Drizzle ORM instance
export const db = drizzle(sqlite, { schema });

// Export the raw sqlite connection for migrations
export { sqlite };

// Helper function to close database connection
export function closeDatabase() {
  sqlite.close();
}
