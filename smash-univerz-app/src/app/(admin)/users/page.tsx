'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, UserX, UserCheck, KeyRound } from 'lucide-react';

interface User {
  _id: string;
  name: string;
  username: string;
  role: 'admin' | 'staff';
  isActive: boolean;
  createdAt: string;
}

const EMPTY_FORM = { name: '', username: '', password: '', role: 'staff' };

export default function UsersPage() {
  const [users, setUsers]         = useState<User[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showAdd, setShowAdd]     = useState(false);
  const [editUser, setEditUser]   = useState<User | null>(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/users');
    const data = await res.json();
    setUsers(data.users ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function handleAdd() {
    setSaving(true); setError('');
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setSaving(false); return; }
    setShowAdd(false); setForm(EMPTY_FORM); fetchUsers(); setSaving(false);
  }

  async function handleEdit() {
    if (!editUser) return;
    setSaving(true); setError('');
    const body: Record<string, string> = { name: form.name, role: form.role };
    if (newPassword) body.password = newPassword;
    const res = await fetch(`/api/users/${editUser._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setSaving(false); return; }
    setEditUser(null); setNewPassword(''); fetchUsers(); setSaving(false);
  }

  async function toggleActive(u: User) {
    await fetch(`/api/users/${u._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !u.isActive }),
    });
    fetchUsers();
  }

  function openEdit(u: User) {
    setForm({ name: u.name, username: u.username, password: '', role: u.role });
    setNewPassword('');
    setEditUser(u);
    setError('');
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage admin and staff accounts</p>
        </div>
        <button
          onClick={() => { setForm(EMPTY_FORM); setError(''); setShowAdd(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-gray-900 font-semibold rounded-lg text-sm hover:bg-yellow-300 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-medium">User</th>
                <th className="text-left px-4 py-3 font-medium">Username</th>
                <th className="text-left px-4 py-3 font-medium">Role</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 5 }).map((__, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-800 rounded animate-pulse w-24" /></td>
                  ))}</tr>
                ))
              ) : users.map(u => (
                <tr key={u._id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-yellow-400/20 flex items-center justify-center text-yellow-400 font-bold text-sm">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-white">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">@{u.username}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                      u.role === 'admin'
                        ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                        : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                      u.isActive
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>{u.isActive ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(u)}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded" title="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => toggleActive(u)}
                        className={`p-1.5 rounded transition-colors ${u.isActive ? 'text-red-400 hover:bg-red-500/10' : 'text-green-400 hover:bg-green-500/10'}`}
                        title={u.isActive ? 'Deactivate' : 'Activate'}>
                        {u.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && users.length === 0 && (
            <p className="text-center text-gray-500 py-10 text-sm">No users found.</p>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Add New User</h2>
            {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">{error}</p>}
            <div className="space-y-3">
              {([
                { label: 'Full Name', key: 'name', placeholder: 'e.g. Pradeep Kumar', type: 'text' },
                { label: 'Username',  key: 'username', placeholder: 'lowercase, no spaces', type: 'text' },
                { label: 'Password',  key: 'password', placeholder: 'min 6 characters', type: 'password' },
              ] as const).map(({ label, key, placeholder, type }) => (
                <div key={key}>
                  <label className="block text-xs text-gray-400 mb-1">{label}</label>
                  <input
                    type={type}
                    placeholder={placeholder}
                    value={form[key]}
                    onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Role</label>
                <select value={form.role} onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-yellow-400">
                  <option value="staff">Staff — Tournaments &amp; Students only</option>
                  <option value="admin">Admin — Full Access</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setShowAdd(false); setError(''); }} className="flex-1 px-4 py-2 border border-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-800">Cancel</button>
              <button disabled={saving} onClick={handleAdd}
                className="flex-1 px-4 py-2 bg-yellow-400 text-gray-900 font-semibold rounded-lg text-sm hover:bg-yellow-300 disabled:opacity-60">
                {saving ? 'Creating…' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Edit User — @{editUser.username}</h2>
            {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">{error}</p>}
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Full Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-yellow-400" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Role</label>
                <select value={form.role} onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-yellow-400">
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1 flex items-center gap-1">
                  <KeyRound className="w-3 h-3" /> New Password <span className="text-gray-600">(leave blank to keep)</span>
                </label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave blank to keep current"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setEditUser(null); setError(''); }} className="flex-1 px-4 py-2 border border-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-800">Cancel</button>
              <button disabled={saving} onClick={handleEdit}
                className="flex-1 px-4 py-2 bg-yellow-400 text-gray-900 font-semibold rounded-lg text-sm hover:bg-yellow-300 disabled:opacity-60">
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
