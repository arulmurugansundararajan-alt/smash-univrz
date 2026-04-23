// GET  /api/reminders/preview?group=X   — count members that match a target group
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Member } from '@/models/Member';
import { addDays } from 'date-fns';

export async function GET(req: NextRequest) {
  await connectDB();
  const group = req.nextUrl.searchParams.get('group') ?? '';
  const now   = new Date();
  const d3    = addDays(now, 3);
  const d7    = addDays(now, 7);

  let count = 0;
  if (group === 'all_active')   count = await Member.countDocuments({ isActive: true });
  if (group === 'overdue')      count = await Member.countDocuments({ expiryDate: { $lt: now }, isActive: true });
  if (group === 'expiring_3d')  count = await Member.countDocuments({ expiryDate: { $gte: now, $lte: d3 }, isActive: true });
  if (group === 'expiring_7d')  count = await Member.countDocuments({ expiryDate: { $gte: now, $lte: d7 }, isActive: true });

  return NextResponse.json({ count });
}
