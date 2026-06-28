import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../lib/auth-store';
import { BRAND } from '../constants/theme';

export default function IndexScreen() {
  const router = useRouter();
  const { accessToken, isHydrated } = useAuthStore();

  useEffect(() => {
    if (!isHydrated) return;
    if (accessToken) {
      router.replace('/(tabs)');
    } else {
      router.replace('/login');
    }
  }, [isHydrated, accessToken, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={BRAND.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BRAND.primary },
});
