import { format, parseISO, differenceInMinutes, startOfWeek, endOfWeek, subDays } from 'date-fns';

// Date formatting
export function formatDate(date: string | Date, formatStr: string = 'MMM d, yyyy'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr);
}

export function formatTime(datetime: string | Date): string {
  const dateObj = typeof datetime === 'string' ? parseISO(datetime) : datetime;
  return format(dateObj, 'h:mm a');
}

export function formatDateTime(datetime: string | Date): string {
  const dateObj = typeof datetime === 'string' ? parseISO(datetime) : datetime;
  return format(dateObj, 'MMM d, yyyy h:mm a');
}

// Get today's date in YYYY-MM-DD format
export function getToday(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

// Get date for N days ago in YYYY-MM-DD format
export function getDaysAgo(days: number): string {
  return format(subDays(new Date(), days), 'yyyy-MM-dd');
}

// Get date range for current week
export function getCurrentWeekRange(): { start: string; end: string } {
  const now = new Date();
  return {
    start: format(startOfWeek(now), 'yyyy-MM-dd'),
    end: format(endOfWeek(now), 'yyyy-MM-dd'),
  };
}

// Calculate sleep duration from bedtime and wake time
export function calculateSleepDuration(bedtime: string, wakeTime: string): number {
  return differenceInMinutes(parseISO(wakeTime), parseISO(bedtime));
}

// Format duration in minutes to hours and minutes
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

// Format duration to decimal hours (e.g., 7.5)
export function minutesToHours(minutes: number): number {
  return Math.round((minutes / 60) * 10) / 10;
}

// Quality rating labels
export const qualityLabels: Record<number, string> = {
  1: 'Very Poor',
  2: 'Poor',
  3: 'Fair',
  4: 'Good',
  5: 'Excellent',
};

export function getQualityLabel(quality: number): string {
  return qualityLabels[quality] || 'Unknown';
}

// Mood/Energy rating labels
export const moodLabels: Record<number, string> = {
  1: 'Very Low',
  2: 'Low',
  3: 'Neutral',
  4: 'Good',
  5: 'Great',
};

export function getMoodLabel(mood: number): string {
  return moodLabels[mood] || 'Unknown';
}

// Rating color classes
export function getRatingColor(rating: number): string {
  switch (rating) {
    case 1:
      return 'text-red-500 bg-red-100';
    case 2:
      return 'text-orange-500 bg-orange-100';
    case 3:
      return 'text-yellow-500 bg-yellow-100';
    case 4:
      return 'text-green-500 bg-green-100';
    case 5:
      return 'text-emerald-500 bg-emerald-100';
    default:
      return 'text-gray-500 bg-gray-100';
  }
}

// Common activity suggestions
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
];

// Format activity tag for display
export function formatActivity(activity: string): string {
  return activity
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Class name utility (simple version of clsx)
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Generate a temporary ID for offline operations
export function generateTempId(): number {
  return -Date.now(); // Negative to distinguish from server IDs
}

// Check if ID is a temporary (offline) ID
export function isTempId(id: number): boolean {
  return id < 0;
}

// Debounce function
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
