import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { TMatch } from '@/models/Tournament';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const { id } = await params;
    const matches = await TMatch
      .find({ tournamentId: id })
      .sort({ round: 1, matchNumber: 1 })
      .lean();
    return NextResponse.json(matches);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
