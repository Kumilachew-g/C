import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../api';

type Slot = { id: string; commissionerId: string; start: string; end: string };
type Commissioner = { id: string; fullName: string; email: string; title?: string; office?: string };

const availabilitySchema = z.object({
  commissionerId: z.string().uuid('Commissioner ID must be a valid UUID.'),
  startTime: z.string().min(1, 'Start time is required.'),
  endTime: z.string().min(1, 'End time is required.'),
});

type AvailabilityForm = z.infer<typeof availabilitySchema>;

const Availability = () => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [commissioners, setCommissioners] = useState<Commissioner[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AvailabilityForm>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: { commissionerId: '', startTime: '', endTime: '' },
  });

  useEffect(() => {
    const loadCommissioners = async () => {
      try {
        const { data } = await api.get<Commissioner[]>('/users/commissioners');
        setCommissioners(data);
      } catch (err) {
        console.error('Failed to load commissioners:', err);
      }
    };
    loadCommissioners();
  }, []);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const commissionerId = watch('commissionerId');
      const { data } = await api.get<{ data?: Slot[] } | Slot[]>('/availability', {
        params: commissionerId ? { commissionerId } : {},
      });
      const slotsData = Array.isArray(data) ? data : data.data || [];
      setSlots(slotsData);
    } catch (err) {
      setError('Unable to load availability');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (values: AvailabilityForm) => {
    setError(null);
    try {
      await api.post('/availability', values);
      reset({ ...values, startTime: '', endTime: '' });
      load();
    } catch (err: any) {
      const apiMessage = err?.response?.data?.message;
      setError(apiMessage || 'Could not create slot (check overlap and inputs).');
    }
  };

  const remove = async (id: string) => {
    await api.delete(`/availability/${id}`);
    load();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Commissioner Availability</h2>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <form
        className="grid gap-3 md:grid-cols-4 md:items-end"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <div className="md:col-span-2">
          <label className="block text-sm text-slate-300 mb-1">Commissioner</label>
          <select
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2"
            {...register('commissionerId')}
          >
            <option value="">Select a commissioner</option>
            {commissioners.map((c) => (
              <option key={c.id} value={c.id}>
                {c.fullName} {c.title ? `- ${c.title}` : ''} {c.office ? `(${c.office})` : ''}
              </option>
            ))}
          </select>
          {errors.commissionerId && (
            <p className="mt-1 text-xs text-red-400">{errors.commissionerId.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Start</label>
          <input
            type="datetime-local"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2"
            {...register('startTime')}
          />
          {errors.startTime && (
            <p className="mt-1 text-xs text-red-400">{errors.startTime.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">End</label>
          <input
            type="datetime-local"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2"
            {...register('endTime')}
          />
          {errors.endTime && (
            <p className="mt-1 text-xs text-red-400">{errors.endTime.message}</p>
          )}
        </div>
        <div className="md:col-span-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700 rounded-lg px-4 py-2 font-semibold"
          >
            {isSubmitting ? 'Saving...' : 'Add slot'}
          </button>
        </div>
      </form>

      <div className="grid gap-3">
        {loading && <p className="text-sm text-slate-400">Loading...</p>}
        {slots.map((slot) => {
          const commissioner = commissioners.find((c) => c.id === slot.commissionerId);
          return (
            <div key={slot.id} className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold">
                  {commissioner ? commissioner.fullName : `Commissioner: ${slot.commissionerId}`}
                </p>
                <p className="text-sm text-slate-400">
                  {new Date(slot.start).toLocaleString()} - {new Date(slot.end).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => remove(slot.id)}
                className="text-xs px-3 py-1 rounded-md border border-red-500 text-red-300 hover:bg-red-500/10"
              >
                Delete
              </button>
            </div>
          );
        })}
        {!loading && !slots.length && <p className="text-sm text-slate-400">No availability slots found.</p>}
      </div>
    </div>
  );
};

export default Availability;

