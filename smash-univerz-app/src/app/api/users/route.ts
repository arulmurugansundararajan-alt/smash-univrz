import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    await connectDB();
    const users = await User.find({}, '-passwordHash').sort({ createdAt: -1 });
    return NextResponse.json({ users });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.name || !body.username || !body.password) {
      return NextResponse.json({ error: 'name, username, and password are required' }, { status: 400 });
    }

    const exists = await User.findOne({ username: body.username.toLowerCase() });
    if (exists) return NextResponse.json({ error: 'Username already taken' }, { status: 409 });

    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await User.create({
      name: body.name.trim(),
      username: body.username.toLowerCase().trim(),
      passwordHash,
      role: body.role === 'admin' ? 'admin' : 'staff',
      isActive: true,
    });

    const { passwordHash: _ph, ...safe } = user.toObject();
    return NextResponse.json({ user: safe }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
