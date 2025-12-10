import { z } from 'zod';

// Quality scale: 1-5 (1 = very poor, 5 = excellent)
const qualityScale = z.number().int().min(1).max(5);

// Create sleep log schema
export const createSleepLogSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  bedtime: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)),
  wakeTime: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)),
  quality: qualityScale,
  interruptions: z.number().int().min(0).max(20).default(0),
  notes: z.string().max(1000).optional(),
}).refine(
  (data) => {
    const bedtime = new Date(data.bedtime);
    const wakeTime = new Date(data.wakeTime);
    return wakeTime > bedtime;
  },
  { message: 'Wake time must be after bedtime', path: ['wakeTime'] }
);

// Update sleep log schema (partial, all fields optional except validation rules apply if present)
export const updateSleepLogSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  bedtime: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)).optional(),
  wakeTime: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)).optional(),
  quality: qualityScale.optional(),
  interruptions: z.number().int().min(0).max(20).optional(),
  notes: z.string().max(1000).optional().nullable(),
});

// Sleep log response schema (from database)
export const sleepLogSchema = z.object({
  id: z.number(),
  userId: z.number(),
  date: z.string(),
  bedtime: z.string(),
  wakeTime: z.string(),
  durationMinutes: z.number(),
  quality: qualityScale,
  interruptions: z.number(),
  notes: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Query params schema for fetching logs
export const sleepLogQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  offset: z.coerce.number().int().min(0).default(0),
});

// Type exports
export type CreateSleepLogInput = z.infer<typeof createSleepLogSchema>;
export type UpdateSleepLogInput = z.infer<typeof updateSleepLogSchema>;
export type SleepLog = z.infer<typeof sleepLogSchema>;
export type SleepLogQuery = z.infer<typeof sleepLogQuerySchema>;
