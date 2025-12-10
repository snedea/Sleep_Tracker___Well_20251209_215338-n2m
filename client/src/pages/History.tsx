import { useState } from 'react';
import { PageHeader } from '@/components/layout/Header';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSleepLogs } from '@/hooks/useSleepLogs';
import { useDiaryEntries } from '@/hooks/useDiaryEntries';
import { formatDate, formatDuration, getQualityLabel, getMoodLabel, getDaysAgo } from '@/lib/utils';
import { SleepTrendChart } from '@/components/charts/SleepTrendChart';
import { QualityChart } from '@/components/charts/QualityChart';
import { MoodCorrelation } from '@/components/charts/MoodCorrelation';
import { Spinner } from '@/components/ui/Spinner';

type TimeRange = '7' | '14' | '30';
type View = 'sleep' | 'diary' | 'charts';

export default function HistoryPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('14');
  const [view, setView] = useState<View>('sleep');

  const daysAgo = parseInt(timeRange);
  const startDate = getDaysAgo(daysAgo);

  const { logs, isLoading: sleepLoading } = useSleepLogs({ startDate, limit: daysAgo });
  const { entries, isLoading: diaryLoading } = useDiaryEntries({ startDate, limit: daysAgo });

  const isLoading = sleepLoading || diaryLoading;

  return (
    <div className="space-y-6">
      <PageHeader title="History" subtitle="Review your wellness journey" />

      {/* Time Range Selector */}
      <div className="flex gap-2">
        {(['7', '14', '30'] as TimeRange[]).map((range) => (
          <Button
            key={range}
            variant={timeRange === range ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setTimeRange(range)}
          >
            {range} days
          </Button>
        ))}
      </div>

      {/* View Selector */}
      <div className="flex border-b border-gray-200">
        {(['sleep', 'diary', 'charts'] as View[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-2 font-medium text-sm border-b-2 -mb-px transition-colors ${
              view === v
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* Sleep Log View */}
          {view === 'sleep' && (
            <div className="space-y-3">
              {logs && logs.length > 0 ? (
                logs.map((log) => (
                  <Card key={log.id}>
                    <CardBody>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">
                            {formatDate(log.date, 'EEEE, MMM d')}
                          </p>
                          <div className="mt-1 space-y-1 text-sm text-gray-600">
                            <p>Duration: <span className="font-medium">{formatDuration(log.durationMinutes)}</span></p>
                            <p>Quality: <span className="font-medium">{getQualityLabel(log.quality)}</span></p>
                            {log.interruptions > 0 && (
                              <p>Interruptions: <span className="font-medium">{log.interruptions}</span></p>
                            )}
                          </div>
                          {log.notes && (
                            <p className="mt-2 text-sm text-gray-500">{log.notes}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            log.quality >= 4 ? 'bg-green-100 text-green-800' :
                            log.quality >= 3 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {log.quality}/5
                          </span>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardBody className="text-center py-8">
                    <p className="text-gray-500">No sleep logs in this period</p>
                  </CardBody>
                </Card>
              )}
            </div>
          )}

          {/* Diary View */}
          {view === 'diary' && (
            <div className="space-y-3">
              {entries && entries.length > 0 ? (
                entries.map((entry) => (
                  <Card key={entry.id}>
                    <CardBody>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">
                            {formatDate(entry.date, 'EEEE, MMM d')}
                          </p>
                          <div className="mt-1 flex gap-4 text-sm text-gray-600">
                            <p>Mood: <span className="font-medium">{getMoodLabel(entry.mood)}</span></p>
                            <p>Energy: <span className="font-medium">{getMoodLabel(entry.energy)}</span></p>
                          </div>
                          {entry.activities.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {entry.activities.map((activity) => (
                                <span
                                  key={activity}
                                  className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600"
                                >
                                  {activity.replace('_', ' ')}
                                </span>
                              ))}
                            </div>
                          )}
                          {entry.journalText && (
                            <p className="mt-2 text-sm text-gray-500 line-clamp-2">{entry.journalText}</p>
                          )}
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardBody className="text-center py-8">
                    <p className="text-gray-500">No diary entries in this period</p>
                  </CardBody>
                </Card>
              )}
            </div>
          )}

          {/* Charts View */}
          {view === 'charts' && (
            <div className="space-y-6">
              <Card>
                <CardHeader title="Sleep Duration Trend" />
                <CardBody>
                  {logs && logs.length >= 2 ? (
                    <SleepTrendChart data={logs} />
                  ) : (
                    <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                      <p className="text-gray-500">Need at least 2 days of data</p>
                    </div>
                  )}
                </CardBody>
              </Card>

              <Card>
                <CardHeader title="Sleep Quality Distribution" />
                <CardBody>
                  {logs && logs.length >= 2 ? (
                    <QualityChart data={logs} />
                  ) : (
                    <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                      <p className="text-gray-500">Need at least 2 days of data</p>
                    </div>
                  )}
                </CardBody>
              </Card>

              <Card>
                <CardHeader title="Sleep & Mood Correlation" />
                <CardBody>
                  {logs && entries && logs.length >= 2 && entries.length >= 2 ? (
                    <MoodCorrelation sleepLogs={logs} diaryEntries={entries} />
                  ) : (
                    <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                      <p className="text-gray-500">Need sleep and diary data from at least 2 days</p>
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
