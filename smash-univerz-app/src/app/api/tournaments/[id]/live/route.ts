// GET /api/tournaments/[id]/live
// Public endpoint — returns complete tournament state for the TV dashboard.

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Tournament, TPlayer, TMatch } from '@/models/Tournament';
import { buildStandings } from '@/utils/tournament';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const { id } = await params;

    const [tournament, players, matches] = await Promise.all([
      Tournament.findById(id).lean(),
      TPlayer.find({ tournamentId: id }).sort({ entryOrder: 1 }).lean(),
      TMatch.find({ tournamentId: id }).sort({ round: 1, matchNumber: 1 }).lean(),
    ]);

    if (!tournament) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Build player lookup map
    type PlayerInfo = { name: string; partnerName: string; phone: string };
    const playerMap: Record<string, PlayerInfo> = {};
    for (const p of players) {
      playerMap[(p._id as { toString(): string }).toString()] = {
        name: p.name,
        partnerName: p.partnerName ?? '',
        phone: p.phone ?? '',
      };
    }

    // Hydrate match player names
    const hydrate = (m: (typeof matches)[0]) => ({
      ...m,
      player1Name: m.player1Id ? (playerMap[m.player1Id.toString()]?.name ?? 'TBD') : 'TBD',
      player1Partner: m.player1Id ? (playerMap[m.player1Id.toString()]?.partnerName ?? '') : '',
      player2Name: m.player2Id ? (playerMap[m.player2Id.toString()]?.name ?? 'TBD') : 'TBD',
      player2Partner: m.player2Id ? (playerMap[m.player2Id.toString()]?.partnerName ?? '') : '',
      winnerName: m.winnerId ? (playerMap[m.winnerId.toString()]?.name ?? '') : '',
      winnerPartner: m.winnerId ? (playerMap[m.winnerId.toString()]?.partnerName ?? '') : '',
    });

    const liveMatches     = matches.filter((m) => m.status === 'live').map(hydrate);
    const upcomingMatches = matches
      .filter((m) => m.status === 'pending' && !m.isBye && m.player1Id && m.player2Id)
      .slice(0, 10)
      .map(hydrate);
    const completedMatches = matches
      .filter((m) => m.status === 'completed' || m.status === 'walkover')
      .reverse()
      .slice(0, 20)
      .map(hydrate);
    const allMatches = matches.map(hydrate);

    // Round-robin standings
    let standings = null;
    if ((tournament as { type: string }).type === 'round_robin') {
      standings = buildStandings(
        players.map((p) => ({
          _id: (p._id as { toString(): string }).toString(),
          name: p.name,
          partnerName: p.partnerName,
        })),
        matches.map((m) => ({
          player1Id: m.player1Id?.toString() ?? null,
          player2Id: m.player2Id?.toString() ?? null,
          winnerId:  m.winnerId?.toString() ?? null,
          sets:      m.sets as { p1: number; p2: number }[],
          status:    m.status,
        })),
      );
    }

    // Knockout bracket (by round)
    const bracketByRound: Record<number, ReturnType<typeof hydrate>[]> = {};
    if ((tournament as { type: string }).type === 'knockout') {
      for (const m of allMatches) {
        if (m.isBye) continue;
        if (!bracketByRound[m.round]) bracketByRound[m.round] = [];
        bracketByRound[m.round].push(m);
      }
    }

    return NextResponse.json({
      tournament,
      playerMap,
      liveMatches,
      upcomingMatches,
      completedMatches,
      allMatches,
      bracketByRound,
      standings,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
