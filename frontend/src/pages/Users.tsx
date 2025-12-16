import { useEffect, useState } from 'react';
import api from '../api';
import type { User, Role } from '../types';

type UserWithMeta = User & {
  status: 'active' | 'disabled';
  lastLoginAt?: string;
  createdAt: string;
};

const Users = () => {
  const [users, setUsers] = useState<UserWithMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [form, setForm] = useState<{ fullName: string; email: string; password: string; roleName: Role }>({
    fullName: '',
    email: '',
    password: '',
    roleName: 'departmentUser',
  });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<UserWithMeta[]>('/users');
      setUsers(data);
    } catch (err) {
      setError('Unable to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleStatus = async (u: UserWithMeta) => {
    const nextStatus = u.status === 'active' ? 'disabled' : 'active';
    await api.patch(`/users/${u.id}/status`, { status: nextStatus });
    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, status: nextStatus } : x)));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">User management</h2>
        <button
          onClick={load}
          disabled={loading}
          className="px-3 py-1.5 rounded-md border border-slate-700 text-sm"
        >
          Refresh
        </button>
      </div>

      {/* Create user form */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-100">Create new user</h3>
        {createError && <p className="text-xs text-red-400">{createError}</p>}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="space-y-1">
            <label className="block text-slate-300">Full name</label>
            <input
              className="w-full rounded-md border border-slate-700 bg-slate-950/60 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              placeholder="Jane Doe"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-slate-300">Email</label>
            <input
              type="email"
              className="w-full rounded-md border border-slate-700 bg-slate-950/60 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="user@example.com"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-slate-300">Password</label>
            <input
              type="password"
              className="w-full rounded-md border border-slate-700 bg-slate-950/60 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="Min 8 characters"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-slate-300">Role</label>
            <select
              className="w-full rounded-md border border-slate-700 bg-slate-950/60 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={form.roleName}
              onChange={(e) => setForm((f) => ({ ...f, roleName: e.target.value as Role }))}
            >
              <option value="admin">System Administrator</option>
              <option value="commissioner">Commissioner</option>
              <option value="secretariat">Secretariat / Assistant</option>
              <option value="departmentUser">Department User</option>
              <option value="auditor">Auditor (read-only)</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            className="px-3 py-1.5 rounded-md bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
            disabled={creating}
            onClick={async () => {
              setCreateError(null);
              if (!form.fullName || !form.email || !form.password) {
                setCreateError('Full name, email, and password are required.');
                return;
              }
              try {
                setCreating(true);
                await api.post('/auth/register', {
                  fullName: form.fullName,
                  email: form.email,
                  password: form.password,
                  roleName: form.roleName,
                });
                setForm({ fullName: '', email: '', password: '', roleName: 'departmentUser' });
                await load();
              } catch (err: any) {
                if (err?.response?.data?.message) {
                  setCreateError(err.response.data.message);
                } else {
                  setCreateError('Failed to create user.');
                }
              } finally {
                setCreating(false);
              }
            }}
          >
            {creating ? 'Creating…' : 'Create user'}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
        <table className="min-w-full text-xs">
          <thead className="bg-slate-900 text-slate-300">
            <tr>
              <th className="text-left py-2 px-3">Name</th>
              <th className="text-left py-2 px-3">Email</th>
              <th className="text-left py-2 px-3">Role</th>
              <th className="text-left py-2 px-3">Status</th>
              <th className="text-left py-2 px-3">Last login</th>
              <th className="text-right py-2 px-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-800">
                <td className="py-2 px-3">{u.fullName}</td>
                <td className="py-2 px-3 text-slate-400">{u.email}</td>
                <td className="py-2 px-3">{u.role}</td>
                <td className="py-2 px-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      u.status === 'active'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-slate-600/30 text-slate-200'
                    }`}
                  >
                    {u.status}
                  </span>
                </td>
                <td className="py-2 px-3 text-slate-400">
                  {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : '—'}
                </td>
                <td className="py-2 px-3 text-right">
                  <button
                    onClick={() => toggleStatus(u)}
                    className="px-3 py-1 rounded-md border border-slate-700 text-xs hover:bg-slate-800"
                  >
                    {u.status === 'active' ? 'Disable' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
            {!users.length && (
              <tr>
                <td colSpan={6} className="py-3 px-3 text-slate-400">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;


