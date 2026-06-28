'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Cpu,
  Bell,
  MessageSquare,
  Settings,
  Droplets,
  Wind,
  Sun,
  CloudRain,
} from 'lucide-react';
import { DashboardLayout, SidebarLink, StatCard, LoadingSkeleton } from '@/components/layout/DashboardLayout';
import { StatusBadge, getStatusVariant } from '@/components/ui/StatusBadge';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api';
import { EQUIPMENT_LABELS } from '@/lib/constants';
import { formatDistanceToNow } from 'date-fns';

interface DashboardData {
  overview: {
    status: string;
    isOnline: boolean;
    connectedDevices: number;
    activeEquipment: number;
    totalEquipment: number;
    unreadAlerts: number;
    lastUpdated: string;
  };
  plantation: { id: string; name: string; location: string; status: string };
  equipment: Array<{
    id: string;
    type: string;
    name: string;
    status: string;
    state: string;
    lastActivityAt: string;
  }>;
  recentAlerts: Array<{
    id: string;
    title: string;
    message: string;
    priority: string;
    isRead: boolean;
    createdAt: string;
  }>;
}

const equipmentIcons: Record<string, React.ReactNode> = {
  WATER_PUMP: <Droplets size={20} />,
  INTAKE_FAN: <Wind size={20} />,
  EXHAUST_FAN: <Wind size={20} />,
  GROW_LIGHTS: <Sun size={20} />,
  HUMIDIFIER: <CloudRain size={20} />,
};

export default function CustomerDashboardPage() {
  const router = useRouter();
  const { accessToken, isAuthenticated, user } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }
    if (accessToken) {
      api<DashboardData>('/customer/dashboard', { token: accessToken })
        .then(setData)
        .catch(() => router.replace('/login'))
        .finally(() => setLoading(false));
    }
  }, [accessToken, isAuthenticated, router]);

  const sidebar = (
    <>
      <SidebarLink href="/dashboard" icon={<LayoutDashboard size={18} />} label="Overview" active />
      <SidebarLink href="/dashboard/equipment" icon={<Cpu size={18} />} label="Equipment" />
      <SidebarLink href="/dashboard/notifications" icon={<Bell size={18} />} label="Notifications" />
      <SidebarLink href="/dashboard/support" icon={<MessageSquare size={18} />} label="Help & Support" />
      <SidebarLink href="/dashboard/profile" icon={<Settings size={18} />} label="Profile" />
    </>
  );

  if (loading) {
    return (
      <DashboardLayout sidebar={sidebar} title="Dashboard">
        <LoadingSkeleton rows={4} />
      </DashboardLayout>
    );
  }

  if (!data) return null;

  return (
    <DashboardLayout
      sidebar={sidebar}
      title="Plantation Overview"
      notificationCount={data.overview.unreadAlerts}
    >
      <div className="space-y-6 animate-fade-in">
        {/* Welcome banner */}
        <div className="card bg-gradient-to-r from-brand-primary to-brand-primary-light text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Welcome, {user?.firstName}!</h2>
              <p className="text-white/80 mt-1">{data.plantation.name} • {data.plantation.location}</p>
            </div>
            <StatusBadge
              label={data.overview.isOnline ? 'Online' : 'Offline'}
              variant={data.overview.isOnline ? 'success' : 'neutral'}
              dot
              pulse={data.overview.isOnline}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Plantation Status"
            value={data.overview.status}
            icon={<LayoutDashboard size={22} />}
            color={data.overview.status === 'HEALTHY' ? 'success' : 'warning'}
          />
          <StatCard
            title="Connected Devices"
            value={data.overview.connectedDevices}
            icon={<Cpu size={22} />}
          />
          <StatCard
            title="Active Equipment"
            value={`${data.overview.activeEquipment}/${data.overview.totalEquipment}`}
            icon={<Sun size={22} />}
            color="success"
          />
          <StatCard
            title="Unread Alerts"
            value={data.overview.unreadAlerts}
            icon={<Bell size={22} />}
            color={data.overview.unreadAlerts > 0 ? 'error' : 'primary'}
          />
        </div>

        {/* Equipment grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Equipment Status</h2>
            <a href="/dashboard/equipment" className="text-sm text-brand-primary font-medium hover:underline">
              View all →
            </a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.equipment.map((eq) => (
              <div key={eq.id} className="card">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-primary/10 text-brand-primary rounded-lg">
                      {equipmentIcons[eq.type] || <Cpu size={20} />}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{EQUIPMENT_LABELS[eq.type] || eq.name}</p>
                      <p className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(eq.lastActivityAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <StatusBadge label={eq.status} variant={getStatusVariant(eq.status)} dot />
                  <StatusBadge label={eq.state} variant={getStatusVariant(eq.state)} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent alerts */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Recent Alerts</h2>
            <a href="/dashboard/notifications" className="text-sm text-brand-primary font-medium hover:underline">
              View all →
            </a>
          </div>
          <div className="space-y-3">
            {data.recentAlerts.length === 0 ? (
              <div className="card text-center py-8 text-gray-500">No alerts at this time</div>
            ) : (
              data.recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`card flex items-start gap-4 ${!alert.isRead ? 'border-l-4 border-l-brand-accent' : ''}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900">{alert.title}</p>
                      <StatusBadge label={alert.priority} variant={getStatusVariant(alert.priority)} />
                    </div>
                    <p className="text-sm text-gray-600">{alert.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center">
          Last updated: {formatDistanceToNow(new Date(data.overview.lastUpdated), { addSuffix: true })}
        </p>
      </div>
    </DashboardLayout>
  );
}
