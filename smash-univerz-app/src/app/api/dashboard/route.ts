import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Member } from '@/models/Member';
import { Student } from '@/models/Student';
import { Tournament } from '@/models/Tournament';

export async function GET() {
  try {
    await connectDB();

    const now = new Date();
    const threeDays = new Date(now.getTime() + 3 * 86400000);
    const sevenDays = new Date(now.getTime() + 7 * 86400000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalMembers,
      activeMembers,
      totalStudents,
      activeStudents,
      expiring3d,
      expiring7d,
      overdueMembers,
      overdueStudents,
      ongoingTournaments,
      upcomingTournaments,
      recentMembers,
      recentStudents,
    ] = await Promise.all([
      Member.countDocuments(),
      Member.countDocuments({ isActive: true }),
      Student.countDocuments(),
      Student.countDocuments({ isActive: true }),
      Member.countDocuments({ isActive: true, expiryDate: { $gte: now, $lte: threeDays } }),
      Member.countDocuments({ isActive: true, expiryDate: { $gte: now, $lte: sevenDays } }),
      Member.countDocuments({ isActive: true, paymentStatus: 'overdue' }),
      Student.countDocuments({ isActive: true, feeStatus: { $in: ['pending', 'overdue'] } }),
      Tournament.countDocuments({ status: 'ongoing' }),
      Tournament.countDocuments({ status: 'setup' }),
      // recent 5 members expiring soon
      Member.find({ isActive: true, expiryDate: { $gte: now, $lte: sevenDays } })
        .sort({ expiryDate: 1 })
        .limit(5)
        .select('name phone plan expiryDate paymentStatus'),
      // students with pending fees
      Student.find({ isActive: true, feeStatus: { $in: ['pending', 'overdue'] } })
        .sort({ feeDueDate: 1 })
        .limit(5)
        .select('name phone batchName feeAmount feeStatus feeDueDate'),
    ]);

    // Revenue this month (paid members + paid students)
    const [memberRevenue, studentRevenue] = await Promise.all([
      Member.aggregate([
        { $match: { isActive: true, paymentStatus: 'paid', paidAt: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: '$paidAmount' } } },
      ]),
      Student.aggregate([
        { $match: { isActive: true, feeStatus: 'paid', paidAt: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: '$paidAmount' } } },
      ]),
    ]);

    const revenueThisMonth = (memberRevenue[0]?.total ?? 0) + (studentRevenue[0]?.total ?? 0);

    return NextResponse.json({
      stats: {
        totalMembers,
        activeMembers,
        totalStudents,
        activeStudents,
        expiring3d,
        expiring7d,
        overdueMembers,
        overdueStudents,
        ongoingTournaments,
        upcomingTournaments,
        revenueThisMonth,
      },
      expiringMembers: recentMembers,
      pendingStudents: recentStudents,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
