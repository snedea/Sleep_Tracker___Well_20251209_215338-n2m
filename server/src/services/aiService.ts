import openai, { generateCompletion, type ChatMessage } from '../lib/openai.js';
import type { SleepLog, DiaryEntry, InsightType } from '@sleep-tracker/shared';

// Calculate average sleep duration
function calculateAvgSleepHours(logs: SleepLog[]): number {
  if (logs.length === 0) return 0;
  const totalMinutes = logs.reduce((sum, log) => sum + log.durationMinutes, 0);
  return Math.round((totalMinutes / logs.length / 60) * 10) / 10;
}

// Calculate sleep debt (difference from recommended 8 hours)
function calculateSleepDebt(logs: SleepLog[]): number {
  const totalRecommended = logs.length * 8 * 60; // 8 hours in minutes
  const totalActual = logs.reduce((sum, log) => sum + log.durationMinutes, 0);
  return Math.round((totalRecommended - totalActual) / 60 * 10) / 10; // hours
}

// Calculate bedtime consistency (standard deviation)
function calculateBedtimeConsistency(logs: SleepLog[]): number {
  if (logs.length < 2) return 0;

  // Convert bedtimes to minutes from midnight
  const bedtimeMinutes = logs.map((log) => {
    const bedtime = new Date(log.bedtime);
    let minutes = bedtime.getHours() * 60 + bedtime.getMinutes();
    // Handle late night times (after midnight)
    if (minutes < 12 * 60) minutes += 24 * 60; // Add 24 hours for times between midnight and noon
    return minutes;
  });

  const mean = bedtimeMinutes.reduce((a, b) => a + b, 0) / bedtimeMinutes.length;
  const variance = bedtimeMinutes.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / bedtimeMinutes.length;
  return Math.round(Math.sqrt(variance)); // Standard deviation in minutes
}

// Find correlations between activities and sleep quality
function findActivityCorrelations(logs: SleepLog[], entries: DiaryEntry[]): Array<{ activity: string; avgQuality: number; count: number }> {
  const activityQuality: Record<string, { total: number; count: number }> = {};

  // Match diary entries with sleep logs by date
  entries.forEach((entry) => {
    // Find the sleep log for the night after this diary entry
    const sleepLog = logs.find((log) => log.date === entry.date);
    if (!sleepLog) return;

    entry.activities.forEach((activity) => {
      if (!activityQuality[activity]) {
        activityQuality[activity] = { total: 0, count: 0 };
      }
      activityQuality[activity].total += sleepLog.quality;
      activityQuality[activity].count += 1;
    });
  });

  return Object.entries(activityQuality)
    .filter(([, data]) => data.count >= 3) // Only include activities with enough data
    .map(([activity, data]) => ({
      activity,
      avgQuality: Math.round((data.total / data.count) * 10) / 10,
      count: data.count,
    }))
    .sort((a, b) => b.avgQuality - a.avgQuality);
}

