'use client';

import { SessionProvider } from 'next-auth/react';
import { useSession } from 'next-auth/react';
import { useAuthStore } from '@/stores/auth-store';
import { useEffect } from 'react';

interface AuthProviderProps {
  children: React.ReactNode;
}

function AuthStoreSync() {
  const { data: session, status } = useSession();
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    if (status === 'loading') {
      setLoading(true);
      return;
    }

    setLoading(false);

    if (session?.user) {
      setUser({
        id: session.user.id,
        email: session.user.email!,
        username: session.user.username,
        displayName: session.user.name!,
        profileImage: session.user.image || undefined,
        isPremium: session.user.isPremium,
        subscriptionTier: 'free', // Default value
        subscriptionStatus: 'canceled', // Default value
        createdAt: new Date(), // We don't have this from session
        updatedAt: new Date(),
      });
    } else {
      setUser(null);
    }
  }, [session, status, setUser, setLoading]);

  return null;
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider>
      <AuthStoreSync />
      {children}
    </SessionProvider>
  );
}