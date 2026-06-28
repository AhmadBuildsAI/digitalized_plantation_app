'use client';

import { ReactNode } from 'react';
import { LogoCompact } from './Logo';
import { useAuthStore } from '@/lib/auth-store';
import { Bell, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

interface DashboardLayoutProps {
  children: ReactNode;
  sidebar: ReactNode;
  title?: string;
  notificationCount?: number;
}

export function DashboardLayout({ children, sidebar, title, notificationCount = 0 }: DashboardLayoutProps) {
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-brand-background flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-brand-primary flex flex-col transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-white/10">
          <LogoCompact />
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">{sidebar}</nav>
        <div className="p-4 border-t border-white/10">
          <div className="text-white/70 text-sm mb-3 px-2">
            {user?.firstName} {user?.lastName}
            <div className="text-white/50 text-xs">{user?.email}</div>
          </div>
          <button
            onClick={() => logout()}
            className="sidebar-link w-full text-red-300 hover:text-red-200 hover:bg-red-500/10"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-100 px-4 lg:px-8 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            {title && <h1 className="text-xl font-bold text-gray-900">{title}</h1>}
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <Bell size={20} className="text-gray-600" />
              {notificationCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>
            <div className="w-9 h-9 rounded-full bg-brand-accent flex items-center justify-center text-white font-semibold text-sm">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

export function SidebarLink({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <a href={href} className={active ? 'sidebar-link-active' : 'sidebar-link'}>
      {icon}
      {label}
    </a>
  );
}

export function StatCard({
  title,
  value,
  icon,
  trend,
  color = 'primary',
}: {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  color?: 'primary' | 'success' | 'warning' | 'error';
}) {
  const colors = {
    primary: 'bg-brand-primary/10 text-brand-primary',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-amber-100 text-amber-700',
    error: 'bg-red-100 text-red-700',
  };

  return (
    <div className="card animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-3xl font-bold mt-1 text-gray-900">{value}</p>
          {trend && <p className="text-xs text-gray-400 mt-1">{trend}</p>}
        </div>
        <div className={`p-3 rounded-xl ${colors[color]}`}>{icon}</div>
      </div>
    </div>
  );
}

export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-24 w-full rounded-2xl" />
      ))}
    </div>
  );
}

export function EmptyState({ title, description, icon }: { title: string; description: string; icon?: ReactNode }) {
  return (
    <div className="card text-center py-12">
      {icon && <div className="flex justify-center mb-4 text-gray-300">{icon}</div>}
      <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
      <p className="text-gray-500 mt-1 text-sm">{description}</p>
    </div>
  );
}

export function Toast({ message, type = 'success', onClose }: { message: string; type?: 'success' | 'error'; onClose: () => void }) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white font-medium animate-fade-in ${
        type === 'success' ? 'bg-brand-primary' : 'bg-red-600'
      }`}
    >
      <div className="flex items-center gap-3">
        {message}
        <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">✕</button>
      </div>
    </div>
  );
}
