import { useState } from 'react';
import { PageHeader } from '@/components/layout/Header';
import { Card, CardBody } from '@/components/ui/Card';
import { SleepLogForm } from '@/components/forms/SleepLogForm';
import { useSleepLogs, useCreateSleepLog, useUpdateSleepLog } from '@/hooks/useSleepLogs';
import { getToday, formatDate, formatDuration, getQualityLabel } from '@/lib/utils';
import { Spinner } from '@/components/ui/Spinner';
import type { SleepLog } from '@/types';

export default function SleepLogPage() {
  const today = getToday();
  const [editingLog, setEditingLog] = useState<SleepLog | null>(null);

  const { logs, isLoading } = useSleepLogs({ limit: 7 });
  const createMutation = useCreateSleepLog();
  const updateMutation = useUpdateSleepLog();

  const todayLog = logs?.find((log) => log.date === today);
  const showForm = !todayLog || editingLog;

  const handleSubmit = async (data: Parameters<typeof createMutation.mutate>[0]) => {
    if (editingLog) {
      await updateMutation.mutateAsync({ id: editingLog.id, data });
      setEditingLog(null);
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sleep Log"
        subtitle={formatDate(new Date(), 'EEEE, MMMM d')}
      />

      {showForm ? (
        <Card>
          <CardBody>
            <SleepLogForm
              initialData={editingLog || undefined}
              onSubmit={handleSubmit}
              isLoading={createMutation.isPending || updateMutation.isPending}
              onCancel={editingLog ? () => setEditingLog(null) : undefined}
            />
          </CardBody>
        </Card>
      ) : todayLog ? (
        <Card className="border-green-200 bg-green-50">
          <CardBody>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Today's Sleep</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Duration: <span className="font-medium">{formatDuration(todayLog.durationMinutes)}</span></p>
                  <p>Quality: <span className="font-medium">{getQualityLabel(todayLog.quality)}</span></p>
                  {todayLog.interruptions > 0 && (
                    <p>Interruptions: <span className="font-medium">{todayLog.interruptions}</span></p>
                  )}
                  {todayLog.notes && (
                    <p className="text-gray-500 mt-2">{todayLog.notes}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setEditingLog(todayLog)}
                className="text-primary-600 hover:text-primary-700 font-medium text-sm"
              >
                Edit
              </button>
            </div>
          </CardBody>
        </Card>
      ) : null}

      {/* Recent logs */}
      {logs && logs.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Recent Entries</h3>
          {logs
            .filter((log) => log.date !== today)
            .slice(0, 5)
            .map((log) => (
              <Card key={log.id}>
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{formatDate(log.date, 'EEEE, MMM d')}</p>
                      <p className="text-sm text-gray-500">
                        {formatDuration(log.durationMinutes)} " Quality: {log.quality}/5
                      </p>
                    </div>
                    <button
                      onClick={() => setEditingLog(log)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                </CardBody>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
