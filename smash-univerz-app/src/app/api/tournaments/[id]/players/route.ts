import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { TPlayer, Tournament } from '@/models/Tournament';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const { id } = await params;
    const players = await TPlayer.find({ tournamentId: id }).sort({ entryOrder: 1 }).lean();
    return NextResponse.json(players);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const { id } = await params;
    const { name, phone, partnerName, partnerPhone } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Player name is required' }, { status: 400 });
    }

    const tournament = await Tournament.findById(id).lean();
    if (!tournament) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });

    if ((tournament as { status: string }).status !== 'setup') {
      return NextResponse.json({ error: 'Players can only be added during setup phase' }, { status: 400 });
    }

    const count = await TPlayer.countDocuments({ tournamentId: id });
    if (count >= (tournament as { maxPlayers: number }).maxPlayers) {
      return NextResponse.json({ error: 'Maximum player limit reached' }, { status: 400 });
    }

    const player = await TPlayer.create({
      tournamentId: id,
      name: name.trim(),
      phone: phone?.trim() ?? '',
      partnerName: partnerName?.trim() ?? '',
      partnerPhone: partnerPhone?.trim() ?? '',
      entryOrder: count + 1,
    });

    return NextResponse.json(player, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
