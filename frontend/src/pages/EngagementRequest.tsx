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
  requestingUnitId: z.union([
    z.string().uuid('Requesting unit must be a valid selection.'),
    z.literal(''),
  ]).optional(),
  details: z.string().optional(),
});

type EngagementForm = z.infer<typeof engagementSchema>;
type Commissioner = { id: string; fullName: string; email: string; title?: string; office?: string };
type Department = { id: string; name: string };

const EngagementRequest = () => {
  const { user } = useAuth();
  const [commissioners, setCommissioners] = useState<Commissioner[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EngagementForm>({
    resolver: zodResolver(engagementSchema),
    defaultValues: {
      referenceNo: '',
      purpose: '',
      date: '',
      time: '',
      commissionerId: '',
      requestingUnitId: '',
      details: '',
    },
  });

  useEffect(() => {
    const loadData = async () => {
      setLoadingDepartments(true);
      try {
        const [commissionersRes, departmentsRes] = await Promise.all([
          api.get<Commissioner[]>('/users/commissioners'),
          api.get<Department[]>('/departments'),
        ]);
        setCommissioners(commissionersRes.data);
        setDepartments(departmentsRes.data);
        
        // Set default requesting unit to user's department if available
        if (user?.departmentId) {
          const userDept = departmentsRes.data.find(d => d.id === user.departmentId);
          if (userDept) {
            setValue('requestingUnitId', userDept.id);
          }
        } else if (user?.department) {
          // Fallback to department name if departmentId not available
          const userDept = departmentsRes.data.find(d => d.name === user.department);
          if (userDept) {
            setValue('requestingUnitId', userDept.id);
          }
        }
      } catch (err) {
        console.error('Failed to load data:', err);
        setServerError('Failed to load departments or commissioners. Please refresh the page.');
      } finally {
        setLoadingDepartments(false);
      }
    };
    loadData();
  }, [user, setValue]);

  const onSubmit = async (values: EngagementForm) => {
    setServerError(null);
    setStatusMessage(null);
    try {
      // Basic client-side validation to ensure selected date/time are in the future
      const now = new Date();
      const selectedDateTime = new Date(`${values.date}T${values.time}`);
      if (Number.isNaN(selectedDateTime.getTime())) {
        setServerError('Please provide a valid engagement date and time.');
        return;
      }
      if (selectedDateTime <= now) {
        setServerError('Engagement date and time must be in the future.');
        return;
      }

      const payload: any = {
        referenceNo: values.referenceNo,
        purpose: values.purpose,
        date: values.date,
        time: values.time,
        commissionerId: values.commissionerId,
        description: values.details,
      };
      
      // Only include requestingUnitId if it's not empty
      if (values.requestingUnitId && values.requestingUnitId.trim() !== '') {
        payload.requestingUnitId = values.requestingUnitId;
      }
      
      await api.post('/engagements', payload);
      setStatusMessage('Engagement request submitted for processing.');
      reset();
    } catch (err: any) {
      const apiMessage = err?.response?.data?.message;
      setServerError(apiMessage || 'Unable to submit engagement request. Please verify details.');
    }
  };

  const selectedCommissionerId = watch('commissionerId');
  const selectedCommissioner = commissioners.find((c) => c.id === selectedCommissionerId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">New Engagement Request</h2>
        <p className="text-sm text-slate-400 mt-1">
          Submit a formal request for a commissioner engagement. All fields marked * are required.
        </p>
      </div>

      {/* Status Messages */}
      {statusMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/50 rounded-lg p-4">
          <p className="text-sm text-emerald-400 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {statusMessage}
          </p>
        </div>
      )}
      {serverError && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
          <p className="text-sm text-red-400 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {serverError}
          </p>
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-8"
      >
        {/* Section 1: Basic Information */}
        <div className="space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Basic Information
            </h3>
            <p className="text-xs text-slate-400 mt-1">Provide the core details that identify this engagement request</p>
          </div>
          
          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Reference Number <span className="text-red-400">*</span>
              </label>
              <input
                className={`w-full rounded-lg border px-4 py-2.5 bg-slate-800 text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors ${
                  errors.referenceNo ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-indigo-500'
                }`}
                placeholder="e.g., ENG-2024-001"
                {...register('referenceNo')}
              />
              <p className="mt-1.5 text-xs text-slate-400 flex items-start gap-1.5">
                <svg className="w-3 h-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>A unique identifier for tracking this engagement. Use your organization's standard format (e.g., ENG-YYYY-XXX).</span>
              </p>
              {errors.referenceNo && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.referenceNo.message}
                </p>
              )}
            </div>
            
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Purpose of Engagement <span className="text-red-400">*</span>
              </label>
              <input
                className={`w-full rounded-lg border px-4 py-2.5 bg-slate-800 text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors ${
                  errors.purpose ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-indigo-500'
                }`}
                placeholder="Brief description of the engagement purpose"
                {...register('purpose')}
              />
              <p className="mt-1.5 text-xs text-slate-400 flex items-start gap-1.5">
                <svg className="w-3 h-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Describe the main objective or reason for this engagement. Be concise but specific (minimum 5 characters).</span>
              </p>
              {errors.purpose && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.purpose.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Scheduling Details */}
        <div className="space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Scheduling Details
            </h3>
            <p className="text-xs text-slate-400 mt-1">Specify when this engagement should take place</p>
          </div>
          
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-300">
                  Engagement Date <span className="text-red-400">*</span>
                </label>
                <div className="flex items-center gap-2 text-[11px]">
                  <button
                    type="button"
                    className="px-2 py-0.5 rounded-full border border-slate-600 text-slate-300 hover:bg-slate-800"
                    onClick={() => setValue('date', new Date().toISOString().split('T')[0])}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    className="px-2 py-0.5 rounded-full border border-slate-600 text-slate-300 hover:bg-slate-800"
                    onClick={() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      setValue('date', tomorrow.toISOString().split('T')[0]);
                    }}
                  >
                    Tomorrow
                  </button>
                </div>
              </div>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                className={`w-full rounded-lg border px-4 py-2.5 bg-slate-800 text-white focus:outline-none focus:ring-2 transition-colors ${
                  errors.date ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-indigo-500'
                }`}
                {...register('date')}
              />
              <p className="mt-1.5 text-xs text-slate-400 flex items-start gap-1.5">
                <svg className="w-3 h-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Select the date for the engagement. Only future dates are allowed. The system will check commissioner availability.</span>
              </p>
              {errors.date && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.date.message}
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Engagement Time <span className="text-red-400">*</span>
              </label>
              <input
                type="time"
                className={`w-full rounded-lg border px-4 py-2.5 bg-slate-800 text-white focus:outline-none focus:ring-2 transition-colors ${
                  errors.time ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-indigo-500'
                }`}
                {...register('time')}
              />
              <p className="mt-1.5 text-xs text-slate-400 flex items-start gap-1.5">
                <svg className="w-3 h-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Select the start time for the engagement. Use 24-hour format (HH:MM). Consider business hours and commissioner availability.</span>
              </p>
              {errors.time && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.time.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Assignment */}
        <div className="space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Assignment & Organization
            </h3>
            <p className="text-xs text-slate-400 mt-1">Assign the commissioner and identify the requesting department</p>
          </div>
          
          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Assigned Commissioner <span className="text-red-400">*</span>
              </label>
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
              <p className="mt-1.5 text-xs text-slate-400 flex items-start gap-1.5">
                <svg className="w-3 h-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Choose the commissioner who will handle this engagement. The commissioner will be notified and can view their assigned engagements.</span>
              </p>
              {errors.commissionerId && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.commissionerId.message}
                </p>
              )}
              {selectedCommissioner && (
                <div className="mt-3 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs text-slate-300">
                  <p className="font-semibold text-slate-100 flex items-center gap-1.5 mb-1">
                    <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Selected commissioner
                  </p>
                  <p>{selectedCommissioner.fullName}</p>
                  {selectedCommissioner.title && (
                    <p className="text-slate-400">{selectedCommissioner.title}</p>
                  )}
                  {selectedCommissioner.office && (
                    <p className="text-slate-400 text-[11px]">Office: {selectedCommissioner.office}</p>
                  )}
                  <p className="text-slate-400 text-[11px] mt-1">Email: {selectedCommissioner.email}</p>
                </div>
              )}
            </div>
            
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Requesting Unit / Department
              </label>
              {loadingDepartments ? (
                <div className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm text-slate-400">Loading departments...</span>
                </div>
              ) : (
                <>
                  <select
                    className={`w-full rounded-lg border px-4 py-2.5 bg-slate-800 text-white focus:outline-none focus:ring-2 transition-colors ${
                      errors.requestingUnitId ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-indigo-500'
                    }`}
                    {...register('requestingUnitId')}
                  >
                    <option value="">Select requesting unit / department</option>
                    {departments.length > 0 ? (
                      departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No departments available</option>
                    )}
                  </select>
                  <p className="mt-1.5 text-xs text-slate-400 flex items-start gap-1.5">
                    <svg className="w-3 h-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Identify the department or unit requesting this engagement. This helps commissioners understand the origin of the request. Your department is pre-selected if available.</span>
                  </p>
                  {errors.requestingUnitId && (
                    <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.requestingUnitId.message}
                    </p>
                  )}
                  {user?.department && (
                    <p className="mt-1.5 text-xs text-indigo-400 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Your department: <span className="font-medium">{user.department}</span>
                    </p>
                  )}
                  {departments.length === 0 && !loadingDepartments && (
                    <p className="mt-1.5 text-xs text-amber-400 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      No departments found. Please contact an administrator to add departments.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Section 4: Additional Information */}
        <div className="space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Additional Information
            </h3>
            <p className="text-xs text-slate-400 mt-1">Provide any supplementary details that may be helpful</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Additional Details / Description
            </label>
            <textarea
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              rows={5}
              placeholder="Provide any additional context, special requirements, agenda items, or notes about this engagement..."
              {...register('details')}
            />
            <p className="mt-1.5 text-xs text-slate-400 flex items-start gap-1.5">
              <svg className="w-3 h-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Optional: Include any relevant background information, agenda items, expected outcomes, or special considerations that would help the commissioner prepare for this engagement.</span>
            </p>
          </div>
        </div>
        <div className="md:col-span-2 flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="px-6 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 font-medium transition-colors"
          >
            Clear
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Submit Request
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EngagementRequest;


