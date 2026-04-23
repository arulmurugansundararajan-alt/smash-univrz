'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Check, X, Clock } from 'lucide-react';

const BATCHES = [
  { id: 'A', name: 'Batch A – 6 AM', coach: 'Coach Venkat' },
  { id: 'B', name: 'Batch B – 7 AM', coach: 'Coach Pradeep' },
  { id: 'C', name: 'Batch C – 5 PM', coach: 'Coach Venkat' },
];

const STUDENTS_BY_BATCH: Record<string, { id: number; name: string }[]> = {
  A: [
    { id: 1, name: 'Aakash R.' },
    { id: 2, name: 'Karthik M.' },
    { id: 3, name: 'Meena V.' },
    { id: 4, name: 'Hari S.' },
    { id: 5, name: 'Preethi K.' },
  ],
  B: [
    { id: 6, name: 'Nivedha S.' },
    { id: 7, name: 'Surya K.' },
    { id: 8, name: 'Ramesh P.' },
    { id: 9, name: 'Janani T.' },
  ],
  C: [
    { id: 10, name: 'Divya L.' },
    { id: 11, name: 'Vishnu M.' },
    { id: 12, name: 'Anbu K.' },
  ],
};

type Status = 'present' | 'absent' | 'leave' | null;

export default function AttendancePage() {
  const [selectedBatch, setSelectedBatch] = useState('A');
  const [attendance, setAttendance] = useState<Record<number, Status>>({});
  const [saved, setSaved] = useState(false);

  const students = STUDENTS_BY_BATCH[selectedBatch] ?? [];
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const mark = (id: number, status: Status) => {
    setAttendance((prev) => ({ ...prev, [id]: status }));
    setSaved(false);
  };

  const markAll = (status: Status) => {
    const all: Record<number, Status> = {};
    students.forEach((s) => (all[s.id] = status));
    setAttendance(all);
    setSaved(false);
  };

  const unmarked = students.filter((s) => !attendance[s.id]).length;
  const present  = students.filter((s) => attendance[s.id] === 'present').length;
  const absent   = students.filter((s) => attendance[s.id] === 'absent').length;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Mark Attendance</h1>
        <p className="text-sm text-gray-400 mt-0.5">{today}</p>
      </div>

      {/* Batch selector */}
      <div className="flex gap-3 flex-wrap">
        {BATCHES.map((b) => (
          <button
            key={b.id}
            onClick={() => { setSelectedBatch(b.id); setAttendance({}); setSaved(false); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${selectedBatch === b.id
                ? 'bg-yellow-400 text-gray-900'
                : 'bg-gray-800 text-gray-300 hover:text-white'}`}
          >
            {b.name}
          </button>
        ))}
      </div>

      {/* Summary bar */}
      <div className="flex gap-4 bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="flex-1 text-center">
          <p className="text-2xl font-bold text-green-400">{present}</p>
          <p className="text-xs text-gray-400 mt-0.5">Present</p>
        </div>
        <div className="flex-1 text-center">
          <p className="text-2xl font-bold text-red-400">{absent}</p>
          <p className="text-xs text-gray-400 mt-0.5">Absent</p>
        </div>
        <div className="flex-1 text-center">
          <p className="text-2xl font-bold text-gray-400">{unmarked}</p>
          <p className="text-xs text-gray-400 mt-0.5">Unmarked</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-2">
        <button onClick={() => markAll('present')} className="px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg text-xs font-medium hover:bg-green-500/20">
          All Present
        </button>
        <button onClick={() => markAll('absent')} className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs font-medium hover:bg-red-500/20">
          All Absent
        </button>
        <button onClick={() => { setAttendance({}); setSaved(false); }} className="px-3 py-1.5 bg-gray-800 text-gray-400 rounded-lg text-xs font-medium hover:text-white">
          Clear
        </button>
      </div>

      {/* Student list */}
      <div className="space-y-2">
        {students.map((s) => {
          const status = attendance[s.id];
          return (
            <div key={s.id} className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-300">
                  {s.name[0]}
                </div>
                <p className="font-medium text-white text-sm">{s.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => mark(s.id, 'present')}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all
                    ${status === 'present' ? 'bg-green-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-green-500/20 hover:text-green-400'}`}
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => mark(s.id, 'absent')}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all
                    ${status === 'absent' ? 'bg-red-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-red-500/20 hover:text-red-400'}`}
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  onClick={() => mark(s.id, 'leave')}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all
                    ${status === 'leave' ? 'bg-yellow-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-yellow-500/20 hover:text-yellow-400'}`}
                >
                  <Clock className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Save button */}
      <button
        onClick={() => setSaved(true)}
        disabled={unmarked > 0}
        className={`w-full py-3 rounded-xl font-semibold text-sm transition-all
          ${unmarked === 0
            ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-300'
            : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
      >
        {unmarked > 0 ? `Mark ${unmarked} remaining student${unmarked > 1 ? 's' : ''}` : saved ? '✓ Attendance Saved!' : 'Save Attendance'}
      </button>
    </div>
  );
}
