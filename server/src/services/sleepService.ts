import { db } from '../lib/db.js';
import { sleepLogs } from '../models/schema.js';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import type { CreateSleepLogInput, UpdateSleepLogInput, SleepLogQuery } from '@sleep-tracker/shared';

// Calculate sleep duration in minutes
function calculateDuration(bedtime: string, wakeTime: string): number {
  const bedDate = new Date(bedtime);
  const wakeDate = new Date(wakeTime);
  const diffMs = wakeDate.getTime() - bedDate.getTime();
  return Math.round(diffMs / (1000 * 60));
}

// Get current timestamp in ISO format
function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

export const sleepService = {
  // Get all sleep logs for a user with optional filtering
  async getByUserId(userId: number, query: SleepLogQuery) {
    const { startDate, endDate, limit = 30, offset = 0 } = query;

    let conditions = [eq(sleepLogs.userId, userId)];

    if (startDate) {
      conditions.push(gte(sleepLogs.date, startDate));
    }
    if (endDate) {
      conditions.push(lte(sleepLogs.date, endDate));
    }

    const logs = await db
      .select()
      .from(sleepLogs)
      .where(and(...conditions))
      .orderBy(desc(sleepLogs.date))
      .limit(limit)
      .offset(offset);

    return logs;
  },

  // Get a single sleep log by ID
  async getById(id: number, userId: number) {
    const log = await db
      .select()
      .from(sleepLogs)
      .where(and(eq(sleepLogs.id, id), eq(sleepLogs.userId, userId)))
      .limit(1);

    return log[0] || null;
  },

  // Get sleep log by date for a user
  async getByDate(userId: number, date: string) {
    const log = await db
      .select()
      .from(sleepLogs)
      .where(and(eq(sleepLogs.userId, userId), eq(sleepLogs.date, date)))
      .limit(1);

    return log[0] || null;
  },

  // Create a new sleep log
  async create(userId: number, input: CreateSleepLogInput) {
    const durationMinutes = calculateDuration(input.bedtime, input.wakeTime);
    const now = getCurrentTimestamp();

    const [log] = await db
      .insert(sleepLogs)
      .values({
        userId,
        date: input.date,
        bedtime: input.bedtime,
        wakeTime: input.wakeTime,
        durationMinutes,
        quality: input.quality,
        interruptions: input.interruptions || 0,
        notes: input.notes || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return log;
  },

  // Update an existing sleep log
  async update(id: number, userId: number, input: UpdateSleepLogInput) {
    const existing = await this.getById(id, userId);
    if (!existing) {
      return null;
    }

    // Calculate new duration if bedtime or wakeTime changed
    let durationMinutes = existing.durationMinutes;
    if (input.bedtime || input.wakeTime) {
      const bedtime = input.bedtime || existing.bedtime;
      const wakeTime = input.wakeTime || existing.wakeTime;
      durationMinutes = calculateDuration(bedtime, wakeTime);
    }

    const [log] = await db
      .update(sleepLogs)
      .set({
        ...input,
        durationMinutes,
        updatedAt: getCurrentTimestamp(),
      })
      .where(and(eq(sleepLogs.id, id), eq(sleepLogs.userId, userId)))
      .returning();

    return log;
  },

  // Delete a sleep log
  async delete(id: number, userId: number) {
    const existing = await this.getById(id, userId);
    if (!existing) {
      return false;
    }

    await db
      .delete(sleepLogs)
      .where(and(eq(sleepLogs.id, id), eq(sleepLogs.userId, userId)));

    return true;
  },

  // Get sleep statistics for a user over a date range
  async getStats(userId: number, startDate: string, endDate: string) {
    const logs = await db
      .select()
      .from(sleepLogs)
      .where(
        and(
          eq(sleepLogs.userId, userId),
          gte(sleepLogs.date, startDate),
          lte(sleepLogs.date, endDate)
        )
      );

    if (logs.length === 0) {
      return null;
    }

    const totalDuration = logs.reduce((sum, log) => sum + log.durationMinutes, 0);
    const avgDuration = Math.round(totalDuration / logs.length);
    const avgQuality = logs.reduce((sum, log) => sum + log.quality, 0) / logs.length;
    const totalInterruptions = logs.reduce((sum, log) => sum + log.interruptions, 0);

    return {
      count: logs.length,
      avgDurationMinutes: avgDuration,
      avgDurationHours: Math.round((avgDuration / 60) * 10) / 10,
      avgQuality: Math.round(avgQuality * 10) / 10,
      totalInterruptions,
      avgInterruptions: Math.round((totalInterruptions / logs.length) * 10) / 10,
    };
  },
};
