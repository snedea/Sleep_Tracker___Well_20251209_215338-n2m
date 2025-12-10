// Re-export types from shared package
export type {
  User,
  RegisterInput,
  LoginInput,
  AuthResponse,
  SleepLog,
  CreateSleepLogInput,
  UpdateSleepLogInput,
  SleepLogQuery,
  DiaryEntry,
  CreateDiaryEntryInput,
  UpdateDiaryEntryInput,
  DiaryEntryQuery,
  Insight,
  InsightType,
  InsightQuery,
  InsightsResponse,
  GenerateInsightsResponse,
} from '@sleep-tracker/shared';

// API Response types
export interface ApiResponse<T> {
  data: T;
  status: number;
}

export interface ApiError {
  error: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
  statusCode?: number;
}

// Sleep logs response
export interface SleepLogsResponse {
  logs: import('@sleep-tracker/shared').SleepLog[];
}

export interface SleepLogResponse {
  log: import('@sleep-tracker/shared').SleepLog;
}

export interface SleepStatsResponse {
  stats: {
    count: number;
    avgDurationMinutes: number;
    avgDurationHours: number;
    avgQuality: number;
    totalInterruptions: number;
    avgInterruptions: number;
  } | null;
  message?: string;
}

// Diary entries response
export interface DiaryEntriesResponse {
  entries: import('@sleep-tracker/shared').DiaryEntry[];
}

export interface DiaryEntryResponse {
  entry: import('@sleep-tracker/shared').DiaryEntry;
}

export interface DiaryStatsResponse {
  stats: {
    count: number;
    avgMood: number;
    avgEnergy: number;
    topActivities: Array<{ activity: string; count: number }>;
  } | null;
  message?: string;
}

// Auth types
export interface AuthState {
  user: import('@sleep-tracker/shared').User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Offline sync types
export interface PendingMutation {
  id: string;
  type: 'create' | 'update' | 'delete';
  resource: 'sleepLogs' | 'diaryEntries';
  data: unknown;
  timestamp: number;
}

// Chart data types
export interface SleepChartData {
  date: string;
  duration: number;
  quality: number;
}

export interface MoodChartData {
  date: string;
  mood: number;
  energy: number;
  sleepQuality?: number;
}

// Success/Delete response
export interface SuccessResponse {
  success: boolean;
}
