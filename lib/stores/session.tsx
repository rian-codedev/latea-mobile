import * as React from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { api, setAuthErrorHandler } from '@/lib/api/client';
import { tokenStorage } from '@/lib/utils/storage';
import { useCart } from './cart';

export type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  store_id: number | null;
  store: {
    id: number;
    name: string;
    code: string;
    location: string;
    avatar_url?: string | null;
  } | null;
  avatar_url?: string | null;
};

export type ExpiredReason = 'token' | 'idle' | null;

type SessionState = {
  user: User | null;
  isLoading: boolean;
  expiredReason: ExpiredReason;
  clearExpiredReason: () => void;
  setUser: (user: User) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signOutLocally: () => Promise<void>;
  expireIdle: () => Promise<void>;
};

const SessionContext = React.createContext<SessionState | null>(null);

export function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [expiredReason, setExpiredReason] =
    React.useState<ExpiredReason>(null);
  const queryClient = useQueryClient();

  /* ⭐ Reset terpusat — semua jalur auth failure lewat sini */
  const performLocalClear = React.useCallback(
    (reason: ExpiredReason) => {
      queryClient.clear();
      useCart.getState().clear();
      setUser(null);
      setExpiredReason(reason);
    },
    [queryClient],
  );

  /* ── Restore session ── */
  React.useEffect(() => {
    let mounted = true;

    (async () => {
      const token = await tokenStorage.get();
      if (!token) {
        if (mounted) setIsLoading(false);
        return;
      }

      try {
        const res = await api.get<{ user: User }>('/me');
        if (mounted) setUser(res.data.user);
      } catch (err: any) {
        if (err?.response?.status === 401) {
          await tokenStorage.clear();
          if (mounted) performLocalClear('token');
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [performLocalClear]);

  /* ── 401 global handler ── */
  React.useEffect(() => {
    setAuthErrorHandler(() => {
      performLocalClear('token');
    });
    return () => setAuthErrorHandler(null);
  }, [performLocalClear]);

  /* ── Re-validate on foreground ── */
  React.useEffect(() => {
    if (!user) return;

    const sub = AppState.addEventListener(
      'change',
      async (state: AppStateStatus) => {
        if (state !== 'active') return;

        try {
          const token = await tokenStorage.get();
          if (!token) {
            performLocalClear('token');
            return;
          }
          const res = await api.get<{ user: User }>('/me');
          setUser(res.data.user);
        } catch (err: any) {
          if (err?.response?.status === 401) {
            await tokenStorage.clear();
            performLocalClear('token');
          }
        }
      },
    );

    return () => sub.remove();
  }, [user, performLocalClear]);

  const clearExpiredReason = React.useCallback(() => {
    setExpiredReason(null);
  }, []);

  const updateUser = React.useCallback((nextUser: User) => {
    setUser(nextUser);
  }, []);

  const signIn = React.useCallback(
    async (email: string, password: string) => {
      const res = await api.post<{ token: string; user: User }>(
        '/login',
        { email, password },
      );
      await tokenStorage.set(res.data.token);
      queryClient.clear();
      setExpiredReason(null);
      setUser(res.data.user);
    },
    [queryClient],
  );

  const signOut = React.useCallback(async () => {
    try {
      await api.post('/logout');
    } catch {
      // diamkan — tetap bersihkan lokal
    } finally {
      await tokenStorage.clear();
      performLocalClear(null);
    }
  }, [performLocalClear]);

  /** Logout lokal tanpa API (setelah change password / idle). */
  const signOutLocally = React.useCallback(async () => {
    await tokenStorage.clear();
    performLocalClear(null);
  }, [performLocalClear]);

  /** Logout karena idle — set reason = 'idle' agar toast muncul. */
  const expireIdle = React.useCallback(async () => {
    await tokenStorage.clear();
    performLocalClear('idle');
  }, [performLocalClear]);

  const value = React.useMemo(
    () => ({
      user,
      isLoading,
      expiredReason,
      clearExpiredReason,
      setUser: updateUser,
      signIn,
      signOut,
      signOutLocally,
      expireIdle,
    }),
    [
      user,
      isLoading,
      expiredReason,
      clearExpiredReason,
      updateUser,
      signIn,
      signOut,
      signOutLocally,
      expireIdle,
    ],
  );

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = React.useContext(SessionContext);
  if (!ctx)
    throw new Error('useSession must be used within SessionProvider');
  return ctx;
}