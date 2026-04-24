/**
 * Tournament bracket generation utilities.
 * Supports knockout (single elimination) format.
 */

export interface BracketParticipant {
  _id: string;
  displayName: string;  // "Player Name" or "P1 / P2" for doubles
}

export interface GeneratedFixture {
  round: number;
  matchNumber: number;
  player1Id: string | null;
  player2Id: string | null;
  status: 'scheduled' | 'walkover' | 'pending';
  winnerId: string | null;
}

/** Return the smallest power of 2 >= n */
function nextPowerOf2(n: number): number {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

/** Fisher-Yates shuffle */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Generate all knockout fixtures for a category.
 * BYEs are automatically assigned to fill to the next power-of-2.
 */
export function generateKnockoutFixtures(
  participants: BracketParticipant[],
): GeneratedFixture[] {
  const players = shuffle(participants);
  const slots = nextPowerOf2(players.length);
  const totalRounds = Math.log2(slots);

  // Pad with nulls (BYEs)
  while (players.length < slots) players.push(null as unknown as BracketParticipant);

  const fixtures: GeneratedFixture[] = [];
  let matchNumber = 1;

  // Round 1
  for (let i = 0; i < slots; i += 2) {
    const p1 = players[i];
    const p2 = players[i + 1];
    const isBye = !p1 || !p2;
    fixtures.push({
      round: 1,
      matchNumber: matchNumber++,
      player1Id: p1?._id ?? null,
      player2Id: p2?._id ?? null,
      status: isBye ? 'walkover' : 'scheduled',
      winnerId: isBye ? (p1?._id ?? p2?._id ?? null) : null,
    });
  }

  // Placeholder fixtures for rounds 2…final
  for (let round = 2; round <= totalRounds; round++) {
    const matchesInRound = slots / Math.pow(2, round);
    for (let m = 0; m < matchesInRound; m++) {
      fixtures.push({
        round,
        matchNumber: matchNumber++,
        player1Id: null,
        player2Id: null,
        status: 'pending',
        winnerId: null,
      });
    }
  }

  return fixtures;
}

/**
 * After saving a match result, determine which next fixture the winner
 * should advance to (matchNumber and slot).
 *
 * @param completedMatchNumber  - 1-based match number WITHIN the round
 * @param currentRound          - The round that just completed
 * @returns { nextRound, nextMatchNumber, slot: 'player1' | 'player2' }
 */
export function getAdvancementTarget(
  completedMatchNumber: number,
  currentRound: number,
) {
  // Within a round, pairs of matches feed one next match
  const positionInRound = completedMatchNumber;  // 1-based within round
  const nextMatchPosition = Math.ceil(positionInRound / 2);
  const slot: 'player1' | 'player2' =
    positionInRound % 2 === 1 ? 'player1' : 'player2';

  return {
    nextRound: currentRound + 1,
    nextMatchPosition,
    slot,
  };
}

/**
 * Build a nested bracket structure for rendering.
 * Groups fixtures by round for easy mapping in React.
 */
export function buildBracketDisplay(
  fixtures: GeneratedFixture[],
): Map<number, GeneratedFixture[]> {
  const rounds = new Map<number, GeneratedFixture[]>();
  for (const f of fixtures) {
    if (!rounds.has(f.round)) rounds.set(f.round, []);
    rounds.get(f.round)!.push(f);
  }
  return rounds;
}
