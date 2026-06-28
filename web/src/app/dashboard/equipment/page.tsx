'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, Cpu, Bell, MessageSquare, Settings, Power, PowerOff } from 'lucide-react';
import { DashboardLayout, SidebarLink, LoadingSkeleton, Toast } from '@/components/layout/DashboardLayout';
import { StatusBadge, getStatusVariant } from '@/components/ui/StatusBadge';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api';
import { EQUIPMENT_LABELS } from '@/lib/constants';
import { formatDistanceToNow } from 'date-fns';

interface Equipment {
  id: string;
  type: string;
  name: string;
  status: string;
  state: string;
  lastActivityAt: string;
}

export default function EquipmentPage() {
  const router = useRouter();
  const { accessToken, isAuthenticated, user } = useAuthStore();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [controlling, setControlling] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const manualControlEnabled = user?.customerProfile?.manualControlEnabled ?? false;

  const loadEquipment = () => {
    if (!accessToken) return;
    api<Equipment[]>('/customer/equipment', { token: accessToken })
      .then(setEquipment)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!isAuthenticated()) { router.replace('/login'); return; }
    loadEquipment();
  }, [accessToken, isAuthenticated, router]);

  const handleControl = async (id: string, state: 'ON' | 'OFF') => {
    if (!accessToken) return;
    setControlling(id);
    try {
      const updated = await api<Equipment>(`/customer/equipment/${id}/control`, {
        method: 'POST',
        token: accessToken,
        body: JSON.stringify({ state }),
      });
      setEquipment((prev) => prev.map((e) => (e.id === id ? updated : e)));
      setToast({ message: `${updated.name} turned ${state}`, type: 'success' });
    } catch (err: unknown) {
      setToast({ message: err instanceof Error ? err.message : 'Control failed', type: 'error' });
    } finally {
      setControlling(null);
    }
  };

  const sidebar = (
    <>
      <SidebarLink href="/dashboard" icon={<LayoutDashboard size={18} />} label="Overview" />
      <SidebarLink href="/dashboard/equipment" icon={<Cpu size={18} />} label="Equipment" active />
      <SidebarLink href="/dashboard/notifications" icon={<Bell size={18} />} label="Notifications" />
      <SidebarLink href="/dashboard/support" icon={<MessageSquare size={18} />} label="Help & Support" />
      <SidebarLink href="/dashboard/profile" icon={<Settings size={18} />} label="Profile" />
    </>
  );

  return (
    <DashboardLayout sidebar={sidebar} title="Equipment Control">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {!manualControlEnabled && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
          Manual control is currently disabled for your account. Contact support to enable backup control access.
        </div>
      )}

      {loading ? (
        <LoadingSkeleton rows={3} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
          {equipment.map((eq) => (
            <div key={eq.id} className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{EQUIPMENT_LABELS[eq.type] || eq.name}</h3>
                  <p className="text-xs text-gray-400">
                    Last activity: {formatDistanceToNow(new Date(eq.lastActivityAt), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <StatusBadge label={eq.status} variant={getStatusVariant(eq.status)} dot pulse={eq.status === 'ACTIVE'} />
                  <StatusBadge label={eq.state} variant={getStatusVariant(eq.state)} />
                </div>
              </div>

              {manualControlEnabled && (
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleControl(eq.id, 'ON')}
                    disabled={controlling === eq.id || eq.state === 'ON'}
                    className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    <Power size={16} /> ON
                  </button>
                  <button
                    onClick={() => handleControl(eq.id, 'OFF')}
                    disabled={controlling === eq.id || eq.state === 'OFF'}
                    className="btn-secondary flex-1 flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    <PowerOff size={16} /> OFF
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
