import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../hooks/useAuth';
import { ROUTE_ROLES } from '../utils/permissions';
import type { Engagement } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { SkeletonCard } from '../components/SkeletonLoader';

type StatusFilter = 'all' | 'draft' | 'scheduled' | 'completed' | 'cancelled';

const Engagements = () => {
  const { user } = useAuth();
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [filteredEngagements, setFilteredEngagements] = useState<Engagement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedEngagement, setSelectedEngagement] = useState<Engagement | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const canCreateEngagement = user?.role && ROUTE_ROLES.engagementRequest.includes(user.role);
  const canEditEngagement = (eng: Engagement) => {
    if (user?.role === 'admin' || user?.role === 'secretariat') return true;
    if (user?.role === 'commissioner' && eng.commissionerId === user.id) return true;
    if (user?.role === 'departmentUser' && eng.createdBy === user.id && eng.status === 'draft') return true;
    return false;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-slate-500/20 text-slate-300 border-slate-500';
      case 'scheduled': return 'bg-blue-500/20 text-blue-300 border-blue-500';
      case 'completed': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500';
      case 'cancelled': return 'bg-red-500/20 text-red-300 border-red-500';
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500';
    }
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<Engagement[]>('/engagements');
      setEngagements(data);
      setFilteredEngagements(data);
    } catch (err) {
      setError('Unable to load engagements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    let filtered = engagements;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(eng => eng.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(eng => 
        eng.referenceNo?.toLowerCase().includes(query) ||
        eng.purpose?.toLowerCase().includes(query) ||
        eng.description?.toLowerCase().includes(query)
      );
    }

    setFilteredEngagements(filtered);
  }, [engagements, statusFilter, searchQuery]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/engagements/${id}/status`, { status: newStatus });
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to update status');
    }
  };

  const handleAdminCancel = async (eng: Engagement) => {
    const reason = window.prompt(
      'Please enter the administrative reason for cancelling this engagement (min 10 characters):'
    );
    if (!reason || reason.trim().length < 10) {
      alert('Cancellation reason must be at least 10 characters.');
      return;
    }
    try {
      await api.patch(`/engagements/${eng.id}/status`, {
        status: 'cancelled',
        adminReason: reason.trim(),
      });
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to cancel engagement');
    }
  };

  const handleEdit = (eng: Engagement) => {
    setSelectedEngagement(eng);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (updatedData: Partial<Engagement>) => {
    if (!selectedEngagement) return;
    try {
      await api.patch(`/engagements/${selectedEngagement.id}`, updatedData);
      setShowEditModal(false);
      setSelectedEngagement(null);
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to update engagement');
    }
  };

  const statusCounts = {
    all: engagements.length,
    draft: engagements.filter(e => e.status === 'draft').length,
    scheduled: engagements.filter(e => e.status === 'scheduled').length,
    completed: engagements.filter(e => e.status === 'completed').length,
    cancelled: engagements.filter(e => e.status === 'cancelled').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Engagements</h2>
          <p className="text-sm text-slate-400 mt-1">
            Manage and track all commissioner engagements
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canCreateEngagement && (
            <Link
              to="/engagements/new"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-sm font-semibold text-white transition-colors"
            >
              + New Engagement
            </Link>
          )}
          <button 
            className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-sm font-medium transition-colors" 
            onClick={load} 
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by reference, purpose, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap gap-2">
          {(['all', 'draft', 'scheduled', 'completed', 'cancelled'] as StatusFilter[]).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)} ({statusCounts[status]})
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && engagements.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-400">Loading engagements...</p>
        </div>
      )}

      {/* Engagements Grid */}
      {!loading && filteredEngagements.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEngagements.map((eng) => (
            <div
              key={eng.id}
              className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all hover:shadow-lg flex flex-col"
            >
              {/* Header Section */}
              <div className="flex items-start justify-between mb-4 pb-3 border-b border-slate-800">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Reference</span>
                    {canEditEngagement(eng) && (
                      <button
                        onClick={() => handleEdit(eng)}
                        className="text-slate-400 hover:text-indigo-400 transition-colors ml-auto"
                        title="Edit engagement details"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <h3 className="font-bold text-white text-xl mb-2">
                    {eng.referenceNo || 'No Reference Number'}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Status:</span>
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(eng.status)}`}>
                      {eng.status.charAt(0).toUpperCase() + eng.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Purpose Section */}
              <div className="mb-4">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Purpose</span>
                </div>
                <p className="text-slate-200 text-sm font-medium line-clamp-2">
                  {eng.purpose || 'No purpose specified'}
                </p>
              </div>

              {/* Description Section */}
              {eng.description && (
                <div className="mb-4">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Additional Details</span>
                  </div>
                  <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">
                    {eng.description}
                  </p>
                </div>
              )}

              {/* Scheduling Information */}
              <div className="mb-4 space-y-2">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Scheduled Date & Time</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-300 bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-700/50">
                  <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium">
                    {eng.date ? new Date(eng.date).toLocaleDateString('en-GB', { 
                      day: '2-digit', 
                      month: '2-digit', 
                      year: 'numeric' 
                    }) : 'Date not set'}
                    {eng.time && ` at ${eng.time.slice(0, 5)}`}
                    {!eng.time && eng.date && ' (Time TBD)'}
                  </span>
                </div>
              </div>

              {/* Requesting Unit/Department - Especially visible for Commissioners */}
              {(eng.requestingUnit || user?.role === 'commissioner') && (
                <div className="mb-4">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Requesting Unit</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-300 bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-700/50">
                    <svg className="w-4 h-4 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="font-medium text-indigo-300">
                      {eng.requestingUnit?.name || 'Not specified'}
                    </span>
                  </div>
                </div>
              )}

              {/* Actions Section */}
              <div className="flex items-center gap-2 pt-4 mt-auto border-t border-slate-800">
                {/* Only Admin / Secretariat can schedule draft engagements */}
                {eng.status === 'draft' && (user?.role === 'admin' || user?.role === 'secretariat') && (
                  <button
                    onClick={() => handleStatusChange(eng.id, 'scheduled')}
                    className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2"
                    title="Schedule this engagement"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Schedule
                  </button>
                )}
                {/* Commissioner can accept (complete) or reject (cancel) their scheduled engagements */}
                {eng.status === 'scheduled' && user?.role === 'commissioner' && eng.commissionerId === user.id && (
                  <>
                    <button
                      onClick={() => handleStatusChange(eng.id, 'completed')}
                      className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2"
                      title="Mark this engagement as completed"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Complete
                    </button>
                    <button
                      onClick={() => handleStatusChange(eng.id, 'cancelled')}
                      className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2"
                      title="Cancel this engagement"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancel
                    </button>
                  </>
                )}
                {/* Admin / Secretariat can adjust status, but must use a special action to cancel */}
                {(user?.role === 'admin' || user?.role === 'secretariat') &&
                  eng.status !== 'completed' &&
                  eng.status !== 'cancelled' && (
                    <>
                      <select
                        value={eng.status}
                        onChange={(e) => handleStatusChange(eng.id, e.target.value)}
                        className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        title="Change engagement status"
                      >
                        <option value="draft">Draft</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="completed">Completed</option>
                      </select>
                      <button
                        onClick={() => handleAdminCancel(eng)}
                        className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-semibold text-white transition-colors"
                        title="Cancel this engagement for exceptional administrative reasons"
                      >
                        Admin cancel
                      </button>
                    </>
                  )}
                {eng.status === 'completed' && (
                  <div className="flex-1 px-4 py-2.5 bg-emerald-500/20 border border-emerald-500/50 rounded-lg text-sm font-medium text-emerald-300 text-center">
                    Engagement Completed
                  </div>
                )}
                {eng.status === 'cancelled' && (
                  <div className="flex-1 px-4 py-2.5 bg-red-500/20 border border-red-500/50 rounded-lg text-sm font-medium text-red-300 text-center">
                    Engagement Cancelled
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredEngagements.length === 0 && (
        <div className="text-center py-12 bg-slate-900/60 border border-slate-800 rounded-xl">
          <p className="text-slate-400">
            {searchQuery || statusFilter !== 'all' 
              ? 'No engagements match your filters.' 
              : 'No engagements found.'}
          </p>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedEngagement && (
        <EditEngagementModal
          engagement={selectedEngagement}
          onClose={() => {
            setShowEditModal(false);
            setSelectedEngagement(null);
          }}
          onSave={handleSaveEdit}
          user={user}
        />
      )}
    </div>
  );
};

