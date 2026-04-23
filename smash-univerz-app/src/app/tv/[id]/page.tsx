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
  _id: string; name: string; type: 'knockout' | 'round_robin';
  category: 'singles' | 'doubles'; venue: string; date?: string;
  status: 'setup' | 'ongoing' | 'completed';
}
interface StandingRow {
  playerId: string; name: string;
  played: number; won: number; lost: number; points: number;
  setsWon: number; setsLost: number;
}
interface LiveData {
  tournament: Tournament;
  liveMatches: Match[];
  upcomingMatches: Match[];
  completedMatches: Match[];
  bracketByRound: Record<number, Match[]>;
  standings: StandingRow[] | null;
  updatedAt: string;
}

const POLL_INTERVAL = 6000;
const dn = (name: string, partner: string) => (partner ? `${name} / ${partner}` : name);
const scoreStr = (sets: MatchSet[]) => sets.map((s) => `${s.p1}-${s.p2}`).join('  ');

function LiveCard({ match }: { match: Match }) {
  const p1 = dn(match.player1Name, match.player1Partner);
  const p2 = dn(match.player2Name, match.player2Partner);
  const p1s = match.sets.filter((s) => s.p1 > s.p2).length;
  const p2s = match.sets.filter((s) => s.p2 > s.p1).length;

  const Row = ({ name, scores, setsWon, isLeading, isP1 }: {
    name: string; scores: number[]; setsWon: number; isLeading: boolean; isP1: boolean;
  }) => (
    <div className={`flex items-center gap-3 py-1.5 ${isLeading ? 'opacity-100' : 'opacity-55'}`}>
      <div className="flex gap-1 shrink-0">
        {[0, 1].map((d) => (
          <div key={d} className={`w-3 h-3 rounded-full ${d < setsWon ? 'bg-yellow-400' : 'bg-gray-700'}`} />
        ))}
      </div>
      <span className={`flex-1 min-w-0 font-black truncate leading-none ${isLeading ? 'text-white' : 'text-gray-400'} text-[clamp(1rem,2vw,1.75rem)]`}>
        {name}
      </span>
      <div className="flex gap-1.5 shrink-0">
        {scores.map((sc, si) => {
          const opp = isP1 ? match.sets[si]?.p2 : match.sets[si]?.p1;
          return (
            <div key={si} className={`flex items-center justify-center rounded-lg font-black border text-[clamp(1.1rem,2vw,1.75rem)] w-[clamp(2rem,3.5vw,3rem)] h-[clamp(2rem,3.5vw,3rem)] ${sc > opp ? 'bg-yellow-400/20 border-yellow-400/50 text-yellow-200' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>
              {sc}
            </div>
          );
        })}
        {scores.length < 2 && (
          <div className="flex items-center justify-center rounded-lg font-black border bg-gray-800/40 border-gray-800 text-gray-700 text-[clamp(1.1rem,2vw,1.75rem)] w-[clamp(2rem,3.5vw,3rem)] h-[clamp(2rem,3.5vw,3rem)]">-</div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex-1 min-w-0 flex flex-col bg-gray-900 border-2 border-red-500/50 rounded-2xl overflow-hidden shadow-[0_0_32px_rgba(239,68,68,0.15)]">
      <div className="flex-none flex items-center justify-between bg-red-500/10 border-b border-red-500/20 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-red-400 font-black tracking-widest text-[clamp(0.7rem,1.5vw,1rem)]">LIVE</span>
          {match.court && <span className="text-gray-400 text-[clamp(0.65rem,1.2vw,0.9rem)] ml-1">- {match.court}</span>}
        </div>
        <span className="text-gray-500 text-[clamp(0.6rem,1vw,0.8rem)]">{match.roundName} M{match.matchNumber}</span>
      </div>
      <div className="flex flex-col px-4 py-2 gap-0.5">
        <Row name={p1} scores={match.sets.map((s) => s.p1)} setsWon={p1s} isLeading={p1s >= p2s} isP1={true} />
        <div className="border-t border-gray-800" />
        <Row name={p2} scores={match.sets.map((s) => s.p2)} setsWon={p2s} isLeading={p2s >= p1s} isP1={false} />
      </div>
    </div>
  );
}

function CompactRow({ match }: { match: Match }) {
  const p1 = dn(match.player1Name, match.player1Partner);
  const p2 = dn(match.player2Name, match.player2Partner);
  const done = match.status === 'completed' || match.status === 'walkover';
  const live = match.status === 'live';
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[clamp(0.7rem,1.1vw,0.875rem)] ${live ? 'bg-red-500/10 border-red-500/30' : done ? 'bg-gray-900/40 border-gray-800/60' : 'bg-gray-900 border-gray-800'}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 flex-none ${live ? 'bg-red-500 animate-pulse' : done ? 'bg-green-500/60' : 'bg-gray-600'}`} />
      <div className="flex-1 min-w-0 flex items-center gap-1.5 flex-wrap">
        <span className={`font-semibold truncate max-w-[40%] ${match.winnerId === match.player1Id ? 'text-yellow-300' : 'text-white/90'}`}>{p1}</span>
        <span className="text-gray-600 text-xs shrink-0">vs</span>
        <span className={`font-semibold truncate max-w-[40%] ${match.winnerId === match.player2Id ? 'text-yellow-300' : 'text-white/90'}`}>{p2}</span>
      </div>
      {done && match.sets.length > 0 && <span className="text-gray-400 font-mono text-xs shrink-0">{scoreStr(match.sets)}</span>}
      {!done && match.court && <span className="text-blue-400 text-xs shrink-0">{match.court}</span>}
    </div>
  );
}

function TVBracket({ bracketByRound }: { bracketByRound: Record<number, Match[]> }) {
  const rounds = Object.keys(bracketByRound).map(Number).sort((a, b) => a - b);
  if (!rounds.length) return null;
  return (
    <div className="flex gap-3 h-full overflow-hidden">
      {rounds.map((round) => {
        const rMatches = bracketByRound[round];
        const rName = rMatches[0]?.roundName ?? `R${round}`;
        return (
          <div key={round} className="flex flex-col min-w-[clamp(140px,18vw,240px)] overflow-hidden">
            <p className="text-[clamp(0.55rem,0.9vw,0.75rem)] text-gray-500 font-bold uppercase tracking-widest text-center pb-1 border-b border-gray-800 shrink-0">{rName}</p>
            <div className="flex-1 overflow-hidden flex flex-col gap-1.5 pt-1.5 justify-around">
              {rMatches.map((m) => {
                const mp1 = dn(m.player1Name, m.player1Partner);
                const mp2 = dn(m.player2Name, m.player2Partner);
                return (
                  <div key={m._id} className={`rounded-lg overflow-hidden border shrink-0 ${m.status === 'live' ? 'border-red-500/50' : m.status === 'completed' ? 'border-green-500/20' : 'border-gray-700/60'}`}>
                    {[
                      { name: mp1, wid: m.player1Id, score: m.sets.map((s) => s.p1) },
                      { name: mp2, wid: m.player2Id, score: m.sets.map((s) => s.p2) },
                    ].map((p, idx) => (
                      <div key={idx} className={`flex items-center justify-between px-2 py-1 gap-1 text-[clamp(0.6rem,0.95vw,0.8rem)] ${idx === 0 ? 'border-b border-gray-800' : ''} ${p.wid && m.winnerId === p.wid ? 'bg-yellow-400/10 text-yellow-300 font-bold' : 'bg-gray-900 text-gray-300'}`}>
                        <span className="truncate">{p.name || 'TBD'}</span>
                        <div className="flex gap-0.5 shrink-0">
                          {p.score.map((sc, si) => <span key={si} className="text-xs font-bold w-4 text-center">{sc}</span>)}
                        </div>
                      </div>
                    ))}
                    {m.status !== 'pending' && (
                      <div className={`px-2 py-0.5 text-[0.6rem] font-medium ${m.status === 'live' ? 'bg-red-500/10 text-red-400' : 'bg-green-950/40 text-green-500'}`}>
                        {m.status === 'live' ? `LIVE${m.court ? ' ' + m.court : ''}` : `Done ${scoreStr(m.sets)}`}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TVStandings({ rows }: { rows: StandingRow[] }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-800 text-gray-500 uppercase">
            <th className="text-left px-3 py-2 text-[clamp(0.55rem,0.9vw,0.72rem)] tracking-wider">#</th>
            <th className="text-left px-3 py-2 text-[clamp(0.55rem,0.9vw,0.72rem)] tracking-wider">Player</th>
            <th className="text-center px-2 py-2 text-[clamp(0.55rem,0.9vw,0.72rem)] tracking-wider">P</th>
            <th className="text-center px-2 py-2 text-[clamp(0.55rem,0.9vw,0.72rem)] tracking-wider">W</th>
            <th className="text-center px-2 py-2 text-[clamp(0.55rem,0.9vw,0.72rem)] tracking-wider">L</th>
            <th className="text-center px-2 py-2 text-[clamp(0.55rem,0.9vw,0.72rem)] tracking-wider">Pts</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/60">
          {rows.map((r, i) => (
            <tr key={r.playerId} className={i === 0 ? 'bg-yellow-400/5' : ''}>
              <td className="px-3 py-1.5 text-gray-500 text-[clamp(0.6rem,1vw,0.8rem)]">{i + 1}</td>
              <td className="px-3 py-1.5 font-semibold text-white text-[clamp(0.65rem,1.1vw,0.875rem)] truncate max-w-[180px]">{r.name}</td>
              <td className="text-center px-2 py-1.5 text-gray-400 text-[clamp(0.6rem,1vw,0.8rem)]">{r.played}</td>
              <td className="text-center px-2 py-1.5 text-green-400 font-bold text-[clamp(0.6rem,1vw,0.8rem)]">{r.won}</td>
              <td className="text-center px-2 py-1.5 text-red-400 text-[clamp(0.6rem,1vw,0.8rem)]">{r.lost}</td>
              <td className="text-center px-2 py-1.5 text-yellow-400 font-bold text-[clamp(0.7rem,1.1vw,0.9rem)]">{r.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function TVDashboard() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<LiveData | null>(null);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const lastFetchRef = useRef<number>(Date.now());

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/tournaments/${id}/live`);
      if (!res.ok) { setError('Failed to load tournament data'); return; }
      setData(await res.json());
      lastFetchRef.current = Date.now();
      setLastRefresh(0);
      setCountdown(Math.ceil(POLL_INTERVAL / 1000));
    } catch { setError('Network error - retrying...'); }
  }, [id]);

  useEffect(() => {
    fetchData();
    const t = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(t);
  }, [fetchData]);

  useEffect(() => {
    const t = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastFetchRef.current) / 1000);
      setLastRefresh(elapsed);
      setCountdown(Math.max(0, Math.ceil(POLL_INTERVAL / 1000) - elapsed));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  if (error && !data) return (
    <div className="h-screen bg-gray-950 flex items-center justify-center text-red-400 text-lg">{error}</div>
  );
  if (!data) return (
    <div className="h-screen bg-gray-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    </div>
  );

  const { tournament, liveMatches, upcomingMatches, completedMatches, bracketByRound, standings } = data;
  const isKnockout = tournament.type === 'knockout';
  const hasLive = liveMatches.length > 0;
  const allRRmatches = Object.values(bracketByRound).flat().filter((m) => !m.isBye);

  const rounds = Object.keys(bracketByRound).map(Number);
  const maxRound = Math.max(0, ...rounds);
  const finalMatch = isKnockout && bracketByRound[maxRound]?.[0];
  const champion = finalMatch && finalMatch.winnerId ? dn(finalMatch.winnerName, finalMatch.winnerPartner) : null;

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-gray-950 text-white select-none">

      <header className="flex-none h-14 border-b border-gray-800 flex items-center px-4 gap-3 bg-gray-900/80">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xl leading-none">🏸</span>
          <div className="hidden sm:block">
            <p className="font-black text-yellow-400 text-sm leading-tight tracking-tight">SMASH UNIVERZ</p>
            <p className="text-[0.6rem] text-gray-500 leading-none tracking-widest uppercase">Badminton</p>
          </div>
        </div>
        <div className="w-px h-8 bg-gray-700 shrink-0" />
        <div className="flex-1 min-w-0">
          <h1 className="font-black text-white text-[clamp(0.8rem,1.8vw,1.25rem)] leading-tight truncate">{tournament.name}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[0.6rem] px-1.5 py-0.5 rounded-full font-bold tracking-wider uppercase ${tournament.status === 'ongoing' ? 'bg-green-500/20 text-green-400' : tournament.status === 'completed' ? 'bg-gray-700 text-gray-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
              {tournament.status}
            </span>
            <span className="text-[0.65rem] text-gray-500 capitalize hidden sm:inline">
              {tournament.type.replace('_', ' ')} - {tournament.category}
              {tournament.venue && ` - ${tournament.venue}`}
            </span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          {hasLive ? (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-400 font-black text-[clamp(0.65rem,1.2vw,0.85rem)] tracking-wide">{liveMatches.length} LIVE</span>
            </div>
          ) : (
            <span className="text-gray-600 text-xs">No live</span>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col">
        {hasLive && (
          <div className="flex-none border-b border-gray-800/60">
            <div className="flex gap-3 px-4 py-3">
              {liveMatches.map((m) => <LiveCard key={m._id} match={m} />)}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-hidden grid" style={{ gridTemplateColumns: '1fr 320px' }}>
          <div className="overflow-hidden flex flex-col border-r border-gray-800 p-3 gap-2">
            <div className="flex-none flex items-center justify-between">
              <h2 className="text-[clamp(0.65rem,1.1vw,0.875rem)] font-bold text-gray-400 uppercase tracking-widest">
                {isKnockout ? 'Bracket' : 'Standings'}
              </h2>
              {champion && (
                <div className="flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 rounded-full px-3 py-1">
                  <span className="text-yellow-400 font-black text-[clamp(0.65rem,1.2vw,0.9rem)] truncate max-w-[200px]">
                    🏆 {champion}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              {isKnockout && <TVBracket bracketByRound={bracketByRound} />}
              {!isKnockout && standings && standings.length > 0 && <TVStandings rows={standings} />}
              {!isKnockout && !standings?.length && (
                <div className="flex items-center justify-center h-full text-gray-600 text-sm">No standings yet</div>
              )}
            </div>
            {!isKnockout && allRRmatches.length > 0 && (
              <div className="flex-none border-t border-gray-800 pt-2 space-y-1 overflow-hidden max-h-[25%]">
                <p className="text-[0.6rem] text-gray-600 uppercase tracking-widest font-bold">All Matches</p>
                {allRRmatches.slice(0, 6).map((m) => <CompactRow key={m._id} match={m} />)}
              </div>
            )}
          </div>

          <div className="overflow-hidden flex flex-col">
            {upcomingMatches.length > 0 && (
              <div className="flex-1 overflow-hidden flex flex-col p-3 border-b border-gray-800 min-h-0">
                <h2 className="flex-none flex items-center gap-1.5 mb-2 text-[clamp(0.65rem,1vw,0.8rem)] font-bold text-gray-400 uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Up Next
                </h2>
                <div className="flex-1 overflow-hidden flex flex-col gap-1.5">
                  {upcomingMatches.slice(0, 5).map((m) => <CompactRow key={m._id} match={m} />)}
                </div>
              </div>
            )}
            {completedMatches.length > 0 && (
              <div className="flex-1 overflow-hidden flex flex-col p-3 min-h-0">
                <h2 className="flex-none flex items-center gap-1.5 mb-2 text-[clamp(0.65rem,1vw,0.8rem)] font-bold text-gray-400 uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Results
                </h2>
                <div className="flex-1 overflow-hidden flex flex-col gap-1.5">
                  {completedMatches.slice(0, 6).map((m) => <CompactRow key={m._id} match={m} />)}
                </div>
              </div>
            )}
            {tournament.status === 'completed' && champion && (
              <div className="flex-none border-t border-yellow-400/20 p-3 bg-yellow-400/5 text-center space-y-1">
                <p className="text-3xl">🏆</p>
                <p className="text-yellow-400 font-black text-[clamp(0.8rem,1.5vw,1.1rem)] truncate">{champion}</p>
                <p className="text-[0.6rem] text-gray-500 uppercase tracking-widest">Champion</p>
              </div>
            )}
            {!upcomingMatches.length && !completedMatches.length && (
              <div className="flex-1 flex items-center justify-center text-gray-700 text-sm p-4 text-center">
                Fixtures not generated yet
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="flex-none h-7 border-t border-gray-800/60 flex items-center justify-between px-4 bg-gray-900/50">
        <span className="text-[0.6rem] text-gray-600">Smash Univerz - Live Display</span>
        <div className="flex items-center gap-1 text-[0.6rem] text-gray-700">
          {lastRefresh < 3 ? 'Just updated' : `${lastRefresh}s ago`} - next in {countdown}s
        </div>
      </footer>
    </div>
  );
}