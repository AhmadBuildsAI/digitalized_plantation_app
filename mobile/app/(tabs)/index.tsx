import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Image } from 'react-native';
import { useAuthStore } from '../../lib/auth-store';
import { api } from '../../lib/api';
import { BRAND, EQUIPMENT_LABELS, APP_NAME } from '../../constants/theme';

interface DashboardData {
  overview: {
    status: string;
    isOnline: boolean;
    connectedDevices: number;
    activeEquipment: number;
    totalEquipment: number;
    unreadAlerts: number;
  };
  plantation: { name: string; location: string };
  equipment: Array<{ id: string; type: string; status: string; state: string }>;
  recentAlerts: Array<{ id: string; title: string; priority: string; isRead: boolean }>;
}

export default function DashboardScreen() {
  const { accessToken, user } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!accessToken) return;
    try {
      const result = await api<DashboardData>('/customer/dashboard', { token: accessToken });
      setData(result);
    } catch {
      // Handle offline gracefully
    }
  };

  useEffect(() => { load(); }, [accessToken]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[BRAND.primary]} />}
    >
      <View style={styles.banner}>
        <Text style={styles.welcome}>Welcome, {user?.firstName}!</Text>
        <Text style={styles.plantation}>{data?.plantation.name || 'Loading...'}</Text>
        <View style={styles.onlineBadge}>
          <View style={[styles.dot, { backgroundColor: data?.overview.isOnline ? BRAND.accent : '#9CA3AF' }]} />
          <Text style={styles.onlineText}>{data?.overview.isOnline ? 'Online' : 'Offline'}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatBox label="Status" value={data?.overview.status || '—'} />
        <StatBox label="Devices" value={String(data?.overview.connectedDevices ?? '—')} />
        <StatBox label="Alerts" value={String(data?.overview.unreadAlerts ?? 0)} highlight={!!data?.overview.unreadAlerts} />
      </View>

      <Text style={styles.sectionTitle}>Equipment</Text>
      {data?.equipment.map((eq) => (
        <View key={eq.id} style={styles.card}>
          <Text style={styles.cardTitle}>{EQUIPMENT_LABELS[eq.type] || eq.type}</Text>
          <View style={styles.badgeRow}>
            <Badge label={eq.status} color={eq.status === 'ACTIVE' ? BRAND.accent : '#9CA3AF'} />
            <Badge label={eq.state} color={eq.state === 'ON' ? BRAND.primary : '#9CA3AF'} />
          </View>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Recent Alerts</Text>
      {data?.recentAlerts.length === 0 ? (
        <View style={styles.card}><Text style={styles.emptyText}>No alerts</Text></View>
      ) : (
        data?.recentAlerts.map((alert) => (
          <View key={alert.id} style={[styles.card, !alert.isRead && styles.unreadCard]}>
            <Text style={styles.cardTitle}>{alert.title}</Text>
            <Badge label={alert.priority} color={alert.priority === 'CRITICAL' ? BRAND.error : BRAND.warning} />
          </View>
        ))
      )}
    </ScrollView>
  );
}

function StatBox({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={[styles.statBox, highlight && { borderColor: BRAND.error }]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: `${color}20` }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.background },
  banner: { backgroundColor: BRAND.primary, padding: 20, paddingTop: 8 },
  welcome: { color: '#fff', fontSize: 22, fontWeight: '700' },
  plantation: { color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  onlineBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  onlineText: { color: '#fff', fontSize: 13 },
  statsRow: { flexDirection: 'row', padding: 16, gap: 10 },
  statBox: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14,
    alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB',
  },
  statValue: { fontSize: 20, fontWeight: '700', color: BRAND.text },
  statLabel: { fontSize: 11, color: BRAND.textMuted, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: BRAND.text, paddingHorizontal: 16, marginBottom: 8 },
  card: {
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 10,
    borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E5E7EB',
  },
  unreadCard: { borderLeftWidth: 4, borderLeftColor: BRAND.accent },
  cardTitle: { fontSize: 15, fontWeight: '600', color: BRAND.text },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start', marginTop: 6 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  emptyText: { color: BRAND.textMuted, textAlign: 'center' },
});
