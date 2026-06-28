'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isInternal, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }
    if (isInternal()) {
      router.replace('/admin');
    } else {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isInternal, router, user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-background">
      <div className="animate-pulse text-brand-primary font-semibold">Loading Digitalized Plantation...</div>
    </div>
  );
}
