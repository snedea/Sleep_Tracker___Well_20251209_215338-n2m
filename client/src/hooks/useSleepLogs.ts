import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut, apiDelete } from '../lib/api';
import { getDaysAgo } from '../lib/utils';
import type {
  SleepLog,
  CreateSleepLogInput,
  UpdateSleepLogInput,
  SleepLogsResponse,
  SleepLogResponse,
  SleepStatsResponse,
  SuccessResponse,
  SleepLogQuery,
} from '../types';

// Query keys
const SLEEP_LOGS_KEY = 'sleepLogs';
const SLEEP_STATS_KEY = 'sleepStats';

// Default query params
const defaultQuery: SleepLogQuery = {
  startDate: getDaysAgo(30),
  limit: 30,
};

// Get all sleep logs
export function useSleepLogs(query: SleepLogQuery = defaultQuery) {
  return useQuery({
    queryKey: [SLEEP_LOGS_KEY, query],
    queryFn: () => apiGet<SleepLogsResponse>('/api/sleep-logs', query as Record<string, unknown>),
    select: (data) => data.logs,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Get a single sleep log
export function useSleepLog(id: number | null) {
  return useQuery({
    queryKey: [SLEEP_LOGS_KEY, id],
    queryFn: () => apiGet<SleepLogResponse>(`/api/sleep-logs/${id}`),
    select: (data) => data.log,
    enabled: !!id,
  });
}

// Get sleep statistics
export function useSleepStats(startDate: string, endDate: string) {
  return useQuery({
    queryKey: [SLEEP_STATS_KEY, startDate, endDate],
    queryFn: () => apiGet<SleepStatsResponse>('/api/sleep-logs/stats', { startDate, endDate }),
    select: (data) => data.stats,
    enabled: !!startDate && !!endDate,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Create sleep log mutation
export function useCreateSleepLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSleepLogInput) =>
      apiPost<SleepLogResponse>('/api/sleep-logs', input),
    onSuccess: () => {
      // Invalidate sleep logs queries to refetch
      queryClient.invalidateQueries({ queryKey: [SLEEP_LOGS_KEY] });
      queryClient.invalidateQueries({ queryKey: [SLEEP_STATS_KEY] });
    },
  });
}

// Update sleep log mutation
export function useUpdateSleepLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateSleepLogInput }) =>
      apiPut<SleepLogResponse>(`/api/sleep-logs/${id}`, input),
    onSuccess: (data) => {
      // Update the specific log in cache
      queryClient.setQueryData([SLEEP_LOGS_KEY, data.log.id], data);
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: [SLEEP_LOGS_KEY] });
      queryClient.invalidateQueries({ queryKey: [SLEEP_STATS_KEY] });
    },
  });
}

// Delete sleep log mutation
export function useDeleteSleepLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => apiDelete<SuccessResponse>(`/api/sleep-logs/${id}`),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: [SLEEP_LOGS_KEY, id] });
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: [SLEEP_LOGS_KEY] });
      queryClient.invalidateQueries({ queryKey: [SLEEP_STATS_KEY] });
    },
  });
}

// Get recent sleep data for dashboard
export function useRecentSleepLogs(days: number = 7) {
  return useSleepLogs({
    startDate: getDaysAgo(days),
    limit: days,
  });
}
