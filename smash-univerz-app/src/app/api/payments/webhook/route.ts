// app/api/payments/webhook/route.ts
// Razorpay fires POST here on payment_link.paid and payment.failed events

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Payment } from '@/models/Payment';
import { Member } from '@/models/Member';
import { Student } from '@/models/Student';
import { verifyWebhookSignature } from '@/lib/razorpay';
import { sendPaymentConfirmation } from '@/lib/whatsapp';
import { format, addMonths, addDays } from 'date-fns';

// Compute expiry using "same day next period" logic
// monthly → same day next month (Jan 31 → Feb 28/29 handled by date-fns)
// quarterly → same day 3 months later
// yearly → same day next year
function computeExpiry(plan: string, from: Date = new Date()): Date {
  if (plan === 'monthly')   return addMonths(from, 1);
  if (plan === 'quarterly') return addMonths(from, 3);
  if (plan === 'yearly')    return addMonths(from, 12);
  return addDays(from, 30); // fallback
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-razorpay-signature') ?? '';

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const event = JSON.parse(rawBody);
  await connectDB();

  if (event.event === 'payment_link.paid') {
    const pl = event.payload.payment_link.entity;
    const payment = event.payload.payment.entity;

    // Find our payment record by payment link id
    const paymentDoc = await Payment.findOne({ paymentLinkId: pl.id });
    if (!paymentDoc) return NextResponse.json({ ok: true }); // not our record

    paymentDoc.status = 'paid';
    paymentDoc.razorpayPaymentId = payment.id;
    paymentDoc.paidAt = new Date();
    await paymentDoc.save();

    // Update the entity (member or student)
    if (paymentDoc.entityType === 'member') {
      const member = await Member.findById(paymentDoc.entityId);
      if (member) {
        const paidAt = paymentDoc.paidAt ?? new Date();
        member.paymentStatus = 'paid';
        member.expiryDate = computeExpiry(member.membershipPlan, paidAt);
        await member.save();

        await sendPaymentConfirmation(
          member.phone,
          member.name,
          `₹${paymentDoc.amount}`,
          format(member.expiryDate, 'dd MMM yyyy'),
        );
      }
    } else if (paymentDoc.entityType === 'student') {
      const student = await Student.findById(paymentDoc.entityId);
      if (student) {
        student.feeStatus = 'paid';
        student.feeDueDate = addMonths(new Date(), 1);
        await student.save();

        const contactPhone = student.parentPhone || student.phone;
        await sendPaymentConfirmation(
          contactPhone,
          student.name,
          `₹${paymentDoc.amount}`,
          format(student.feeDueDate, 'dd MMM yyyy'),
        );
      }
    }
  }

  return NextResponse.json({ ok: true });
}
