'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Trophy, Plus, Tv, Settings, Loader2, X, Check,
  Swords, ShieldCheck, AlertCircle,
} from 'lucide-react';

interface Tournament {
  _id: string;
  name: string;
  type: 'knockout' | 'round_robin';
  category: 'singles' | 'doubles';
  maxPlayers: number;
  venue: string;
  date?: string;
  status: 'setup' | 'ongoing' | 'completed';
  playerCount: number;
  matchCount: number;
}

const STATUS_CHIP: Record<string, string> = {
  setup:     'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  ongoing:   'bg-green-500/10  text-green-400  border-green-500/20',
  completed: 'bg-gray-500/10   text-gray-400   border-gray-500/20',
};

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showCreate, setShowCreate]   = useState(false);
  const [form, setForm] = useState({
    name: '', type: 'knockout', category: 'singles',
    maxPlayers: '16', venue: '', date: '', courtCount: '2',
  });
  const [creating, setCreating]     = useState(false);
  const [createError, setCreateError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tournaments');
      const data = await res.json();
      setTournaments(Array.isArray(data) ? data : []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.name.trim()) { setCreateError('Tournament name is required'); return; }
    setCreating(true); setCreateError('');
    try {
      const res = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(), type: form.type, category: form.category,
          maxPlayers: Number(form.maxPlayers), venue: form.venue.trim(),
          date: form.date || undefined, courtCount: Number(form.courtCount),
        }),
      });
      if (!res.ok) { const d = await res.json(); setCreateError(d.error); return; }
      setShowCreate(false);
      setForm({ name: '', type: 'knockout', category: 'singles', maxPlayers: '16', venue: '', date: '', courtCount: '2' });
      await load();
    } finally { setCreating(false); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-400" /> Tournaments
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage badminton tournaments and brackets</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-gray-900 font-bold rounded-xl text-sm hover:bg-yellow-300"
        >
          <Plus className="w-4 h-4" /> New Tournament
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 text-yellow-400 animate-spin" /></div>
      ) : tournaments.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">No tournaments yet. Create your first one!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tournaments.map((t) => (
            <div key={t._id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-4 hover:border-gray-700 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-bold text-white text-base leading-snug">{t.name}</h2>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border shrink-0 ${STATUS_CHIP[t.status]}`}>{t.status}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-lg">
                  {t.type === 'knockout' ? '⚔️ Knockout' : '🔄 Round Robin'}
                </span>
                <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-lg capitalize">🏸 {t.category}</span>
                {t.venue && <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-lg">📍 {t.venue}</span>}
              </div>
              <div className="flex gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{t.playerCount}/{t.maxPlayers} players</span>
                {t.matchCount > 0 && <span className="flex items-center gap-1"><Swords className="w-3.5 h-3.5" />{t.matchCount} matches</span>}
              </div>
              <div className="flex gap-2 mt-auto">
                <Link href={`/tournaments/${t._id}`} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-yellow-400 text-gray-900 font-semibold rounded-lg text-xs hover:bg-yellow-300">
                  <Settings className="w-3.5 h-3.5" /> Manage
                </Link>
                <a href={`/tv/${t._id}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-xs hover:bg-blue-500/20">
                  <Tv className="w-3.5 h-3.5" /> TV Mode
                </a>
                {t.status === 'completed' && (
                  <Link href={`/tournaments/${t._id}/report`}
                    className="flex items-center gap-1.5 px-3 py-2 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg text-xs hover:bg-green-500/20">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-800">
              <h2 className="font-bold text-white text-lg">Create Tournament</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-3">
            {createError && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-4 py-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {createError}
              </div>
            )}
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Tournament Name *</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g., Champions Cup 2026"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Format *</label>
                  <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-yellow-400">
                    <option value="knockout">Knockout</option>
                    <option value="round_robin">Round Robin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Category *</label>
                  <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-yellow-400">
                    <option value="singles">Singles</option>
                    <option value="doubles">Doubles</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Max Players *</label>
                  <select value={form.maxPlayers} onChange={(e) => setForm((f) => ({ ...f, maxPlayers: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-yellow-400">
                    {[4,8,12,16,24,32,48,64].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Courts Available</label>
                  <select value={form.courtCount} onChange={(e) => setForm((f) => ({ ...f, courtCount: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-yellow-400">
                    {[1,2,3,4].map((n) => <option key={n} value={n}>{n} court{n > 1 ? 's' : ''}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Venue</label>
                <input value={form.venue} onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
                  placeholder="Court name or location"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Tournament Date</label>
                <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-yellow-400" />
              </div>
            </div>
            </div>{/* end scrollable body */}
            {/* Footer buttons — always visible */}
            <div className="flex gap-3 px-6 py-4 border-t border-gray-800">
              <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2.5 border border-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-800">Cancel</button>
              <button onClick={handleCreate} disabled={creating}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow-400 text-gray-900 font-bold rounded-lg text-sm hover:bg-yellow-300 disabled:opacity-60">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {creating ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Users({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
