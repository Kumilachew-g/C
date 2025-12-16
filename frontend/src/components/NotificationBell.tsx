import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { Notification } from '../types';

const NotificationBell = () => {
  const [unread, setUnread] = useState(0);

  const load = async () => {
    try {
      const { data } = await api.get<Notification[]>('/notifications');
      setUnread(data.filter((n) => !n.isRead).length);
    } catch {
      // swallow errors for bell; keep UI quiet
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <Link to="/notifications" className="relative inline-flex items-center text-slate-300">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 hover:bg-slate-800">
        🔔
      </span>
      {unread > 0 && (
        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-rose-500 text-[10px] font-semibold text-white px-1.5 py-0.5">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </Link>
  );
};

export default NotificationBell;


