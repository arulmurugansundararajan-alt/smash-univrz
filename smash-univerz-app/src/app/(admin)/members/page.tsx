'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, Phone, Mail, Pencil, Trash2, IndianRupee } from 'lucide-react';
import { format } from 'date-fns';

interface Member {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  plan: string;
  paymentStatus: string;
  startDate: string;
  expiryDate: string;
  paidAmount?: number;
  isActive: boolean;
}

interface Plan { _id: string; name: string; slug: string; price: number; }

const STATUS_BADGE: Record<string, string> = {
  paid:    'bg-green-500/10 text-green-400 border-green-500/20',
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  overdue: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const today = () => new Date().toISOString().split('T')[0];
const EMPTY_FORM = { name: '', phone: '', email: '', plan: 'monthly', joinDate: today() };

export default function MembersPage() {
  const [members, setMembers]         = useState<Member[]>([]);
  const [plans, setPlans]             = useState<Plan[]>([]);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [search, setSearch]           = useState('');
  const [filter, setFilter]           = useState('all');
  const [loading, setLoading]         = useState(true);
  const [showAdd, setShowAdd]         = useState(false);
  const [editMember, setEditMember]   = useState<Member | null>(null);
  const [payMember, setPayMember]     = useState<Member | null>(null);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [payAmount, setPayAmount]     = useState('');
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) params.set('search', search);
    if (filter !== 'all') params.set('status', filter);
    const res = await fetch(`/api/members?${params}`);
    const data = await res.json();
    setMembers(data.members ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [page, search, filter]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  useEffect(() => {
    fetch('/api/plans').then(r => r.json()).then(d => setPlans(d.plans ?? []));
  }, []);

  async function handleAdd() {
    setSaving(true); setError('');
    const res = await fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, startDate: form.joinDate }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setSaving(false); return; }
    setShowAdd(false); setForm(EMPTY_FORM);
    fetchMembers();
    setSaving(false);
  }

  async function handleEdit() {
    if (!editMember) return;
    setSaving(true); setError('');
    const res = await fetch(`/api/members/${editMember._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, startDate: form.joinDate }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setSaving(false); return; }
    setEditMember(null); fetchMembers(); setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Deactivate this member?')) return;
    await fetch(`/api/members/${id}`, { method: 'DELETE' });
    fetchMembers();
  }

  async function handlePay() {
    if (!payMember) return;
    setSaving(true); setError('');
    const res = await fetch(`/api/members/${payMember._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentStatus: 'paid', paidAmount: Number(payAmount) }),
    });
    if (!res.ok) { const d = await res.json(); setError(d.error); setSaving(false); return; }
    setPayMember(null); setPayAmount(''); fetchMembers(); setSaving(false);
  }

  function openEdit(m: Member) {
    setForm({ name: m.name, phone: m.phone, email: m.email ?? '', plan: m.plan, joinDate: m.startDate ? m.startDate.split('T')[0] : today() });
    setEditMember(m);
    setError('');
  }

  const planPrice = (slug: string) => plans.find(p => p.slug === slug)?.price ?? '';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Members</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total} total members</p>
        </div>
        <button
          onClick={() => { setForm(EMPTY_FORM); setError(''); setShowAdd(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-gray-900 font-semibold rounded-lg text-sm hover:bg-yellow-300 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Member
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search name or phone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400" />
          {['all', 'paid', 'pending', 'overdue'].map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors
                ${filter === f ? 'bg-yellow-400 text-gray-900' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-medium">Member</th>
                <th className="text-left px-4 py-3 font-medium">Plan</th>
                <th className="text-left px-4 py-3 font-medium">Expiry</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-800 rounded animate-pulse w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : members.map((m) => (
                <tr key={m._id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{m.name}</div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Phone className="w-3 h-3" />{m.phone}
                      </span>
                      {m.email && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Mail className="w-3 h-3" />{m.email}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-300 capitalize">{m.plan.replace('_', '-')}</td>
                  <td className="px-4 py-3 text-gray-300 text-xs">
                    {m.expiryDate ? format(new Date(m.expiryDate), 'dd MMM yyyy') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_BADGE[m.paymentStatus] ?? ''}`}>
                      {m.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <a
                        href={`https://wa.me/91${m.phone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded hover:bg-green-500/20 transition-colors"
                      >
                        WA
                      </a>
                      <button
                        onClick={() => { setPayMember(m); setPayAmount(String(planPrice(m.plan))); setError(''); }}
                        className="p-1.5 text-yellow-400 hover:bg-yellow-400/10 rounded transition-colors"
                        title="Mark Paid"
                      >
                        <IndianRupee className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openEdit(m)}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(m._id)}
                        className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                        title="Deactivate"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && members.length === 0 && (
            <p className="text-center text-gray-500 py-10 text-sm">No members found.</p>
          )}
        </div>
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 bg-gray-800 text-gray-300 rounded disabled:opacity-40">Prev</button>
          <span className="text-gray-400">Page {page} of {Math.ceil(total / 20)}</span>
          <button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)} className="px-3 py-1 bg-gray-800 text-gray-300 rounded disabled:opacity-40">Next</button>
        </div>
      )}

      {/* Add / Edit Modal */}
      {(showAdd || editMember) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">{editMember ? 'Edit Member' : 'Add New Member'}</h2>
            {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">{error}</p>}
            <div className="space-y-3">
              {([
                { label: 'Full Name', key: 'name', placeholder: 'e.g. Ravi Kumar' },
                { label: 'Phone',     key: 'phone', placeholder: '10-digit mobile' },
                { label: 'Email',     key: 'email', placeholder: 'optional' },
              ] as const).map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs text-gray-400 mb-1">{label}</label>
                  <input
                    type="text"
                    placeholder={placeholder}
                    value={form[key]}
                    onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Membership Plan</label>
                <select
                  value={form.plan}
                  onChange={(e) => setForm(f => ({ ...f, plan: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-yellow-400"
                >
                  {plans.map(p => (
                    <option key={p.slug} value={p.slug}>{p.name} – ₹{p.price.toLocaleString('en-IN')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Date of Joining</label>
                <input
                  type="date"
                  value={form.joinDate}
                  onChange={(e) => setForm(f => ({ ...f, joinDate: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-yellow-400 [color-scheme:dark]"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setShowAdd(false); setEditMember(null); setError(''); }}
                className="flex-1 px-4 py-2 border border-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={saving}
                onClick={editMember ? handleEdit : handleAdd}
                className="flex-1 px-4 py-2 bg-yellow-400 text-gray-900 font-semibold rounded-lg text-sm hover:bg-yellow-300 transition-colors disabled:opacity-60"
              >
                {saving ? 'Saving…' : editMember ? 'Save Changes' : 'Add Member'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark Paid Modal */}
      {payMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Mark Payment — {payMember.name}</h2>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Amount Paid (₹)</label>
              <input
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-yellow-400"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setPayMember(null); setError(''); }} className="flex-1 px-4 py-2 border border-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-800">Cancel</button>
              <button disabled={saving} onClick={handlePay} className="flex-1 px-4 py-2 bg-yellow-400 text-gray-900 font-semibold rounded-lg text-sm hover:bg-yellow-300 disabled:opacity-60">
                {saving ? 'Saving…' : 'Confirm Paid'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
