// GET  /api/reminders        — list all reminder jobs
// POST /api/reminders        — create a scheduled (or immediate) reminder job

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ScheduledReminder } from '@/models/ScheduledReminder';
import { Member } from '@/models/Member';
import { sendMembershipExpiryReminder } from '@/lib/whatsapp';
import { createPaymentLink } from '@/lib/razorpay';
import { format, addDays } from 'date-fns';

// ── Member query per group ────────────────────────────────────────────────────
async function getMembersForGroup(group: string) {
  const now  = new Date();
  const d3   = addDays(now, 3);
  const d7   = addDays(now, 7);

  if (group === 'all_active') {
    return Member.find({ isActive: true }).lean();
  }
  if (group === 'overdue') {
    return Member.find({ expiryDate: { $lt: now }, isActive: true }).lean();
  }
  if (group === 'expiring_3d') {
    return Member.find({ expiryDate: { $gte: now, $lte: d3 }, isActive: true }).lean();
  }
  if (group === 'expiring_7d') {
    return Member.find({ expiryDate: { $gte: now, $lte: d7 }, isActive: true }).lean();
  }
  return [];
}

export async function GET() {
  await connectDB();
  const reminders = await ScheduledReminder.find().sort({ scheduledAt: -1 }).limit(50).lean();
  return NextResponse.json(reminders);
}

export async function POST(req: NextRequest) {
  await connectDB();
  const body = await req.json();
  const { title, targetGroup, scheduledAt, sendNow } = body;

  if (!title || !targetGroup) {
    return NextResponse.json({ error: 'title and targetGroup are required' }, { status: 400 });
  }

  const fireAt = sendNow ? new Date() : (scheduledAt ? new Date(scheduledAt) : null);
  if (!fireAt) return NextResponse.json({ error: 'scheduledAt is required' }, { status: 400 });

  // Preview: count members that would be targeted
  const members = await getMembersForGroup(targetGroup);
  const job = await ScheduledReminder.create({
    title,
    targetGroup,
    scheduledAt: fireAt,
    totalCount: members.length,
    status: sendNow ? 'sending' : 'scheduled',
  });

  // If sendNow, fire immediately and wait for result
  if (sendNow) {
    let sentCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const member of members) {
      try {
        const link = await createPaymentLink({
          amount: 1500,
          name: member.name,
          phone: member.phone,
          description: `Membership Renewal – ${member.membershipPlan}`,
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

    job.status     = failedCount === members.length && members.length > 0 ? 'failed' : 'sent';
    job.sentCount  = sentCount;
    job.failedCount = failedCount;
    job.sentAt     = new Date();
    if (errors.length) job.errorMsg = errors.slice(0, 3).join('; ');
    await job.save();
  }

  return NextResponse.json(job);
}
