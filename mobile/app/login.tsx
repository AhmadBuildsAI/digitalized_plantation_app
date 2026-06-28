import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Image,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../lib/auth-store';
import { BRAND, APP_NAME } from '../constants/theme';
import { ApiError } from '../lib/api';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    try {
      await login(email, password, rememberMe);
      router.replace('/(tabs)');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.brandTitle}>DIGITALIZED</Text>
          <Text style={styles.brandTitle}>PLANTATION</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to {APP_NAME}</Text>

          {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

          <Text style={styles.label}>Email address</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={BRAND.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            placeholderTextColor={BRAND.textMuted}
            secureTextEntry
          />

          <TouchableOpacity style={styles.checkRow} onPress={() => setRememberMe(!rememberMe)}>
            <View style={[styles.checkbox, rememberMe && styles.checkboxActive]} />
            <Text style={styles.checkLabel}>Remember me</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
          </TouchableOpacity>

          <View style={styles.demoBox}>
            <Text style={styles.demoTitle}>Demo Credentials</Text>
            <Text style={styles.demoText}>Customer: john.green@farm.com / Customer@123</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.primary },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  logo: { width: 100, height: 100, marginBottom: 12 },
  brandTitle: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: 1 },
  card: { backgroundColor: BRAND.surface, borderRadius: 20, padding: 24 },
  title: { fontSize: 24, fontWeight: '700', color: BRAND.text },
  subtitle: { color: BRAND.textMuted, marginBottom: 24, marginTop: 4 },
  label: { fontSize: 14, fontWeight: '500', color: BRAND.text, marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12,
    padding: 14, fontSize: 16, color: BRAND.text, backgroundColor: '#fff',
  },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 8 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: BRAND.primary, marginRight: 8 },
  checkboxActive: { backgroundColor: BRAND.primary },
  checkLabel: { color: BRAND.textMuted, fontSize: 14 },
  button: {
    backgroundColor: BRAND.primary, borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 16,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  errorBox: { backgroundColor: '#FEE2E2', padding: 12, borderRadius: 10, marginBottom: 8 },
  errorText: { color: BRAND.error, fontSize: 14 },
  demoBox: { backgroundColor: `${BRAND.primary}10`, padding: 12, borderRadius: 10, marginTop: 20 },
  demoTitle: { fontSize: 12, fontWeight: '600', color: BRAND.textMuted, marginBottom: 4 },
  demoText: { fontSize: 11, color: BRAND.textMuted },
});
