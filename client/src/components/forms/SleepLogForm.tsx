import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createSleepLogSchema, type CreateSleepLogInput, type SleepLog } from '@sleep-tracker/shared';
import { useCreateSleepLog, useUpdateSleepLog } from '@/hooks/useSleepLogs';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { getToday, qualityLabels, cn } from '@/lib/utils';

interface SleepLogFormProps {
  initialData?: SleepLog;
  onSuccess?: () => void;
}

export function SleepLogForm({ initialData, onSuccess }: SleepLogFormProps) {
  const createMutation = useCreateSleepLog();
  const updateMutation = useUpdateSleepLog();
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateSleepLogInput>({
    resolver: zodResolver(createSleepLogSchema),
    defaultValues: initialData
      ? {
          date: initialData.date,
          bedtime: initialData.bedtime.slice(0, 16), // Format for datetime-local
          wakeTime: initialData.wakeTime.slice(0, 16),
          quality: initialData.quality,
          interruptions: initialData.interruptions,
          notes: initialData.notes || '',
        }
      : {
          date: getToday(),
          quality: 3,
          interruptions: 0,
        },
  });

  const quality = watch('quality');

  const onSubmit = async (data: CreateSleepLogInput) => {
    try {
      // Convert datetime-local to ISO string
      const formattedData = {
        ...data,
        bedtime: new Date(data.bedtime).toISOString(),
        wakeTime: new Date(data.wakeTime).toISOString(),
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
      console.error('Failed to save sleep log:', error);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Card>
      <CardHeader title={isEditing ? 'Edit Sleep Log' : 'Log Your Sleep'} />
      <CardBody>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Date"
            type="date"
            error={errors.date?.message}
            {...register('date')}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Bedtime"
              type="datetime-local"
              error={errors.bedtime?.message}
              {...register('bedtime')}
            />

            <Input
              label="Wake Time"
              type="datetime-local"
              error={errors.wakeTime?.message}
              {...register('wakeTime')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sleep Quality
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setValue('quality', value as 1 | 2 | 3 | 4 | 5)}
                  className={cn(
                    'flex-1 py-3 rounded-lg text-sm font-medium transition-colors',
                    quality === value
                      ? 'bg-sleep text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {value}
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-1 text-center">
              {qualityLabels[quality]}
            </p>
            {errors.quality && (
              <p className="text-sm text-red-500 mt-1">{errors.quality.message}</p>
            )}
          </div>

          <Input
            label="Interruptions"
            type="number"
            min={0}
            max={20}
            error={errors.interruptions?.message}
            {...register('interruptions', { valueAsNumber: true })}
          />

          <Textarea
            label="Notes (optional)"
            placeholder="Any notes about your sleep..."
            rows={3}
            {...register('notes')}
          />

          <Button type="submit" fullWidth isLoading={isLoading}>
            {isEditing ? 'Update Sleep Log' : 'Save Sleep Log'}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
