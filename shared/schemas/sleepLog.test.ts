import { describe, it, expect } from 'vitest';
import { createSleepLogSchema, sleepLogQuerySchema } from './sleepLog';

describe('sleepLog schemas', () => {
  describe('createSleepLogSchema', () => {
    const validInput = {
      date: '2024-01-15',
      bedtime: '2024-01-14T22:00:00Z',
      wakeTime: '2024-01-15T06:00:00Z',
      quality: 4,
      interruptions: 1,
      notes: 'Good sleep',
    };

    it('accepts valid input', () => {
      const result = createSleepLogSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('rejects invalid date format', () => {
      const result = createSleepLogSchema.safeParse({
        ...validInput,
        date: '01-15-2024', // Wrong format
      });
      expect(result.success).toBe(false);
    });

    it('rejects quality below 1', () => {
      const result = createSleepLogSchema.safeParse({
        ...validInput,
        quality: 0,
      });
      expect(result.success).toBe(false);
    });

    it('rejects quality above 5', () => {
      const result = createSleepLogSchema.safeParse({
        ...validInput,
        quality: 6,
      });
      expect(result.success).toBe(false);
    });

    it('rejects wake time before bedtime', () => {
      const result = createSleepLogSchema.safeParse({
        ...validInput,
        bedtime: '2024-01-15T06:00:00Z',
        wakeTime: '2024-01-14T22:00:00Z', // Before bedtime
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Wake time must be after bedtime');
      }
    });

    it('applies default interruptions of 0', () => {
      const input = { ...validInput };
      delete (input as Partial<typeof validInput>).interruptions;

      const result = createSleepLogSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.interruptions).toBe(0);
      }
    });

    it('rejects interruptions above 20', () => {
      const result = createSleepLogSchema.safeParse({
        ...validInput,
        interruptions: 21,
      });
      expect(result.success).toBe(false);
    });

    it('allows notes to be optional', () => {
      const input = { ...validInput };
      delete (input as Partial<typeof validInput>).notes;

      const result = createSleepLogSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('rejects notes over 1000 characters', () => {
      const result = createSleepLogSchema.safeParse({
        ...validInput,
        notes: 'a'.repeat(1001),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('sleepLogQuerySchema', () => {
    it('accepts empty query (uses defaults)', () => {
      const result = sleepLogQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(30);
        expect(result.data.offset).toBe(0);
      }
    });

    it('accepts valid date range', () => {
      const result = sleepLogQuerySchema.safeParse({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });
      expect(result.success).toBe(true);
    });

    it('coerces string numbers for limit', () => {
      const result = sleepLogQuerySchema.safeParse({
        limit: '50',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
      }
    });

    it('rejects limit above 100', () => {
      const result = sleepLogQuerySchema.safeParse({
        limit: 101,
      });
      expect(result.success).toBe(false);
    });

    it('rejects negative offset', () => {
      const result = sleepLogQuerySchema.safeParse({
        offset: -1,
      });
      expect(result.success).toBe(false);
    });
  });
});
