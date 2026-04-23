'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, UserPlus, Play, Tv, Loader2, X, Check,
  Trophy, Trash2, AlertCircle, Swords, Clock,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Tournament {
  _id: string; name: string; type: 'knockout' | 'round_robin';
  category: 'singles' | 'doubles'; maxPlayers: number;
  venue: string; status: 'setup' | 'ongoing' | 'completed'; courtCount: number;
}
interface TPlayer {
  _id: string; name: string; phone: string;
  partnerName: string; partnerPhone: string; entryOrder: number;
}
interface MatchSet { p1: number; p2: number; }
interface TMatch {
  _id: string; round: number; roundName: string; matchNumber: number;
  player1Id: string | null; player2Id: string | null;
  sets: MatchSet[]; winnerId: string | null;
  status: 'pending' | 'live' | 'completed' | 'walkover';
  court: string; isBye: boolean;
}

const STATUS_MAP = {
  pending:   { label: 'Pending',   cls: 'bg-gray-700 text-gray-300' },
  live:      { label: '● LIVE',    cls: 'bg-red-500/20 text-red-400 animate-pulse' },
  completed: { label: 'Completed', cls: 'bg-green-500/10 text-green-400' },
  walkover:  { label: 'Walkover',  cls: 'bg-gray-700/50 text-gray-500' },
};

function pName(p: TPlayer | undefined) {
  if (!p) return 'TBD';
  return p.partnerName ? `${p.name} / ${p.partnerName}` : p.name;
}

// ══ Score Entry Modal (auto-save + tap-friendly steppers) ═══════════════════
function Stepper({ value, onChange, highlight }: { value: number; onChange: (n: number) => void; highlight: boolean }) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange(Math.max(0, value - 1))}
        className="w-12 h-12 rounded-xl bg-gray-800 border border-gray-700 text-xl font-bold text-gray-300 hover:bg-gray-700 active:scale-95 transition-transform select-none touch-manipulation">
        −
      </button>
      <span className={`w-12 h-12 flex items-center justify-center rounded-xl text-xl font-black border select-none
        ${highlight ? 'bg-yellow-400/20 border-yellow-400/50 text-yellow-200' : 'bg-gray-900 border-gray-700 text-white'}`}>
        {value}
      </span>
      <button
        onClick={() => onChange(value + 1)}
        className="w-12 h-12 rounded-xl bg-gray-800 border border-gray-700 text-xl font-bold text-gray-300 hover:bg-gray-700 active:scale-95 transition-transform select-none touch-manipulation">
        +
      </button>
    </div>
  );
}

