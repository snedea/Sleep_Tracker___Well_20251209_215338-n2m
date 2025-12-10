import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { SleepLog, DiaryEntry } from '@/types';
import { formatDate } from '@/lib/utils';

interface MoodCorrelationProps {
  sleepLogs: SleepLog[];
  diaryEntries: DiaryEntry[];
  className?: string;
}

export function MoodCorrelation({ sleepLogs, diaryEntries, className }: MoodCorrelationProps) {
  // Match sleep logs with diary entries by date
  const correlationData = sleepLogs
    .map((log) => {
      const diary = diaryEntries.find((e) => e.date === log.date);
      if (!diary) return null;
      return {
        date: log.date,
        sleepQuality: log.quality,
        mood: diary.mood,
        energy: diary.energy,
        sleepHours: (log.durationMinutes / 60).toFixed(1),
      };
    })
    .filter(Boolean);

  if (correlationData.length < 3) {
    return (
      <div className={`flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg p-4 ${className}`}>
        <p className="text-gray-500 text-center">
          Log both sleep and diary entries for the same days to see correlations.
        </p>
        <p className="text-sm text-gray-400 mt-2">
          {correlationData.length}/3 matching days
        </p>
      </div>
    );
  }

  return (
    <div className={`h-64 ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 10, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            type="number"
            dataKey="sleepQuality"
            name="Sleep Quality"
            domain={[1, 5]}
            ticks={[1, 2, 3, 4, 5]}
            tick={{ fontSize: 12 }}
            stroke="#9ca3af"
            label={{ value: 'Sleep Quality', position: 'bottom', fontSize: 12 }}
          />
          <YAxis
            type="number"
            dataKey="mood"
            name="Mood"
            domain={[1, 5]}
            ticks={[1, 2, 3, 4, 5]}
            tick={{ fontSize: 12 }}
            stroke="#9ca3af"
            label={{ value: 'Mood', angle: -90, position: 'insideLeft', fontSize: 12 }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const data = payload[0].payload;
              return (
                <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
                  <p className="font-medium text-gray-900">
                    {formatDate(data.date, 'MMM d, yyyy')}
                  </p>
                  <p className="text-sm text-gray-600">
                    Sleep Quality: {data.sleepQuality}/5
                  </p>
                  <p className="text-sm text-gray-600">
                    Mood: {data.mood}/5
                  </p>
                  <p className="text-sm text-gray-600">
                    Energy: {data.energy}/5
                  </p>
                  <p className="text-sm text-gray-600">
                    Duration: {data.sleepHours}h
                  </p>
                </div>
              );
            }}
          />
          <Scatter
            name="Sleep vs Mood"
            data={correlationData}
            fill="#6366f1"
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

// Simple correlation summary
interface CorrelationSummaryProps {
  sleepLogs: SleepLog[];
  diaryEntries: DiaryEntry[];
}

export function CorrelationSummary({ sleepLogs, diaryEntries }: CorrelationSummaryProps) {
  // Calculate correlation between sleep quality and mood
  const matchedData = sleepLogs
    .map((log) => {
      const diary = diaryEntries.find((e) => e.date === log.date);
      return diary ? { sleepQuality: log.quality, mood: diary.mood } : null;
    })
    .filter(Boolean) as { sleepQuality: number; mood: number }[];

  if (matchedData.length < 5) {
    return null;
  }

  // Simple correlation analysis
  const avgSleepQuality = matchedData.reduce((s, d) => s + d.sleepQuality, 0) / matchedData.length;
  const avgMood = matchedData.reduce((s, d) => s + d.mood, 0) / matchedData.length;

  // Calculate Pearson correlation coefficient
  const numerator = matchedData.reduce(
    (sum, d) => sum + (d.sleepQuality - avgSleepQuality) * (d.mood - avgMood),
    0
  );
  const denominator = Math.sqrt(
    matchedData.reduce((sum, d) => sum + Math.pow(d.sleepQuality - avgSleepQuality, 2), 0) *
    matchedData.reduce((sum, d) => sum + Math.pow(d.mood - avgMood, 2), 0)
  );

  const correlation = denominator === 0 ? 0 : numerator / denominator;

  const getCorrelationText = (r: number) => {
    if (r > 0.5) return { text: 'Strong positive', color: 'text-green-600' };
    if (r > 0.25) return { text: 'Moderate positive', color: 'text-green-500' };
    if (r > -0.25) return { text: 'Weak', color: 'text-gray-500' };
    if (r > -0.5) return { text: 'Moderate negative', color: 'text-orange-500' };
    return { text: 'Strong negative', color: 'text-red-500' };
  };

  const correlationInfo = getCorrelationText(correlation);

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h4 className="text-sm font-medium text-gray-700 mb-2">Sleep-Mood Correlation</h4>
      <p className={`text-lg font-semibold ${correlationInfo.color}`}>
        {correlationInfo.text}
      </p>
      <p className="text-xs text-gray-500 mt-1">
        Based on {matchedData.length} matching days
      </p>
    </div>
  );
}
