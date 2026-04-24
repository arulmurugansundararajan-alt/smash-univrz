import { NextRequest, NextResponse } from 'next/server';
import { addMonths } from 'date-fns';
import { connectDB } from '@/lib/mongodb';
import { Member } from '@/models/Member';

const PLAN_MONTHS: Record<string, number> = { monthly: 1, half_yearly: 6, yearly: 12 };

// GET /api/members?search=&status=&page=1&limit=20
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = req.nextUrl;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '20'));

    const query: Record<string, unknown> = { isActive: true };
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
    if (status && status !== 'all') query.paymentStatus = status;

    const [members, total] = await Promise.all([
      Member.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Member.countDocuments(query),
    ]);

    return NextResponse.json({ members, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

// POST /api/members — create member
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, phone, email, plan, notes } = body;

    if (!name || !phone || !plan) {
      return NextResponse.json({ error: 'name, phone and plan are required' }, { status: 422 });
    }
    if (!PLAN_MONTHS[plan]) {
      return NextResponse.json({ error: 'Invalid plan. Use monthly, half_yearly or yearly' }, { status: 422 });
    }

    const startDate = new Date();
    const expiryDate = addMonths(startDate, PLAN_MONTHS[plan]);

    const member = await Member.create({
      name: name.trim(),
      phone: phone.trim(),
      email: email?.trim() || '',
      plan,
      startDate,
      expiryDate,
      paymentStatus: 'pending',
      notes: notes?.trim(),
    });

    return NextResponse.json({ member }, { status: 201 });
  } catch (err: unknown) {
    const msg = (err as Error).message;
    if (msg.includes('duplicate') || msg.includes('E11000')) {
      return NextResponse.json({ error: 'A member with this phone number already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
