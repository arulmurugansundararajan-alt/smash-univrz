'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Bell, Send, Clock, Calendar, Users,
  CheckCircle, XCircle, Loader2, RefreshCw, AlertCircle,
} from 'lucide-react';

type TargetGroup = 'all_active' | 'overdue' | 'expiring_3d' | 'expiring_7d';
type ReminderStatus = 'scheduled' | 'sending' | 'sent' | 'failed';

interface ReminderJob {
  _id: string;
  title: string;
  targetGroup: TargetGroup;
  scheduledAt: string;
  status: ReminderStatus;
  sentCount: number;
  failedCount: number;
  totalCount: number;
  sentAt?: string;
  errorMsg?: string;
  createdAt: string;
}

const GROUP_LABELS: Record<TargetGroup, { label: string; desc: string; color: string }> = {
  all_active:   { label: 'All Active Members',   desc: 'All members with active account',       color: 'text-blue-400'   },
  overdue:      { label: 'Overdue Members',       desc: 'Membership expired, not renewed',        color: 'text-red-400'    },
  expiring_3d:  { label: 'Expiring in 3 Days',    desc: 'Membership expires within 3 days',       color: 'text-orange-400' },
  expiring_7d:  { label: 'Expiring in 7 Days',    desc: 'Membership expires within 7 days',       color: 'text-yellow-400' },
};

