import { NextRequest, NextResponse } from 'next/server';
import { addMonths } from 'date-fns';
import { connectDB } from '@/lib/mongodb';
import { Member } from '@/models/Member';

const PLAN_MONTHS: Record<string, number> = { monthly: 1, half_yearly: 6, yearly: 12 };

type Params = { params: Promise<{ id: string }> };

// GET /api/members/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    const member = await Member.findById(id);
    if (!member) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ member });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

// PUT /api/members/[id]
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const update: Record<string, unknown> = {};
    if (body.name)          update.name = body.name.trim();
    if (body.phone)         update.phone = body.phone.trim();
    if (body.email !== undefined) update.email = body.email?.trim() || '';
    if (body.plan && PLAN_MONTHS[body.plan]) {
      update.plan = body.plan;
      // Use provided startDate or today
      const start = body.startDate ? new Date(body.startDate) : new Date();
      update.startDate = start;
      update.expiryDate = addMonths(start, PLAN_MONTHS[body.plan]);
    }
    if (body.notes !== undefined)   update.notes = body.notes;
    if (body.isActive !== undefined) update.isActive = body.isActive;

    // Admin-only payment fields
    if (body.paymentStatus !== undefined) update.paymentStatus = body.paymentStatus;
    if (body.paidAmount !== undefined) {
      update.paidAmount = Number(body.paidAmount);
      update.paidAt = new Date();
    }

    const member = await Member.findByIdAndUpdate(id, { $set: update }, { new: true });
    if (!member) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ member });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

// DELETE /api/members/[id] — soft delete
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    await Member.findByIdAndUpdate(id, { $set: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
