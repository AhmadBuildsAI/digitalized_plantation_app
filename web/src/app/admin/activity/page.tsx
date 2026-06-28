'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, Users, Leaf, AlertTriangle, MessageSquare, Activity } from 'lucide-react';
import { DashboardLayout, SidebarLink, LoadingSkeleton } from '@/components/layout/DashboardLayout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useAuthStore } from '@/lib/auth-store';
import { apiWithMeta } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

interface ActivityLog {
  id: string;
  action: string;
  details: string;
  device: string;
  ipAddress: string;
  status: string;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string; role: string } | null;
}

export default function AdminActivityPage() {
  const router = useRouter();
  const { accessToken, isAuthenticated, isInternal } = useAuthStore();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated() || !isInternal()) { router.replace('/login'); return; }
    if (accessToken) {
      apiWithMeta<ActivityLog[]>('/admin/activity-logs', { token: accessToken })
        .then(({ data }) => setLogs(data))
        .finally(() => setLoading(false));
    }
  }, [accessToken, isAuthenticated, isInternal, router]);

  const sidebar = (
    <>
      <SidebarLink href="/admin" icon={<LayoutDashboard size={18} />} label="Dashboard" />
      <SidebarLink href="/admin/customers" icon={<Users size={18} />} label="Customers" />
      <SidebarLink href="/admin/plantations" icon={<Leaf size={18} />} label="Plantations" />
      <SidebarLink href="/admin/emergencies" icon={<AlertTriangle size={18} />} label="Emergencies" />
      <SidebarLink href="/admin/tickets" icon={<MessageSquare size={18} />} label="Support Tickets" />
      <SidebarLink href="/admin/activity" icon={<Activity size={18} />} label="Activity Logs" active />
    </>
  );

  return (
    <DashboardLayout sidebar={sidebar} title="Activity Logs">
      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : (
        <div className="card overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="py-3 px-4 font-semibold text-gray-600">Timestamp</th>
                  <th className="py-3 px-4 font-semibold text-gray-600">User</th>
                  <th className="py-3 px-4 font-semibold text-gray-600">Action</th>
                  <th className="py-3 px-4 font-semibold text-gray-600">Details</th>
                  <th className="py-3 px-4 font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                      {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                    </td>
                    <td className="py-3 px-4">
                      {log.user ? (
                        <div>
                          <p className="font-medium">{log.user.firstName} {log.user.lastName}</p>
                          <p className="text-xs text-gray-400">{log.user.role}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400">System</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge label={log.action.replace('_', ' ')} variant="info" />
                    </td>
                    <td className="py-3 px-4 text-gray-600 max-w-xs truncate">{log.details || '—'}</td>
                    <td className="py-3 px-4">
                      <StatusBadge label={log.status} variant={log.status === 'success' ? 'success' : 'error'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