const STATUS_BADGE: Record<ReminderStatus, { label: string; cls: string }> = {
  scheduled: { label: 'Scheduled', cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  sending:   { label: 'Sending…',  cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 animate-pulse' },
  sent:      { label: 'Sent',      cls: 'bg-green-500/20 text-green-400 border-green-500/30' },
  failed:    { label: 'Failed',    cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

function fmt(d: string) {
  return new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function RemindersPage() {
  const [jobs, setJobs]           = useState<ReminderJob[]>([]);
  const [loading, setLoading]     = useState(true);
  const [preview, setPreview]     = useState<Record<TargetGroup, number>>({} as Record<TargetGroup, number>);
  const [showForm, setShowForm]   = useState(false);
  const [sending, setSending]     = useState<Record<string, boolean>>({});

  // Form state
  const [form, setForm] = useState({
    title:       '',
    targetGroup: 'overdue' as TargetGroup,
    sendNow:     true,
    scheduledAt: '', // ISO local datetime
  });
  const [creating, setCreating]     = useState(false);
  const [createErr, setCreateErr]   = useState('');

  // Load jobs
  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reminders');
      if (res.ok) setJobs(await res.json());
    } finally { setLoading(false); }
  }, []);

  // Load preview counts
  const loadPreview = useCallback(async () => {
    const groups: TargetGroup[] = ['all_active', 'overdue', 'expiring_3d', 'expiring_7d'];
    const results = await Promise.all(
      groups.map(async (g) => {
        const res = await fetch(`/api/reminders/preview?group=${g}`);
        const data = res.ok ? await res.json() : { count: 0 };
        return [g, data.count] as [TargetGroup, number];
      }),
    );
    setPreview(Object.fromEntries(results) as Record<TargetGroup, number>);
  }, []);

  useEffect(() => {
    loadJobs();
    loadPreview();
  }, [loadJobs, loadPreview]);

  // Create / send reminder
  const handleCreate = async () => {
    setCreateErr('');
    if (!form.title.trim()) { setCreateErr('Title is required'); return; }
    if (!form.sendNow && !form.scheduledAt) { setCreateErr('Please pick a schedule date/time'); return; }
    setCreating(true);
    try {
      const body: Record<string, unknown> = {
        title: form.title,
        targetGroup: form.targetGroup,
        sendNow: form.sendNow,
      };
      if (!form.sendNow) body.scheduledAt = new Date(form.scheduledAt).toISOString();
      const res = await fetch('/api/reminders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const d = await res.json(); setCreateErr(d.error ?? 'Failed'); return; }
      setShowForm(false);
      setForm({ title: '', targetGroup: 'overdue', sendNow: true, scheduledAt: '' });
      await loadJobs();
    } finally { setCreating(false); }
  };

  // Manually trigger a scheduled job
  const triggerJob = async (jobId: string) => {
    setSending((s) => ({ ...s, [jobId]: true }));
    try {
      await fetch(`/api/reminders/${jobId}/send`, { method: 'POST' });
      await loadJobs();
    } finally { setSending((s) => ({ ...s, [jobId]: false })); }
  };

  // Preselect a default title when group changes
  const groupLabel = (g: TargetGroup) => GROUP_LABELS[g].label;

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-yellow-400" /> Fee Reminders
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Send WhatsApp reminders to members for fee renewal</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setForm((f) => ({ ...f, title: `Fee Reminder – ${groupLabel(f.targetGroup)}` }));
          }}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-gray-900 font-bold rounded-xl text-sm hover:bg-yellow-300 w-fit">
          <Send className="w-4 h-4" /> New Reminder
        </button>
      </div>

      {/* Member stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(Object.entries(GROUP_LABELS) as [TargetGroup, typeof GROUP_LABELS[TargetGroup]][]).map(([key, meta]) => (
          <div key={key} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <p className={`text-2xl font-black ${meta.color}`}>{preview[key] ?? '–'}</p>
            <p className="text-xs text-gray-400 mt-1 leading-snug">{meta.label}</p>
          </div>
        ))}
      </div>

      {/* WhatsApp setup notice (shown when env vars not set) */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl px-4 py-3 flex gap-3">
        <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <div className="text-xs text-gray-400 space-y-1">
          <p className="text-blue-300 font-semibold">WhatsApp Integration via WATI</p>
          <p>Requires <code className="text-gray-300">WATI_API_ENDPOINT</code> and <code className="text-gray-300">WATI_API_TOKEN</code> environment variables.</p>
          <p>Templates used: <code className="text-gray-300">membership_expiry_reminder</code> — params: name, expiry date, payment link.</p>
        </div>
      </div>

      {/* Reminder history */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h2 className="font-semibold text-white text-sm">History</h2>
          <button onClick={loadJobs} className="text-gray-500 hover:text-gray-300">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 text-yellow-400 animate-spin" /></div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No reminders sent yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {jobs.map((job) => (
              <div key={job._id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Left */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-white text-sm">{job.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_BADGE[job.status].cls}`}>
                      {STATUS_BADGE[job.status].label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />{GROUP_LABELS[job.targetGroup]?.label ?? job.targetGroup}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />{fmt(job.scheduledAt)}
                    </span>
                    {job.sentAt && (
                      <span className="flex items-center gap-1 text-green-400/70">
                        <Clock className="w-3 h-3" />Sent {fmt(job.sentAt)}
                      </span>
                    )}
                  </div>
                  {(job.sentCount > 0 || job.failedCount > 0) && (
                    <div className="flex items-center gap-3 text-xs flex-wrap">
                      {job.sentCount > 0 && (
                        <span className="flex items-center gap-1 text-green-400">
                          <CheckCircle className="w-3 h-3" /> {job.sentCount} sent
                        </span>
                      )}
                      {job.failedCount > 0 && (
                        <span className="flex items-center gap-1 text-red-400">
                          <XCircle className="w-3 h-3" /> {job.failedCount} failed
                        </span>
                      )}
                      {job.totalCount > 0 && (
                        <span className="text-gray-600">/ {job.totalCount} total</span>
                      )}
                    </div>
                  )}
                  {job.errorMsg && (
                    <p className="text-xs text-red-400/70 truncate">{job.errorMsg}</p>
                  )}
                </div>

                {/* Actions */}
                {(job.status === 'scheduled' || job.status === 'failed') && (
                  <button
                    onClick={() => triggerJob(job._id)}
                    disabled={sending[job._id]}
                    className="flex items-center gap-1.5 px-3 py-2 bg-yellow-400/10 text-yellow-400 border border-yellow-400/30
                      rounded-lg text-xs font-semibold hover:bg-yellow-400/20 disabled:opacity-50 shrink-0 touch-manipulation">
                    {sending[job._id] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    {sending[job._id] ? 'Sending…' : 'Send Now'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md flex flex-col max-h-[95vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-800 shrink-0">
              <h2 className="font-bold text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-yellow-400" /> New Reminder
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white text-xl leading-none">×</button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
              {createErr && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg px-3 py-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />{createErr}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g., April Fee Reminder"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white
                    placeholder-gray-500 focus:outline-none focus:border-yellow-400" />
              </div>

              {/* Target group */}
              <div>
                <label className="block text-xs text-gray-400 mb-2">Send To</label>
                <div className="space-y-2">
                  {(Object.entries(GROUP_LABELS) as [TargetGroup, typeof GROUP_LABELS[TargetGroup]][]).map(([key, meta]) => (
                    <label key={key} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors
                      ${form.targetGroup === key ? 'border-yellow-400/60 bg-yellow-400/5' : 'border-gray-700 hover:border-gray-600'}`}>
                      <input type="radio" name="group" value={key} checked={form.targetGroup === key}
                        onChange={() => setForm((f) => ({ ...f, targetGroup: key, title: `Fee Reminder – ${meta.label}` }))}
                        className="accent-yellow-400" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-semibold ${meta.color}`}>{meta.label}</p>
                          {preview[key] !== undefined && (
                            <span className="text-xs bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded-md">{preview[key]} members</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{meta.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Send mode */}
              <div>
                <label className="block text-xs text-gray-400 mb-2">When to Send</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setForm((f) => ({ ...f, sendNow: true }))}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-sm font-semibold transition-colors
                      ${form.sendNow ? 'bg-yellow-400/10 border-yellow-400/60 text-yellow-300' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}>
                    <Send className="w-3.5 h-3.5" /> Send Now
                  </button>
                  <button
                    onClick={() => setForm((f) => ({ ...f, sendNow: false }))}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-sm font-semibold transition-colors
                      ${!form.sendNow ? 'bg-blue-500/10 border-blue-500/50 text-blue-300' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}>
                    <Clock className="w-3.5 h-3.5" /> Schedule
                  </button>
                </div>

                {!form.sendNow && (
                  <div className="mt-3">
                    <input
                      type="datetime-local"
                      value={form.scheduledAt}
                      onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white
                        focus:outline-none focus:border-blue-400" />
                    <p className="text-xs text-gray-500 mt-1">Auto-triggered by daily cron at 9 AM IST, or use the Send button in history.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-800 flex gap-3 shrink-0">
              <button onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2.5 border border-gray-700 text-gray-300 rounded-xl text-sm hover:bg-gray-800">
                Cancel
              </button>
              <button onClick={handleCreate} disabled={creating}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow-400 text-gray-900 font-bold rounded-xl text-sm hover:bg-yellow-300 disabled:opacity-50">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {creating ? (form.sendNow ? 'Sending…' : 'Scheduling…') : (form.sendNow ? 'Send Now' : 'Schedule')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
