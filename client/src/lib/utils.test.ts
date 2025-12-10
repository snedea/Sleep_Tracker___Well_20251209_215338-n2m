import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatTime,
  formatDuration,
  minutesToHours,
  getQualityLabel,
  getMoodLabel,
  getRatingColor,
  formatActivity,
  cn,
  generateTempId,
  isTempId,
  calculateSleepDuration,
} from './utils';

describe('utils', () => {
  describe('formatDate', () => {
    it('formats ISO date string', () => {
      const result = formatDate('2024-01-15');
      expect(result).toBe('Jan 15, 2024');
    });

    it('accepts custom format', () => {
      const result = formatDate('2024-01-15', 'yyyy-MM-dd');
      expect(result).toBe('2024-01-15');
    });
  });

  describe('formatTime', () => {
    it('formats time to 12-hour format', () => {
      const result = formatTime('2024-01-15T14:30:00Z');
      // Note: exact output depends on timezone
      expect(result).toMatch(/\d{1,2}:\d{2} [AP]M/);
    });
  });

  describe('formatDuration', () => {
    it('formats hours only', () => {
      expect(formatDuration(120)).toBe('2h');
    });

    it('formats minutes only', () => {
      expect(formatDuration(45)).toBe('45m');
    });

    it('formats hours and minutes', () => {
      expect(formatDuration(150)).toBe('2h 30m');
    });

    it('handles zero', () => {
      expect(formatDuration(0)).toBe('0m');
    });
  });

  describe('minutesToHours', () => {
    it('converts minutes to decimal hours', () => {
      expect(minutesToHours(90)).toBe(1.5);
      expect(minutesToHours(480)).toBe(8);
      expect(minutesToHours(45)).toBe(0.8);
    });
  });

  describe('getQualityLabel', () => {
    it('returns correct labels', () => {
      expect(getQualityLabel(1)).toBe('Very Poor');
      expect(getQualityLabel(2)).toBe('Poor');
      expect(getQualityLabel(3)).toBe('Fair');
      expect(getQualityLabel(4)).toBe('Good');
      expect(getQualityLabel(5)).toBe('Excellent');
    });

    it('returns Unknown for invalid values', () => {
      expect(getQualityLabel(0)).toBe('Unknown');
      expect(getQualityLabel(6)).toBe('Unknown');
    });
  });

  describe('getMoodLabel', () => {
    it('returns correct labels', () => {
      expect(getMoodLabel(1)).toBe('Very Low');
      expect(getMoodLabel(3)).toBe('Neutral');
      expect(getMoodLabel(5)).toBe('Great');
    });
  });

  describe('getRatingColor', () => {
    it('returns red for rating 1', () => {
      expect(getRatingColor(1)).toContain('red');
    });

    it('returns green for rating 4-5', () => {
      expect(getRatingColor(4)).toContain('green');
      expect(getRatingColor(5)).toContain('emerald');
    });

    it('returns gray for invalid rating', () => {
      expect(getRatingColor(0)).toContain('gray');
    });
  });

  describe('formatActivity', () => {
    it('capitalizes words and replaces underscores', () => {
      expect(formatActivity('screen_time')).toBe('Screen Time');
      expect(formatActivity('exercise')).toBe('Exercise');
    });
  });

  describe('cn (classnames)', () => {
    it('joins class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('filters out falsy values', () => {
      expect(cn('foo', false, null, undefined, 'bar')).toBe('foo bar');
    });

    it('returns empty string for no valid classes', () => {
      expect(cn(false, null)).toBe('');
    });
  });

  describe('generateTempId and isTempId', () => {
    it('generates negative IDs', () => {
      const id = generateTempId();
      expect(id).toBeLessThan(0);
    });

    it('identifies temp IDs correctly', () => {
      expect(isTempId(-1234567890)).toBe(true);
      expect(isTempId(1)).toBe(false);
      expect(isTempId(0)).toBe(false);
    });
  });

  describe('calculateSleepDuration', () => {
    it('calculates duration between two times', () => {
      const result = calculateSleepDuration(
        '2024-01-14T22:00:00Z',
        '2024-01-15T06:00:00Z'
      );
      expect(result).toBe(480); // 8 hours
    });
  });
});
