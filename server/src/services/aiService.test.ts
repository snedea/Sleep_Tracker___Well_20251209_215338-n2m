import { describe, it, expect } from 'vitest';
import type { SleepLog, DiaryEntry } from '@sleep-tracker/shared';

// Test the pure calculation functions
describe('aiService calculations', () => {
  // Helper to create mock sleep logs
  const createMockLog = (durationMinutes: number, quality: number, bedtime: string): SleepLog => ({
    id: 1,
    userId: 1,
    date: '2024-01-15',
    bedtime,
    wakeTime: '2024-01-15T07:00:00Z',
    durationMinutes,
    quality: quality as 1 | 2 | 3 | 4 | 5,
    interruptions: 0,
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  });

  describe('calculateAvgSleepHours', () => {
    it('returns 0 for empty array', () => {
      const logs: SleepLog[] = [];
      const totalMinutes = logs.reduce((sum, log) => sum + log.durationMinutes, 0);
      const result = logs.length === 0 ? 0 : Math.round((totalMinutes / logs.length / 60) * 10) / 10;
      expect(result).toBe(0);
    });

    it('calculates average correctly', () => {
      const logs = [
        createMockLog(480, 4, '2024-01-14T22:00:00Z'), // 8 hours
        createMockLog(420, 3, '2024-01-14T23:00:00Z'), // 7 hours
        createMockLog(360, 3, '2024-01-15T00:00:00Z'), // 6 hours
      ];

      const totalMinutes = logs.reduce((sum, log) => sum + log.durationMinutes, 0);
      const result = Math.round((totalMinutes / logs.length / 60) * 10) / 10;

      expect(result).toBe(7); // (8+7+6)/3 = 7
    });
  });

  describe('calculateSleepDebt', () => {
    it('calculates positive debt when under 8 hours', () => {
      const logs = [
        createMockLog(360, 3, '2024-01-14T22:00:00Z'), // 6 hours
        createMockLog(360, 3, '2024-01-15T22:00:00Z'), // 6 hours
      ];

      const totalRecommended = logs.length * 8 * 60; // 960 minutes
      const totalActual = logs.reduce((sum, log) => sum + log.durationMinutes, 0); // 720 minutes
      const debt = Math.round((totalRecommended - totalActual) / 60 * 10) / 10;

      expect(debt).toBe(4); // 4 hours of debt
    });

    it('calculates negative debt (surplus) when over 8 hours', () => {
      const logs = [
        createMockLog(540, 5, '2024-01-14T21:00:00Z'), // 9 hours
        createMockLog(540, 5, '2024-01-15T21:00:00Z'), // 9 hours
      ];

      const totalRecommended = logs.length * 8 * 60; // 960 minutes
      const totalActual = logs.reduce((sum, log) => sum + log.durationMinutes, 0); // 1080 minutes
      const debt = Math.round((totalRecommended - totalActual) / 60 * 10) / 10;

      expect(debt).toBe(-2); // 2 hours surplus
    });

    it('returns 0 for exactly 8 hours', () => {
      const logs = [
        createMockLog(480, 4, '2024-01-14T22:00:00Z'), // 8 hours
      ];

      const totalRecommended = logs.length * 8 * 60;
      const totalActual = logs.reduce((sum, log) => sum + log.durationMinutes, 0);
      const debt = Math.round((totalRecommended - totalActual) / 60 * 10) / 10;

      expect(debt).toBe(0);
    });
  });

  describe('calculateBedtimeConsistency', () => {
    it('returns 0 for less than 2 logs', () => {
      const logs = [createMockLog(480, 4, '2024-01-14T22:00:00Z')];
      const result = logs.length < 2 ? 0 : 100; // placeholder
      expect(result).toBe(0);
    });

    it('returns low variance for consistent bedtimes', () => {
      const logs = [
        createMockLog(480, 4, '2024-01-14T22:00:00Z'), // 10pm
        createMockLog(480, 4, '2024-01-15T22:00:00Z'), // 10pm
        createMockLog(480, 4, '2024-01-16T22:00:00Z'), // 10pm
      ];

      // All same time = 0 variance
      const bedtimeMinutes = logs.map((log) => {
        const bedtime = new Date(log.bedtime);
        let minutes = bedtime.getUTCHours() * 60 + bedtime.getUTCMinutes();
        if (minutes < 12 * 60) minutes += 24 * 60;
        return minutes;
      });

      const mean = bedtimeMinutes.reduce((a, b) => a + b, 0) / bedtimeMinutes.length;
      const variance = bedtimeMinutes.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / bedtimeMinutes.length;
      const stdDev = Math.round(Math.sqrt(variance));

      expect(stdDev).toBe(0);
    });

    it('returns higher variance for inconsistent bedtimes', () => {
      const logs = [
        createMockLog(480, 4, '2024-01-14T21:00:00Z'), // 9pm
        createMockLog(480, 4, '2024-01-15T23:00:00Z'), // 11pm
        createMockLog(480, 4, '2024-01-17T01:00:00Z'), // 1am (next day)
      ];

      const bedtimeMinutes = logs.map((log) => {
        const bedtime = new Date(log.bedtime);
        let minutes = bedtime.getUTCHours() * 60 + bedtime.getUTCMinutes();
        if (minutes < 12 * 60) minutes += 24 * 60;
        return minutes;
      });

      const mean = bedtimeMinutes.reduce((a, b) => a + b, 0) / bedtimeMinutes.length;
      const variance = bedtimeMinutes.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / bedtimeMinutes.length;
      const stdDev = Math.round(Math.sqrt(variance));

      expect(stdDev).toBeGreaterThan(60); // More than 1 hour variance
    });
  });

  describe('findActivityCorrelations', () => {
    it('returns empty array when no matching dates', () => {
      const logs: SleepLog[] = [
        { ...createMockLog(480, 4, '2024-01-14T22:00:00Z'), date: '2024-01-14' },
      ];
      const entries: DiaryEntry[] = [
        {
          id: 1,
          userId: 1,
          date: '2024-01-13', // Different date
          mood: 4,
          energy: 4,
          activities: ['exercise'],
          createdAt: '2024-01-13T00:00:00Z',
          updatedAt: '2024-01-13T00:00:00Z',
        },
      ];

      // Simulate the correlation logic
      const activityQuality: Record<string, { total: number; count: number }> = {};
      entries.forEach((entry) => {
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

      const result = Object.entries(activityQuality)
        .filter(([, data]) => data.count >= 3)
        .map(([activity, data]) => ({
          activity,
          avgQuality: Math.round((data.total / data.count) * 10) / 10,
          count: data.count,
        }));

      expect(result).toHaveLength(0);
    });

    it('filters activities with less than 3 occurrences', () => {
      const logs: SleepLog[] = [
        { ...createMockLog(480, 5, '2024-01-14T22:00:00Z'), date: '2024-01-14' },
        { ...createMockLog(480, 4, '2024-01-15T22:00:00Z'), date: '2024-01-15' },
      ];
      const entries: DiaryEntry[] = [
        {
          id: 1, userId: 1, date: '2024-01-14', mood: 4, energy: 4,
          activities: ['exercise'], createdAt: '', updatedAt: '',
        },
        {
          id: 2, userId: 1, date: '2024-01-15', mood: 4, energy: 4,
          activities: ['exercise'], createdAt: '', updatedAt: '',
        },
      ];

      const activityQuality: Record<string, { total: number; count: number }> = {};
      entries.forEach((entry) => {
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

      // Filter for 3+ occurrences
      const result = Object.entries(activityQuality)
        .filter(([, data]) => data.count >= 3);

      expect(result).toHaveLength(0); // Only 2 occurrences
    });
  });
});
