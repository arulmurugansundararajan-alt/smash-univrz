// app/api/tournaments/[id]/generate-fixtures/route.ts
// POST — Admin: close registration and generate all bracket fixtures

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Tournament, TournamentRegistration, Fixture } from '@/models/Tournament';
import { generateKnockoutFixtures } from '@/utils/tournament';

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  await connectDB();

  const tournament = await Tournament.findById(params.id);
  if (!tournament) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const createdFixtures: unknown[] = [];

  for (const category of tournament.categories) {
    if (category.format !== 'knockout') continue; // only knockout in MVP

    const registrations = await TournamentRegistration.find({
      tournamentId: tournament._id,
      categoryId: category._id.toString(),
      status: { $ne: 'withdrawn' },
    }).lean();

    if (registrations.length < 2) continue;

    const participants = registrations.map((r) => ({
      _id: r._id.toString(),
      displayName:
        r.player2?.name
          ? `${r.player1.name} / ${r.player2.name}`
          : r.player1.name,
    }));

    const fixtures = generateKnockoutFixtures(participants);

    const docs = fixtures.map((f) => ({
      tournamentId: tournament._id,
      categoryId: category._id.toString(),
      round: f.round,
      matchNumber: f.matchNumber,
      player1Id: f.player1Id ?? undefined,
      player2Id: f.player2Id ?? undefined,
      winnerId: f.winnerId ?? undefined,
      status: f.status,
    }));

    const inserted = await Fixture.insertMany(docs);
    createdFixtures.push(...inserted);

    // Update category status to ongoing
    category.status = 'ongoing';
  }

  tournament.status = 'ongoing';
  await tournament.save();

  return NextResponse.json({ ok: true, fixturesCreated: createdFixtures.length });
}
