// POST /api/reminders/[id]/send — manually trigger a scheduled reminder
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ScheduledReminder } from '@/models/ScheduledReminder';
import { Member } from '@/models/Member';
import { sendMembershipExpiryReminder } from '@/lib/whatsapp';
import { createPaymentLink } from '@/lib/razorpay';
import { format, addDays } from 'date-fns';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await connectDB();
  const { id } = await params;

  const job = await ScheduledReminder.findById(id);
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (job.status === 'sending') return NextResponse.json({ error: 'Already in progress' }, { status: 400 });

  job.status = 'sending';
  await job.save();

  const now = new Date();
  const d3  = addDays(now, 3);
  const d7  = addDays(now, 7);
  let query = {};
  if (job.targetGroup === 'all_active')   query = { isActive: true };
  if (job.targetGroup === 'overdue')      query = { expiryDate: { $lt: now }, isActive: true };
  if (job.targetGroup === 'expiring_3d')  query = { expiryDate: { $gte: now, $lte: d3 }, isActive: true };
  if (job.targetGroup === 'expiring_7d')  query = { expiryDate: { $gte: now, $lte: d7 }, isActive: true };

  const members = await Member.find(query).lean();
  let sentCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  for (const member of members) {
    try {
      const link = await createPaymentLink({
        amount: 1500,
        name: member.name,
        phone: member.phone,
        description: `Membership Renewal`,
        referenceId: member._id.toString(),
      }).catch(() => '');

      const result = await sendMembershipExpiryReminder(
        member.phone,
        member.name,
        format(member.expiryDate, 'dd MMM yyyy'),
        link,
      );
      if (result.success) sentCount++; else { failedCount++; errors.push(result.error ?? ''); }
    } catch (e) {
      failedCount++;
      errors.push((e as Error).message);
    }
  }

  job.status       = failedCount === members.length && members.length > 0 ? 'failed' : 'sent';
  job.sentCount    = sentCount;
  job.failedCount  = failedCount;
  job.totalCount   = members.length;
  job.sentAt       = new Date();
  if (errors.length) job.errorMsg = errors.slice(0, 3).join('; ');
  await job.save();

  return NextResponse.json(job);
}
