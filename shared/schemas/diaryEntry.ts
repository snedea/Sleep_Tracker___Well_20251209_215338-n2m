import { z } from 'zod';

// Rating scale: 1-5 (1 = very low, 5 = very high)
const ratingScale = z.number().int().min(1).max(5);

// Common activity tags
export const commonActivities = [
  'exercise',
  'meditation',
  'reading',
  'work',
  'social',
  'outdoor',
  'alcohol',
  'caffeine',
  'screen_time',
  'nap',
  'travel',
  'stress',
  'relaxation',
] as const;

// Create diary entry schema
export const createDiaryEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  mood: ratingScale,
  energy: ratingScale,
  activities: z.array(z.string().max(50)).max(20).default([]),
  dietNotes: z.string().max(500).optional(),
  journalText: z.string().max(5000).optional(),
});

// Update diary entry schema (partial)
export const updateDiaryEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  mood: ratingScale.optional(),
  energy: ratingScale.optional(),
  activities: z.array(z.string().max(50)).max(20).optional(),
  dietNotes: z.string().max(500).optional().nullable(),
  journalText: z.string().max(5000).optional().nullable(),
});

// Diary entry response schema (from database)
export const diaryEntrySchema = z.object({
  id: z.number(),
  userId: z.number(),
  date: z.string(),
  mood: ratingScale,
  energy: ratingScale,
  activities: z.array(z.string()),
  dietNotes: z.string().nullable().optional(),
  journalText: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Query params schema for fetching entries
export const diaryEntryQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  offset: z.coerce.number().int().min(0).default(0),
});

// Type exports
export type CreateDiaryEntryInput = z.infer<typeof createDiaryEntrySchema>;
export type UpdateDiaryEntryInput = z.infer<typeof updateDiaryEntrySchema>;
export type DiaryEntry = z.infer<typeof diaryEntrySchema>;
export type DiaryEntryQuery = z.infer<typeof diaryEntryQuerySchema>;
