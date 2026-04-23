'use client';

import { useState } from 'react';
import { Plus, Search, Filter, MoreVertical, Phone, Mail } from 'lucide-react';

const MEMBERS = [
  { id: 1, name: 'Ravi Kumar',    phone: '9876543210', email: 'ravi@gmail.com',   plan: 'Monthly',   status: 'paid',    expiry: 'Apr 21, 2026', joined: 'Jan 2025' },
  { id: 2, name: 'Priya M.',      phone: '9123456780', email: 'priya@gmail.com',  plan: 'Quarterly', status: 'paid',    expiry: 'Apr 22, 2026', joined: 'Feb 2025' },
  { id: 3, name: 'Suresh G.',     phone: '9988776655', email: '',                 plan: 'Monthly',   status: 'overdue', expiry: 'Apr 10, 2026', joined: 'Mar 2024' },
  { id: 4, name: 'Arun P.',       phone: '9876501234', email: 'arun@gmail.com',   plan: 'Yearly',    status: 'paid',    expiry: 'Dec 31, 2026', joined: 'Jan 2026' },
  { id: 5, name: 'Kavitha S.',    phone: '9765432109', email: 'kavitha@mail.com', plan: 'Monthly',   status: 'pending', expiry: 'Apr 23, 2026', joined: 'Mar 2026' },
  { id: 6, name: 'Manoj K.',      phone: '9876500001', email: '',                 plan: 'Monthly',   status: 'paid',    expiry: 'May 15, 2026', joined: 'Apr 2026' },
  { id: 7, name: 'Sangeetha R.',  phone: '9000011111', email: 'sang@gmail.com',   plan: 'Quarterly', status: 'paid',    expiry: 'Jun 30, 2026', joined: 'Apr 2026' },
  { id: 8, name: 'Deepak M.',     phone: '9555544444', email: '',                 plan: 'Monthly',   status: 'pending', expiry: 'Apr 25, 2026', joined: 'Mar 2026' },
];

const STATUS_BADGE: Record<string, string> = {
  paid:    'bg-green-500/10 text-green-400 border-green-500/20',
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  overdue: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function MembersPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);

  const filtered = MEMBERS.filter((m) => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.phone.includes(search);
    const matchFilter = filter === 'all' || m.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Members</h1>
          <p className="text-sm text-gray-400 mt-0.5">{MEMBERS.length} total members</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-gray-900 font-semibold rounded-lg text-sm hover:bg-yellow-300 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Member
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          {['all', 'paid', 'pending', 'overdue'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors
                ${filter === f
                  ? 'bg-yellow-400 text-gray-900'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-medium">Member</th>
                <th className="text-left px-4 py-3 font-medium">Plan</th>
                <th className="text-left px-4 py-3 font-medium">Expiry</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{m.name}</div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Phone className="w-3 h-3" />{m.phone}
                      </span>
                      {m.email && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Mail className="w-3 h-3" />{m.email}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-300">{m.plan}</td>
                  <td className="px-4 py-3 text-gray-300">{m.expiry}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_BADGE[m.status]}`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://wa.me/91${m.phone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded hover:bg-green-500/20 transition-colors"
                      >
                        WhatsApp
                      </a>
                      <button className="text-gray-500 hover:text-white transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-center text-gray-500 py-10 text-sm">No members found.</p>
          )}
        </div>
      </div>

      {/* Add Member Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Add New Member</h2>
            <div className="space-y-3">
              {[
                { label: 'Full Name',    name: 'name',  placeholder: 'e.g. Ravi Kumar' },
                { label: 'Phone',        name: 'phone', placeholder: '10-digit mobile number' },
                { label: 'Email',        name: 'email', placeholder: 'optional' },
              ].map(({ label, name, placeholder }) => (
                <div key={name}>
                  <label className="block text-xs text-gray-400 mb-1">{label}</label>
                  <input
                    type="text"
                    placeholder={placeholder}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Membership Plan</label>
                <select className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-yellow-400">
                  <option value="monthly">Monthly – ₹1,500</option>
                  <option value="quarterly">Quarterly – ₹4,000</option>
                  <option value="yearly">Yearly – ₹14,000</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 bg-yellow-400 text-gray-900 font-semibold rounded-lg text-sm hover:bg-yellow-300 transition-colors"
              >
                Add Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
