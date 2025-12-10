import { useState } from 'react';
import { PageHeader } from '@/components/layout/Header';
import { Card, CardBody } from '@/components/ui/Card';
import { DiaryEntryForm } from '@/components/forms/DiaryEntryForm';
import { useDiaryEntries, useCreateDiaryEntry, useUpdateDiaryEntry } from '@/hooks/useDiaryEntries';
import { getToday, formatDate, getMoodLabel, formatActivity } from '@/lib/utils';
import { Spinner } from '@/components/ui/Spinner';
import type { DiaryEntry } from '@/types';

export default function DiaryPage() {
  const today = getToday();
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);

  const { entries, isLoading } = useDiaryEntries({ limit: 7 });
  const createMutation = useCreateDiaryEntry();
  const updateMutation = useUpdateDiaryEntry();

  const todayEntry = entries?.find((entry) => entry.date === today);
  const showForm = !todayEntry || editingEntry;

  const handleSubmit = async (data: Parameters<typeof createMutation.mutate>[0]) => {
    if (editingEntry) {
      await updateMutation.mutateAsync({ id: editingEntry.id, data });
      setEditingEntry(null);
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
        title="Wellness Diary"
        subtitle={formatDate(new Date(), 'EEEE, MMMM d')}
      />

      {showForm ? (
        <Card>
          <CardBody>
            <DiaryEntryForm
              initialData={editingEntry || undefined}
              onSubmit={handleSubmit}
              isLoading={createMutation.isPending || updateMutation.isPending}
              onCancel={editingEntry ? () => setEditingEntry(null) : undefined}
            />
          </CardBody>
        </Card>
      ) : todayEntry ? (
        <Card className="border-green-200 bg-green-50">
          <CardBody>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Today's Entry</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex gap-4">
                    <div>
                      <span className="text-gray-500">Mood:</span>
                      <span className="font-medium ml-1">{getMoodLabel(todayEntry.mood)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Energy:</span>
                      <span className="font-medium ml-1">{getMoodLabel(todayEntry.energy)}</span>
                    </div>
                  </div>
                  {todayEntry.activities.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {todayEntry.activities.map((activity) => (
                        <span
                          key={activity}
                          className="px-2 py-0.5 bg-white rounded-full text-xs text-gray-600"
                        >
                          {formatActivity(activity)}
                        </span>
                      ))}
                    </div>
                  )}
                  {todayEntry.journalText && (
                    <p className="text-gray-600 mt-2">{todayEntry.journalText}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setEditingEntry(todayEntry)}
                className="text-primary-600 hover:text-primary-700 font-medium text-sm"
              >
                Edit
              </button>
            </div>
          </CardBody>
        </Card>
      ) : null}

      {/* Recent entries */}
      {entries && entries.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Recent Entries</h3>
          {entries
            .filter((entry) => entry.date !== today)
            .slice(0, 5)
            .map((entry) => (
              <Card key={entry.id}>
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{formatDate(entry.date, 'EEEE, MMM d')}</p>
                      <p className="text-sm text-gray-500">
                        Mood: {entry.mood}/5 " Energy: {entry.energy}/5
                      </p>
                    </div>
                    <button
                      onClick={() => setEditingEntry(entry)}
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
