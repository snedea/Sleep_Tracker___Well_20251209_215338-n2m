import { db } from '../lib/db.js';
import { diaryEntries } from '../models/schema.js';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import type { CreateDiaryEntryInput, UpdateDiaryEntryInput, DiaryEntryQuery } from '@sleep-tracker/shared';

// Get current timestamp in ISO format
function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

export const diaryService = {
  // Get all diary entries for a user with optional filtering
  async getByUserId(userId: number, query: DiaryEntryQuery) {
    const { startDate, endDate, limit = 30, offset = 0 } = query;

    let conditions = [eq(diaryEntries.userId, userId)];

    if (startDate) {
      conditions.push(gte(diaryEntries.date, startDate));
    }
    if (endDate) {
      conditions.push(lte(diaryEntries.date, endDate));
    }

    const entries = await db
      .select()
      .from(diaryEntries)
      .where(and(...conditions))
      .orderBy(desc(diaryEntries.date))
      .limit(limit)
      .offset(offset);

    // Parse activities JSON string back to array
    return entries.map((entry) => ({
      ...entry,
      activities: typeof entry.activities === 'string'
        ? JSON.parse(entry.activities)
        : entry.activities || [],
    }));
  },

  // Get a single diary entry by ID
  async getById(id: number, userId: number) {
    const entry = await db
      .select()
      .from(diaryEntries)
      .where(and(eq(diaryEntries.id, id), eq(diaryEntries.userId, userId)))
      .limit(1);

    if (!entry[0]) return null;

    return {
      ...entry[0],
      activities: typeof entry[0].activities === 'string'
        ? JSON.parse(entry[0].activities)
        : entry[0].activities || [],
    };
  },

  // Get diary entry by date for a user
  async getByDate(userId: number, date: string) {
    const entry = await db
      .select()
      .from(diaryEntries)
      .where(and(eq(diaryEntries.userId, userId), eq(diaryEntries.date, date)))
      .limit(1);

    if (!entry[0]) return null;

    return {
      ...entry[0],
      activities: typeof entry[0].activities === 'string'
        ? JSON.parse(entry[0].activities)
        : entry[0].activities || [],
    };
  },

  // Create a new diary entry
  async create(userId: number, input: CreateDiaryEntryInput) {
    const now = getCurrentTimestamp();

    const [entry] = await db
      .insert(diaryEntries)
      .values({
        userId,
        date: input.date,
        mood: input.mood,
        energy: input.energy,
        activities: JSON.stringify(input.activities || []) as unknown as string[],
        dietNotes: input.dietNotes || null,
        journalText: input.journalText || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return {
      ...entry,
      activities: input.activities || [],
    };
  },

  // Update an existing diary entry
  async update(id: number, userId: number, input: UpdateDiaryEntryInput) {
    const existing = await this.getById(id, userId);
    if (!existing) {
      return null;
    }

    const updateData: Record<string, unknown> = {
      updatedAt: getCurrentTimestamp(),
    };

    if (input.date !== undefined) updateData.date = input.date;
    if (input.mood !== undefined) updateData.mood = input.mood;
    if (input.energy !== undefined) updateData.energy = input.energy;
    if (input.activities !== undefined) {
      updateData.activities = JSON.stringify(input.activities);
    }
    if (input.dietNotes !== undefined) updateData.dietNotes = input.dietNotes;
    if (input.journalText !== undefined) updateData.journalText = input.journalText;

    const [entry] = await db
      .update(diaryEntries)
      .set(updateData)
      .where(and(eq(diaryEntries.id, id), eq(diaryEntries.userId, userId)))
      .returning();

    return {
      ...entry,
      activities: typeof entry.activities === 'string'
        ? JSON.parse(entry.activities)
        : entry.activities || [],
    };
  },

  // Delete a diary entry
  async delete(id: number, userId: number) {
    const existing = await this.getById(id, userId);
    if (!existing) {
      return false;
    }

    await db
      .delete(diaryEntries)
      .where(and(eq(diaryEntries.id, id), eq(diaryEntries.userId, userId)));

    return true;
  },

  // Get wellness statistics for a user over a date range
  async getStats(userId: number, startDate: string, endDate: string) {
    const entries = await this.getByUserId(userId, { startDate, endDate, limit: 100 });

    if (entries.length === 0) {
      return null;
    }

    const avgMood = entries.reduce((sum, e) => sum + e.mood, 0) / entries.length;
    const avgEnergy = entries.reduce((sum, e) => sum + e.energy, 0) / entries.length;

    // Count activity frequencies
    const activityCounts: Record<string, number> = {};
    entries.forEach((entry) => {
      entry.activities.forEach((activity: string) => {
        activityCounts[activity] = (activityCounts[activity] || 0) + 1;
      });
    });

    // Sort activities by frequency
    const topActivities = Object.entries(activityCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([activity, count]) => ({ activity, count }));

    return {
      count: entries.length,
      avgMood: Math.round(avgMood * 10) / 10,
      avgEnergy: Math.round(avgEnergy * 10) / 10,
      topActivities,
    };
  },
};
