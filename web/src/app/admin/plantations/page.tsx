'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, Users, Leaf, AlertTriangle, MessageSquare, Activity } from 'lucide-react';
import { DashboardLayout, SidebarLink, LoadingSkeleton } from '@/components/layout/DashboardLayout';
import { StatusBadge, getStatusVariant } from '@/components/ui/StatusBadge';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

interface Plantation {
  id: string;
  name: string;
  status: string;
  isOnline: boolean;
  lastActivityAt: string;
  customer: {
    companyName: string;
    user: { firstName: string; lastName: string; email: string };
  };
  equipment: Array<{ type: string; status: string; state: string }>;
  notifications: Array<{ title: string; priority: string }>;
}

export default function AdminPlantationsPage() {
  const router = useRouter();
  const { accessToken, isAuthenticated, isInternal } = useAuthStore();
  const [plantations, setPlantations] = useState<Plantation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated() || !isInternal()) { router.replace('/login'); return; }
    if (accessToken) {
      api<Plantation[]>('/admin/plantations', { token: accessToken })
        .then(setPlantations)
        .finally(() => setLoading(false));
    }
  }, [accessToken, isAuthenticated, isInternal, router]);

  const sidebar = (
    <>
      <SidebarLink href="/admin" icon={<LayoutDashboard size={18} />} label="Dashboard" />
      <SidebarLink href="/admin/customers" icon={<Users size={18} />} label="Customers" />
      <SidebarLink href="/admin/plantations" icon={<Leaf size={18} />} label="Plantations" active />
      <SidebarLink href="/admin/emergencies" icon={<AlertTriangle size={18} />} label="Emergencies" />
      <SidebarLink href="/admin/tickets" icon={<MessageSquare size={18} />} label="Support Tickets" />
      <SidebarLink href="/admin/activity" icon={<Activity size={18} />} label="Activity Logs" />
    </>
  );

  return (
    <DashboardLayout sidebar={sidebar} title="Plantation Monitoring">
      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in">
          {plantations.map((p) => (
            <div key={p.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-gray-900">{p.name}</h3>
                  <p className="text-sm text-gray-500">
                    {p.customer.user.firstName} {p.customer.user.lastName} • {p.customer.companyName}
                  </p>
                </div>
                <div className="flex gap-2">
                  <StatusBadge label={p.status} variant={getStatusVariant(p.status)} />
                  <StatusBadge label={p.isOnline ? 'Online' : 'Offline'} variant={p.isOnline ? 'success' : 'neutral'} dot pulse={p.isOnline} />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {p.equipment.map((eq, i) => (
                  <StatusBadge key={i} label={eq.type.replace('_', ' ')} variant={getStatusVariant(eq.status)} />
                ))}
              </div>

              {p.notifications.length > 0 && (
                <div className="bg-red-50 rounded-lg p-2 mb-3">
                  {p.notifications.map((n, i) => (
                    <p key={i} className="text-xs text-red-700">{n.title}</p>
                  ))}
                </div>
              )}

              <p className="text-xs text-gray-400">
                Last activity: {formatDistanceToNow(new Date(p.lastActivityAt), { addSuffix: true })}
              </p>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
