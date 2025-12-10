import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { SleepLog } from '@/types';

interface QualityChartProps {
  data: SleepLog[];
  className?: string;
}

const qualityColors = {
  1: '#ef4444', // red
  2: '#f97316', // orange
  3: '#eab308', // yellow
  4: '#22c55e', // green
  5: '#10b981', // emerald
};

export function QualityChart({ data, className }: QualityChartProps) {
  // Count quality ratings
  const qualityCounts = data.reduce((acc, log) => {
    acc[log.quality] = (acc[log.quality] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  // Transform to chart data
  const chartData = [1, 2, 3, 4, 5].map((rating) => ({
    rating: rating.toString(),
    count: qualityCounts[rating] || 0,
    label: ['Very Poor', 'Poor', 'Fair', 'Good', 'Excellent'][rating - 1],
    color: qualityColors[rating as keyof typeof qualityColors],
  }));

  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-48 bg-gray-50 rounded-lg ${className}`}>
        <p className="text-gray-500">No data to display</p>
      </div>
    );
  }

  return (
    <div className={`h-48 ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis
            dataKey="rating"
            tick={{ fontSize: 12 }}
            stroke="#9ca3af"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            stroke="#9ca3af"
            allowDecimals={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const data = payload[0].payload;
              return (
                <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
                  <p className="font-medium text-gray-900">{data.label}</p>
                  <p className="text-sm text-gray-600">
                    {data.count} {data.count === 1 ? 'night' : 'nights'}
                  </p>
                </div>
              );
            }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Compact version for dashboard
export function QualityMiniChart({ data }: { data: SleepLog[] }) {
  const avgQuality = data.length > 0
    ? (data.reduce((sum, log) => sum + log.quality, 0) / data.length).toFixed(1)
    : '0';

  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-5 h-5 ${
              star <= Math.round(parseFloat(avgQuality))
                ? 'text-yellow-400'
                : 'text-gray-200'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="text-lg font-semibold">{avgQuality}</span>
    </div>
  );
}
