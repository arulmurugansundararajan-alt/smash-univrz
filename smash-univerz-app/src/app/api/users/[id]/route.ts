import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    const user = await User.findById(id, '-passwordHash');
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ user });
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
    if (body.name     !== undefined) update.name = body.name.trim();
    if (body.role     !== undefined) update.role = body.role;
    if (body.isActive !== undefined) update.isActive = body.isActive;
    if (body.password) update.passwordHash = await bcrypt.hash(body.password, 10);

    const user = await User.findByIdAndUpdate(id, { $set: update }, { new: true, projection: '-passwordHash' });
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ user });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;

    // Prevent deleting self — caller passes their own id in body optionally
    const body = await req.json().catch(() => ({}));
    if (body.requesterId && body.requesterId === id) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
    }

    await User.findByIdAndUpdate(id, { $set: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
