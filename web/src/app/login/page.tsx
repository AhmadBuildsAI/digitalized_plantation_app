'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';
import { useAuthStore } from '@/lib/auth-store';
import { ApiError } from '@/lib/api';
import { APP_NAME } from '@/lib/constants';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, isAuthenticated, isInternal } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  if (isAuthenticated()) {
    router.replace(isInternal() ? '/admin' : '/dashboard');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password, rememberMe);
      const store = useAuthStore.getState();
      router.push(store.isInternal() ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-primary items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white/20" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-white/10" />
        </div>
        <div className="relative z-10 text-center">
          <Logo size="xl" />
          <p className="text-white/80 mt-8 text-lg max-w-sm mx-auto leading-relaxed">
            Monitor your plantation, control equipment, and stay connected with our support team — all in one platform.
          </p>
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-brand-background">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden flex justify-center mb-8">
            <Logo size="lg" />
          </div>

          <div className="card">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h1>
            <p className="text-gray-500 mb-8">Sign in to {APP_NAME}</p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pr-12"
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-brand-primary focus:ring-brand-accent"
                  />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
              </div>

              <button type="submit" disabled={isLoading} className="btn-primary w-full flex items-center justify-center gap-2">
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : null}
                Sign In
              </button>
            </form>

            <div className="mt-6 p-4 bg-brand-primary/5 rounded-xl">
              <p className="text-xs text-gray-500 font-medium mb-2">Demo Credentials</p>
              <div className="space-y-1 text-xs text-gray-600">
                <p><span className="font-medium">Customer:</span> john.green@farm.com / Customer@123</p>
                <p><span className="font-medium">Admin:</span> admin@digitalizedplantation.com / Admin@123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
