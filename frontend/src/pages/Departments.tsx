import { useEffect, useState } from 'react';
import api from '../api';

export type Department = { id: string; name: string };

const Departments = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    const { data } = await api.get<Department[]>('/departments');
    setDepartments(data);
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async () => {
    setError(null);
    if (!newName.trim()) {
      setError('Department name required.');
      return;
    }
    try {
      setCreating(true);
      await api.post('/departments', { name: newName.trim() });
      setNewName('');
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not add department.');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (dep: Department) => {
    setEditingId(dep.id);
    setEditName(dep.name);
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) {
      setError('Department name required.');
      return;
    }
    try {
      await api.put(`/departments/${id}`, { name: editName.trim() });
      setEditingId(null);
      setEditName('');
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not update department.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this department? This cannot be undone.')) {
      return;
    }
    try {
      setDeletingId(id);
      await api.delete(`/departments/${id}`);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not delete department.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Departments / Units</h2>
        <p className="text-sm text-slate-400 mt-1">
          Manage organizational departments and units. Only administrators can add, edit, or delete departments.
        </p>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex-1 w-full flex gap-3 items-center">
          <input
            className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New department name"
          />
        </div>
        <button
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={creating}
          onClick={handleAdd}
        >
          {creating ? 'Adding...' : 'Add Department'}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">Departments / Units</h3>
          <span className="text-xs text-slate-400">{departments.length} total</span>
        </div>
        <ul className="divide-y divide-slate-800">
          {departments.map((dep) => (
            <li key={dep.id} className="px-4 py-2.5 flex items-center gap-3">
              {editingId === dep.id ? (
                <>
                  <input
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    autoFocus
                  />
                  <button
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white"
                    onClick={() => handleSaveEdit(dep.id)}
                  >
                    Save
                  </button>
                  <button
                    className="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs font-medium text-slate-200"
                    onClick={cancelEdit}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-slate-100 text-sm">{dep.name}</span>
                  <button
                    className="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs font-medium text-slate-200"
                    onClick={() => startEdit(dep)}
                  >
                    Edit
                  </button>
                  <button
                    className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handleDelete(dep.id)}
                    disabled={deletingId === dep.id}
                  >
                    {deletingId === dep.id ? 'Deleting...' : 'Delete'}
                  </button>
                </>
              )}
            </li>
          ))}
          {!departments.length && (
            <li className="px-4 py-4 text-xs text-slate-400 text-center">No departments found.</li>
          )}
        </ul>
      </div>
    </div>
  );
};
export default Departments;

