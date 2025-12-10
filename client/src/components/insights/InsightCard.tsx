import { Card, CardBody } from '@/components/ui/Card';
import { cn, formatDate } from '@/lib/utils';
import type { Insight, InsightType } from '@/types';

interface InsightCardProps {
  insight: Insight;
}

const insightIcons: Record<InsightType, JSX.Element> = {
  sleep_debt: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  consistency: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  correlation: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
};

const insightColors: Record<InsightType, { bg: string; icon: string; border: string }> = {
  sleep_debt: {
    bg: 'bg-blue-50',
    icon: 'bg-blue-100 text-blue-600',
    border: 'border-blue-200',
  },
  consistency: {
    bg: 'bg-purple-50',
    icon: 'bg-purple-100 text-purple-600',
    border: 'border-purple-200',
  },
  correlation: {
    bg: 'bg-green-50',
    icon: 'bg-green-100 text-green-600',
    border: 'border-green-200',
  },
};

export function InsightCard({ insight }: InsightCardProps) {
  const colors = insightColors[insight.type];

  return (
    <Card className={cn('border', colors.bg, colors.border)}>
      <CardBody>
        <div className="flex gap-4">
          <div className={cn('p-3 rounded-xl shrink-0', colors.icon)}>
            {insightIcons[insight.type]}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900">{insight.title}</h3>
            <p className="text-sm text-gray-600 mt-1 leading-relaxed">
              {insight.content}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Generated {formatDate(insight.generatedAt, 'MMM d, h:mm a')}
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

// Skeleton loader for insights
export function InsightCardSkeleton() {
  return (
    <Card className="border border-gray-200">
      <CardBody>
        <div className="flex gap-4 animate-pulse">
          <div className="w-12 h-12 bg-gray-200 rounded-xl shrink-0" />
          <div className="flex-1">
            <div className="h-5 bg-gray-200 rounded w-2/3 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-full mb-1" />
            <div className="h-4 bg-gray-200 rounded w-4/5" />
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