export const aiService = {
  // Generate sleep debt insight
  async generateSleepDebtInsight(logs: SleepLog[]): Promise<{ title: string; content: string }> {
    const avgHours = calculateAvgSleepHours(logs);
    const sleepDebt = calculateSleepDebt(logs);
    const avgQuality = logs.reduce((sum, log) => sum + log.quality, 0) / logs.length;

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are a wellness coach providing brief, actionable sleep insights. Be encouraging but honest. Keep responses to 2-3 sentences.`,
      },
      {
        role: 'user',
        content: `Based on the last ${logs.length} days of sleep data:
- Average sleep duration: ${avgHours} hours per night
- Sleep debt (vs recommended 8 hours): ${sleepDebt > 0 ? '+' : ''}${sleepDebt} hours
- Average quality rating: ${avgQuality.toFixed(1)}/5

Provide a brief insight about their sleep debt situation and one suggestion to improve.`,
      },
    ];

    const content = await generateCompletion(messages, { maxTokens: 150 });

    let title = 'Sleep Debt Summary';
    if (sleepDebt > 5) title = 'Significant Sleep Debt Detected';
    else if (sleepDebt > 0) title = 'Mild Sleep Debt';
    else if (sleepDebt <= 0) title = 'Great Sleep Balance!';

    return { title, content };
  },

  // Generate consistency insight
  async generateConsistencyInsight(logs: SleepLog[]): Promise<{ title: string; content: string }> {
    const consistencyMinutes = calculateBedtimeConsistency(logs);

    // Get average bedtime
    const bedtimes = logs.map((log) => new Date(log.bedtime));
    const avgHour = Math.round(bedtimes.reduce((sum, d) => sum + d.getHours(), 0) / bedtimes.length);
    const avgMinute = Math.round(bedtimes.reduce((sum, d) => sum + d.getMinutes(), 0) / bedtimes.length);

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are a wellness coach providing brief, actionable sleep insights. Be encouraging but honest. Keep responses to 2-3 sentences.`,
      },
      {
        role: 'user',
        content: `Based on the last ${logs.length} days of sleep data:
- Average bedtime: approximately ${avgHour}:${avgMinute.toString().padStart(2, '0')}
- Bedtime consistency variation: ${consistencyMinutes} minutes standard deviation
(Lower variation is better; under 30 minutes is excellent, 30-60 is good, over 60 needs improvement)

Provide a brief insight about their sleep schedule consistency and one suggestion.`,
      },
    ];

    const content = await generateCompletion(messages, { maxTokens: 150 });

    let title = 'Sleep Schedule Consistency';
    if (consistencyMinutes <= 30) title = 'Excellent Sleep Schedule!';
    else if (consistencyMinutes <= 60) title = 'Good Sleep Routine';
    else title = 'Inconsistent Sleep Schedule';

    return { title, content };
  },

  // Generate correlation insight
  async generateCorrelationInsight(
    logs: SleepLog[],
    entries: DiaryEntry[]
  ): Promise<{ title: string; content: string }> {
    const correlations = findActivityCorrelations(logs, entries);

    if (correlations.length === 0) {
      return {
        title: 'More Data Needed',
        content: 'Keep logging your daily activities and sleep to discover patterns. We need at least a few days of data with consistent activity tracking to find correlations.',
      };
    }

    const bestActivities = correlations.slice(0, 3);
    const worstActivities = correlations.slice(-3).reverse();

    // Calculate average mood/energy correlation with sleep
    const avgMood = entries.reduce((sum, e) => sum + e.mood, 0) / entries.length;
    const avgEnergy = entries.reduce((sum, e) => sum + e.energy, 0) / entries.length;
    const avgSleepQuality = logs.reduce((sum, l) => sum + l.quality, 0) / logs.length;

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are a wellness coach providing brief, actionable insights about sleep and lifestyle correlations. Be encouraging but honest. Keep responses to 2-3 sentences.`,
      },
      {
        role: 'user',
        content: `Based on ${logs.length} days of sleep and wellness data:

Activities associated with BETTER sleep quality:
${bestActivities.map((a) => `- ${a.activity}: ${a.avgQuality}/5 average quality (${a.count} days)`).join('\n')}

Activities associated with LOWER sleep quality:
${worstActivities.map((a) => `- ${a.activity}: ${a.avgQuality}/5 average quality (${a.count} days)`).join('\n')}

Average mood: ${avgMood.toFixed(1)}/5, Average energy: ${avgEnergy.toFixed(1)}/5
Average sleep quality: ${avgSleepQuality.toFixed(1)}/5

Provide a brief insight about the most notable correlation and one actionable suggestion.`,
      },
    ];

    const content = await generateCompletion(messages, { maxTokens: 150 });

    return {
      title: 'Sleep & Lifestyle Correlations',
      content,
    };
  },

  // Generate all insights for a user
  async generateAllInsights(
    logs: SleepLog[],
    entries: DiaryEntry[]
  ): Promise<Array<{ type: InsightType; title: string; content: string }>> {
    const insights: Array<{ type: InsightType; title: string; content: string }> = [];

    if (logs.length >= 3) {
      try {
        const sleepDebt = await this.generateSleepDebtInsight(logs);
        insights.push({ type: 'sleep_debt', ...sleepDebt });
      } catch (error) {
        console.error('Error generating sleep debt insight:', error);
      }

      try {
        const consistency = await this.generateConsistencyInsight(logs);
        insights.push({ type: 'consistency', ...consistency });
      } catch (error) {
        console.error('Error generating consistency insight:', error);
      }
    }

    if (logs.length >= 5 && entries.length >= 5) {
      try {
        const correlation = await this.generateCorrelationInsight(logs, entries);
        insights.push({ type: 'correlation', ...correlation });
      } catch (error) {
        console.error('Error generating correlation insight:', error);
      }
    }

    return insights;
  },
};
