import { z } from 'zod';

// Insight types
export const insightTypes = ['sleep_debt', 'consistency', 'correlation'] as const;
export const insightTypeSchema = z.enum(insightTypes);

// Insight response schema
export const insightSchema = z.object({
  id: z.number(),
  userId: z.number(),
  type: insightTypeSchema,
  title: z.string(),
  content: z.string(),
  dataSnapshot: z.string().nullable().optional(),
  generatedAt: z.string(),
  expiresAt: z.string(),
  createdAt: z.string(),
});

// Insights response (list with metadata)
export const insightsResponseSchema = z.object({
  insights: z.array(insightSchema),
  generatedAt: z.string().nullable(),
  nextUpdate: z.string().nullable(),
});

// Query params for fetching insights
export const insightQuerySchema = z.object({
  type: insightTypeSchema.optional(),
});

// Generate insights response
export const generateInsightsResponseSchema = z.object({
  success: z.boolean(),
  insightCount: z.number(),
  message: z.string().optional(),
});

// Type exports
export type InsightType = z.infer<typeof insightTypeSchema>;
export type Insight = z.infer<typeof insightSchema>;
export type InsightsResponse = z.infer<typeof insightsResponseSchema>;
export type InsightQuery = z.infer<typeof insightQuerySchema>;
export type GenerateInsightsResponse = z.infer<typeof generateInsightsResponseSchema>;
