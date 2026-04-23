// Tournament generation utilities: Knockout + Round Robin

export interface Participant {
  _id: string;
  displayName: string;
}

export interface GeneratedMatch {
  round: number;
  roundName: string;
  matchNumber: number;
  player1Id: string | null;
  player2Id: string | null;
  status: 'pending' | 'walkover';
  winnerId: string | null;
  isBye: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function nextPow2(n: number): number {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function knockoutRoundName(round: number, totalRounds: number): string {
  const fromEnd = totalRounds - round;
  if (fromEnd === 0) return 'Final';
  if (fromEnd === 1) return 'Semifinals';
  if (fromEnd === 2) return 'Quarterfinals';
  return `Round ${round}`;
}

// ── Knockout ─────────────────────────────────────────────────────────────────
export function generateKnockout(participants: Participant[]): GeneratedMatch[] {
  const players = shuffle([...participants]);
  const slots = nextPow2(players.length);
  const totalRounds = Math.log2(slots);

  while (players.length < slots) players.push(null as unknown as Participant);

  const matches: GeneratedMatch[] = [];
  let matchNum = 1;

  // Round 1 — real matches + BYEs
  for (let i = 0; i < slots; i += 2) {
    const p1 = players[i];
    const p2 = players[i + 1];
    const isBye = !p1 || !p2;
    matches.push({
      round: 1,
      roundName: knockoutRoundName(1, totalRounds),
      matchNumber: matchNum++,
      player1Id: p1?._id ?? null,
      player2Id: p2?._id ?? null,
      status: isBye ? 'walkover' : 'pending',
      winnerId: isBye ? (p1?._id ?? p2?._id ?? null) : null,
      isBye,
    });
  }

  // Subsequent rounds — placeholder slots
  for (let round = 2; round <= totalRounds; round++) {
    const count = slots / Math.pow(2, round);
    for (let m = 0; m < count; m++) {
      matches.push({
        round,
        roundName: knockoutRoundName(round, totalRounds),
        matchNumber: matchNum++,
        player1Id: null,
        player2Id: null,
        status: 'pending',
        winnerId: null,
        isBye: false,
      });
    }
  }

  return matches;
}

// ── Round Robin ─────────────────────────────────────────────────────────────
export function generateRoundRobin(participants: Participant[]): GeneratedMatch[] {
  const players = shuffle([...participants]) as (Participant | null)[];
  if (players.length % 2 !== 0) players.push(null); // BYE slot

  const n = players.length;
  const numRounds = n - 1;
  const matchesPerRound = n / 2;
  const matches: GeneratedMatch[] = [];
  let matchNum = 1;

  for (let round = 1; round <= numRounds; round++) {
    for (let i = 0; i < matchesPerRound; i++) {
      const p1 = players[i];
      const p2 = players[n - 1 - i];
      if (!p1 || !p2) continue; // skip BYE pairing
      matches.push({
        round,
        roundName: `Round ${round}`,
        matchNumber: matchNum++,
        player1Id: p1._id,
        player2Id: p2._id,
        status: 'pending',
        winnerId: null,
        isBye: false,
      });
    }
    // Rotate: keep index 0 fixed, rotate the rest
    const last = players.pop()!;
    players.splice(1, 0, last);
  }

  return matches;
}

// ── Winner logic ─────────────────────────────────────────────────────────────
export function computeWinner(
  sets: { p1: number; p2: number }[],
  player1Id: string,
  player2Id: string,
): string | null {
  let p1Sets = 0;
  let p2Sets = 0;
  for (const s of sets) {
    if (s.p1 > s.p2) p1Sets++;
    else if (s.p2 > s.p1) p2Sets++;
  }
  if (p1Sets >= 2) return player1Id;
  if (p2Sets >= 2) return player2Id;
  return null;
}

// ── Round Robin Standings ────────────────────────────────────────────────────
export interface StandingRow {
  playerId: string;
  name: string;
  played: number;
  won: number;
  lost: number;
  points: number;
  setsWon: number;
  setsLost: number;
}

export function buildStandings(
  players: { _id: string; name: string; partnerName?: string }[],
  matches: { player1Id: string | null; player2Id: string | null; winnerId: string | null; sets: { p1: number; p2: number }[]; status: string }[],
): StandingRow[] {
  const map = new Map<string, StandingRow>();

  for (const p of players) {
    map.set(p._id, {
      playerId: p._id,
      name: p.partnerName ? `${p.name} / ${p.partnerName}` : p.name,
      played: 0, won: 0, lost: 0, points: 0, setsWon: 0, setsLost: 0,
    });
  }

  for (const m of matches) {
    if (m.status !== 'completed' || !m.winnerId || !m.player1Id || !m.player2Id) continue;

    const r1 = map.get(m.player1Id);
    const r2 = map.get(m.player2Id);
    if (!r1 || !r2) continue;

    r1.played++; r2.played++;
    let sw1 = 0, sw2 = 0;
    for (const s of m.sets) { sw1 += s.p1; sw2 += s.p2; }
    r1.setsWon += sw1; r1.setsLost += sw2;
    r2.setsWon += sw2; r2.setsLost += sw1;

    if (m.winnerId === m.player1Id) {
      r1.won++; r1.points += 2; r2.lost++;
    } else {
      r2.won++; r2.points += 2; r1.lost++;
    }
  }

  return [...map.values()].sort((a, b) =>
    b.points - a.points || (b.setsWon - b.setsLost) - (a.setsWon - a.setsLost),
  );
}
