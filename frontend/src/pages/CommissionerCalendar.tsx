import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../hooks/useAuth';
import CalendarSlot from '../components/CalendarSlot';

type Slot = { id: string; start: string; end: string };

type DayGroup = {
  date: string;
  slots: Slot[];
};

const groupByDay = (slots: Slot[]): DayGroup[] => {
  const map: Record<string, Slot[]> = {};
  slots.forEach((slot) => {
    const d = new Date(slot.start).toISOString().slice(0, 10);
    if (!map[d]) map[d] = [];
    map[d].push(slot);
  });
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, s]) => ({ date, slots: s.sort((x, y) => x.start.localeCompare(y.start)) }));
};

const CommissionerCalendar = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<DayGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<Slot[]>('/availability', {
        params: { commissionerId: user.id },
      });
      setGroups(groupByDay(data));
    } catch (err) {
      setError('Unable to load calendar view.');
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
        <div>
          <h2 className="text-xl font-semibold">Commissioner Calendar</h2>
          <p className="text-sm text-slate-400">Availability overview for {user?.fullName}.</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="px-3 py-1.5 rounded-md border border-slate-700 text-sm"
        >
          Refresh
        </button>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {loading && <p className="text-sm text-slate-400">Loading...</p>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {groups.map((g) => (
          <div key={g.date} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="font-semibold mb-2">{new Date(g.date).toLocaleDateString()}</p>
            <div className="space-y-1">
              {g.slots.map((slot) => (
                <CalendarSlot key={slot.id} start={slot.start} end={slot.end} />
              ))}
            </div>
          </div>
        ))}
        {!loading && !groups.length && (
          <p className="text-sm text-slate-400">No availability slots configured.</p>
        )}
      </div>
    </div>
  );
};

export default CommissionerCalendar;


