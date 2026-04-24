import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Plan } from '@/models/Plan';

export async function GET() {
  try {
    await connectDB();
    let plans = await Plan.find().sort({ durationMonths: 1 });
    if (plans.length === 0) {
      // Seed defaults
      await Plan.insertMany([
        { name: 'Monthly Plan',      slug: 'monthly',     durationMonths: 1,  price: 1500, isActive: true },
        { name: 'Half-Yearly Plan',  slug: 'half_yearly', durationMonths: 6,  price: 7500, isActive: true },
        { name: 'Yearly Plan',       slug: 'yearly',      durationMonths: 12, price: 12000, isActive: true },
      ]);
      plans = await Plan.find().sort({ durationMonths: 1 });
    }
    return NextResponse.json({ plans });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const plan = await Plan.create({
      name: body.name,
      slug: body.slug,
      durationMonths: Number(body.durationMonths),
      price: Number(body.price),
      isActive: body.isActive ?? true,
    });
    return NextResponse.json({ plan }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
