'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';

interface MatchSet { p1: number; p2: number; }
interface Match {
  _id: string; round: number; roundName: string; matchNumber: number;
  player1Id: string | null; player2Id: string | null;
  player1Name: string; player1Partner: string;
  player2Name: string; player2Partner: string;
  winnerName: string; winnerPartner: string;
  sets: MatchSet[]; winnerId: string | null;
  status: 'pending' | 'live' | 'completed' | 'walkover';
  court: string; isBye: boolean;
}
interface Tournament {
  _id: string; name: string; type: string;
  category: string; venue: string;
  status: 'setup' | 'ongoing' | 'completed';
}
interface LiveData {
  tournament: Tournament;
  liveMatches: Match[];
  upcomingMatches: Match[];
  completedMatches: Match[];
}

const POLL_MS = 5000;

const dn = (name: string, partner: string) => (partner ? `${name} / ${partner}` : name);

// ── Set dots ──────────────────────────────────────────────────────────────────
function SetDots({ won, total = 2 }: { won: number; total?: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={`w-2.5 h-2.5 rounded-full ${i < won ? 'bg-yellow-400' : 'bg-gray-700'}`} />
      ))}
    </div>
  );
}

// ── Score pill ────────────────────────────────────────────────────────────────
function ScorePill({ score, opp, done }: { score: number; opp: number; done: boolean }) {
  const winning = score > opp;
  return (
    <span className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-black border
      ${winning && !done ? 'bg-yellow-400/20 border-yellow-400/60 text-yellow-200' :
        winning && done  ? 'bg-yellow-400/30 border-yellow-400 text-yellow-100' :
        'bg-gray-800 border-gray-700 text-gray-400'}`}>
      {score}
    </span>
  );
}

// ── LIVE card (big) ───────────────────────────────────────────────────────────
function LiveCard({ match }: { match: Match }) {
  const p1 = dn(match.player1Name, match.player1Partner);
  const p2 = dn(match.player2Name, match.player2Partner);
  const p1sets = match.sets.filter(s => s.p1 > s.p2).length;
  const p2sets = match.sets.filter(s => s.p2 > s.p1).length;
  const setCount = Math.max(match.sets.length, 1);

  const PlayerRow = ({
    name, sets, setsWon, isLeading, isP1,
  }: { name: string; sets: MatchSet[]; setsWon: number; isLeading: boolean; isP1: boolean }) => (
    <div className={`flex items-center gap-3 py-3 ${isLeading ? 'opacity-100' : 'opacity-50'}`}>
      <SetDots won={setsWon} />
      <span className={`flex-1 min-w-0 font-black text-lg leading-tight truncate ${isLeading ? 'text-white' : 'text-gray-400'}`}>
        {name}
      </span>
      <div className="flex gap-1 shrink-0">
        {sets.map((s, i) => (
          <ScorePill key={i} score={isP1 ? s.p1 : s.p2} opp={isP1 ? s.p2 : s.p1} done={false} />
        ))}
        {sets.length < setCount && (
          <span className="w-8 h-8 flex items-center justify-center rounded-lg text-sm border bg-gray-800/40 border-gray-800 text-gray-700">-</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="rounded-2xl overflow-hidden border-2 border-red-500/60 shadow-[0_0_24px_rgba(239,68,68,0.2)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-red-500/10 border-b border-red-500/20">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-red-400 font-black text-xs tracking-widest">LIVE</span>
          {match.court && <span className="text-gray-400 text-xs">· {match.court}</span>}
        </div>
        <span className="text-gray-500 text-xs">{match.roundName} · M{match.matchNumber}</span>
      </div>
      {/* Players */}
      <div className="px-4 bg-gray-900 divide-y divide-gray-800">
        <PlayerRow name={p1} sets={match.sets} setsWon={p1sets} isLeading={p1sets >= p2sets} isP1={true} />
        <PlayerRow name={p2} sets={match.sets} setsWon={p2sets} isLeading={p2sets > p1sets} isP1={false} />
      </div>
    </div>
  );
}

// ── NEXT match card (medium) ──────────────────────────────────────────────────
function NextCard({ match }: { match: Match }) {
  const p1 = dn(match.player1Name, match.player1Partner);
  const p2 = dn(match.player2Name, match.player2Partner);
  return (
    <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-blue-400 tracking-wider">NEXT UP</span>
        <span className="text-xs text-gray-500">{match.roundName} · M{match.matchNumber}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-sm font-semibold text-white truncate">{p1}</p>
          <p className="text-xs text-gray-500 font-medium">vs</p>
          <p className="text-sm font-semibold text-white truncate">{p2}</p>
        </div>
        {match.court && (
          <div className="shrink-0 flex flex-col items-center bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-2">
            <span className="text-xs text-blue-400">Court</span>
            <span className="text-base font-black text-blue-300">{match.court}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── COMPLETED strip (small) ───────────────────────────────────────────────────
function CompletedStrip({ match }: { match: Match }) {
  const p1 = dn(match.player1Name, match.player1Partner);
  const p2 = dn(match.player2Name, match.player2Partner);
  const scoreStr = match.sets.map(s => `${s.p1}-${s.p2}`).join(' ');
  const p1won = match.winnerId === match.player1Id;
  const p2won = match.winnerId === match.player2Id;
  return (
    <div className="flex items-center gap-2 rounded-lg bg-gray-900/60 border border-gray-800/60 px-3 py-2">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500/60 shrink-0" />
      <span className={`text-xs truncate max-w-[36%] ${p1won ? 'text-yellow-300 font-bold' : 'text-gray-400'}`}>{p1}</span>
      <span className="text-gray-600 text-xs shrink-0">vs</span>
      <span className={`text-xs truncate max-w-[36%] ${p2won ? 'text-yellow-300 font-bold' : 'text-gray-400'}`}>{p2}</span>
      <span className="text-gray-500 text-xs font-mono ml-auto shrink-0">{scoreStr}</span>
    </div>
  );
}

// ── Empty placeholder ─────────────────────────────────────────────────────────
function EmptyCard({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/30 flex items-center justify-center py-6">
      <span className="text-gray-600 text-sm">{label}</span>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function MobileViewPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData]       = useState<LiveData | null>(null);
  const [error, setError]     = useState('');
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [liveIdx, setLiveIdx] = useState(0);        // index for rotating courts
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rotateRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/tournaments/${id}/live`, { cache: 'no-store' });
      if (!res.ok) { setError('Tournament not found'); return; }
      const json = await res.json();
      setData(json);
      setLastUpdate(new Date());
      setError('');
    } catch {
      setError('Connection error');
    }
  }, [id]);

  useEffect(() => {
    fetchData();
    timerRef.current = setInterval(fetchData, POLL_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fetchData]);

  // Rotate between multiple live matches every 8s
  useEffect(() => {
    rotateRef.current = setInterval(() => {
      setLiveIdx(prev => {
        const count = data?.liveMatches?.length ?? 1;
        return count > 1 ? (prev + 1) % count : 0;
      });
    }, 8000);
    return () => { if (rotateRef.current) clearInterval(rotateRef.current); };
  }, [data?.liveMatches?.length]);

  if (error) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-red-400 text-sm">{error}</p>
    </div>
  );
  if (!data) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <span className="w-6 h-6 rounded-full border-2 border-yellow-400 border-t-transparent animate-spin" />
    </div>
  );

  const { tournament, liveMatches, upcomingMatches, completedMatches } = data;
  const activeLive   = liveMatches[liveIdx] ?? null;
  const nextMatch    = upcomingMatches[0] ?? null;
  const lastDone     = completedMatches[0] ?? null;
  const multiCourt   = liveMatches.length > 1;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col overflow-hidden"
      style={{ maxWidth: 430, margin: '0 auto' }}>

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
        <div className="min-w-0">
          <p className="text-xs text-yellow-400 font-bold tracking-widest uppercase">🏸 Smash Univerz</p>
          <h1 className="text-sm font-black text-white truncate leading-tight mt-0.5">{tournament.name}</h1>
          {tournament.venue && <p className="text-xs text-gray-500 truncate">📍 {tournament.venue}</p>}
        </div>
        <div className="shrink-0 flex flex-col items-end gap-0.5">
          <Clock />
          <span className="text-xs text-gray-600">{lastUpdate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {/* ── Court rotator indicator (if multiple live) ── */}
      {multiCourt && (
        <div className="flex items-center gap-1 px-4 pb-1 shrink-0">
          {liveMatches.map((_, i) => (
            <button key={i} onClick={() => setLiveIdx(i)}
              className={`h-1 rounded-full transition-all ${i === liveIdx ? 'bg-red-500 w-4' : 'bg-gray-700 w-2'}`} />
          ))}
          <span className="text-xs text-gray-500 ml-1">Court {liveIdx + 1}/{liveMatches.length}</span>
        </div>
      )}

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col gap-3 px-4 pb-4 min-h-0">

        {/* LIVE — big card */}
        <div className="flex-[3] min-h-0 flex flex-col justify-center">
          {activeLive
            ? <LiveCard match={activeLive} />
            : <EmptyCard label={tournament.status === 'completed' ? 'Tournament completed' : 'No live match right now'} />}
        </div>

        {/* NEXT — medium card */}
        <div className="flex-[2] min-h-0 flex flex-col justify-center">
          {nextMatch
            ? <NextCard match={nextMatch} />
            : upcomingMatches.length === 0 && liveMatches.length === 0
              ? null
              : <EmptyCard label="No upcoming matches" />}
        </div>

        {/* COMPLETED — small strip(s) */}
        {completedMatches.length > 0 && (
          <div className="flex-[1] min-h-0 flex flex-col gap-1.5 overflow-hidden">
            <p className="text-xs text-gray-600 font-bold uppercase tracking-wider shrink-0">Recent Results</p>
            {completedMatches.slice(0, 3).map(m => (
              <CompletedStrip key={m._id} match={m} />
            ))}
          </div>
        )}
      </div>

      {/* ── Pulse footer ── */}
      <div className="shrink-0 flex items-center justify-center gap-1.5 pb-3">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        <span className="text-xs text-gray-600">Live · updates every {POLL_MS / 1000}s</span>
      </div>
    </div>
  );
}

// ── Live clock ────────────────────────────────────────────────────────────────
function Clock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="text-xs font-mono text-yellow-400">{time}</span>;
}
