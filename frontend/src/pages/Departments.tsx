import { useEffect, useState } from 'react';
import api from '../api';

export type Department = { id: string; name: string };

const Departments = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    const { data } = await api.get<Department[]>('/departments');
    setDepartments(data);
  };

  useEffect(() => { load(); }, []);

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

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <input
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1 text-sm"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="New department name"
        />
        <button
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-md px-4 py-1.5"
          disabled={creating}
          onClick={handleAdd}
        >
          Add
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div>
        <h3 className="text-sm font-semibold text-slate-200 mb-2">Departments/Units</h3>
        <ul className="space-y-1">
          {departments.map(dep => (
            <li key={dep.id} className="px-2 py-1 border-b border-slate-800 text-slate-100 text-sm">{dep.name}</li>
          ))}
          {!departments.length && <li className="text-xs text-slate-400">No departments.</li>}
        </ul>
      </div>
    </div>
  );
};
export default Departments;

