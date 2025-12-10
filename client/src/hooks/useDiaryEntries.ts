import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut, apiDelete } from '../lib/api';
import { getDaysAgo } from '../lib/utils';
import type {
  CreateDiaryEntryInput,
  UpdateDiaryEntryInput,
  DiaryEntriesResponse,
  DiaryEntryResponse,
  DiaryStatsResponse,
  SuccessResponse,
  DiaryEntryQuery,
} from '../types';

// Query keys
const DIARY_ENTRIES_KEY = 'diaryEntries';
const DIARY_STATS_KEY = 'diaryStats';

// Default query params
const defaultQuery: DiaryEntryQuery = {
  startDate: getDaysAgo(30),
  limit: 30,
};

// Get all diary entries
export function useDiaryEntries(query: DiaryEntryQuery = defaultQuery) {
  return useQuery({
    queryKey: [DIARY_ENTRIES_KEY, query],
    queryFn: () => apiGet<DiaryEntriesResponse>('/api/diary-entries', query as Record<string, unknown>),
    select: (data) => data.entries,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Get a single diary entry
export function useDiaryEntry(id: number | null) {
  return useQuery({
    queryKey: [DIARY_ENTRIES_KEY, id],
    queryFn: () => apiGet<DiaryEntryResponse>(`/api/diary-entries/${id}`),
    select: (data) => data.entry,
    enabled: !!id,
  });
}

// Get diary statistics
export function useDiaryStats(startDate: string, endDate: string) {
  return useQuery({
    queryKey: [DIARY_STATS_KEY, startDate, endDate],
    queryFn: () => apiGet<DiaryStatsResponse>('/api/diary-entries/stats', { startDate, endDate }),
    select: (data) => data.stats,
    enabled: !!startDate && !!endDate,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Create diary entry mutation
export function useCreateDiaryEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDiaryEntryInput) =>
      apiPost<DiaryEntryResponse>('/api/diary-entries', input),
    onSuccess: () => {
      // Invalidate diary entries queries to refetch
      queryClient.invalidateQueries({ queryKey: [DIARY_ENTRIES_KEY] });
      queryClient.invalidateQueries({ queryKey: [DIARY_STATS_KEY] });
    },
  });
}

// Update diary entry mutation
export function useUpdateDiaryEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateDiaryEntryInput }) =>
      apiPut<DiaryEntryResponse>(`/api/diary-entries/${id}`, input),
    onSuccess: (data) => {
      // Update the specific entry in cache
      queryClient.setQueryData([DIARY_ENTRIES_KEY, data.entry.id], data);
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: [DIARY_ENTRIES_KEY] });
      queryClient.invalidateQueries({ queryKey: [DIARY_STATS_KEY] });
    },
  });
}

// Delete diary entry mutation
export function useDeleteDiaryEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => apiDelete<SuccessResponse>(`/api/diary-entries/${id}`),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: [DIARY_ENTRIES_KEY, id] });
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: [DIARY_ENTRIES_KEY] });
      queryClient.invalidateQueries({ queryKey: [DIARY_STATS_KEY] });
    },
  });
}

// Get recent diary entries for dashboard
export function useRecentDiaryEntries(days: number = 7) {
  return useDiaryEntries({
    startDate: getDaysAgo(days),
    limit: days,
  });
}
