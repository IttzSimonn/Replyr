import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { supabase } from '../services/supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  /** True when the app was opened via a password-reset deep link */
  recoveryMode: boolean;
  clearRecoveryMode: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  recoveryMode: false,
  clearRecoveryMode: () => {},
  signOut: async () => {},
});

// ─── Deep-link URL parser ─────────────────────────────────────────────────────
// Supabase can return params in query string (?code=X) OR hash fragment (#access_token=X)
function parseAuthUrl(url: string): Record<string, string> {
  const result: Record<string, string> = {};
  const qIndex = url.indexOf('?');
  const hIndex = url.indexOf('#');
  const queryStr = qIndex !== -1 ? url.slice(qIndex + 1, hIndex !== -1 ? hIndex : undefined) : '';
  const hashStr = hIndex !== -1 ? url.slice(hIndex + 1) : '';

  for (const part of [...queryStr.split('&'), ...hashStr.split('&')]) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const k = decodeURIComponent(part.slice(0, eq));
    const v = decodeURIComponent(part.slice(eq + 1));
    if (k) result[k] = v;
  }
  return result;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const recoveryNavigated = useRef(false);

  // ─── Handle any auth deep link ────────────────────────────────────────────
  const handleDeepLink = useCallback(async (url: string) => {
    if (!url) return;
    const params = parseAuthUrl(url);

    // Google / OAuth PKCE callback: replyr://auth/callback?code=XXX
    if (params.code && !params.type) {
      try {
        const { error } = await supabase.auth.exchangeCodeForSession(params.code);
        if (error) console.warn('[Auth] Code exchange error:', error.message);
      } catch (e) {
        console.warn('[Auth] Code exchange threw:', e);
      }
      return;
    }

    // Password recovery implicit tokens: #access_token=X&type=recovery
    if (params.type === 'recovery' && params.access_token) {
      try {
        const { error } = await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token ?? '',
        });
        if (!error) setRecoveryMode(true);
      } catch (e) {
        console.warn('[Auth] Recovery setSession threw:', e);
      }
      return;
    }

    // Password recovery PKCE: ?code=XXX&type=recovery
    if (params.code && params.type === 'recovery') {
      try {
        const { error } = await supabase.auth.exchangeCodeForSession(params.code);
        if (!error) setRecoveryMode(true);
      } catch (e) {
        console.warn('[Auth] Recovery code exchange threw:', e);
      }
    }
  }, []);

  useEffect(() => {
    // Restore persisted session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Keep in sync with Supabase auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      // Supabase fires PASSWORD_RECOVERY when a reset-link token is verified
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryMode(true);
      }
    });

    // Handle deep links while app is already open
    const linkSub = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));

    // Handle deep link that cold-launched the app
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    return () => {
      subscription.unsubscribe();
      linkSub.remove();
    };
  }, [handleDeepLink]);

  // Navigate to /reset-password whenever recovery mode activates
  useEffect(() => {
    if (recoveryMode && !recoveryNavigated.current) {
      recoveryNavigated.current = true;
      setTimeout(() => router.push('/reset-password'), 50);
    }
    if (!recoveryMode) {
      recoveryNavigated.current = false;
    }
  }, [recoveryMode]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setRecoveryMode(false);
  };

  const clearRecoveryMode = () => setRecoveryMode(false);

  return (
    <AuthContext.Provider
      value={{ session, user: session?.user ?? null, loading, recoveryMode, clearRecoveryMode, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
