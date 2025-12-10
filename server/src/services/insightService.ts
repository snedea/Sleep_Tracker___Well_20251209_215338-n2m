import { db } from '../lib/db.js';
import { insights, sleepLogs, diaryEntries } from '../models/schema.js';
import { eq, and, gte, desc, lte } from 'drizzle-orm';
import { aiService } from './aiService.js';
import type { InsightQuery } from '@sleep-tracker/shared';

// Get current timestamp in ISO format
function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

// Get timestamp for 24 hours from now
function getExpirationTimestamp(): string {
  const date = new Date();
  date.setHours(date.getHours() + 24);
  return date.toISOString();
}

// Get date string for N days ago
function getDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

export const insightService = {
  // Get insights for a user
  async getByUserId(userId: number, query: InsightQuery = {}) {
    const now = getCurrentTimestamp();
    let conditions = [
      eq(insights.userId, userId),
      gte(insights.expiresAt, now), // Only get non-expired insights
    ];

    if (query.type) {
      conditions.push(eq(insights.type, query.type));
    }

    const userInsights = await db
      .select()
      .from(insights)
      .where(and(...conditions))
      .orderBy(desc(insights.generatedAt));

    // Parse dataSnapshot JSON
    return userInsights.map((insight) => ({
      ...insight,
      dataSnapshot: insight.dataSnapshot
        ? JSON.parse(insight.dataSnapshot as string)
        : null,
    }));
  },

  // Get the most recent generation time for a user
  async getLastGeneratedAt(userId: number): Promise<string | null> {
    const result = await db
      .select({ generatedAt: insights.generatedAt })
      .from(insights)
      .where(eq(insights.userId, userId))
      .orderBy(desc(insights.generatedAt))
      .limit(1);

    return result[0]?.generatedAt || null;
  },

  // Check if user can generate new insights (rate limiting)
  async canGenerateInsights(userId: number): Promise<boolean> {
    const lastGenerated = await this.getLastGeneratedAt(userId);
    if (!lastGenerated) return true;

    const cooldownMs = parseInt(process.env.INSIGHT_REFRESH_COOLDOWN_MS || '3600000'); // 1 hour default
    const lastTime = new Date(lastGenerated).getTime();
    const now = Date.now();

    return now - lastTime >= cooldownMs;
  },

  // Delete old insights for a user
  async deleteExpired(userId: number): Promise<void> {
    const now = getCurrentTimestamp();
    await db
      .delete(insights)
      .where(and(eq(insights.userId, userId), lte(insights.expiresAt, now)));
  },

  // Generate new insights for a user
  async generateForUser(userId: number): Promise<number> {
    // Get last 30 days of sleep logs
    const startDate = getDaysAgo(30);
    const logs = await db
      .select()
      .from(sleepLogs)
      .where(
        and(
          eq(sleepLogs.userId, userId),
          gte(sleepLogs.date, startDate)
        )
      )
      .orderBy(desc(sleepLogs.date));

    // Get last 30 days of diary entries
    const entries = await db
      .select()
      .from(diaryEntries)
      .where(
        and(
          eq(diaryEntries.userId, userId),
          gte(diaryEntries.date, startDate)
        )
      )
      .orderBy(desc(diaryEntries.date));

    // Parse activities for diary entries
    const parsedEntries = entries.map((entry) => ({
      ...entry,
      activities: typeof entry.activities === 'string'
        ? JSON.parse(entry.activities)
        : entry.activities || [],
    }));

    // Need minimum data to generate insights
    if (logs.length < 3) {
      return 0;
    }

    // Delete existing insights for this user
    await db.delete(insights).where(eq(insights.userId, userId));

    // Generate new insights using AI service
    const generatedInsights = await aiService.generateAllInsights(logs, parsedEntries);

    const now = getCurrentTimestamp();
    const expiresAt = getExpirationTimestamp();

    // Insert new insights
    for (const insight of generatedInsights) {
      await db.insert(insights).values({
        userId,
        type: insight.type,
        title: insight.title,
        content: insight.content,
        dataSnapshot: JSON.stringify({
          sleepLogCount: logs.length,
          diaryEntryCount: entries.length,
          dateRange: { start: startDate, end: now.split('T')[0] },
        }),
        generatedAt: now,
        expiresAt,
        createdAt: now,
      });
    }

    return generatedInsights.length;
  },

  // Get insights response with metadata
  async getInsightsResponse(userId: number, query: InsightQuery = {}) {
    const userInsights = await this.getByUserId(userId, query);
    const lastGenerated = await this.getLastGeneratedAt(userId);

    // Calculate next update time (24 hours from last generation or now if none)
    let nextUpdate: string | null = null;
    if (lastGenerated) {
      const next = new Date(lastGenerated);
      next.setHours(next.getHours() + 24);
      nextUpdate = next.toISOString();
    }

    return {
      insights: userInsights,
      generatedAt: lastGenerated,
      nextUpdate,
    };
  },
};
