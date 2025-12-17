import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../hooks/useAuth';
import { ROUTE_ROLES } from '../utils/permissions';
import type { Engagement } from '../types';

const Engagements = () => {
  const { user } = useAuth();
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const canCreateEngagement = user?.role && ROUTE_ROLES.engagementRequest.includes(user.role);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<Engagement[]>('/engagements');
      setEngagements(data);
    } catch (err) {
      setError('Unable to load engagements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Engagements</h2>
        <div className="flex items-center gap-2">
          {canCreateEngagement && (
            <Link
              to="/engagements/new"
              className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-sm font-semibold"
            >
              Create Engagement
            </Link>
          )}
          <button className="px-3 py-2 rounded-md border border-slate-700 text-sm" onClick={load} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {loading && <p className="text-sm text-slate-400">Loading...</p>}
      <div className="grid gap-3">
        {engagements.map((eng) => (
          <div key={eng.id} className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{eng.title || eng.referenceNo}</p>
              <span className="text-xs px-2 py-1 rounded-full border border-indigo-500 text-indigo-200">{eng.status}</span>
            </div>
            <p className="text-sm text-slate-400">{eng.description || eng.purpose}</p>
            <p className="text-xs text-slate-500 mt-1">
              Scheduled: {eng.scheduledAt ? new Date(eng.scheduledAt).toLocaleString() : `${eng.date} ${eng.time || ''}`}
            </p>
          </div>
        ))}
        {!loading && !engagements.length && <p className="text-sm text-slate-400">No engagements found.</p>}
      </div>
    </div>
  );
};

export default Engagements;

