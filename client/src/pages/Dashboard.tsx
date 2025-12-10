import { Link } from 'react-router-dom';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSleepLogs } from '@/hooks/useSleepLogs';
import { useDiaryEntries } from '@/hooks/useDiaryEntries';
import { useAuth } from '@/hooks/useAuth';
import { formatDate, formatDuration, getToday, getDaysAgo, getMoodLabel } from '@/lib/utils';
import { SleepTrendChart } from '@/components/charts/SleepTrendChart';
import { InsightsList } from '@/components/insights/InsightsList';

export default function Dashboard() {
  const { user } = useAuth();
  const today = getToday();
  const sevenDaysAgo = getDaysAgo(7);

  const { logs, isLoading: sleepLoading } = useSleepLogs({
    startDate: sevenDaysAgo,
    limit: 7,
  });

  const { entries, isLoading: diaryLoading } = useDiaryEntries({
    startDate: sevenDaysAgo,
    limit: 7,
  });

  const todaySleep = logs?.find((log) => log.date === today);
  const todayDiary = entries?.find((entry) => entry.date === today);

  const avgSleepHours = logs && logs.length > 0
    ? (logs.reduce((sum, log) => sum + log.durationMinutes, 0) / logs.length / 60).toFixed(1)
    : null;
  const avgQuality = logs && logs.length > 0
    ? (logs.reduce((sum, log) => sum + log.quality, 0) / logs.length).toFixed(1)
    : null;

  const isLoading = sleepLoading || diaryLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Good {getTimeOfDay()}, {user?.name?.split(' ')[0] || 'there'}!
        </h1>
        <p className="text-gray-500">{formatDate(new Date(), 'EEEE, MMMM d')}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Link to="/sleep">
          <Card className={`${todaySleep ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}`}>
            <CardBody className="text-center py-4">
              <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${todaySleep ? 'bg-green-100' : 'bg-orange-100'}`}>
                <svg className={`w-6 h-6 ${todaySleep ? 'text-green-600' : 'text-orange-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              </div>
              <p className="font-medium text-gray-900">{todaySleep ? 'Sleep Logged' : 'Log Sleep'}</p>
              {todaySleep && <p className="text-sm text-gray-600">{formatDuration(todaySleep.durationMinutes)}</p>}
            </CardBody>
          </Card>
        </Link>

        <Link to="/diary">
          <Card className={`${todayDiary ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}`}>
            <CardBody className="text-center py-4">
              <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${todayDiary ? 'bg-green-100' : 'bg-orange-100'}`}>
                <svg className={`w-6 h-6 ${todayDiary ? 'text-green-600' : 'text-orange-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <p className="font-medium text-gray-900">{todayDiary ? 'Diary Updated' : 'Write Diary'}</p>
              {todayDiary && <p className="text-sm text-gray-600">Mood: {getMoodLabel(todayDiary.mood)}</p>}
            </CardBody>
          </Card>
        </Link>
      </div>

      {logs && logs.length > 0 && (
        <Card>
          <CardHeader title="This Week" subtitle="Last 7 days" />
          <CardBody>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary-600">{avgSleepHours}h</p>
                <p className="text-xs text-gray-500">Avg Sleep</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary-600">{avgQuality}</p>
                <p className="text-xs text-gray-500">Avg Quality</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary-600">{logs.length}</p>
                <p className="text-xs text-gray-500">Days Logged</p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {logs && logs.length >= 3 && (
        <Card>
          <CardHeader title="Sleep Duration" action={<Link to="/history"><Button variant="ghost" size="sm">See All</Button></Link>} />
          <CardBody>
            <SleepTrendChart data={logs} />
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader title="AI Insights" action={<Link to="/insights"><Button variant="ghost" size="sm">See All</Button></Link>} />
        <CardBody>
          <InsightsList showGenerateButton={false} />
        </CardBody>
      </Card>

      {(!logs || logs.length === 0) && !isLoading && (
        <Card className="border-dashed border-2">
          <CardBody className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Start Your Journey</h3>
            <p className="text-gray-500 text-sm mb-4">Log your first night of sleep to begin tracking your wellness.</p>
            <Link to="/sleep"><Button>Log Sleep</Button></Link>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
