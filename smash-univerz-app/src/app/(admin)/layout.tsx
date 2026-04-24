'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CalendarCheck,
  Trophy,
  CreditCard,
  Menu,
  X,
  Dumbbell,
  Bell,
  Tags,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { useState } from 'react';

const ALL_NAV = [
  { href: '/dashboard',   label: 'Dashboard',  icon: LayoutDashboard, adminOnly: true },
  { href: '/members',     label: 'Members',     icon: Users,           adminOnly: false },
  { href: '/students',    label: 'Students',    icon: GraduationCap,   adminOnly: false },
  { href: '/attendance',  label: 'Attendance',  icon: CalendarCheck,   adminOnly: false },
  { href: '/tournaments', label: 'Tournaments', icon: Trophy,          adminOnly: false },
  { href: '/payments',    label: 'Payments',    icon: CreditCard,      adminOnly: true },
  { href: '/plans',       label: 'Plans',       icon: Tags,            adminOnly: true },
  { href: '/users',       label: 'Users',       icon: ShieldCheck,     adminOnly: true },
  { href: '/reminders',   label: 'Reminders',   icon: Bell,            adminOnly: true },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: session } = useSession();

  const role = (session?.user as { role?: string } | undefined)?.role;
  const name = session?.user?.name ?? 'User';
  const isAdmin = role === 'admin';

  const navItems = ALL_NAV.filter(n => !n.adminOnly || isAdmin);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 border-r border-gray-800 flex flex-col transform transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 p-5 border-b border-gray-800">
          <div className="w-9 h-9 bg-yellow-400 rounded-lg flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-gray-900" />
          </div>
          <div>
            <p className="font-bold text-sm text-white leading-tight">SMASH UNIVERZ</p>
            <p className="text-xs text-gray-400">Admin Panel</p>
          </div>
          <button
            className="ml-auto lg:hidden text-gray-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${active
                    ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User info + logout */}
        <div className="p-4 border-t border-gray-800 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-yellow-400/20 flex items-center justify-center text-yellow-400 font-bold text-sm shrink-0">
              {name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{name}</p>
              <p className="text-xs text-gray-500 capitalize">{role ?? 'loading…'}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center px-4 gap-4 sticky top-0 z-30">
          <button
            className="lg:hidden text-gray-400 hover:text-white"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold text-white capitalize">
            {navItems.find(n => pathname === n.href || pathname.startsWith(n.href + '/'))?.label ?? 'Admin'}
          </span>
          <div className="ml-auto flex items-center gap-3">
            {role && (
              <span className={`text-xs px-2 py-0.5 rounded-full border ${
                isAdmin ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
              }`}>{role}</span>
            )}
            <div className="w-8 h-8 rounded-full bg-yellow-400/20 flex items-center justify-center text-yellow-400 font-bold text-sm">
              {name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-3 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
