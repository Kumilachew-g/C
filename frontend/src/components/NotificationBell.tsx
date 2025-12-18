import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const NotificationBell = () => {
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await api.get<{ unreadCount: number }>('/notifications/unread-count');
      setUnread(data.unreadCount || 0);
    } catch {
      // swallow errors for bell; keep UI quiet
      setUnread(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Refresh every 30 seconds
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <Link 
      to="/notifications" 
      className="relative inline-flex items-center justify-center w-10 h-10 rounded-lg border border-slate-700 hover:bg-slate-800 hover:border-slate-600 text-slate-300 transition-all group"
      title={unread > 0 ? `${unread} unread notification${unread !== 1 ? 's' : ''}` : 'Notifications'}
    >
      <svg 
        className={`w-5 h-5 transition-transform group-hover:scale-110 ${unread > 0 ? 'animate-pulse' : ''}`}
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
        />
      </svg>
      {!loading && unread > 0 && (
        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-1.5 py-0.5 min-w-[20px] shadow-lg animate-pulse">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </Link>
  );
};

export default NotificationBell;


