import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '../lib/api';
import type {
  InsightsResponse,
  GenerateInsightsResponse,
  InsightQuery,
  InsightType,
} from '../types';

// Query keys
const INSIGHTS_KEY = 'insights';
const INSIGHTS_STATUS_KEY = 'insightsStatus';

// Insight status response type
interface InsightStatusResponse {
  canGenerate: boolean;
  lastGenerated: string | null;
  nextAvailable: string | null;
}

// Get insights
export function useInsights(query: InsightQuery = {}) {
  return useQuery({
    queryKey: [INSIGHTS_KEY, query],
    queryFn: () => apiGet<InsightsResponse>('/api/insights', query as Record<string, unknown>),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

// Get insights by type
export function useInsightsByType(type: InsightType) {
  return useInsights({ type });
}

// Get insight generation status
export function useInsightStatus() {
  return useQuery({
    queryKey: [INSIGHTS_STATUS_KEY],
    queryFn: () => apiGet<InsightStatusResponse>('/api/insights/status'),
    staleTime: 1000 * 60, // 1 minute
  });
}

// Generate insights mutation
export function useGenerateInsights() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiPost<GenerateInsightsResponse>('/api/insights/generate'),
    onSuccess: () => {
      // Invalidate insights queries to refetch new insights
      queryClient.invalidateQueries({ queryKey: [INSIGHTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [INSIGHTS_STATUS_KEY] });
    },
  });
}

// Get all insights data for dashboard
export function useDashboardInsights() {
  const { data: insightsData, isLoading, error } = useInsights();
  const { data: statusData } = useInsightStatus();

  return {
    insights: insightsData?.insights || [],
    generatedAt: insightsData?.generatedAt,
    nextUpdate: insightsData?.nextUpdate,
    canGenerate: statusData?.canGenerate || false,
    isLoading,
    error,
  };
}