function ScoreModal({ match, playerMap, tournamentId, onClose, onSaved }: {
  match: TMatch; playerMap: Record<string, TPlayer>;
  tournamentId: string; onClose: () => void; onSaved: () => void;
}) {
  const [sets, setSets] = useState<MatchSet[]>(
    match.sets.length > 0 ? [...match.sets] : [{ p1: 0, p2: 0 }],
  );
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [completing, setCompleting] = useState(false);
  const [err, setErr]              = useState('');
  const dirtyRef                   = useRef(false);
  const debounceRef                = useRef<ReturnType<typeof setTimeout> | null>(null);

  const p1Name = pName(playerMap[match.player1Id ?? '']);
  const p2Name = pName(playerMap[match.player2Id ?? '']);
  const p1Won  = sets.filter((s) => s.p1 > s.p2).length;
  const p2Won  = sets.filter((s) => s.p2 > s.p1).length;
  const winner = p1Won >= 2 ? match.player1Id : p2Won >= 2 ? match.player2Id : null;

  const updateSet = (i: number, k: 'p1' | 'p2', v: number) => {
    dirtyRef.current = true;
    setSets((prev) => prev.map((s, idx) => idx === i ? { ...s, [k]: Math.max(0, v) } : s));
  };

  // Auto-save 1.5 s after last change
  useEffect(() => {
    if (!dirtyRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaveState('idle');
    debounceRef.current = setTimeout(async () => {
      setSaveState('saving');
      setErr('');
      try {
        const res = await fetch(`/api/tournaments/${tournamentId}/matches/${match._id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'update_score', sets }),
        });
        if (!res.ok) {
          setErr((await res.json()).error ?? 'Save failed');
          setSaveState('error');
        } else {
          setSaveState('saved');
          onSaved();
          setTimeout(() => setSaveState('idle'), 2000);
        }
      } catch { setSaveState('error'); setErr('Network error'); }
      dirtyRef.current = false;
    }, 1500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sets]);

  const complete = async () => {
    // Flush any pending auto-save before completing
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setCompleting(true); setErr('');
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/matches/${match._id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete', sets }),
      });
      if (!res.ok) { setErr((await res.json()).error ?? 'Error'); }
      else { onSaved(); onClose(); }
    } finally { setCompleting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-800 shrink-0">
          <h3 className="font-bold text-white flex items-center gap-2 text-sm">
            <Swords className="w-4 h-4 text-yellow-400" /> {match.roundName} · M{match.matchNumber}
          </h3>
          <div className="flex items-center gap-3">
            {/* Save status indicator */}
            {saveState === 'saving' && <span className="text-xs text-blue-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />Saving…</span>}
            {saveState === 'saved'  && <span className="text-xs text-green-400 flex items-center gap-1"><Check className="w-3 h-3" />Saved</span>}
            {saveState === 'error'  && <span className="text-xs text-red-400">Save failed</span>}
            <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {err && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />{err}
            </div>
          )}

          {/* Player name labels */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-xs text-center font-bold">
            <div className="bg-blue-500/10 text-blue-300 rounded-xl px-2 py-1.5 truncate">{p1Name}</div>
            <span className="text-gray-600">VS</span>
            <div className="bg-orange-500/10 text-orange-300 rounded-xl px-2 py-1.5 truncate">{p2Name}</div>
          </div>

          {/* Set rows */}
          <div className="space-y-3">
            {sets.map((s, i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <span className="text-xs text-gray-500 w-9 text-right shrink-0">Set {i + 1}</span>
                <Stepper value={s.p1} onChange={(v) => updateSet(i, 'p1', v)} highlight={s.p1 > s.p2} />
                <span className="text-gray-600 text-xs shrink-0">–</span>
                <Stepper value={s.p2} onChange={(v) => updateSet(i, 'p2', v)} highlight={s.p2 > s.p1} />
              </div>
            ))}
          </div>

          {sets.length < 3 && (
            <button onClick={() => { dirtyRef.current = true; setSets((s) => [...s, { p1: 0, p2: 0 }]); }}
              className="text-xs text-yellow-400 hover:text-yellow-300 touch-manipulation">
              + Add Set 3
            </button>
          )}

          {/* Sets won summary */}
          <div className="flex justify-center gap-8 text-sm pt-1">
            <span className={`font-black ${p1Won > p2Won ? 'text-blue-300 text-2xl' : 'text-gray-600'}`}>{p1Won}</span>
            <span className="text-gray-600 self-center text-xs">sets</span>
            <span className={`font-black ${p2Won > p1Won ? 'text-orange-300 text-2xl' : 'text-gray-600'}`}>{p2Won}</span>
          </div>

          {winner && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm text-center rounded-xl px-4 py-2.5 font-bold">
              🏆 Winner: {pName(playerMap[winner])}
            </div>
          )}
        </div>

        {/* Footer — always visible */}
        <div className="px-5 py-4 border-t border-gray-800 shrink-0">
          <button onClick={complete} disabled={!winner || completing}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-yellow-400 text-gray-900 font-black rounded-xl text-sm hover:bg-yellow-300 disabled:opacity-50 active:scale-[0.98] transition-transform touch-manipulation">
            {completing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {completing ? 'Completing…' : 'Complete Match'}
          </button>
          <p className="text-[0.65rem] text-gray-600 text-center mt-2">Score saves automatically · tap +/− to update</p>
        </div>
      </div>
    </div>
  );
}

// ══ Start Match Modal ════════════════════════════════════════════════════════
function StartModal({ match, courtCount, playerMap, tournamentId, onClose, onDone }: {
  match: TMatch; courtCount: number; playerMap: Record<string, TPlayer>;
  tournamentId: string; onClose: () => void; onDone: () => void;
}) {
  const courts = Array.from({ length: courtCount }, (_, i) => `Court ${i + 1}`);
  const [court, setCourt] = useState(courts[0] ?? 'Court 1');
  const [loading, setLoading] = useState(false);

  const start = async () => {
    setLoading(true);
    await fetch(`/api/tournaments/${tournamentId}/matches/${match._id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start', court }),
    });
    setLoading(false); onDone(); onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white flex items-center gap-2"><Play className="w-4 h-4 text-green-400" /> Start Match</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 text-center space-y-1">
          <p className="text-white font-bold text-sm">{pName(playerMap[match.player1Id ?? ''])}</p>
          <p className="text-gray-500 text-xs">vs</p>
          <p className="text-white font-bold text-sm">{pName(playerMap[match.player2Id ?? ''])}</p>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-2">Assign Court</label>
          <div className="flex gap-2 flex-wrap">
            {courts.map((c) => (
              <button key={c} onClick={() => setCourt(c)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${court === c ? 'bg-yellow-400 text-gray-900 border-yellow-400' : 'bg-gray-800 text-gray-300 border-gray-700 hover:border-gray-500'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-700 text-gray-300 rounded-xl text-sm">Cancel</button>
          <button onClick={start} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 text-white font-bold rounded-xl text-sm hover:bg-green-400 disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {loading ? 'Starting…' : 'Start Match'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ══ Match Card ═══════════════════════════════════════════════════════════════
function MatchCard({ match, playerMap, onStart, onScore }: {
  match: TMatch; playerMap: Record<string, TPlayer>;
  onStart: (m: TMatch) => void; onScore: (m: TMatch) => void;
}) {
  if (match.isBye) return null;
  const st = STATUS_MAP[match.status] ?? STATUS_MAP.pending;
  const p1 = playerMap[match.player1Id ?? ''];
  const p2 = playerMap[match.player2Id ?? ''];

  const Player = ({ p, isWinner }: { p: TPlayer | undefined; isWinner: boolean }) => (
    <div className={`flex items-center justify-between gap-2 ${isWinner ? '' : match.status === 'completed' ? 'opacity-40' : ''}`}>
      <div className="flex items-center gap-1.5 min-w-0">
        {isWinner && <Trophy className="w-3 h-3 text-yellow-400 shrink-0" />}
        <span className={`text-sm truncate ${isWinner ? 'text-yellow-300 font-bold' : p ? 'text-white' : 'text-gray-500 italic'}`}>
          {pName(p)}
        </span>
      </div>
      {match.sets.length > 0 && (
        <div className="flex gap-1 shrink-0">
          {match.sets.map((s, i) => {
            const score = p === playerMap[match.player1Id ?? ''] ? s.p1 : s.p2;
            const other = p === playerMap[match.player1Id ?? ''] ? s.p2 : s.p1;
            return <span key={i} className={`text-xs font-bold w-7 text-center ${score > other ? 'text-white' : 'text-gray-500'}`}>{score}</span>;
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className={`bg-gray-900 rounded-xl border transition-all
      ${match.status === 'live' ? 'border-red-500/50 shadow-[0_0_16px_rgba(239,68,68,0.12)]' :
        match.status === 'completed' ? 'border-green-500/20' : 'border-gray-800'}`}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
        <span className="text-xs text-gray-500 font-medium">
          M{match.matchNumber}
          {match.court && <span className="ml-1.5 text-blue-400">· {match.court}</span>}
        </span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
      </div>
      <div className="px-4 py-3 space-y-2">
        <Player p={p1} isWinner={match.winnerId === match.player1Id} />
        <Player p={p2} isWinner={match.winnerId === match.player2Id} />
      </div>
      {(match.status === 'pending' || match.status === 'live') && (
        <div className="px-4 pb-3">
          {match.status === 'pending' && match.player1Id && match.player2Id && (
            <button onClick={() => onStart(match)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg text-xs font-medium hover:bg-green-500/20">
              <Play className="w-3 h-3" /> Start
            </button>
          )}
          {match.status === 'live' && (
            <button onClick={() => onScore(match)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs font-medium hover:bg-red-500/20">
              <Swords className="w-3 h-3" /> Update Score
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ══ Main Page ════════════════════════════════════════════════════════════════
export default function TournamentDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [players, setPlayers]       = useState<TPlayer[]>([]);
  const [matches, setMatches]       = useState<TMatch[]>([]);
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState<'players' | 'matches'>('players');
  const [scoreMatch, setScoreMatch] = useState<TMatch | null>(null);
  const [startMatch, setStartMatch] = useState<TMatch | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError]     = useState('');
  const [showAdd, setShowAdd]       = useState(false);
  const [pForm, setPForm]           = useState({ name: '', phone: '', partnerName: '', partnerPhone: '' });
  const [pSaving, setPSaving]       = useState(false);
  const [pError, setPError]         = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, plRes, mRes] = await Promise.all([
        fetch(`/api/tournaments/${id}`),
        fetch(`/api/tournaments/${id}/players`),
        fetch(`/api/tournaments/${id}/matches`),
      ]);
      const [t, pl, m] = await Promise.all([tRes.json(), plRes.json(), mRes.json()]);
      setTournament(t); setPlayers(Array.isArray(pl) ? pl : []); setMatches(Array.isArray(m) ? m : []);
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const playerMap = Object.fromEntries(players.map((p) => [p._id, p]));

  const handleAddPlayer = async () => {
    if (!pForm.name.trim()) { setPError('Name is required'); return; }
    setPSaving(true); setPError('');
    try {
      const res = await fetch(`/api/tournaments/${id}/players`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pForm),
      });
      if (!res.ok) { setPError((await res.json()).error); return; }
      setPForm({ name: '', phone: '', partnerName: '', partnerPhone: '' });
      setShowAdd(false); await load();
    } finally { setPSaving(false); }
  };

  const handleDelete = async (pid: string) => {
    await fetch(`/api/tournaments/${id}/players/${pid}`, { method: 'DELETE' });
    await load();
  };

  const handleGenerate = async () => {
    setGenerating(true); setGenError('');
    const res = await fetch(`/api/tournaments/${id}/generate`, { method: 'POST' });
    if (!res.ok) setGenError((await res.json()).error);
    else { setTab('matches'); await load(); }
    setGenerating(false);
  };

  if (loading && !tournament) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 text-yellow-400 animate-spin" /></div>;
  if (!tournament || !tournament.type) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 text-yellow-400 animate-spin" /></div>;

  const isSetup   = tournament.status === 'setup';
  const rounds    = [...new Set(matches.filter((m) => !m.isBye).map((m) => m.round))].sort((a, b) => a - b);
  const byRound   = rounds.reduce((acc, r) => ({ ...acc, [r]: matches.filter((m) => m.round === r && !m.isBye) }), {} as Record<number, TMatch[]>);
  const liveCount = matches.filter((m) => m.status === 'live').length;

  // Find champion (highest round completed match winner)
  const champion = (() => {
    if (tournament.status !== 'completed' || tournament.type !== 'knockout') return null;
    const finalMatch = matches.filter((m) => !m.isBye && m.status === 'completed').sort((a, b) => b.round - a.round)[0];
    return finalMatch ? playerMap[finalMatch.winnerId ?? ''] : null;
  })();

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Header */}
      <div className="flex flex-wrap items-start gap-3">
        <Link href="/tournaments" className="text-gray-400 hover:text-white mt-1"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-white truncate">{tournament.name}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isSetup ? 'bg-yellow-500/20 text-yellow-400' : tournament.status === 'ongoing' ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
              {tournament.status}
            </span>
            <span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full capitalize">{(tournament.type ?? '').replace('_', ' ')}</span>
            <span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full capitalize">🏸 {tournament.category ?? ''}</span>
          </div>
          {tournament.venue && <p className="text-xs text-gray-400 mt-1">📍 {tournament.venue}</p>}
        </div>
        <a href={`/tv/${id}`} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-xs hover:bg-blue-500/20 shrink-0">
          <Tv className="w-3.5 h-3.5" /> TV Mode
        </a>
      </div>

      {/* Champion banner */}
      {champion && (
        <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-2xl p-5 flex items-center gap-4">
          <Trophy className="w-10 h-10 text-yellow-400 shrink-0" />
          <div>
            <p className="text-yellow-400 text-lg font-bold">{pName(champion)}</p>
            <p className="text-gray-400 text-sm">Tournament Champion 🏆</p>
          </div>
        </div>
      )}

      {/* Live alert */}
      {liveCount > 0 && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5 cursor-pointer" onClick={() => setTab('matches')}>
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-semibold text-red-400">{liveCount} match{liveCount > 1 ? 'es' : ''} LIVE — tap to view</span>
          <span className="ml-auto text-xs text-red-400">→</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-800">
        {(['players', 'matches'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors capitalize ${tab === t ? 'border-yellow-400 text-yellow-400' : 'border-transparent text-gray-400 hover:text-white'}`}>
            {t === 'players' ? `Players (${players.length}/${tournament.maxPlayers})` : `Matches (${matches.filter((m) => !m.isBye).length})`}
          </button>
        ))}
      </div>

      {/* ── PLAYERS TAB ── */}
      {tab === 'players' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-400">
              {isSetup ? `Add players then click Generate Fixtures.` : 'Players locked after fixtures are generated.'}
            </p>
            <div className="flex flex-wrap gap-2 items-start">
              {isSetup && (
                <button onClick={() => setShowAdd(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400 text-gray-900 font-bold rounded-lg text-xs hover:bg-yellow-300">
                  <UserPlus className="w-3.5 h-3.5" /> Add {tournament.category === 'doubles' ? 'Team' : 'Player'}
                </button>
              )}
              {players.length >= 2 && isSetup && (
                <div className="flex flex-col items-end gap-1">
                  <button onClick={handleGenerate} disabled={generating}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white font-bold rounded-lg text-xs hover:bg-green-400 disabled:opacity-60">
                    {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    {generating ? 'Generating…' : 'Generate Fixtures'}
                  </button>
                  {genError && <p className="text-xs text-red-400">{genError}</p>}
                </div>
              )}
            </div>
          </div>

          {players.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Trophy className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No players yet. Add {tournament.category === 'doubles' ? 'teams' : 'players'} to get started.</p>
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className={`grid gap-3 px-4 py-2 text-xs text-gray-500 border-b border-gray-800 font-medium uppercase tracking-wider
                ${tournament.category === 'doubles' ? 'grid-cols-[28px_1fr_1fr_32px]' : 'grid-cols-[28px_1fr_1fr_32px]'}`}>
                <span>#</span>
                <span>{tournament.category === 'doubles' ? 'Player 1' : 'Name'}</span>
                <span>{tournament.category === 'doubles' ? 'Player 2 (Partner)' : 'Phone'}</span>
                <span></span>
              </div>
              {players.map((p, i) => (
                <div key={p._id} className={`grid gap-3 px-4 py-3 items-center border-b border-gray-800/50 last:border-0 hover:bg-gray-800/30
                  ${tournament.category === 'doubles' ? 'grid-cols-[28px_1fr_1fr_32px]' : 'grid-cols-[28px_1fr_1fr_32px]'}`}>
                  <span className="text-xs text-gray-600">{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-white">{p.name}</p>
                    {p.phone && <p className="text-xs text-gray-500">{p.phone}</p>}
                  </div>
                  <div>
                    {tournament.category === 'doubles'
                      ? p.partnerName
                        ? <><p className="text-sm font-medium text-gray-300">{p.partnerName}</p>{p.partnerPhone && <p className="text-xs text-gray-500">{p.partnerPhone}</p>}</>
                        : <span className="text-xs text-gray-600">—</span>
                      : p.phone ? <></> : <span className="text-xs text-gray-500">—</span>
                    }
                  </div>
                  {isSetup && (
                    <button onClick={() => handleDelete(p._id)} className="text-gray-600 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {players.length >= 2 && isSetup && (
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 text-sm text-blue-400 flex items-start gap-2">
              <span className="text-base shrink-0">ℹ️</span>
              <span>
                {players.length} {tournament.category === 'doubles' ? 'teams' : 'players'} ready.
                {tournament.type === 'knockout' && ' Seedings will be randomized.'}
                {tournament.type === 'round_robin' && ' All players/teams will play each other.'}
                {' '}Click <strong>Generate Fixtures</strong> to start.
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── MATCHES TAB ── */}
      {tab === 'matches' && (
        <div className="space-y-6">
          {matches.filter((m) => !m.isBye).length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <Swords className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No matches yet.</p>
              <button onClick={() => setTab('players')} className="mt-2 text-xs text-yellow-400 underline">
                Go to Players tab
              </button>
            </div>
          ) : (
            rounds.map((round) => {
              const rMatches = byRound[round] ?? [];
              const rName    = rMatches[0]?.roundName ?? `Round ${round}`;
              const done     = rMatches.filter((m) => m.status === 'completed').length;
              return (
                <div key={round} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-bold text-white">{rName}</h3>
                    <div className="flex-1 h-px bg-gray-800" />
                    <span className="text-xs text-gray-500">{done}/{rMatches.length} done</span>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {rMatches.map((m) => (
                      <MatchCard key={m._id} match={m} playerMap={playerMap} onStart={setStartMatch} onScore={setScoreMatch} />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Modals ── */}
      {showAdd && (
        <AddPlayerModal
          tournament={tournament} form={pForm} setForm={setPForm}
          error={pError} saving={pSaving} onSave={handleAddPlayer}
          onClose={() => { setShowAdd(false); setPError(''); }}
        />
      )}
      {startMatch && (
        <StartModal match={startMatch} courtCount={tournament.courtCount} playerMap={playerMap}
          tournamentId={id} onClose={() => setStartMatch(null)} onDone={load} />
      )}
      {scoreMatch && (
        <ScoreModal match={scoreMatch} playerMap={playerMap} tournamentId={id}
          onClose={() => setScoreMatch(null)} onSaved={load} />
      )}
    </div>
  );
}

// ══ Add Player Modal ════════════════════════════════════════════════════════
function AddPlayerModal({ tournament, form, setForm, error, saving, onSave, onClose }: {
  tournament: Tournament;
  form: { name: string; phone: string; partnerName: string; partnerPhone: string };
  setForm: React.Dispatch<React.SetStateAction<typeof form>>;
  error: string; saving: boolean; onSave: () => void; onClose: () => void;
}) {
  const isDoubles = tournament.category === 'doubles';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white">Add {isDoubles ? 'Team' : 'Player'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        {error && <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg px-3 py-2"><AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}</div>}
        <div className="space-y-3">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{isDoubles ? 'Player 1' : 'Player Details'}</p>
          {[{ k: 'name', l: 'Full Name *', ph: 'Enter name' }, { k: 'phone', l: 'Phone', ph: 'Optional' }].map(({ k, l, ph }) => (
            <div key={k}>
              <label className="block text-xs text-gray-400 mb-1">{l}</label>
              <input value={form[k as keyof typeof form]} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} placeholder={ph}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400" />
            </div>
          ))}
          {isDoubles && (
            <>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider pt-1">Player 2 (Partner)</p>
              {[{ k: 'partnerName', l: 'Full Name', ph: 'Partner name' }, { k: 'partnerPhone', l: 'Phone', ph: 'Optional' }].map(({ k, l, ph }) => (
                <div key={k}>
                  <label className="block text-xs text-gray-400 mb-1">{l}</label>
                  <input value={form[k as keyof typeof form]} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} placeholder={ph}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400" />
                </div>
              ))}
            </>
          )}
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-700 text-gray-300 rounded-xl text-sm hover:bg-gray-800">Cancel</button>
          <button onClick={onSave} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow-400 text-gray-900 font-bold rounded-xl text-sm hover:bg-yellow-300 disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {saving ? 'Adding…' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}
