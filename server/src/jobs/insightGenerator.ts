import cron from 'node-cron';
import { db } from '../lib/db.js';
import { users } from '../models/schema.js';
import { insightService } from '../services/insightService.js';
import { gte } from 'drizzle-orm';

// Get active users (users who have logged in within the last 30 days)
async function getActiveUserIds(): Promise<number[]> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const activeUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(gte(users.updatedAt, thirtyDaysAgo.toISOString()));

  return activeUsers.map((u) => u.id);
}

// Generate insights for all active users
async function generateAllInsights(): Promise<void> {
  console.log('[InsightGenerator] Starting batch insight generation...');

  try {
    const userIds = await getActiveUserIds();
    console.log(`[InsightGenerator] Found ${userIds.length} active users`);

    let successCount = 0;
    let errorCount = 0;
    let totalInsights = 0;

    for (const userId of userIds) {
      try {
        const count = await insightService.generateForUser(userId);
        totalInsights += count;
        successCount++;
        console.log(`[InsightGenerator] Generated ${count} insights for user ${userId}`);
      } catch (error) {
        errorCount++;
        console.error(`[InsightGenerator] Error generating insights for user ${userId}:`, error);
      }
    }

    console.log(`[InsightGenerator] Batch complete: ${successCount} users processed, ${totalInsights} total insights, ${errorCount} errors`);
  } catch (error) {
    console.error('[InsightGenerator] Batch job failed:', error);
  }
}

// Schedule the insight generation job
export function scheduleInsightGeneration(): void {
  // Default: Run every day at 6 AM
  const cronSchedule = process.env.INSIGHT_GENERATION_CRON || '0 6 * * *';

  const task = cron.schedule(cronSchedule, async () => {
    console.log(`[InsightGenerator] Scheduled job triggered at ${new Date().toISOString()}`);
    await generateAllInsights();
  });

  console.log(`[InsightGenerator] Job scheduled with cron: ${cronSchedule}`);

  // Return the task for potential cleanup
  return;
}

// Export for manual triggering
export { generateAllInsights };
