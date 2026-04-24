import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Plan } from '@/models/Plan';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    const plan = await Plan.findById(id);
    if (!plan) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ plan });
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
    if (body.name      !== undefined) update.name = body.name;
    if (body.price     !== undefined) update.price = Number(body.price);
    if (body.durationMonths !== undefined) update.durationMonths = Number(body.durationMonths);
    if (body.isActive  !== undefined) update.isActive = body.isActive;

    const plan = await Plan.findByIdAndUpdate(id, { $set: update }, { new: true });
    if (!plan) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ plan });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    await Plan.findByIdAndUpdate(id, { $set: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
