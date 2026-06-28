import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useAuthStore } from '../../lib/auth-store';
import { api } from '../../lib/api';
import { BRAND, EQUIPMENT_LABELS } from '../../constants/theme';

interface Equipment {
  id: string;
  type: string;
  name: string;
  status: string;
  state: string;
}

export default function EquipmentScreen() {
  const { accessToken, user } = useAuthStore();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  const manualEnabled = user?.customerProfile?.manualControlEnabled ?? false;

  const load = () => {
    if (!accessToken) return;
    api<Equipment[]>('/customer/equipment', { token: accessToken }).then(setEquipment);
  };

  useEffect(() => { load(); }, [accessToken]);

  const control = async (id: string, state: 'ON' | 'OFF', name: string) => {
    if (!accessToken) return;
    setLoading(id);
    try {
      const updated = await api<Equipment>(`/customer/equipment/${id}/control`, {
        method: 'POST',
        token: accessToken,
        body: JSON.stringify({ state }),
      });
      setEquipment((prev) => prev.map((e) => (e.id === id ? updated : e)));
      Alert.alert('Success', `${name} turned ${state}`);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Control failed');
    } finally {
      setLoading(null);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {!manualEnabled && (
        <View style={styles.warning}>
          <Text style={styles.warningText}>Manual control is disabled. Contact support to enable.</Text>
        </View>
      )}

      {equipment.map((eq) => (
        <View key={eq.id} style={styles.card}>
          <Text style={styles.title}>{EQUIPMENT_LABELS[eq.type] || eq.name}</Text>
          <View style={styles.statusRow}>
            <Text style={styles.status}>{eq.status}</Text>
            <Text style={styles.state}>{eq.state}</Text>
          </View>

          {manualEnabled && (
            <View style={styles.controls}>
              <TouchableOpacity
                style={[styles.btn, styles.btnOn, eq.state === 'ON' && styles.btnDisabled]}
                onPress={() => control(eq.id, 'ON', eq.name)}
                disabled={loading === eq.id || eq.state === 'ON'}
              >
                <Text style={styles.btnText}>ON</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnOff, eq.state === 'OFF' && styles.btnDisabled]}
                onPress={() => control(eq.id, 'OFF', eq.name)}
                disabled={loading === eq.id || eq.state === 'OFF'}
              >
                <Text style={[styles.btnText, { color: BRAND.text }]}>OFF</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.background, padding: 16 },
  warning: { backgroundColor: '#FEF3C7', padding: 12, borderRadius: 10, marginBottom: 12 },
  warningText: { color: '#92400E', fontSize: 13 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  title: { fontSize: 17, fontWeight: '700', color: BRAND.text },
  statusRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  status: { fontSize: 13, color: BRAND.accent, fontWeight: '600' },
  state: { fontSize: 13, color: BRAND.textMuted },
  controls: { flexDirection: 'row', gap: 10, marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  btn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
  btnOn: { backgroundColor: BRAND.primary },
  btnOff: { backgroundColor: '#F3F4F6' },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: '#fff', fontWeight: '600' },
});
