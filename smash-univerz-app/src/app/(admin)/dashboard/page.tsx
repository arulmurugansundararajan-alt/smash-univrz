"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users, GraduationCap, AlertTriangle, TrendingUp,
  Trophy, CreditCard, RefreshCw, Clock,
} from "lucide-react";
import { format } from "date-fns";

interface Stats {
  totalMembers: number; activeMembers: number;
  totalStudents: number; activeStudents: number;
  expiring3d: number; expiring7d: number;
  overdueMembers: number; overdueStudents: number;
  ongoingTournaments: number; upcomingTournaments: number;
  revenueThisMonth: number;
}
interface ExpiringMember { _id: string; name: string; phone: string; plan: string; expiryDate: string; paymentStatus: string; }
interface PendingStudent  { _id: string; name: string; phone: string; batchName: string; feeAmount: number; feeStatus: string; feeDueDate: string; }

const PLAN_LABEL: Record<string, string> = { monthly: "Monthly", half_yearly: "Half-Yearly", yearly: "Yearly" };

export default function DashboardPage() {
  const [now, setNow] = useState(new Date());
  const [stats, setStats] = useState<Stats | null>(null);
  const [expiring, setExpiring] = useState<ExpiringMember[]>([]);
  const [pending, setPending] = useState<PendingStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setStats(data.stats);
      setExpiring(data.expiringMembers);
      setPending(data.pendingStudents);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const statCards = stats ? [
    { label: "Active Members",    value: stats.activeMembers,   sub: `${stats.totalMembers} total`,         icon: Users,         color: "text-blue-400",   bg: "bg-blue-400/10" },
    { label: "Active Students",   value: stats.activeStudents,  sub: `${stats.totalStudents} total`,        icon: GraduationCap, color: "text-green-400",  bg: "bg-green-400/10" },
    { label: "Expiring (3 days)", value: stats.expiring3d,      sub: `${stats.expiring7d} in 7 days`,      icon: AlertTriangle, color: "text-yellow-400", bg: "bg-yellow-400/10" },
    { label: "Revenue (Month)",   value: `\u20B9${stats.revenueThisMonth.toLocaleString("en-IN")}`, sub: "payments this month", icon: TrendingUp, color: "text-purple-400", bg: "bg-purple-400/10" },
    { label: "Live Tournaments",  value: stats.ongoingTournaments, sub: `${stats.upcomingTournaments} upcoming`, icon: Trophy,   color: "text-orange-400", bg: "bg-orange-400/10" },
    { label: "Overdue Payments",  value: stats.overdueMembers + stats.overdueStudents, sub: "members + students", icon: CreditCard, color: "text-red-400", bg: "bg-red-400/10" },
  ] : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <div className="flex items-center gap-2 mt-1">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <p className="text-sm text-gray-400">
              {format(now, "EEEE, dd MMM yyyy")} &nbsp;&bull;&nbsp;
              <span className="font-mono text-yellow-400">{format(now, "hh:mm:ss aa")}</span>
            </p>
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">{error}</div>}

      {/* Stats grid */}
      {loading && !stats ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 animate-pulse h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {statCards.map((s) => (
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
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Expiring members */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl">
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <h2 className="font-semibold text-white flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-yellow-400" /> Expiring Soon (7 days)
            </h2>
            <Link href="/members" className="text-xs text-yellow-400 hover:underline">View all</Link>
          </div>
          {expiring.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">{loading ? "Loading..." : "No expiring members"}</p>
          ) : (
            <div className="divide-y divide-gray-800">
              {expiring.map((m) => (
                <div key={m._id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-white">{m.name}</p>
                    <p className="text-xs text-gray-400">
                      {PLAN_LABEL[m.plan] ?? m.plan} &bull; expires {format(new Date(m.expiryDate), "dd MMM yyyy")}
                    </p>
                  </div>
                  <a
                    href={`https://wa.me/91${m.phone}`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 rounded-md px-2 py-1 hover:bg-green-500/20 transition-colors shrink-0"
                  >
                    WhatsApp
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending student fees */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl">
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <h2 className="font-semibold text-white flex items-center gap-2 text-sm">
              <CreditCard className="w-4 h-4 text-red-400" /> Pending Student Fees
            </h2>
            <Link href="/students" className="text-xs text-yellow-400 hover:underline">View all</Link>
          </div>
          {pending.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">{loading ? "Loading..." : "No pending fees"}</p>
          ) : (
            <div className="divide-y divide-gray-800">
              {pending.map((s) => (
                <div key={s._id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-white">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.batchName} &bull; due {format(new Date(s.feeDueDate), "dd MMM yyyy")}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-white">\u20B9{s.feeAmount.toLocaleString("en-IN")}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.feeStatus === "overdue" ? "bg-red-500/10 text-red-400" : "bg-yellow-500/10 text-yellow-400"}`}>
                      {s.feeStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
