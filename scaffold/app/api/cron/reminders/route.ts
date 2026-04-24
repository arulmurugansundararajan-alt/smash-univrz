// app/api/cron/reminders/route.ts
// Triggered daily at 9 AM IST via Vercel Cron
// vercel.json: { "crons": [{ "path": "/api/cron/reminders", "schedule": "0 3 * * *" }] }
// (9 AM IST = 3:30 AM UTC → use "30 3" for IST)

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Member } from '@/models/Member';
import { Student } from '@/models/Student';
import { createPaymentLink } from '@/lib/razorpay';
import {
  sendMembershipExpiryReminder,
  sendFeePendingAlert,
} from '@/lib/whatsapp';
import { format } from 'date-fns';

export async function GET(req: NextRequest) {
  // Protect cron endpoint
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();

  const results = { membersNotified: 0, studentsNotified: 0, errors: [] as string[] };

  // ── 1. Members expiring in 3 days ────────────────────────────────────────────
  const soon = new Date(Date.now() + 3 * 86_400_000);
  const today = new Date();

  const expiringMembers = await Member.find({
    expiryDate: { $gte: today, $lte: soon },
    paymentStatus: { $ne: 'paid' },
    isActive: true,
  }).lean();

  for (const member of expiringMembers) {
    try {
      const link = await createPaymentLink({
        amount: 1500,   // TODO: lookup from membershipPlans collection
        name: member.name,
        phone: member.phone,
        description: `${member.membershipPlan} Membership Renewal`,
        referenceId: member._id.toString(),
      });

      await sendMembershipExpiryReminder(
        member.phone,
        member.name,
        format(member.expiryDate, 'dd MMM yyyy'),
        link,
      );

      results.membersNotified++;
    } catch (err) {
      results.errors.push(`Member ${member._id}: ${(err as Error).message}`);
    }
  }

  // ── 2. Students with overdue fees ────────────────────────────────────────────
  const overdueStudents = await Student.find({
    feeStatus: { $in: ['pending', 'overdue'] },
    feeDueDate: { $lte: today },
    isActive: true,
  }).lean();

  for (const student of overdueStudents) {
    try {
      const contactPhone = student.parentPhone || student.phone;
      const link = await createPaymentLink({
        amount: student.feeAmount,
        name: student.name,
        phone: contactPhone,
        description: `Coaching Fee - ${student.name}`,
        referenceId: student._id.toString(),
      });

      await sendFeePendingAlert(
        contactPhone,
        student.name,
        student.feeAmount.toString(),
        format(student.feeDueDate, 'dd MMM yyyy'),
        link,
      );

      results.studentsNotified++;
    } catch (err) {
      results.errors.push(`Student ${student._id}: ${(err as Error).message}`);
    }
  }

  return NextResponse.json({ ok: true, ...results });
}
