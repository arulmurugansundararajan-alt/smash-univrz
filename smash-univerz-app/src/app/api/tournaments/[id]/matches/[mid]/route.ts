// PUT /api/tournaments/[id]/matches/[mid]
// Actions: 'start' | 'update_score' | 'complete'
// On 'complete': auto-detects winner from sets (best of 3),
//  then for knockout advances winner to next round.

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Tournament, TMatch } from '@/models/Tournament';
import { computeWinner } from '@/utils/tournament';
import type { Types } from 'mongoose';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; mid: string }> },
) {
  try {
    await connectDB();
    const { id, mid } = await params;
    const body = await req.json();
    const { action, court, sets, forcedWinnerId } = body as {
      action: 'start' | 'update_score' | 'complete';
      court?: string;
      sets?: { p1: number; p2: number }[];
      forcedWinnerId?: string;
    };

    const match = await TMatch.findOne({ _id: mid, tournamentId: id });
    if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });

    if (action === 'start') {
      if (match.status !== 'pending') {
        return NextResponse.json({ error: 'Match is not in pending state' }, { status: 400 });
      }
      match.status = 'live';
      if (court) match.court = court;
    }

    if (action === 'update_score') {
      if (sets) match.sets = sets as typeof match.sets;
    }

    if (action === 'complete') {
      if (sets) match.sets = sets as typeof match.sets;

      const p1 = match.player1Id?.toString() ?? '';
      const p2 = match.player2Id?.toString() ?? '';

      const autoWinner = sets
        ? computeWinner(sets, p1, p2)
        : computeWinner(match.sets as { p1: number; p2: number }[], p1, p2);

      const winnerId = forcedWinnerId ?? autoWinner;
      if (!winnerId) {
        return NextResponse.json(
          { error: 'Cannot determine winner – complete at least 2 sets or specify forcedWinnerId' },
          { status: 400 },
        );
      }

      match.status = 'completed';
      match.winnerId = winnerId as unknown as Types.ObjectId;
      match.completedAt = new Date();

      await match.save();

      // Advance winner for knockout tournaments
      const tournament = await Tournament.findById(id).lean();
      if (tournament && (tournament as { type: string }).type === 'knockout') {
        await advanceWinner(id, mid, winnerId);

        // Check if all non-BYE matches are completed → mark tournament done
        const remaining = await TMatch.countDocuments({
          tournamentId: id,
          status: { $in: ['pending', 'live'] },
          isBye: false,
        });
        if (remaining === 0) {
          await Tournament.findByIdAndUpdate(id, { status: 'completed' });
        }
      }

      return NextResponse.json(match);
    }

    await match.save();
    return NextResponse.json(match);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; mid: string }> },
) {
  try {
    await connectDB();
    const { id, mid } = await params;
    const match = await TMatch.findOne({ _id: mid, tournamentId: id }).lean();
    if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    return NextResponse.json(match);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

// ── Winner advancement (knockout) ─────────────────────────────────────────────
async function advanceWinner(
  tournamentId: string,
  matchId: string,
  winnerId: string,
) {
  const match = await TMatch.findById(matchId).lean();
  if (!match) return;

  const currentRound = (match as { round: number }).round;

  // All matches in this round, sorted
  const roundMatches = await TMatch
    .find({ tournamentId, round: currentRound })
    .sort({ matchNumber: 1 })
    .lean();

  const idx = roundMatches.findIndex(
    (m) => (m._id as Types.ObjectId).toString() === matchId,
  );
  if (idx < 0) return;

  const slot = idx % 2 === 0 ? 'player1Id' : 'player2Id';
  const nextIdx = Math.floor(idx / 2);

  const nextRoundMatches = await TMatch
    .find({ tournamentId, round: currentRound + 1 })
    .sort({ matchNumber: 1 })
    .lean();

  if (nextIdx >= nextRoundMatches.length) return; // This was the Final

  const nextMatch = nextRoundMatches[nextIdx];
  await TMatch.findByIdAndUpdate(nextMatch._id, { [slot]: winnerId });
}
