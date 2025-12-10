import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatDate, minutesToHours } from '@/lib/utils';
import type { SleepLog } from '@/types';

interface SleepTrendChartProps {
  data: SleepLog[];
  className?: string;
}

export function SleepTrendChart({ data, className }: SleepTrendChartProps) {
  // Transform data for chart
  const chartData = data
    .slice()
    .reverse()
    .map((log) => ({
      date: formatDate(log.date, 'MMM d'),
      fullDate: log.date,
      hours: minutesToHours(log.durationMinutes),
      quality: log.quality,
    }));

  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 bg-gray-50 rounded-lg ${className}`}>
        <p className="text-gray-500">No sleep data to display</p>
      </div>
    );
  }

  return (
    <div className={`h-64 ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            stroke="#9ca3af"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            stroke="#9ca3af"
            domain={[0, 12]}
            ticks={[0, 4, 8, 12]}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const data = payload[0].payload;
              return (
                <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
                  <p className="font-medium text-gray-900">{data.fullDate}</p>
                  <p className="text-sm text-gray-600">
                    Duration: {data.hours} hours
                  </p>
                  <p className="text-sm text-gray-600">
                    Quality: {data.quality}/5
                  </p>
                </div>
              );
            }}
          />
          <Line
            type="monotone"
            dataKey="hours"
            stroke="#6366f1"
            strokeWidth={2}
            dot={{ fill: '#6366f1', strokeWidth: 0, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
