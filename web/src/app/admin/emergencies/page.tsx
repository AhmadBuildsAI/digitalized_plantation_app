'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, Users, Leaf, AlertTriangle, MessageSquare, Activity } from 'lucide-react';
import { DashboardLayout, SidebarLink, LoadingSkeleton } from '@/components/layout/DashboardLayout';
import { StatusBadge, getStatusVariant } from '@/components/ui/StatusBadge';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

interface Emergency {
  id: string;
  title: string;
  message: string;
  priority: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  plantation: {
    name: string;
    customer: { user: { firstName: string; lastName: string; email: string }; companyName: string };
  };
}

export default function AdminEmergenciesPage() {
  const router = useRouter();
  const { accessToken, isAuthenticated, isInternal } = useAuthStore();
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (!isAuthenticated() || !isInternal()) { router.replace('/login'); return; }
    const url = filter ? `/admin/emergencies?severity=${filter}` : '/admin/emergencies';
    if (accessToken) {
      api<Emergency[]>(url, { token: accessToken })
        .then(setEmergencies)
        .finally(() => setLoading(false));
    }
  }, [accessToken, isAuthenticated, isInternal, router, filter]);

  const sidebar = (
    <>
      <SidebarLink href="/admin" icon={<LayoutDashboard size={18} />} label="Dashboard" />
      <SidebarLink href="/admin/customers" icon={<Users size={18} />} label="Customers" />
      <SidebarLink href="/admin/plantations" icon={<Leaf size={18} />} label="Plantations" />
      <SidebarLink href="/admin/emergencies" icon={<AlertTriangle size={18} />} label="Emergencies" active />
      <SidebarLink href="/admin/tickets" icon={<MessageSquare size={18} />} label="Support Tickets" />
      <SidebarLink href="/admin/activity" icon={<Activity size={18} />} label="Activity Logs" />
    </>
  );

  return (
    <DashboardLayout sidebar={sidebar} title="Emergency Monitoring">
      <div className="flex gap-2 mb-6">
        {['', 'HIGH', 'CRITICAL'].map((f) => (
          <button
            key={f || 'all'}
            onClick={() => { setLoading(true); setFilter(f); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === f ? 'bg-brand-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : emergencies.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">No active emergencies</div>
      ) : (
        <div className="space-y-3 animate-fade-in">
          {emergencies.map((e) => (
            <div key={e.id} className={`card border-l-4 ${e.priority === 'CRITICAL' ? 'border-l-red-500' : 'border-l-amber-500'}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900">{e.title}</h3>
                    <StatusBadge label={e.priority} variant={getStatusVariant(e.priority)} />
                    <StatusBadge label={e.type.replace('_', ' ')} variant="neutral" />
                  </div>
                  <p className="text-sm text-gray-600">{e.message}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {e.plantation.customer.user.firstName} {e.plantation.customer.user.lastName} • {e.plantation.name} •{' '}
                    {formatDistanceToNow(new Date(e.createdAt), { addSuffix: true })}
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
