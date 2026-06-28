import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useAuthStore } from '../../lib/auth-store';
import { apiWithMeta } from '../../lib/api';
import { BRAND } from '../../constants/theme';

interface Notification {
  id: string;
  title: string;
  message: string;
  priority: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsScreen() {
  const { accessToken } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!accessToken) return;
    const { data, meta } = await apiWithMeta<Notification[]>('/customer/notifications', { token: accessToken });
    setNotifications(data);
    setUnreadCount((meta?.unreadCount as number) || 0);
  };

  useEffect(() => { load(); }, [accessToken]);

  const markRead = async (id: string) => {
    if (!accessToken) return;
    await apiWithMeta(`/customer/notifications/${id}/read`, { method: 'PATCH', token: accessToken });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const priorityColor = (p: string) => {
    if (p === 'CRITICAL') return BRAND.error;
    if (p === 'HIGH') return BRAND.warning;
    return BRAND.primary;
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
    >
      <Text style={styles.header}>{unreadCount} unread</Text>

      {notifications.map((n) => (
        <TouchableOpacity
          key={n.id}
          style={[styles.card, !n.isRead && styles.unread]}
          onPress={() => !n.isRead && markRead(n.id)}
        >
          <View style={styles.row}>
            <Text style={styles.title}>{n.title}</Text>
            <View style={[styles.priority, { backgroundColor: `${priorityColor(n.priority)}20` }]}>
              <Text style={[styles.priorityText, { color: priorityColor(n.priority) }]}>{n.priority}</Text>
            </View>
          </View>
          <Text style={styles.message}>{n.message}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.background, padding: 16 },
  header: { fontSize: 14, color: BRAND.textMuted, marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  unread: { borderLeftWidth: 4, borderLeftColor: BRAND.accent },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 15, fontWeight: '600', color: BRAND.text, flex: 1 },
  priority: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  priorityText: { fontSize: 10, fontWeight: '700' },
  message: { fontSize: 13, color: BRAND.textMuted, marginTop: 6 },
});
