// POST /api/tournaments/[id]/generate
// Generates all matches (knockout or round robin), clears previous ones,
// processes BYE walkovers and advances winners to next round.

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Tournament, TPlayer, TMatch } from '@/models/Tournament';
import { generateKnockout, generateRoundRobin } from '@/utils/tournament';
import type { Document, Types } from 'mongoose';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const { id } = await params;

    const tournament = await Tournament.findById(id);
    if (!tournament) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });

    const players = await TPlayer.find({ tournamentId: id }).sort({ entryOrder: 1 }).lean();
    if (players.length < 2) {
      return NextResponse.json({ error: 'Need at least 2 players to generate matches' }, { status: 400 });
    }

    // Clear existing matches
    await TMatch.deleteMany({ tournamentId: id });

    const participants = players.map((p) => ({
      _id: (p._id as { toString(): string }).toString(),
      displayName: p.partnerName ? `${p.name} / ${p.partnerName}` : p.name,
    }));

    const generated =
      tournament.type === 'knockout'
        ? generateKnockout(participants)
        : generateRoundRobin(participants);

    const docs = generated.map((m) => ({
      tournamentId: tournament._id,
      round:       m.round,
      roundName:   m.roundName,
      matchNumber: m.matchNumber,
      player1Id:   m.player1Id ?? null,
      player2Id:   m.player2Id ?? null,
      winnerId:    m.winnerId ?? null,
      status:      m.status,
      isBye:       m.isBye,
    }));

    const inserted = await TMatch.insertMany(docs);

    // For knockout: advance BYE winners into round 2
    if (tournament.type === 'knockout') {
      const walkovers = inserted.filter((m) => m.isBye && m.winnerId);
      if (walkovers.length > 0) {
        const round1 = inserted
          .filter((m) => m.round === 1)
          .sort((a, b) => a.matchNumber - b.matchNumber);
        const round2 = inserted
          .filter((m) => m.round === 2)
          .sort((a, b) => a.matchNumber - b.matchNumber);

        for (const wo of walkovers) {
          const idx = round1.findIndex(
            (m) => (m._id as Types.ObjectId).toString() === (wo._id as Types.ObjectId).toString(),
          );
          if (idx < 0 || round2.length === 0) continue;
          const nextIdx = Math.floor(idx / 2);
          const slot = idx % 2 === 0 ? 'player1Id' : 'player2Id';
          if (nextIdx < round2.length) {
            await TMatch.findByIdAndUpdate(round2[nextIdx]._id, { [slot]: wo.winnerId });
          }
        }
      }
    }

    tournament.status = 'ongoing';
    await tournament.save();

    return NextResponse.json({ message: 'Fixtures generated', count: inserted.length });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
