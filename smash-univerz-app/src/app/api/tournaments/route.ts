import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Tournament, TPlayer, TMatch } from '@/models/Tournament';

export async function GET() {
  try {
    await connectDB();
    const tournaments = await Tournament.find().sort({ createdAt: -1 }).lean();

    // Attach player + match counts
    const ids = tournaments.map((t) => (t._id as { toString(): string }).toString());
    const [playerCounts, matchCounts] = await Promise.all([
      TPlayer.aggregate([
        { $match: { tournamentId: { $in: tournaments.map((t) => t._id) } } },
        { $group: { _id: '$tournamentId', count: { $sum: 1 } } },
      ]),
      TMatch.aggregate([
        { $match: { tournamentId: { $in: tournaments.map((t) => t._id) } } },
        { $group: { _id: '$tournamentId', count: { $sum: 1 } } },
      ]),
    ]);

    const pcMap: Record<string, number> = {};
    const mcMap: Record<string, number> = {};
    for (const r of playerCounts) pcMap[r._id.toString()] = r.count;
    for (const r of matchCounts)  mcMap[r._id.toString()] = r.count;

    const result = tournaments.map((t) => ({
      ...t,
      playerCount: pcMap[(t._id as { toString(): string }).toString()] ?? 0,
      matchCount:  mcMap[(t._id as { toString(): string }).toString()] ?? 0,
    }));

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { name, type, category, maxPlayers, venue, date, courtCount } = await req.json();

    if (!name || !type || !category || !maxPlayers) {
      return NextResponse.json({ error: 'name, type, category and maxPlayers are required' }, { status: 400 });
    }

    const tournament = await Tournament.create({
      name, type, category,
      maxPlayers: Number(maxPlayers),
      venue: venue ?? '',
      date: date ? new Date(date) : undefined,
      courtCount: courtCount ?? 2,
      status: 'setup',
    });

    return NextResponse.json(tournament, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
