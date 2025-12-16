import { useEffect, useState } from 'react';
import api from '../api';

type CommissionerSummary = {
  commissionerId: string;
  commissionerName: string;
  commissionerEmail: string;
  engagementCount: number;
};

type MonthlySummary = {
  month: string;
  count: number;
};

type Wrapped<T> = { data: T; exportedAt: string };

const Reports = () => {
  const [byCommissioner, setByCommissioner] = useState<CommissionerSummary[]>([]);
  const [monthly, setMonthly] = useState<MonthlySummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [byCommRes, monthlyRes] = await Promise.all([
        api.get<Wrapped<CommissionerSummary[]>>('/reports/engagements/by-commissioner'),
        api.get<Wrapped<MonthlySummary[]>>('/reports/engagements/monthly'),
      ]);
      setByCommissioner(byCommRes.data.data);
      setMonthly(monthlyRes.data.data);
    } catch (err) {
      setError('Unable to load reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Reports</h2>
          <p className="text-sm text-slate-400">
            High-level overview of engagement volumes and commissioner workload.
          </p>
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

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <h3 className="font-semibold mb-2 text-sm">Engagements by commissioner</h3>
          <div className="max-h-72 overflow-auto">
            <table className="w-full text-xs">
              <thead className="text-slate-400">
                <tr>
                  <th className="text-left py-1 pr-2">Commissioner</th>
                  <th className="text-left py-1 pr-2">Email</th>
                  <th className="text-right py-1">Engagements</th>
                </tr>
              </thead>
              <tbody>
                {byCommissioner.map((row) => (
                  <tr key={row.commissionerId} className="border-t border-slate-800">
                    <td className="py-1 pr-2">{row.commissionerName}</td>
                    <td className="py-1 pr-2 text-slate-400">{row.commissionerEmail}</td>
                    <td className="py-1 text-right font-semibold">{row.engagementCount}</td>
                  </tr>
                ))}
                {!byCommissioner.length && (
                  <tr>
                    <td colSpan={3} className="py-2 text-slate-400">
                      No data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <h3 className="font-semibold mb-2 text-sm">Monthly engagement summary</h3>
          <div className="space-y-2">
            {monthly.map((m) => (
              <div key={m.month} className="flex items-center justify-between text-xs">
                <span className="text-slate-300">{m.month}</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-32 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500"
                      style={{ width: `${Math.min(m.count * 10, 100)}%` }}
                    />
                  </div>
                  <span className="font-semibold">{m.count}</span>
                </div>
              </div>
            ))}
            {!monthly.length && <p className="text-xs text-slate-400">No data.</p>}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Reports;


