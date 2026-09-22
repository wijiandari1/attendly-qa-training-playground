import { useCallback, useEffect, useState } from 'react';
import type { SessionUser } from '../types';

const KEY = 'attendly_session_v2';

export function loadSession(): SessionUser | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function useSession() {
  const [user, setUser] = useState<SessionUser | null>(() => loadSession());

  useEffect(() => {
    const onStorage = () => setUser(loadSession());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const signIn = useCallback((u: SessionUser) => {
    localStorage.setItem(KEY, JSON.stringify(u));
    setUser(u);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(KEY);
    setUser(null);
  }, []);

  return { user, signIn, signOut };
}
