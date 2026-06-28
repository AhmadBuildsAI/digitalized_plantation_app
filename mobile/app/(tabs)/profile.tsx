import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../lib/auth-store';
import { BRAND, APP_NAME } from '../../constants/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{user?.firstName?.[0]}{user?.lastName?.[0]}</Text>
      </View>
      <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
      <Text style={styles.email}>{user?.email}</Text>
      <Text style={styles.company}>{user?.customerProfile?.companyName || 'Customer Account'}</Text>

      <View style={styles.infoCard}>
        <InfoRow label="Manual Control" value={user?.customerProfile?.manualControlEnabled ? 'Enabled' : 'Disabled'} />
        <InfoRow label="App" value={APP_NAME} />
        <InfoRow label="Role" value="Customer" />
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.background, padding: 24, alignItems: 'center' },
  avatar: {
    width: 80, height: 80, borderRadius: 20, backgroundColor: BRAND.primary,
    justifyContent: 'center', alignItems: 'center', marginTop: 20,
  },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '700' },
  name: { fontSize: 22, fontWeight: '700', color: BRAND.text, marginTop: 16 },
  email: { fontSize: 14, color: BRAND.textMuted, marginTop: 4 },
  company: { fontSize: 14, color: BRAND.primary, fontWeight: '500', marginTop: 2 },
  infoCard: {
    width: '100%', backgroundColor: '#fff', borderRadius: 16, padding: 20,
    marginTop: 32, borderWidth: 1, borderColor: '#E5E7EB',
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  infoLabel: { color: BRAND.textMuted, fontSize: 14 },
  infoValue: { color: BRAND.text, fontSize: 14, fontWeight: '500' },
  logoutBtn: {
    marginTop: 32, backgroundColor: '#FEE2E2', borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 40,
  },
  logoutText: { color: BRAND.error, fontWeight: '600', fontSize: 16 },
});
