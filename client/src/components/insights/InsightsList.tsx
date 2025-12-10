import { InsightCard, InsightCardSkeleton } from './InsightCard';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { useGenerateInsights, useDashboardInsights } from '@/hooks/useInsights';
import { formatDate } from '@/lib/utils';

interface InsightsListProps {
  showGenerateButton?: boolean;
}

export function InsightsList({ showGenerateButton = true }: InsightsListProps) {
  const { insights, generatedAt, canGenerate, isLoading, error } = useDashboardInsights();
  const generateMutation = useGenerateInsights();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <InsightCardSkeleton />
        <InsightCardSkeleton />
        <InsightCardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardBody className="text-center py-8">
          <p className="text-red-500">Failed to load insights</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </CardBody>
      </Card>
    );
  }

  if (insights.length === 0) {
    return (
      <Card>
        <CardBody className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">No Insights Yet</h3>
          <p className="text-gray-500 text-sm mb-4">
            Log at least 3 days of sleep data to generate personalized insights.
          </p>
          {showGenerateButton && canGenerate && (
            <Button
              onClick={() => generateMutation.mutate()}
              isLoading={generateMutation.isPending}
            >
              Generate Insights
            </Button>
          )}
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Insights header */}
      {showGenerateButton && (
        <div className="flex items-center justify-between">
          <div>
            {generatedAt && (
              <p className="text-sm text-gray-500">
                Last updated: {formatDate(generatedAt, 'MMM d, h:mm a')}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateMutation.mutate()}
            isLoading={generateMutation.isPending}
            disabled={!canGenerate}
          >
            {canGenerate ? 'Refresh' : 'Refresh in 1hr'}
          </Button>
        </div>
      )}

      {/* Insights list */}
      {insights.map((insight) => (
        <InsightCard key={insight.id} insight={insight} />
      ))}

      {/* Status message */}
      {generateMutation.isSuccess && (
        <p className="text-center text-sm text-green-600">
          Insights updated successfully!
        </p>
      )}
      {generateMutation.isError && (
        <p className="text-center text-sm text-red-600">
          Failed to generate insights. Please try again.
        </p>
      )}
    </div>
  );
}
