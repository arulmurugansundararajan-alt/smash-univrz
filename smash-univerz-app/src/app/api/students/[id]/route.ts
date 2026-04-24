import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Student } from '@/models/Student';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    const student = await Student.findById(id);
    if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ student });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const update: Record<string, unknown> = {};
    if (body.name)           update.name = body.name.trim();
    if (body.phone)          update.phone = body.phone.trim();
    if (body.parentPhone !== undefined) update.parentPhone = body.parentPhone?.trim() || '';
    if (body.email   !== undefined) update.email = body.email?.trim() || '';
    if (body.age     !== undefined) update.age = body.age ? Number(body.age) : undefined;
    if (body.batchName)      update.batchName = body.batchName.trim();
    if (body.coachName !== undefined) update.coachName = body.coachName?.trim() || '';
    if (body.level)          update.level = body.level;
    if (body.feeAmount !== undefined) update.feeAmount = Number(body.feeAmount);
    if (body.feeDueDate)     update.feeDueDate = new Date(body.feeDueDate);
    if (body.performanceNotes !== undefined) update.performanceNotes = body.performanceNotes;
    if (body.isActive !== undefined) update.isActive = body.isActive;

    // Admin-only payment fields
    if (body.feeStatus !== undefined) update.feeStatus = body.feeStatus;
    if (body.paidAmount !== undefined) {
      update.paidAmount = Number(body.paidAmount);
      update.paidAt = new Date();
    }

    const student = await Student.findByIdAndUpdate(id, { $set: update }, { new: true });
    if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ student });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    await Student.findByIdAndUpdate(id, { $set: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
