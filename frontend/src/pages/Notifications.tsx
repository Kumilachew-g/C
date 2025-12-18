import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import type { Notification } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { SkeletonText } from '../components/SkeletonLoader';

const Notifications = () => {
  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingRead, setMarkingRead] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<{ notifications: Notification[]; unreadCount: number }>('/notifications');
      setItems(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    setMarkingRead(id);
    try {
      await api.patch(`/notifications/${id}/read`);
      setItems(items.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    } finally {
      setMarkingRead(null);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setItems(items.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  useEffect(() => {
    load();
    // Refresh every 30 seconds
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case 'engagement_created':
      case 'engagement_assigned':
        return '📋';
      case 'engagement_status_changed':
        return '🔄';
      case 'engagement_updated':
        return '✏️';
      case 'engagement_cancelled':
        return '❌';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type?: string, isRead?: boolean) => {
    if (isRead) {
      return 'border-slate-800 bg-slate-900/40 text-slate-300';
    }
    
    switch (type) {
      case 'engagement_created':
      case 'engagement_assigned':
        return 'border-blue-600 bg-blue-950/40 text-blue-100';
      case 'engagement_status_changed':
        return 'border-purple-600 bg-purple-950/40 text-purple-100';
      case 'engagement_updated':
        return 'border-amber-600 bg-amber-950/40 text-amber-100';
      case 'engagement_cancelled':
        return 'border-red-600 bg-red-950/40 text-red-100';
      default:
        return 'border-indigo-600 bg-indigo-950/40 text-indigo-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Notifications</h2>
          <p className="text-sm text-slate-400 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-sm font-medium transition-colors"
            >
              Mark all as read
            </button>
          )}
          <button
            onClick={load}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && items.length === 0 && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <SkeletonText lines={2} />
            </div>
          ))}
        </div>
      )}

      {/* Notifications List */}
      {!loading && items.length > 0 && (
        <div className="space-y-3">
          {items.map((n) => (
            <div
              key={n.id}
              className={`rounded-xl border px-5 py-4 transition-all hover:shadow-lg ${
                getNotificationColor(n.type, n.isRead)
              } ${!n.isRead ? 'ring-2 ring-opacity-20' : ''}`}
            >
              <div className="flex items-start gap-4">
                <div className="text-2xl flex-shrink-0 mt-0.5">
                  {getNotificationIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium leading-relaxed">{n.message}</p>
                    {!n.isRead && (
                      <button
                        onClick={() => markAsRead(n.id)}
                        disabled={markingRead === n.id}
                        className="flex-shrink-0 px-2 py-1 text-xs rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors disabled:opacity-50"
                        title="Mark as read"
                      >
                        {markingRead === n.id ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                  {n.metadata?.engagementId && (
                    <Link
                      to="/engagements"
                      className="inline-block mt-2 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      View engagement →
                    </Link>
                  )}
                  <p className="text-xs text-slate-400 mt-2">
                    {new Date(n.createdAt).toLocaleString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && items.length === 0 && (
        <div className="text-center py-12 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="text-4xl mb-4">🔔</div>
          <p className="text-slate-400 text-lg font-medium">No notifications</p>
          <p className="text-slate-500 text-sm mt-2">You're all caught up!</p>
        </div>
      )}
    </div>
  );
};

export default Notifications;


