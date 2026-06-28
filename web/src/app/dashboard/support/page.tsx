'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, Cpu, Bell, MessageSquare, Settings, Plus, Send } from 'lucide-react';
import { DashboardLayout, SidebarLink, LoadingSkeleton } from '@/components/layout/DashboardLayout';
import { StatusBadge, getStatusVariant } from '@/components/ui/StatusBadge';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api';
import { TICKET_CATEGORY_LABELS } from '@/lib/constants';
import { formatDistanceToNow } from 'date-fns';

interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  updatedAt: string;
  messages: Array<{ content: string; createdAt: string }>;
}

interface TicketDetail extends Ticket {
  messages: Array<{
    id: string;
    content: string;
    isStaff: boolean;
    createdAt: string;
    sender: { firstName: string; lastName: string; role: string };
  }>;
}

export default function SupportPage() {
  const router = useRouter();
  const { accessToken, isAuthenticated } = useAuthStore();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [reply, setReply] = useState('');
  const [form, setForm] = useState({ subject: '', category: 'GENERAL_INQUIRY', message: '' });

  const loadTickets = () => {
    if (!accessToken) return;
    api<Ticket[]>('/customer/tickets', { token: accessToken })
      .then(setTickets)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!isAuthenticated()) { router.replace('/login'); return; }
    loadTickets();
  }, [accessToken, isAuthenticated, router]);

  const openTicket = async (id: string) => {
    if (!accessToken) return;
    const detail = await api<TicketDetail>(`/customer/tickets/${id}`, { token: accessToken });
    setSelected(detail);
  };

  const createTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    await api('/customer/tickets', {
      method: 'POST',
      token: accessToken,
      body: JSON.stringify(form),
    });
    setShowCreate(false);
    setForm({ subject: '', category: 'GENERAL_INQUIRY', message: '' });
    loadTickets();
  };

  const sendReply = async () => {
    if (!accessToken || !selected || !reply.trim()) return;
    await api(`/customer/tickets/${selected.id}/messages`, {
      method: 'POST',
      token: accessToken,
      body: JSON.stringify({ content: reply }),
    });
    setReply('');
    openTicket(selected.id);
  };

  const sidebar = (
    <>
      <SidebarLink href="/dashboard" icon={<LayoutDashboard size={18} />} label="Overview" />
      <SidebarLink href="/dashboard/equipment" icon={<Cpu size={18} />} label="Equipment" />
      <SidebarLink href="/dashboard/notifications" icon={<Bell size={18} />} label="Notifications" />
      <SidebarLink href="/dashboard/support" icon={<MessageSquare size={18} />} label="Help & Support" active />
      <SidebarLink href="/dashboard/profile" icon={<Settings size={18} />} label="Profile" />
    </>
  );

  return (
    <DashboardLayout sidebar={sidebar} title="Help & Support">
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Ticket
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-lg animate-fade-in">
            <h2 className="text-xl font-bold mb-4">Create Support Ticket</h2>
            <form onSubmit={createTicket} className="space-y-4">
              <input
                className="input-field"
                placeholder="Subject"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                required
              />
              <select
                className="input-field"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {Object.entries(TICKET_CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <textarea
                className="input-field min-h-[120px]"
                placeholder="Describe your issue..."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
              />
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1">Submit</button>
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="font-bold text-gray-900 mb-3">Your Tickets</h2>
          {loading ? (
            <LoadingSkeleton rows={3} />
          ) : tickets.length === 0 ? (
            <div className="card text-center py-8 text-gray-500">No support tickets yet</div>
          ) : (
            <div className="space-y-3">
              {tickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => openTicket(t.id)}
                  className={`card cursor-pointer hover:shadow-md transition-shadow ${selected?.id === t.id ? 'ring-2 ring-brand-accent' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{t.subject}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {TICKET_CATEGORY_LABELS[t.category]} • {formatDistanceToNow(new Date(t.updatedAt), { addSuffix: true })}
                      </p>
                    </div>
                    <StatusBadge label={t.status.replace('_', ' ')} variant={getStatusVariant(t.status)} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          {selected ? (
            <div className="card flex flex-col h-[500px]">
              <h3 className="font-bold text-gray-900 mb-4">{selected.subject}</h3>
              <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                {selected.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`p-3 rounded-xl max-w-[85%] ${m.isStaff ? 'bg-brand-primary/10 ml-auto' : 'bg-gray-100'}`}
                  >
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      {m.sender.firstName} {m.sender.lastName}
                      {m.isStaff && ' (Support)'}
                    </p>
                    <p className="text-sm text-gray-800">{m.content}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 border-t pt-4">
                <input
                  className="input-field flex-1"
                  placeholder="Type a reply..."
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendReply()}
                />
                <button onClick={sendReply} className="btn-primary px-4">
                  <Send size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className="card text-center py-16 text-gray-400">
              Select a ticket to view conversation
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
