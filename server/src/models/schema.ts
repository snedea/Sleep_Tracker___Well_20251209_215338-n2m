import { sqliteTable, text, integer, unique } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Users table
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: text('updated_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// Sleep logs table
export const sleepLogs = sqliteTable(
  'sleep_logs',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    date: text('date').notNull(), // YYYY-MM-DD
    bedtime: text('bedtime').notNull(), // ISO datetime
    wakeTime: text('wake_time').notNull(), // ISO datetime
    durationMinutes: integer('duration_minutes').notNull(),
    quality: integer('quality').notNull(), // 1-5
    interruptions: integer('interruptions').default(0).notNull(),
    notes: text('notes'),
    createdAt: text('created_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: text('updated_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    userDateUnique: unique().on(table.userId, table.date),
  })
);

// Diary entries table
export const diaryEntries = sqliteTable(
  'diary_entries',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    date: text('date').notNull(), // YYYY-MM-DD
    mood: integer('mood').notNull(), // 1-5
    energy: integer('energy').notNull(), // 1-5
    activities: text('activities', { mode: 'json' }).$type<string[]>().default([]),
    dietNotes: text('diet_notes'),
    journalText: text('journal_text'),
    createdAt: text('created_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: text('updated_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    userDateUnique: unique().on(table.userId, table.date),
  })
);

// Insights table (cached AI insights)
export const insights = sqliteTable('insights', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  type: text('type').notNull(), // 'sleep_debt' | 'consistency' | 'correlation'
  title: text('title').notNull(),
  content: text('content').notNull(), // AI-generated text
  dataSnapshot: text('data_snapshot', { mode: 'json' }), // JSON of data used for insight
  generatedAt: text('generated_at').notNull(),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// Type exports for Drizzle
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type SleepLog = typeof sleepLogs.$inferSelect;
export type NewSleepLog = typeof sleepLogs.$inferInsert;
export type DiaryEntry = typeof diaryEntries.$inferSelect;
export type NewDiaryEntry = typeof diaryEntries.$inferInsert;
export type Insight = typeof insights.$inferSelect;
export type NewInsight = typeof insights.$inferInsert;
