'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, Leaf, AlertTriangle, MessageSquare, Activity, Search, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { DashboardLayout, SidebarLink, LoadingSkeleton, Toast } from '@/components/layout/DashboardLayout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useAuthStore } from '@/lib/auth-store';
import { apiWithMeta } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

interface Customer {
  id: string;
  companyName: string;
  manualControlEnabled: boolean;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
    lastLoginAt: string;
  };
  plantations: Array<{ id: string; name: string; status: string; isOnline: boolean }>;
}

export default function AdminCustomersPage() {
  const router = useRouter();
  const { accessToken, isAuthenticated, isInternal } = useAuthStore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const load = (q = '') => {
    if (!accessToken) return;
    apiWithMeta<Customer[]>(`/admin/customers?search=${encodeURIComponent(q)}`, { token: accessToken })
      .then(({ data }) => setCustomers(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!isAuthenticated() || !isInternal()) { router.replace('/login'); return; }
    load();
  }, [accessToken, isAuthenticated, isInternal, router]);

  const toggleActive = async (id: string, isActive: boolean) => {
    if (!accessToken) return;
    await apiWithMeta(`/admin/customers/${id}`, {
      method: 'PATCH',
      token: accessToken,
      body: JSON.stringify({ isActive: !isActive }),
    });
    setToast(`Customer ${!isActive ? 'activated' : 'deactivated'}`);
    load(search);
  };

  const toggleManualControl = async (id: string, enabled: boolean) => {
    if (!accessToken) return;
    await apiWithMeta(`/admin/customers/${id}/manual-control`, {
      method: 'PATCH',
      token: accessToken,
      body: JSON.stringify({ enabled: !enabled }),
    });
    setToast(`Manual control ${!enabled ? 'enabled' : 'disabled'}`);
    load(search);
  };

  const sidebar = (
    <>
      <SidebarLink href="/admin" icon={<LayoutDashboard size={18} />} label="Dashboard" />
      <SidebarLink href="/admin/customers" icon={<Users size={18} />} label="Customers" active />
      <SidebarLink href="/admin/plantations" icon={<Leaf size={18} />} label="Plantations" />
      <SidebarLink href="/admin/emergencies" icon={<AlertTriangle size={18} />} label="Emergencies" />
      <SidebarLink href="/admin/tickets" icon={<MessageSquare size={18} />} label="Support Tickets" />
      <SidebarLink href="/admin/activity" icon={<Activity size={18} />} label="Activity Logs" />
    </>
  );

  return (
    <DashboardLayout sidebar={sidebar} title="Customer Management">
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input-field pl-10"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load(search)}
          />
        </div>
        <button onClick={() => load(search)} className="btn-primary">Search</button>
      </div>

      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : (
        <div className="space-y-4 animate-fade-in">
          {customers.map((c) => (
            <div key={c.id} className="card">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-gray-900">{c.user.firstName} {c.user.lastName}</h3>
                    <StatusBadge label={c.user.isActive ? 'Active' : 'Inactive'} variant={c.user.isActive ? 'success' : 'neutral'} />
                  </div>
                  <p className="text-sm text-gray-500">{c.user.email} • {c.companyName}</p>
                  {c.plantations[0] && (
                    <p className="text-xs text-gray-400 mt-1">
                      {c.plantations[0].name} — {c.plantations[0].isOnline ? 'Online' : 'Offline'}
                    </p>
                  )}
                  {c.user.lastLoginAt && (
                    <p className="text-xs text-gray-400">
                      Last login: {formatDistanceToNow(new Date(c.user.lastLoginAt), { addSuffix: true })}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => toggleActive(c.id, c.user.isActive)}
                    className="btn-secondary text-sm flex items-center gap-2"
                  >
                    {c.user.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => toggleManualControl(c.id, c.manualControlEnabled)}
                    className="btn-secondary text-sm flex items-center gap-2"
                  >
                    {c.manualControlEnabled ? <ToggleRight size={16} className="text-brand-accent" /> : <ToggleLeft size={16} />}
                    Manual Control: {c.manualControlEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
