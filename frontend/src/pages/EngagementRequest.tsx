import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../api';
import { useAuth } from '../hooks/useAuth';

const engagementSchema = z.object({
  referenceNo: z.string().min(3, 'Reference number is required.'),
  purpose: z.string().min(5, 'Purpose is required.'),
  date: z.string().min(1, 'Date is required.'),
  time: z.string().min(1, 'Time is required.'),
  commissionerId: z.string().uuid('Commissioner ID must be a valid UUID.'),
  details: z.string().optional(),
});

type EngagementForm = z.infer<typeof engagementSchema>;
type Commissioner = { id: string; fullName: string; email: string; title?: string; office?: string };

const EngagementRequest = () => {
  const { user } = useAuth();
  const [commissioners, setCommissioners] = useState<Commissioner[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EngagementForm>({
    resolver: zodResolver(engagementSchema),
    defaultValues: {
      referenceNo: '',
      purpose: '',
      date: '',
      time: '',
      commissionerId: '',
      details: '',
    },
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

  const onSubmit = async (values: EngagementForm) => {
    setServerError(null);
    setStatusMessage(null);
    try {
      await api.post('/engagements', {
        referenceNo: values.referenceNo,
        purpose: values.purpose,
        date: values.date,
        time: values.time,
        commissionerId: values.commissionerId,
        description: values.details,
      });
      setStatusMessage('Engagement request submitted for processing.');
      reset();
    } catch (err: any) {
      const apiMessage = err?.response?.data?.message;
      setServerError(apiMessage || 'Unable to submit engagement request. Please verify details.');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">New Engagement Request</h2>
        <p className="text-sm text-slate-400">
          Submit a formal request for a commissioner engagement. All fields marked * are required.
        </p>
      </div>
      {statusMessage && <p className="text-sm text-emerald-400">{statusMessage}</p>}
      {serverError && <p className="text-sm text-red-400">{serverError}</p>}
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 grid gap-4 md:grid-cols-2"
      >
        <div className="md:col-span-1">
          <label className="block text-sm text-slate-300 mb-1">
            Reference number <span className="text-red-400">*</span>
          </label>
          <input
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2"
            {...register('referenceNo')}
          />
          {errors.referenceNo && (
            <p className="mt-1 text-xs text-red-400">{errors.referenceNo.message}</p>
          )}
        </div>
        <div className="md:col-span-1">
          <label className="block text-sm text-slate-300 mb-1">
            Purpose <span className="text-red-400">*</span>
          </label>
          <input
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2"
            {...register('purpose')}
          />
          {errors.purpose && <p className="mt-1 text-xs text-red-400">{errors.purpose.message}</p>}
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">
            Date <span className="text-red-400">*</span>
          </label>
          <input
            type="date"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2"
            {...register('date')}
          />
          {errors.date && <p className="mt-1 text-xs text-red-400">{errors.date.message}</p>}
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">
            Time <span className="text-red-400">*</span>
          </label>
          <input
            type="time"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2"
            {...register('time')}
          />
          {errors.time && <p className="mt-1 text-xs text-red-400">{errors.time.message}</p>}
        </div>
        <div className="md:col-span-1">
          <label className="block text-sm text-slate-300 mb-1">
            Commissioner <span className="text-red-400">*</span>
          </label>
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
        <div className="md:col-span-1">
          <label className="block text-sm text-slate-300 mb-1">Requesting unit</label>
          <input
            disabled
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-slate-400"
            value={user?.department || 'Not specified'}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-slate-300 mb-1">Additional details</label>
          <textarea
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2"
            rows={4}
            {...register('details')}
          />
        </div>
        <div className="md:col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700 rounded-lg px-6 py-2 font-semibold"
          >
            {isSubmitting ? 'Submitting...' : 'Submit request'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EngagementRequest;


