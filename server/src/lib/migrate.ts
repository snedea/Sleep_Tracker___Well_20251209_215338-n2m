import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db, sqlite } from './db.js';
import * as schema from '../models/schema.js';

console.log('Running migrations...');

// For initial setup, we'll create tables directly if drizzle folder doesn't exist
// This is a simple approach for development

const createTablesSQL = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Sleep logs table
CREATE TABLE IF NOT EXISTS sleep_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  bedtime TEXT NOT NULL,
  wake_time TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  quality INTEGER NOT NULL CHECK(quality >= 1 AND quality <= 5),
  interruptions INTEGER DEFAULT 0 NOT NULL,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  UNIQUE(user_id, date)
);

-- Diary entries table
CREATE TABLE IF NOT EXISTS diary_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  mood INTEGER NOT NULL CHECK(mood >= 1 AND mood <= 5),
  energy INTEGER NOT NULL CHECK(energy >= 1 AND energy <= 5),
  activities TEXT DEFAULT '[]',
  diet_notes TEXT,
  journal_text TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  UNIQUE(user_id, date)
);

-- Insights table
CREATE TABLE IF NOT EXISTS insights (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  data_snapshot TEXT,
  generated_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sleep_logs_user_date ON sleep_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_diary_entries_user_date ON diary_entries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_insights_user_type ON insights(user_id, type);
`;

try {
  // Execute the SQL statements
  sqlite.exec(createTablesSQL);
  console.log('Database tables created successfully!');
} catch (error) {
  console.error('Migration failed:', error);
  process.exit(1);
}

// Close the database connection
sqlite.close();
console.log('Migration completed!');
