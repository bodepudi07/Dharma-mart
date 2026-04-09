

import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode, useRef } from 'react';
import * as api from '../services/apiService';

interface ExclusiveSession {
  token: string;
  email: string;
  expiresAt: string;
  remainingMs: number;
}

interface AuthContextType {
  session: ExclusiveSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  userLoading: boolean;
  remainingMs: number;
  activateSession: (token: string, expiresAt: string, remainingMs: number, email: string) => void;
  logout: () => void;
  // Legacy compat — keep these so existing components don't break
  currentUser: any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'dharmasetu-exclusive-session';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<ExclusiveSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userLoading, setUserLoading] = useState(true);
  const [remainingMs, setRemainingMs] = useState(0);
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const logout = useCallback(() => {
    setSession(null);
    setRemainingMs(0);
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem('dharma-setu-user');
    localStorage.removeItem('dharma-setu-user');

    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const startSessionTimers = useCallback((expiresAt: string) => {
    // Clear any existing timers
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    const expiresAtMs = new Date(expiresAt).getTime();
    const nowMs = Date.now();
    const remaining = Math.max(0, expiresAtMs - nowMs);

    if (remaining <= 0) {
      logout();
      return;
    }

    setRemainingMs(remaining);

    // Auto-logout timer — exact expiry
    logoutTimerRef.current = setTimeout(() => {
      logout();
      // Force page reload to show gateway
      window.location.hash = '';
      window.location.reload();
    }, remaining);

    // Countdown timer — update every second
    countdownRef.current = setInterval(() => {
      const now = Date.now();
      const left = Math.max(0, expiresAtMs - now);
      setRemainingMs(left);
      if (left <= 0) {
        logout();
        window.location.hash = '';
        window.location.reload();
      }
    }, 1000);
  }, [logout]);

  const activateSession = useCallback((token: string, expiresAt: string, remainingMs: number, email: string) => {
    const newSession: ExclusiveSession = { token, expiresAt, remainingMs, email };
    setSession(newSession);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
    startSessionTimers(expiresAt);
  }, [startSessionTimers]);

  // On mount: check for saved session and validate it
  useEffect(() => {
    const validateSession = async () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) {
          setUserLoading(false);
          return;
        }

        const savedSession = JSON.parse(saved) as ExclusiveSession;
        const expiresAtMs = new Date(savedSession.expiresAt).getTime();

        // If already expired, clear it
        if (Date.now() >= expiresAtMs) {
          logout();
          setUserLoading(false);
          return;
        }

        // Validate with backend
        try {
          const status = await api.getSessionStatus(savedSession.token);
          const validSession: ExclusiveSession = {
            token: savedSession.token,
            email: status.email,
            expiresAt: status.expiresAt,
            remainingMs: status.remainingMs,
          };
          setSession(validSession);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(validSession));
          startSessionTimers(status.expiresAt);
        } catch {
          // Session invalid on backend
          logout();
        }
      } catch {
        logout();
      } finally {
        setUserLoading(false);
      }
    };

    validateSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  // Legacy compat: expose a minimal currentUser-like object
  const currentUser = session ? {
    id: 0,
    name: session.email.split('@')[0],
    email: session.email,
    token: session.token,
    role: 'exclusive_user',
  } : null;

  const value: AuthContextType = {
    session,
    isAuthenticated: !!session,
    isLoading,
    userLoading,
    remainingMs,
    activateSession,
    logout,
    currentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};