'use client';

import { CreditCard, TrendingUp, ArrowUpRight } from 'lucide-react';

const PAYMENTS = [
  { id: 1, name: 'Ravi Kumar',    amount: 1500, purpose: 'Membership Renewal', status: 'paid',    date: 'Apr 19, 2026', method: 'UPI' },
  { id: 2, name: 'Manoj K.',      amount: 1500, purpose: 'Membership Renewal', status: 'paid',    date: 'Apr 18, 2026', method: 'Card' },
  { id: 3, name: 'Nivedha S.',    amount: 2500, purpose: 'Coaching Fee',       status: 'pending', date: 'Apr 18, 2026', method: '—' },
  { id: 4, name: 'Sangeetha R.',  amount: 2500, purpose: 'Coaching Fee',       status: 'paid',    date: 'Apr 17, 2026', method: 'UPI' },
  { id: 5, name: 'Deepak M.',     amount: 1500, purpose: 'Membership Renewal', status: 'pending', date: 'Apr 16, 2026', method: '—' },
  { id: 6, name: 'Arun P.',       amount: 14000, purpose: 'Membership Renewal', status: 'paid',   date: 'Apr 15, 2026', method: 'Net Banking' },
  { id: 7, name: 'Divya L.',      amount: 2500, purpose: 'Coaching Fee',       status: 'failed',  date: 'Apr 14, 2026', method: '—' },
  { id: 8, name: 'Surya K.',      amount: 200,  purpose: 'Tournament Entry',   status: 'paid',    date: 'Apr 13, 2026', method: 'UPI' },
];

const STATUS_BADGE: Record<string, string> = {
  paid:    'bg-green-500/10 text-green-400 border-green-500/20',
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  failed:  'bg-red-500/10 text-red-400 border-red-500/20',
};

const totalPaid    = PAYMENTS.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
const totalPending = PAYMENTS.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);

export default function PaymentsPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Payments</h1>
        <p className="text-sm text-gray-400 mt-0.5">Transaction history and payment links</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-green-400 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-medium uppercase">Collected</span>
          </div>
          <p className="text-2xl font-bold text-white">₹{(totalPaid).toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-0.5">{PAYMENTS.filter(p => p.status === 'paid').length} transactions</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-yellow-400 mb-2">
            <CreditCard className="w-4 h-4" />
            <span className="text-xs font-medium uppercase">Pending</span>
          </div>
          <p className="text-2xl font-bold text-white">₹{(totalPending).toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-0.5">{PAYMENTS.filter(p => p.status === 'pending').length} pending links</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-blue-400 mb-2">
            <ArrowUpRight className="w-4 h-4" />
            <span className="text-xs font-medium uppercase">This Month</span>
          </div>
          <p className="text-2xl font-bold text-white">₹{(totalPaid + totalPending).toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-0.5">Total invoiced Apr 2026</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Purpose</th>
                <th className="text-left px-4 py-3 font-medium">Amount</th>
                <th className="text-left px-4 py-3 font-medium">Method</th>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {PAYMENTS.map((p) => (
                <tr key={p.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-white">{p.name}</td>
                  <td className="px-4 py-3 text-gray-300">{p.purpose}</td>
                  <td className="px-4 py-3 text-white font-semibold">₹{p.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-300">{p.method}</td>
                  <td className="px-4 py-3 text-gray-300">{p.date}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_BADGE[p.status]}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {p.status === 'pending' && (
                      <button className="text-xs bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 px-2 py-1 rounded hover:bg-yellow-400/20 transition-colors">
                        Resend Link
                      </button>
                    )}
                    {p.status === 'paid' && (
                      <button className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                        Receipt
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
