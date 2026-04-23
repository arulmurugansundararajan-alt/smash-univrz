'use client';

import { useState } from 'react';
import { Plus, Search, ChevronDown } from 'lucide-react';

const BATCHES = [
  { id: 'A', name: 'Batch A – 6 AM', coach: 'Coach Venkat',  days: 'Mon–Sat', students: 14, max: 15 },
  { id: 'B', name: 'Batch B – 7 AM', coach: 'Coach Pradeep', days: 'Mon–Sat', students: 12, max: 12 },
  { id: 'C', name: 'Batch C – 5 PM', coach: 'Coach Venkat',  days: 'Mon–Fri', students: 10, max: 15 },
];

const STUDENTS = [
  { id: 1, name: 'Aakash R.',   batch: 'A', phone: '9876543210', fee: 2500, feeStatus: 'paid',    dueDate: 'May 1, 2026',  level: 'beginner' },
  { id: 2, name: 'Nivedha S.',  batch: 'B', phone: '9123456780', fee: 2500, feeStatus: 'pending', dueDate: 'Apr 25, 2026', level: 'intermediate' },
  { id: 3, name: 'Karthik M.', batch: 'A', phone: '9988776655', fee: 2500, feeStatus: 'paid',    dueDate: 'May 1, 2026',  level: 'advanced' },
  { id: 4, name: 'Divya L.',    batch: 'C', phone: '9876501234', fee: 2500, feeStatus: 'overdue', dueDate: 'Apr 10, 2026', level: 'beginner' },
  { id: 5, name: 'Surya K.',    batch: 'B', phone: '9765432109', fee: 2500, feeStatus: 'paid',    dueDate: 'May 1, 2026',  level: 'beginner' },
  { id: 6, name: 'Meena V.',    batch: 'A', phone: '9876500002', fee: 2500, feeStatus: 'pending', dueDate: 'Apr 28, 2026', level: 'intermediate' },
];

const STATUS_BADGE: Record<string, string> = {
  paid:    'bg-green-500/10 text-green-400 border-green-500/20',
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  overdue: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const LEVEL_BADGE: Record<string, string> = {
  beginner:     'bg-blue-500/10 text-blue-400',
  intermediate: 'bg-purple-500/10 text-purple-400',
  advanced:     'bg-orange-500/10 text-orange-400',
};

export default function StudentsPage() {
  const [search, setSearch] = useState('');
  const [batchFilter, setBatchFilter] = useState('all');

  const filtered = STUDENTS.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchBatch = batchFilter === 'all' || s.batch === batchFilter;
    return matchSearch && matchBatch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Students</h1>
          <p className="text-sm text-gray-400 mt-0.5">{STUDENTS.length} enrolled across {BATCHES.length} batches</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-gray-900 font-semibold rounded-lg text-sm hover:bg-yellow-300 transition-colors">
          <Plus className="w-4 h-4" /> Enroll Student
        </button>
      </div>

      {/* Batch cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {BATCHES.map((b) => (
          <div
            key={b.id}
            onClick={() => setBatchFilter(batchFilter === b.id ? 'all' : b.id)}
            className={`bg-gray-900 border rounded-xl p-4 cursor-pointer transition-all
              ${batchFilter === b.id ? 'border-yellow-400/60 shadow-lg shadow-yellow-400/5' : 'border-gray-800 hover:border-gray-700'}`}
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-white text-sm">{b.name}</p>
              <span className="text-xs text-gray-400">{b.days}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">{b.coach}</p>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 rounded-full"
                  style={{ width: `${(b.students / b.max) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-400">{b.students}/{b.max}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search students..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400"
        />
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-medium">Student</th>
                <th className="text-left px-4 py-3 font-medium">Batch</th>
                <th className="text-left px-4 py-3 font-medium">Level</th>
                <th className="text-left px-4 py-3 font-medium">Fee</th>
                <th className="text-left px-4 py-3 font-medium">Due Date</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    {BATCHES.find(b => b.id === s.batch)?.name.split('–')[0].trim()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${LEVEL_BADGE[s.level]}`}>
                      {s.level}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-300 font-medium">₹{s.fee.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-300">{s.dueDate}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_BADGE[s.feeStatus]}`}>
                      {s.feeStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`https://wa.me/91${s.phone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded hover:bg-green-500/20 transition-colors"
                    >
                      WhatsApp
                    </a>
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
