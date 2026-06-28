'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, Cpu, Bell, MessageSquare, Settings } from 'lucide-react';
import { DashboardLayout, SidebarLink, LoadingSkeleton } from '@/components/layout/DashboardLayout';
import { StatusBadge, getStatusVariant } from '@/components/ui/StatusBadge';
import { useAuthStore } from '@/lib/auth-store';
import { apiWithMeta } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: string;
  priority: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { accessToken, isAuthenticated } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = () => {
    if (!accessToken) return;
    apiWithMeta<Notification[]>('/customer/notifications', { token: accessToken })
      .then(({ data, meta }) => {
        setNotifications(data);
        setUnreadCount((meta?.unreadCount as number) || 0);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!isAuthenticated()) { router.replace('/login'); return; }
    load();
  }, [accessToken, isAuthenticated, router]);

  const markRead = async (id: string) => {
    if (!accessToken) return;
    await apiWithMeta(`/customer/notifications/${id}/read`, { method: 'PATCH', token: accessToken });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    if (!accessToken) return;
    await apiWithMeta('/customer/notifications/read-all', { method: 'PATCH', token: accessToken });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const sidebar = (
    <>
      <SidebarLink href="/dashboard" icon={<LayoutDashboard size={18} />} label="Overview" />
      <SidebarLink href="/dashboard/equipment" icon={<Cpu size={18} />} label="Equipment" />
      <SidebarLink href="/dashboard/notifications" icon={<Bell size={18} />} label="Notifications" active />
      <SidebarLink href="/dashboard/support" icon={<MessageSquare size={18} />} label="Help & Support" />
      <SidebarLink href="/dashboard/profile" icon={<Settings size={18} />} label="Profile" />
    </>
  );

  return (
    <DashboardLayout sidebar={sidebar} title="Notifications" notificationCount={unreadCount}>
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-500 text-sm">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-sm text-brand-primary font-medium hover:underline">
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : notifications.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">No notifications yet</div>
      ) : (
        <div className="space-y-3 animate-fade-in">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.isRead && markRead(n.id)}
              className={`card cursor-pointer transition-all ${!n.isRead ? 'border-l-4 border-l-brand-accent bg-brand-accent/5' : ''}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{n.title}</h3>
                    <StatusBadge label={n.priority} variant={getStatusVariant(n.priority)} />
                    {!n.isRead && <span className="w-2 h-2 bg-brand-accent rounded-full" />}
                  </div>
                  <p className="text-sm text-gray-600">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
