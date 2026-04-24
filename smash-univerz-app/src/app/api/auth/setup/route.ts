import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { Plan } from '@/models/Plan';

// POST /api/auth/setup
// Creates default admin + seed plans. Only works when NO admin exists.
// Protect with a setup secret in production.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { setupSecret, name, username, password } = body;

    // Optional: require setup secret from env
    if (process.env.SETUP_SECRET && setupSecret !== process.env.SETUP_SECRET) {
      return NextResponse.json({ error: 'Invalid setup secret' }, { status: 403 });
    }

    await connectDB();

    // Only allow setup if no admin exists
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount > 0) {
      return NextResponse.json({ error: 'Setup already completed. Admin exists.' }, { status: 400 });
    }

    if (!name || !username || !password) {
      return NextResponse.json({ error: 'name, username and password are required' }, { status: 422 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 422 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await User.create({ name, username: username.toLowerCase().trim(), passwordHash, role: 'admin' });

    // Seed default plans (skip if already exist)
    const existingPlans = await Plan.countDocuments();
    if (existingPlans === 0) {
      await Plan.insertMany([
        { name: 'Monthly Plan',    slug: 'monthly',    durationMonths: 1,  price: 1500 },
        { name: 'Half-Yearly Plan', slug: 'half_yearly', durationMonths: 6, price: 7500 },
        { name: 'Yearly Plan',     slug: 'yearly',     durationMonths: 12, price: 12000 },
      ]);
    }

    return NextResponse.json({ success: true, message: 'Admin created and plans seeded.' });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
