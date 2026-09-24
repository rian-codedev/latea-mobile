import * as React from 'react';
import { api } from './api';
import { tokenStorage } from './storage';

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
  } | null;
};

type SessionState = {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = React.createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Restore session saat app pertama dibuka
  React.useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const token = await tokenStorage.get();
        if (token) {
          const res = await api.get<User>('/me');
          if (mounted) setUser(res.data);
        }
      } catch {
        await tokenStorage.clear();
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const signIn = React.useCallback(async (email: string, password: string) => {
    const res = await api.post<{ token: string; user: User }>('/login', {
      email,
      password,
    });
    await tokenStorage.set(res.data.token);
    setUser(res.data.user);
  }, []);

  const signOut = React.useCallback(async () => {
    try {
      await api.post('/logout');
    } catch {
      // Abaikan — tetap bersihkan lokal
    } finally {
      await tokenStorage.clear();
      setUser(null);
    }
  }, []);

  const value = React.useMemo(
    () => ({ user, isLoading, signIn, signOut }),
    [user, isLoading, signIn, signOut]
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = React.useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return ctx;
}