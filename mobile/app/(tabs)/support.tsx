import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal,
} from 'react-native';
import { useAuthStore } from '../../lib/auth-store';
import { api } from '../../lib/api';
import { BRAND, TICKET_CATEGORY_LABELS } from '../../constants/theme';

interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: string;
}

interface TicketDetail {
  id: string;
  subject: string;
  messages: Array<{ id: string; content: string; isStaff: boolean; sender: { firstName: string; lastName: string } }>;
}

export default function SupportScreen() {
  const { accessToken } = useAuthStore();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<TicketDetail | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [reply, setReply] = useState('');
  const [form, setForm] = useState({ subject: '', message: '' });

  const load = () => {
    if (!accessToken) return;
    api<Ticket[]>('/customer/tickets', { token: accessToken }).then(setTickets);
  };

  useEffect(() => { load(); }, [accessToken]);

  const openTicket = async (id: string) => {
    if (!accessToken) return;
    const detail = await api<TicketDetail>(`/customer/tickets/${id}`, { token: accessToken });
    setSelected(detail);
  };

  const createTicket = async () => {
    if (!accessToken) return;
    await api('/customer/tickets', {
      method: 'POST',
      token: accessToken,
      body: JSON.stringify({ ...form, category: 'GENERAL_INQUIRY' }),
    });
    setShowCreate(false);
    setForm({ subject: '', message: '' });
    load();
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

  if (selected) {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={() => setSelected(null)} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.detailTitle}>{selected.subject}</Text>
        <ScrollView style={styles.messages}>
          {selected.messages.map((m) => (
            <View key={m.id} style={[styles.msg, m.isStaff && styles.staffMsg]}>
              <Text style={styles.msgSender}>{m.sender.firstName} {m.isStaff ? '(Support)' : ''}</Text>
              <Text style={styles.msgContent}>{m.content}</Text>
            </View>
          ))}
        </ScrollView>
        <View style={styles.replyRow}>
          <TextInput style={styles.replyInput} value={reply} onChangeText={setReply} placeholder="Type a reply..." />
          <TouchableOpacity style={styles.sendBtn} onPress={sendReply}>
            <Text style={styles.sendText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreate(true)}>
        <Text style={styles.createText}>+ New Ticket</Text>
      </TouchableOpacity>

      {tickets.map((t) => (
        <TouchableOpacity key={t.id} style={styles.card} onPress={() => openTicket(t.id)}>
          <Text style={styles.title}>{t.subject}</Text>
          <Text style={styles.meta}>{TICKET_CATEGORY_LABELS[t.category] || t.category} • {t.status}</Text>
        </TouchableOpacity>
      ))}

      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>New Support Ticket</Text>
            <TextInput style={styles.input} placeholder="Subject" value={form.subject} onChangeText={(v) => setForm({ ...form, subject: v })} />
            <TextInput style={[styles.input, { height: 100 }]} placeholder="Message" multiline value={form.message} onChangeText={(v) => setForm({ ...form, message: v })} />
            <TouchableOpacity style={styles.createBtn} onPress={createTicket}><Text style={styles.createText}>Submit</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setShowCreate(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.background, padding: 16 },
  createBtn: { backgroundColor: BRAND.primary, borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 16 },
  createText: { color: '#fff', fontWeight: '600' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  title: { fontSize: 15, fontWeight: '600', color: BRAND.text },
  meta: { fontSize: 12, color: BRAND.textMuted, marginTop: 4 },
  back: { marginBottom: 8 },
  backText: { color: BRAND.primary, fontWeight: '600' },
  detailTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  messages: { flex: 1 },
  msg: { backgroundColor: '#F3F4F6', borderRadius: 12, padding: 12, marginBottom: 8, maxWidth: '85%' },
  staffMsg: { backgroundColor: `${BRAND.primary}15`, alignSelf: 'flex-end' },
  msgSender: { fontSize: 11, color: BRAND.textMuted, marginBottom: 4 },
  msgContent: { fontSize: 14, color: BRAND.text },
  replyRow: { flexDirection: 'row', gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  replyInput: { flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 10 },
  sendBtn: { backgroundColor: BRAND.primary, borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  sendText: { color: '#fff', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modal: { backgroundColor: '#fff', borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, marginBottom: 12 },
  cancelText: { textAlign: 'center', color: BRAND.textMuted, marginTop: 12 },
});
