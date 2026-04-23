import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { TPlayer, Tournament } from '@/models/Tournament';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; pid: string }> },
) {
  try {
    await connectDB();
    const { id, pid } = await params;

    const tournament = await Tournament.findById(id).lean();
    if (!tournament) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });

    if ((tournament as { status: string }).status !== 'setup') {
      return NextResponse.json({ error: 'Players can only be removed during setup phase' }, { status: 400 });
    }

    const deleted = await TPlayer.findOneAndDelete({ _id: pid, tournamentId: id });
    if (!deleted) return NextResponse.json({ error: 'Player not found' }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
