import {
  Users,
  GraduationCap,
  AlertTriangle,
  TrendingUp,
  Trophy,
  CreditCard,
  CalendarCheck,
  Bell,
} from 'lucide-react';
import Link from 'next/link';

const stats = [
  { label: 'Total Members',      value: '124',  sub: '+8 this month',   icon: Users,          color: 'text-blue-400',   bg: 'bg-blue-400/10' },
  { label: 'Active Students',    value: '67',   sub: '5 batches',       icon: GraduationCap,  color: 'text-green-400',  bg: 'bg-green-400/10' },
  { label: 'Expiring (3 days)',  value: '9',    sub: 'Send reminders',  icon: AlertTriangle,  color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  { label: 'Revenue (April)',    value: '₹1.2L', sub: '↑ 14% vs March', icon: TrendingUp,     color: 'text-purple-400', bg: 'bg-purple-400/10' },
  { label: 'Tournaments',        value: '2',    sub: '1 ongoing',       icon: Trophy,         color: 'text-orange-400', bg: 'bg-orange-400/10' },
  { label: 'Pending Payments',   value: '18',   sub: '₹54,000 dues',    icon: CreditCard,     color: 'text-red-400',    bg: 'bg-red-400/10' },
];

const expiringMembers = [
  { name: 'Ravi Kumar',   plan: 'Monthly',   expires: 'Apr 21, 2026', phone: '9876543210' },
  { name: 'Priya M.',     plan: 'Quarterly', expires: 'Apr 22, 2026', phone: '9123456780' },
  { name: 'Suresh G.',    plan: 'Monthly',   expires: 'Apr 22, 2026', phone: '9988776655' },
  { name: 'Arun P.',      plan: 'Yearly',    expires: 'Apr 23, 2026', phone: '9876501234' },
  { name: 'Kavitha S.',   plan: 'Monthly',   expires: 'Apr 23, 2026', phone: '9765432109' },
];

const recentPayments = [
  { name: 'Manoj K.',    amount: '₹1,500', purpose: 'Membership Renewal', status: 'paid',    time: '2h ago' },
  { name: 'Sangeetha R.', amount: '₹2,500', purpose: 'Coaching Fee',       status: 'paid',    time: '5h ago' },
  { name: 'Deepak M.',   amount: '₹1,500', purpose: 'Membership Renewal', status: 'pending', time: '1d ago' },
  { name: 'Anitha V.',   amount: '₹2,500', purpose: 'Coaching Fee',       status: 'failed',  time: '2d ago' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">Saturday, April 19, 2026</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-gray-900 font-semibold rounded-lg text-sm hover:bg-yellow-300 transition-colors">
          <Bell className="w-4 h-4" />
          Send Reminders
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-300 font-medium mt-0.5">{s.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Expiring members */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl">
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              Expiring Soon
            </h2>
            <Link href="/members" className="text-xs text-yellow-400 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-800">
            {expiringMembers.map((m) => (
              <div key={m.phone} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">{m.name}</p>
                  <p className="text-xs text-gray-400">{m.plan} · expires {m.expires}</p>
                </div>
                <a
                  href={`https://wa.me/91${m.phone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 rounded-md px-2 py-1 hover:bg-green-500/20 transition-colors"
                >
                  WhatsApp
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Recent payments */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl">
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-purple-400" />
              Recent Payments
            </h2>
            <Link href="/payments" className="text-xs text-yellow-400 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-800">
            {recentPayments.map((p, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.purpose} · {p.time}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">{p.amount}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                    ${p.status === 'paid'    ? 'bg-green-500/10 text-green-400'  : ''}
                    ${p.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400': ''}
                    ${p.status === 'failed'  ? 'bg-red-500/10 text-red-400'      : ''}
                  `}>
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Today's attendance summary */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-green-400" />
            Today&apos;s Attendance
          </h2>
          <Link href="/attendance" className="text-xs text-yellow-400 hover:underline">Mark attendance</Link>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { batch: 'Batch A – 6AM', present: 11, total: 14, color: 'bg-green-400' },
            { batch: 'Batch B – 7AM', present: 9,  total: 12, color: 'bg-blue-400' },
            { batch: 'Batch C – 5PM', present: 0,  total: 15, color: 'bg-gray-400', note: 'Not marked' },
          ].map((b) => (
            <div key={b.batch} className="bg-gray-800 rounded-lg p-3">
              <p className="text-xs font-medium text-gray-300">{b.batch}</p>
              {b.note
                ? <p className="text-xs text-gray-500 mt-1">{b.note}</p>
                : (
                  <>
                    <p className="text-lg font-bold text-white mt-1">{b.present}<span className="text-sm text-gray-400">/{b.total}</span></p>
                    <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div className={`h-full ${b.color} rounded-full`} style={{ width: `${(b.present / b.total) * 100}%` }} />
                    </div>
                  </>
                )
              }
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
