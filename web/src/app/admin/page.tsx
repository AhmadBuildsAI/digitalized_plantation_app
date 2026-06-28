'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Leaf,
  AlertTriangle,
  MessageSquare,
  Activity,
  Shield,
} from 'lucide-react';
import { DashboardLayout, SidebarLink, StatCard, LoadingSkeleton } from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api';

interface AdminStats {
  stats: {
    totalCustomers: number;
    activeCustomers: number;
    totalPlantations: number;
    openTickets: number;
    criticalAlerts: number;
    onlinePlantations: number;
  };
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { accessToken, isAuthenticated, isInternal } = useAuthStore();
  const [stats, setStats] = useState<AdminStats['stats'] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated() || !isInternal()) {
      router.replace('/login');
      return;
    }
    if (accessToken) {
      api<AdminStats>('/admin/dashboard', { token: accessToken })
        .then((d) => setStats(d.stats))
        .finally(() => setLoading(false));
    }
  }, [accessToken, isAuthenticated, isInternal, router]);

  const sidebar = (
    <>
      <SidebarLink href="/admin" icon={<LayoutDashboard size={18} />} label="Dashboard" active />
      <SidebarLink href="/admin/customers" icon={<Users size={18} />} label="Customers" />
      <SidebarLink href="/admin/plantations" icon={<Leaf size={18} />} label="Plantations" />
      <SidebarLink href="/admin/emergencies" icon={<AlertTriangle size={18} />} label="Emergencies" />
      <SidebarLink href="/admin/tickets" icon={<MessageSquare size={18} />} label="Support Tickets" />
      <SidebarLink href="/admin/activity" icon={<Activity size={18} />} label="Activity Logs" />
    </>
  );

  return (
    <DashboardLayout sidebar={sidebar} title="Internal Team Dashboard">
      {loading ? (
        <LoadingSkeleton rows={3} />
      ) : stats ? (
        <div className="space-y-6 animate-fade-in">
          <div className="card bg-gradient-to-r from-brand-primary to-brand-secondary text-white">
            <div className="flex items-center gap-4">
              <Shield size={32} />
              <div>
                <h2 className="text-xl font-bold">Digitalized Plantation — Admin Panel</h2>
                <p className="text-white/80 text-sm">Monitor all customers, plantations, and system operations</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard title="Total Customers" value={stats.totalCustomers} icon={<Users size={22} />} />
            <StatCard title="Active Customers" value={stats.activeCustomers} icon={<Users size={22} />} color="success" />
            <StatCard title="Plantations" value={stats.totalPlantations} icon={<Leaf size={22} />} />
            <StatCard title="Online Plantations" value={stats.onlinePlantations} icon={<Leaf size={22} />} color="success" />
            <StatCard title="Open Tickets" value={stats.openTickets} icon={<MessageSquare size={22} />} color="warning" />
            <StatCard title="Critical Alerts" value={stats.criticalAlerts} icon={<AlertTriangle size={22} />} color="error" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { href: '/admin/customers', label: 'Manage Customers', desc: 'View, edit, and manage customer accounts' },
              { href: '/admin/emergencies', label: 'Emergency Feed', desc: 'Monitor all active critical alerts' },
              { href: '/admin/tickets', label: 'Support Queue', desc: 'Respond to customer support tickets' },
            ].map((item) => (
              <a key={item.href} href={item.href} className="card hover:shadow-lg transition-shadow group">
                <h3 className="font-bold text-gray-900 group-hover:text-brand-primary transition-colors">{item.label}</h3>
                <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
}
