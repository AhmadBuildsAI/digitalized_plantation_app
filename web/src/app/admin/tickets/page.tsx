'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, Users, Leaf, AlertTriangle, MessageSquare, Activity, Send } from 'lucide-react';
import { DashboardLayout, SidebarLink, LoadingSkeleton } from '@/components/layout/DashboardLayout';
import { StatusBadge, getStatusVariant } from '@/components/ui/StatusBadge';
import { useAuthStore } from '@/lib/auth-store';
import { api, apiWithMeta } from '@/lib/api';
import { TICKET_CATEGORY_LABELS } from '@/lib/constants';
import { formatDistanceToNow } from 'date-fns';

interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  updatedAt: string;
  customerId: string;
}

interface TicketDetail {
  id: string;
  subject: string;
  status: string;
  messages: Array<{
    id: string;
    content: string;
    isStaff: boolean;
    createdAt: string;
    sender: { firstName: string; lastName: string; role: string };
  }>;
}

export default function AdminTicketsPage() {
  const router = useRouter();
  const { accessToken, isAuthenticated, isInternal, user } = useAuthStore();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadTickets = () => {
    if (!accessToken) return;
    const url = statusFilter ? `/admin/tickets?status=${statusFilter}` : '/admin/tickets';
    apiWithMeta<Ticket[]>(url, { token: accessToken })
      .then(({ data }) => setTickets(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!isAuthenticated() || !isInternal()) { router.replace('/login'); return; }
    loadTickets();
  }, [accessToken, isAuthenticated, isInternal, router, statusFilter]);

  const openTicket = async (id: string) => {
    if (!accessToken) return;
    const detail = await api<TicketDetail>(`/admin/tickets/${id}`, { token: accessToken });
    setSelected(detail);
  };

  const sendReply = async () => {
    if (!accessToken || !selected || !reply.trim()) return;
    await api(`/admin/tickets/${selected.id}/messages`, {
      method: 'POST',
      token: accessToken,
      body: JSON.stringify({ content: reply }),
    });
    setReply('');
    openTicket(selected.id);
    loadTickets();
  };

  const updateStatus = async (status: string) => {
    if (!accessToken || !selected) return;
    await api(`/admin/tickets/${selected.id}`, {
      method: 'PATCH',
      token: accessToken,
      body: JSON.stringify({ status }),
    });
    openTicket(selected.id);
    loadTickets();
  };

  const sidebar = (
    <>
      <SidebarLink href="/admin" icon={<LayoutDashboard size={18} />} label="Dashboard" />
      <SidebarLink href="/admin/customers" icon={<Users size={18} />} label="Customers" />
      <SidebarLink href="/admin/plantations" icon={<Leaf size={18} />} label="Plantations" />
      <SidebarLink href="/admin/emergencies" icon={<AlertTriangle size={18} />} label="Emergencies" />
      <SidebarLink href="/admin/tickets" icon={<MessageSquare size={18} />} label="Support Tickets" active />
      <SidebarLink href="/admin/activity" icon={<Activity size={18} />} label="Activity Logs" />
    </>
  );

  return (
    <DashboardLayout sidebar={sidebar} title="Support Ticket Management">
      <div className="flex gap-2 mb-4 flex-wrap">
        {['', 'OPEN', 'IN_PROGRESS', 'CLOSED'].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => { setLoading(true); setStatusFilter(s); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              statusFilter === s ? 'bg-brand-primary text-white' : 'bg-white border text-gray-600'
            }`}
          >
            {s ? s.replace('_', ' ') : 'All'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          {loading ? (
            <LoadingSkeleton rows={3} />
          ) : (
            <div className="space-y-3">
              {tickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => openTicket(t.id)}
                  className={`card cursor-pointer ${selected?.id === t.id ? 'ring-2 ring-brand-accent' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{t.subject}</p>
                      <p className="text-xs text-gray-400">{TICKET_CATEGORY_LABELS[t.category]}</p>
                    </div>
                    <StatusBadge label={t.status.replace('_', ' ')} variant={getStatusVariant(t.status)} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDistanceToNow(new Date(t.updatedAt), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          {selected ? (
            <div className="card flex flex-col h-[520px]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold">{selected.subject}</h3>
                <div className="flex gap-2">
                  {['IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPENED'].map((s) => (
                    <button key={s} onClick={() => updateStatus(s)} className="text-xs btn-secondary py-1 px-2">
                      {s.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                {selected.messages.map((m) => (
                  <div key={m.id} className={`p-3 rounded-xl max-w-[85%] ${m.isStaff ? 'bg-brand-primary/10 ml-auto' : 'bg-gray-100'}`}>
                    <p className="text-xs text-gray-500">{m.sender.firstName} {m.sender.lastName}</p>
                    <p className="text-sm">{m.content}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 border-t pt-4">
                <input className="input-field flex-1" value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Reply as support..." />
                <button onClick={sendReply} className="btn-primary px-4"><Send size={16} /></button>
              </div>
            </div>
          ) : (
            <div className="card text-center py-16 text-gray-400">Select a ticket</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