// Edit Modal Component
const EditEngagementModal = ({ 
  engagement, 
  onClose, 
  onSave,
  user 
}: { 
  engagement: Engagement; 
  onClose: () => void;
  onSave: (data: Partial<Engagement>) => void;
  user: any;
}) => {
  const [formData, setFormData] = useState({
    referenceNo: engagement.referenceNo || '',
    purpose: engagement.purpose || '',
    description: engagement.description || '',
    date: engagement.date || '',
    time: engagement.time || '',
  });
  const [commissioners, setCommissioners] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadCommissioners = async () => {
      try {
        const { data } = await api.get('/users/commissioners');
        setCommissioners(data);
      } catch (err) {
        console.error('Failed to load commissioners:', err);
      }
    };
    loadCommissioners();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
    } finally {
      setLoading(false);
    }
  };

  const canEditCommissioner = user?.role === 'admin' || user?.role === 'secretariat';
  const canEditAllFields = user?.role === 'admin' || user?.role === 'secretariat' || 
    (user?.role === 'departmentUser' && engagement.status === 'draft');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Edit Engagement</h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {canEditAllFields && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Reference Number
                  </label>
                  <input
                    type="text"
                    value={formData.referenceNo}
                    onChange={(e) => setFormData({ ...formData, referenceNo: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Purpose
                  </label>
                  <input
                    type="text"
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            {canEditAllFields && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

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

export default Engagements;
