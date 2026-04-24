'use client';

import { useState, useEffect } from 'react';
import { Pencil, CheckCircle, XCircle } from 'lucide-react';

interface Plan {
  _id: string;
  name: string;
  slug: string;
  durationMonths: number;
  price: number;
  isActive: boolean;
}

export default function PlansPage() {
  const [plans, setPlans]         = useState<Plan[]>([]);
  const [loading, setLoading]     = useState(true);
  const [editPlan, setEditPlan]   = useState<Plan | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editName, setEditName]   = useState('');
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  async function fetchPlans() {
    setLoading(true);
    const res = await fetch('/api/plans');
    const data = await res.json();
    setPlans(data.plans ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchPlans(); }, []);

  function openEdit(p: Plan) {
    setEditPlan(p);
    setEditPrice(String(p.price));
    setEditName(p.name);
    setError('');
  }

  async function handleSave() {
    if (!editPlan) return;
    setSaving(true); setError('');
    const res = await fetch(`/api/plans/${editPlan._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName, price: Number(editPrice) }),
    });
    if (!res.ok) { const d = await res.json(); setError(d.error); setSaving(false); return; }
    setEditPlan(null);
    fetchPlans();
    setSaving(false);
  }

  async function toggleActive(p: Plan) {
    await fetch(`/api/plans/${p._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !p.isActive }),
    });
    fetchPlans();
  }

  const SLUG_LABELS: Record<string, string> = {
    monthly:     'Monthly',
    half_yearly: 'Half-Yearly',
    yearly:      'Yearly',
  };

  const SLUG_COLORS: Record<string, string> = {
    monthly:     'from-blue-600/20 to-blue-900/10 border-blue-500/20',
    half_yearly: 'from-purple-600/20 to-purple-900/10 border-purple-500/20',
    yearly:      'from-yellow-600/20 to-yellow-900/10 border-yellow-500/20',
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Membership Plans</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage pricing for your membership plans</p>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-6 animate-pulse h-40" />
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-3 gap-4">
          {plans.map(p => (
            <div key={p._id}
              className={`bg-gradient-to-br ${SLUG_COLORS[p.slug] ?? 'from-gray-800/30 to-gray-900/10 border-gray-700'} border rounded-xl p-6 space-y-3`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-white text-lg">{SLUG_LABELS[p.slug] ?? p.name}</p>
                  <p className="text-xs text-gray-400">{p.durationMonths} month{p.durationMonths > 1 ? 's' : ''}</p>
                </div>
                {p.isActive
                  ? <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full">Active</span>
                  : <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full">Inactive</span>
                }
              </div>

              <p className="text-3xl font-bold text-white">&#8377;{p.price.toLocaleString('en-IN')}</p>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => openEdit(p)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-medium transition-colors"
                >
                  <Pencil className="w-3 h-3" /> Edit Price
                </button>
                <button
                  onClick={() => toggleActive(p)}
                  className={`p-1.5 rounded-lg transition-colors ${p.isActive ? 'text-red-400 hover:bg-red-500/10' : 'text-green-400 hover:bg-green-500/10'}`}
                  title={p.isActive ? 'Deactivate' : 'Activate'}
                >
                  {p.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Edit Plan — {SLUG_LABELS[editPlan.slug] ?? editPlan.name}</h2>
            {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">{error}</p>}
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Plan Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-yellow-400"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Price (&#8377;)</label>
                <input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-yellow-400"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditPlan(null)} className="flex-1 px-4 py-2 border border-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-800">Cancel</button>
              <button disabled={saving} onClick={handleSave}
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
