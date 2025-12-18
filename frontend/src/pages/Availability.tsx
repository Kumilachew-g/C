import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../api';
import { useAuth } from '../hooks/useAuth';

type Slot = { id: string; commissionerId: string; start: string; end: string };
type Commissioner = { id: string; fullName: string; email: string; title?: string; office?: string };

const availabilitySchema = z.object({
  commissionerId: z.string().uuid('Commissioner ID must be a valid UUID.'),
  startTime: z.string().min(1, 'Start time is required.'),
  endTime: z.string().min(1, 'End time is required.'),
});

const editSlotSchema = z.object({
  startTime: z.string().min(1, 'Start time is required.'),
  endTime: z.string().min(1, 'End time is required.'),
});

type AvailabilityForm = z.infer<typeof availabilitySchema>;
type EditSlotForm = z.infer<typeof editSlotSchema>;

const Availability = () => {
  const { user } = useAuth();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [filteredSlots, setFilteredSlots] = useState<Slot[]>([]);
  const [commissioners, setCommissioners] = useState<Commissioner[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCommissionerFilter, setSelectedCommissionerFilter] = useState<string>('');

  // Role-based permissions
  const isCommissioner = user?.role === 'commissioner';
  const isAdminOrSecretariat = user?.role === 'admin' || user?.role === 'secretariat';
  const canEditSlot = (slot: Slot) => {
    // Only commissioners can edit, and only their own slots
    return isCommissioner && slot.commissionerId === user?.id;
  };
  const canDeleteSlot = (slot: Slot) => {
    // Only commissioners can delete, and only their own slots
    return isCommissioner && slot.commissionerId === user?.id;
  };
  const canCreateSlots = isAdminOrSecretariat || isCommissioner;

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AvailabilityForm>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: {
      commissionerId: isCommissioner ? user?.id || '' : '',
      startTime: '',
      endTime: '',
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

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      let params: any = {};
      
      // Commissioners can only see their own slots
      if (isCommissioner) {
        params.commissionerId = user?.id;
      } else if (selectedCommissionerFilter) {
        // Admin/Secretariat can filter by commissioner
        params.commissionerId = selectedCommissionerFilter;
      }
      
      const { data } = await api.get<Slot[]>('/availability', { params });
      const slotsData = Array.isArray(data) ? data : [];
      setSlots(slotsData);
      setFilteredSlots(slotsData);
    } catch (err) {
      setError('Unable to load availability');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCommissionerFilter, isCommissioner]);

  const onSubmit = async (values: AvailabilityForm) => {
    setError(null);
    try {
      // Ensure commissionerId is set for commissioners
      const payload = {
        ...values,
        commissionerId: isCommissioner ? (user?.id || values.commissionerId) : values.commissionerId,
      };
      await api.post('/availability', payload);
      reset({ ...values, startTime: '', endTime: '' });
      await load();
    } catch (err: any) {
      const apiMessage = err?.response?.data?.message;
      setError(apiMessage || 'Could not create slot (check overlap and inputs).');
    }
  };

  const handleEdit = (slot: Slot) => {
    setSelectedSlot(slot);
    setShowEditModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this availability slot?')) {
      return;
    }
    try {
      await api.delete(`/availability/${id}`);
      await load();
    } catch (err: any) {
      const apiMessage = err?.response?.data?.message;
      setError(apiMessage || 'Failed to delete slot.');
    }
  };

  const handleUpdateSlot = async (values: EditSlotForm) => {
    if (!selectedSlot) return;
    setError(null);
    try {
      await api.patch(`/availability/${selectedSlot.id}`, values);
      setShowEditModal(false);
      setSelectedSlot(null);
      await load();
    } catch (err: any) {
      const apiMessage = err?.response?.data?.message;
      setError(apiMessage || 'Failed to update slot.');
    }
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: date.toISOString().slice(0, 10),
      time: date.toTimeString().slice(0, 5),
    };
  };

  const getCommissionerName = (commissionerId: string) => {
    const commissioner = commissioners.find((c) => c.id === commissionerId);
    return commissioner ? `${commissioner.fullName}${commissioner.title ? ` - ${commissioner.title}` : ''}` : `Commissioner: ${commissionerId.slice(0, 8)}...`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Commissioner Availability</h2>
          <p className="text-sm text-slate-400 mt-1">
            {isCommissioner 
              ? 'Manage your availability slots for engagements'
              : 'View and manage commissioner availability slots'}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-sm font-medium transition-colors"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Filter for Admin/Secretariat */}
      {isAdminOrSecretariat && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Filter by Commissioner
          </label>
          <select
            value={selectedCommissionerFilter}
            onChange={(e) => setSelectedCommissionerFilter(e.target.value)}
            className="w-full sm:w-auto rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Commissioners</option>
            {commissioners.map((c) => (
              <option key={c.id} value={c.id}>
                {c.fullName} {c.title ? `- ${c.title}` : ''} {c.office ? `(${c.office})` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Create Form */}
      {canCreateSlots && (
        <form
          className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 grid gap-4 md:grid-cols-4 md:items-end"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div className={isCommissioner ? 'md:col-span-3' : 'md:col-span-2'}>
            {!isCommissioner ? (
              <>
                <label className="block text-sm font-medium text-slate-300 mb-2">Commissioner</label>
                <select
                  className={`w-full rounded-lg border px-4 py-2.5 bg-slate-800 text-white focus:outline-none focus:ring-2 transition-colors ${
                    errors.commissionerId ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-indigo-500'
                  }`}
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
                  <p className="mt-1.5 text-xs text-red-400">{errors.commissionerId.message}</p>
                )}
              </>
            ) : (
              <div className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5">
                <p className="text-sm text-slate-300">
                  <span className="font-medium">Your Availability</span>
                </p>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Start</label>
            <input
              type="datetime-local"
              className={`w-full rounded-lg border px-4 py-2.5 bg-slate-800 text-white focus:outline-none focus:ring-2 transition-colors ${
                errors.startTime ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-indigo-500'
              }`}
              {...register('startTime')}
            />
            {errors.startTime && (
              <p className="mt-1.5 text-xs text-red-400">{errors.startTime.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">End</label>
            <input
              type="datetime-local"
              className={`w-full rounded-lg border px-4 py-2.5 bg-slate-800 text-white focus:outline-none focus:ring-2 transition-colors ${
                errors.endTime ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-indigo-500'
              }`}
              {...register('endTime')}
            />
            {errors.endTime && (
              <p className="mt-1.5 text-xs text-red-400">{errors.endTime.message}</p>
            )}
          </div>
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-lg px-4 py-2.5 font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Adding...' : 'Add Slot'}
            </button>
          </div>
        </form>
      )}

      {/* Slots List */}
      <div className="space-y-3">
        {loading && <p className="text-sm text-slate-400 text-center py-4">Loading availability slots...</p>}
        {!loading && filteredSlots.length === 0 && (
          <div className="text-center py-8 bg-slate-900/60 border border-slate-800 rounded-xl">
            <p className="text-slate-400">No availability slots found.</p>
          </div>
        )}
        {!loading && filteredSlots.map((slot) => {
          const canEdit = canEditSlot(slot);
          const canDelete = canDeleteSlot(slot);
          return (
            <div
              key={slot.id}
              className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {!isCommissioner && (
                    <p className="font-semibold text-white mb-1">
                      {getCommissionerName(slot.commissionerId)}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2 text-slate-300">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{new Date(slot.start).toLocaleString()}</span>
                    </div>
                    <span className="text-slate-500">→</span>
                    <div className="flex items-center gap-2 text-slate-300">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{new Date(slot.end).toLocaleString()}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Duration: {Math.round((new Date(slot.end).getTime() - new Date(slot.start).getTime()) / (1000 * 60 * 60))} hours
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {canEdit && (
                    <button
                      onClick={() => handleEdit(slot)}
                      className="px-3 py-1.5 rounded-lg border border-blue-500 text-blue-300 hover:bg-blue-500/10 text-sm font-medium transition-colors"
                      title="Edit slot"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(slot.id)}
                      className="px-3 py-1.5 rounded-lg border border-red-500 text-red-300 hover:bg-red-500/10 text-sm font-medium transition-colors"
                      title="Delete slot"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                  {!canEdit && !canDelete && (
                    <span className="text-xs text-slate-500 px-2 py-1">
                      {isCommissioner ? 'Cannot edit other commissioners\' slots' : 'Read-only'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedSlot && (
        <EditSlotModal
          slot={selectedSlot}
          onClose={() => {
            setShowEditModal(false);
            setSelectedSlot(null);
          }}
          onSave={handleUpdateSlot}
        />
      )}
    </div>
  );
};

// Edit Slot Modal Component
const EditSlotModal = ({
  slot,
  onClose,
  onSave,
}: {
  slot: Slot;
  onClose: () => void;
  onSave: (values: EditSlotForm) => void;
}) => {
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditSlotForm>({
    resolver: zodResolver(editSlotSchema),
    defaultValues: {
      startTime: new Date(slot.start).toISOString().slice(0, 16),
      endTime: new Date(slot.end).toISOString().slice(0, 16),
    },
  });

  const onSubmit = async (values: EditSlotForm) => {
    setLoading(true);
    try {
      await onSave(values);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Edit Availability Slot</h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Start Date & Time</label>
              <input
                type="datetime-local"
                className={`w-full rounded-lg border px-4 py-2.5 bg-slate-800 text-white focus:outline-none focus:ring-2 transition-colors ${
                  errors.startTime ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-indigo-500'
                }`}
                {...register('startTime')}
              />
              {errors.startTime && (
                <p className="mt-1.5 text-xs text-red-400">{errors.startTime.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">End Date & Time</label>
              <input
                type="datetime-local"
                className={`w-full rounded-lg border px-4 py-2.5 bg-slate-800 text-white focus:outline-none focus:ring-2 transition-colors ${
                  errors.endTime ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-indigo-500'
                }`}
                {...register('endTime')}
              />
              {errors.endTime && (
                <p className="mt-1.5 text-xs text-red-400">{errors.endTime.message}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Availability;
