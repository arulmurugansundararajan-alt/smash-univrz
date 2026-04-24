'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, Phone, Pencil, Trash2, IndianRupee } from 'lucide-react';
import { format } from 'date-fns';

interface Student {
  _id: string;
  name: string;
  phone: string;
  parentPhone?: string;
  batchName: string;
  coachName?: string;
  level: string;
  feeAmount: number;
  feeStatus: string;
  feeDueDate: string;
  paidAmount?: number;
  isActive: boolean;
}

const STATUS_BADGE: Record<string, string> = {
  paid:    'bg-green-500/10 text-green-400 border-green-500/20',
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  overdue: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const LEVEL_BADGE: Record<string, string> = {
  beginner:     'bg-blue-500/10 text-blue-400',
  intermediate: 'bg-purple-500/10 text-purple-400',
  advanced:     'bg-orange-500/10 text-orange-400',
};

const EMPTY_FORM = {
  name: '', phone: '', parentPhone: '', batchName: '', coachName: '',
  level: 'beginner', feeAmount: '2500',
};

export default function StudentsPage() {
  const [students, setStudents]       = useState<Student[]>([]);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [search, setSearch]           = useState('');
  const [feeFilter, setFeeFilter]     = useState('all');
  const [loading, setLoading]         = useState(true);
  const [showAdd, setShowAdd]         = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [payStudent, setPayStudent]   = useState<Student | null>(null);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [payAmount, setPayAmount]     = useState('');
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (search)              params.set('search', search);
    if (feeFilter !== 'all') params.set('feeStatus', feeFilter);
    const res = await fetch(`/api/students?${params}`);
    const data = await res.json();
    setStudents(data.students ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [page, search, feeFilter]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  async function handleAdd() {
    setSaving(true); setError('');
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, feeAmount: Number(form.feeAmount) }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setSaving(false); return; }
    setShowAdd(false); setForm(EMPTY_FORM); fetchStudents(); setSaving(false);
  }

  async function handleEdit() {
    if (!editStudent) return;
    setSaving(true); setError('');
    const res = await fetch(`/api/students/${editStudent._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, feeAmount: Number(form.feeAmount) }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setSaving(false); return; }
    setEditStudent(null); fetchStudents(); setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Deactivate this student?')) return;
    await fetch(`/api/students/${id}`, { method: 'DELETE' });
    fetchStudents();
  }

  async function handlePay() {
    if (!payStudent) return;
    setSaving(true); setError('');
    const res = await fetch(`/api/students/${payStudent._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feeStatus: 'paid', paidAmount: Number(payAmount) }),
    });
    if (!res.ok) { const d = await res.json(); setError(d.error); setSaving(false); return; }
    setPayStudent(null); setPayAmount(''); fetchStudents(); setSaving(false);
  }

  function openEdit(s: Student) {
    setForm({
      name: s.name, phone: s.phone, parentPhone: s.parentPhone ?? '',
      batchName: s.batchName, coachName: s.coachName ?? '',
      level: s.level, feeAmount: String(s.feeAmount),
    });
    setEditStudent(s); setError('');
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Students</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total} enrolled students</p>
        </div>
        <button
          onClick={() => { setForm(EMPTY_FORM); setError(''); setShowAdd(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-gray-900 font-semibold rounded-lg text-sm hover:bg-yellow-300 transition-colors"
        >
          <Plus className="w-4 h-4" /> Enroll Student
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search students..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400" />
          {['all', 'paid', 'pending', 'overdue'].map((f) => (
            <button key={f} onClick={() => { setFeeFilter(f); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors
                ${feeFilter === f ? 'bg-yellow-400 text-gray-900' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
            >{f}</button>
          ))}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-medium">Student</th>
                <th className="text-left px-4 py-3 font-medium">Batch / Coach</th>
                <th className="text-left px-4 py-3 font-medium">Level</th>
                <th className="text-left px-4 py-3 font-medium">Fee</th>
                <th className="text-left px-4 py-3 font-medium">Due Date</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 7 }).map((__, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-800 rounded animate-pulse w-20" /></td>
                  ))}</tr>
                ))
              ) : students.map((s) => (
                <tr key={s._id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{s.name}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <Phone className="w-3 h-3" />{s.phone}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-300 text-xs">{s.batchName}</p>
                    {s.coachName && <p className="text-gray-500 text-xs">{s.coachName}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${LEVEL_BADGE[s.level] ?? 'text-gray-400'}`}>{s.level}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-300 font-medium">&#8377;{s.feeAmount.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-gray-300 text-xs">
                    {s.feeDueDate ? format(new Date(s.feeDueDate), 'dd MMM yyyy') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_BADGE[s.feeStatus] ?? ''}`}>{s.feeStatus}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <a href={`https://wa.me/91${s.phone}`} target="_blank" rel="noopener noreferrer"
                        className="text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded hover:bg-green-500/20">WA</a>
                      <button onClick={() => { setPayStudent(s); setPayAmount(String(s.feeAmount)); setError(''); }}
                        className="p-1.5 text-yellow-400 hover:bg-yellow-400/10 rounded" title="Mark Paid">
                        <IndianRupee className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => openEdit(s)}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded" title="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(s._id)}
                        className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded" title="Deactivate">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && students.length === 0 && (
            <p className="text-center text-gray-500 py-10 text-sm">No students found.</p>
          )}
        </div>
      </div>

      {total > 20 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 bg-gray-800 text-gray-300 rounded disabled:opacity-40">Prev</button>
          <span className="text-gray-400">Page {page} of {Math.ceil(total / 20)}</span>
          <button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)} className="px-3 py-1 bg-gray-800 text-gray-300 rounded disabled:opacity-40">Next</button>
        </div>
      )}

      {/* Add / Edit Modal */}
      {(showAdd || editStudent) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-white">{editStudent ? 'Edit Student' : 'Enroll Student'}</h2>
            {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">{error}</p>}
            <div className="grid grid-cols-2 gap-3">
              {([
                { label: 'Full Name',      key: 'name',        placeholder: 'e.g. Aakash R.', col: 2 },
                { label: 'Phone',          key: 'phone',       placeholder: '10-digit',        col: 1 },
                { label: "Parent's Phone", key: 'parentPhone', placeholder: 'optional',        col: 1 },
                { label: 'Batch Name',     key: 'batchName',   placeholder: 'e.g. Batch A',    col: 1 },
                { label: 'Coach Name',     key: 'coachName',   placeholder: 'optional',        col: 1 },
                { label: 'Fee Amount',     key: 'feeAmount',   placeholder: '2500',            col: 1 },
              ] as { label: string; key: keyof typeof EMPTY_FORM; placeholder: string; col: number }[]).map(({ label, key, placeholder, col }) => (
                <div key={key} className={col === 2 ? 'col-span-2' : ''}>
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
                <label className="block text-xs text-gray-400 mb-1">Level</label>
                <select value={form.level} onChange={(e) => setForm(f => ({ ...f, level: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-yellow-400">
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setShowAdd(false); setEditStudent(null); setError(''); }}
                className="flex-1 px-4 py-2 border border-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-800">Cancel</button>
              <button disabled={saving} onClick={editStudent ? handleEdit : handleAdd}
                className="flex-1 px-4 py-2 bg-yellow-400 text-gray-900 font-semibold rounded-lg text-sm hover:bg-yellow-300 disabled:opacity-60">
                {saving ? 'Saving…' : editStudent ? 'Save Changes' : 'Enroll'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark Paid Modal */}
      {payStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Mark Fee — {payStudent.name}</h2>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Amount Paid (&#8377;)</label>
              <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-yellow-400" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setPayStudent(null); setError(''); }} className="flex-1 px-4 py-2 border border-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-800">Cancel</button>
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

