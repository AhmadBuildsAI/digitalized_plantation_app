'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, Cpu, Bell, MessageSquare, Settings } from 'lucide-react';
import { DashboardLayout, SidebarLink } from '@/components/layout/DashboardLayout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useAuthStore } from '@/lib/auth-store';
import { formatDistanceToNow } from 'date-fns';

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated()) router.replace('/login');
  }, [isAuthenticated, router]);

  const sidebar = (
    <>
      <SidebarLink href="/dashboard" icon={<LayoutDashboard size={18} />} label="Overview" />
      <SidebarLink href="/dashboard/equipment" icon={<Cpu size={18} />} label="Equipment" />
      <SidebarLink href="/dashboard/notifications" icon={<Bell size={18} />} label="Notifications" />
      <SidebarLink href="/dashboard/support" icon={<MessageSquare size={18} />} label="Help & Support" />
      <SidebarLink href="/dashboard/profile" icon={<Settings size={18} />} label="Profile" active />
    </>
  );

  return (
    <DashboardLayout sidebar={sidebar} title="Profile">
      <div className="max-w-2xl animate-fade-in">
        <div className="card">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-20 h-20 rounded-2xl bg-brand-primary flex items-center justify-center text-white text-2xl font-bold">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{user?.firstName} {user?.lastName}</h2>
              <p className="text-gray-500">{user?.email}</p>
              <StatusBadge label="Customer" variant="primary" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Company</p>
              <p className="font-medium">{user?.customerProfile?.companyName || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Phone</p>
              <p className="font-medium">{user?.phone || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Manual Control</p>
              <StatusBadge
                label={user?.customerProfile?.manualControlEnabled ? 'Enabled' : 'Disabled'}
                variant={user?.customerProfile?.manualControlEnabled ? 'success' : 'neutral'}
              />
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Last Login</p>
              <p className="font-medium">
                {user?.lastLoginAt
                  ? formatDistanceToNow(new Date(user.lastLoginAt), { addSuffix: true })
                  : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
