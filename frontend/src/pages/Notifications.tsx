import { useEffect, useState } from 'react';
import api from '../api';
import type { Notification } from '../types';

const Notifications = () => {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<Notification[]>('/notifications');
      setItems(data);
    } catch (err) {
      setError('Unable to load notifications.');
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
        <h2 className="text-xl font-semibold">Notifications</h2>
        <button
          onClick={load}
          disabled={loading}
          className="px-3 py-1.5 rounded-md border border-slate-700 text-sm"
        >
          Refresh
        </button>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="space-y-2">
        {loading && <p className="text-sm text-slate-400">Loading...</p>}
        {items.map((n) => (
          <div
            key={n.id}
            className={`rounded-lg border px-4 py-3 text-sm ${
              n.isRead
                ? 'border-slate-800 bg-slate-900/40 text-slate-300'
                : 'border-indigo-600 bg-indigo-950/40 text-slate-100'
            }`}
          >
            <p>{n.message}</p>
            <p className="text-xs text-slate-400 mt-1">
              {new Date(n.createdAt).toLocaleString()} {n.isRead ? '(read)' : '(new)'}
            </p>
          </div>
        ))}
        {!loading && !items.length && <p className="text-sm text-slate-400">No notifications.</p>}
      </div>
    </div>
  );
};

export default Notifications;


