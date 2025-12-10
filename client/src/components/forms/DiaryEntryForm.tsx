import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createDiaryEntrySchema, type CreateDiaryEntryInput, type DiaryEntry } from '@sleep-tracker/shared';
import { useCreateDiaryEntry, useUpdateDiaryEntry } from '@/hooks/useDiaryEntries';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { getToday, moodLabels, commonActivities, formatActivity, cn } from '@/lib/utils';

interface DiaryEntryFormProps {
  initialData?: DiaryEntry;
  onSuccess?: () => void;
}

export function DiaryEntryForm({ initialData, onSuccess }: DiaryEntryFormProps) {
  const createMutation = useCreateDiaryEntry();
  const updateMutation = useUpdateDiaryEntry();
  const isEditing = !!initialData;

  const [selectedActivities, setSelectedActivities] = useState<string[]>(
    initialData?.activities || []
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateDiaryEntryInput>({
    resolver: zodResolver(createDiaryEntrySchema),
    defaultValues: initialData
      ? {
          date: initialData.date,
          mood: initialData.mood,
          energy: initialData.energy,
          activities: initialData.activities,
          dietNotes: initialData.dietNotes || '',
          journalText: initialData.journalText || '',
        }
      : {
          date: getToday(),
          mood: 3,
          energy: 3,
          activities: [],
        },
  });

  const mood = watch('mood');
  const energy = watch('energy');

  const toggleActivity = (activity: string) => {
    const newActivities = selectedActivities.includes(activity)
      ? selectedActivities.filter((a) => a !== activity)
      : [...selectedActivities, activity];
    setSelectedActivities(newActivities);
    setValue('activities', newActivities);
  };

  const onSubmit = async (data: CreateDiaryEntryInput) => {
    try {
      const formattedData = {
        ...data,
        activities: selectedActivities,
      };

      if (isEditing) {
        await updateMutation.mutateAsync({
          id: initialData.id,
          input: formattedData,
        });
      } else {
        await createMutation.mutateAsync(formattedData);
      }
      onSuccess?.();
    } catch (error) {
      console.error('Failed to save diary entry:', error);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Card>
      <CardHeader title={isEditing ? 'Edit Diary Entry' : 'Daily Wellness Check-in'} />
      <CardBody>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            label="Date"
            type="date"
            error={errors.date?.message}
            {...register('date')}
          />

          {/* Mood Scale */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How's your mood today?
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setValue('mood', value as 1 | 2 | 3 | 4 | 5)}
                  className={cn(
                    'flex-1 py-3 rounded-lg text-lg transition-colors',
                    mood === value
                      ? 'bg-wellness text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  )}
                >
                  {value === 1 && '="'}
                  {value === 2 && '='}
                  {value === 3 && '='}
                  {value === 4 && '=B'}
                  {value === 5 && '='}
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-1 text-center">
              {moodLabels[mood]}
            </p>
          </div>

          {/* Energy Scale */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Energy Level
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setValue('energy', value as 1 | 2 | 3 | 4 | 5)}
                  className={cn(
                    'flex-1 py-3 rounded-lg text-lg transition-colors',
                    energy === value
                      ? 'bg-sleep text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  )}
                >
                  {value === 1 && '='}
                  {value === 2 && '>«'}
                  {value === 3 && '¡'}
                  {value === 4 && '=ª'}
                  {value === 5 && '=€'}
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-1 text-center">
              {moodLabels[energy]}
            </p>
          </div>

          {/* Activities */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Today's Activities
            </label>
            <div className="flex flex-wrap gap-2">
              {commonActivities.map((activity) => (
                <button
                  key={activity}
                  type="button"
                  onClick={() => toggleActivity(activity)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                    selectedActivities.includes(activity)
                      ? 'bg-sleep text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {formatActivity(activity)}
                </button>
              ))}
            </div>
          </div>

          <Textarea
            label="Diet Notes (optional)"
            placeholder="What did you eat today?"
            rows={2}
            {...register('dietNotes')}
          />

          <Textarea
            label="Journal (optional)"
            placeholder="How was your day? Any thoughts?"
            rows={4}
            {...register('journalText')}
          />

          <Button type="submit" fullWidth isLoading={isLoading}>
            {isEditing ? 'Update Entry' : 'Save Entry'}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
