import { NextRequest, NextResponse } from 'next/server';
import { addMonths } from 'date-fns';
import { connectDB } from '@/lib/mongodb';
import { Student } from '@/models/Student';

// GET /api/students?search=&status=&batch=&page=1
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = req.nextUrl;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const batch  = searchParams.get('batch') || '';
    const page   = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit  = Math.min(100, parseInt(searchParams.get('limit') || '20'));

    const query: Record<string, unknown> = { isActive: true };
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
    if (status && status !== 'all') query.feeStatus = status;
    if (batch  && batch  !== 'all') query.batchName = { $regex: batch, $options: 'i' };

    const [students, total] = await Promise.all([
      Student.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Student.countDocuments(query),
    ]);

    return NextResponse.json({ students, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

// POST /api/students
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, phone, parentPhone, email, age, batchName, coachName, level, feeAmount, enrollmentDate: enrollmentDateRaw } = body;

    if (!name || !phone || !batchName || !feeAmount) {
      return NextResponse.json({ error: 'name, phone, batchName and feeAmount are required' }, { status: 422 });
    }

    const enrollmentDate = enrollmentDateRaw ? new Date(enrollmentDateRaw) : new Date();
    const feeDueDate = addMonths(enrollmentDate, 1); // due next month

    const student = await Student.create({
      name: name.trim(), phone: phone.trim(),
      parentPhone: parentPhone?.trim() || '',
      email: email?.trim() || '',
      age: age ? Number(age) : undefined,
      batchName: batchName.trim(),
      coachName: coachName?.trim() || '',
      level: level || 'beginner',
      enrollmentDate,
      feeAmount: Number(feeAmount),
      feeDueDate,
      feeStatus: 'pending',
    });

    return NextResponse.json({ student }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
