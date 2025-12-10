import type { Config } from 'drizzle-kit';

export default {
  schema: './src/models/schema.ts',
  out: './drizzle',
  driver: 'better-sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL || './data/sleep-tracker.db',
  },
  verbose: true,
  strict: true,
} satisfies Config;
