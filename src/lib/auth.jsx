// DPR Analyzer Pro — auth context.
// Single source of truth for session + profile. Components read these via useAuth().

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { supabase, isSupabaseConfigured } from './supabase.js';

const AuthContext = createContext(null);

async function fetchProfile(userId) {
  if (!supabase || !userId) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) {
    // PGRST116 = no row yet; happens briefly right after signup before the
    // handle_new_user trigger has populated the row. Caller will retry.
    if (error.code !== 'PGRST116') {
      console.error('[auth] fetchProfile error:', error);
    }
    return null;
  }
  return data;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Bootstrap: load the existing session (if any) and subscribe to changes.
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return undefined;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setSession(data.session ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) setSession(nextSession ?? null);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Whenever the session user changes, refresh the profile. We retry once with
  // a short delay because the handle_new_user trigger may not have committed
  // the row by the time we first read it.
  useEffect(() => {
    if (!supabase) return undefined;

    const userId = session?.user?.id;
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      let p = await fetchProfile(userId);
      if (!p) {
        await new Promise((r) => setTimeout(r, 600));
        p = await fetchProfile(userId);
      }
      if (!cancelled) {
        setProfile(p);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  const refreshProfile = useCallback(async () => {
    const userId = session?.user?.id;
    if (!userId) return null;
    const p = await fetchProfile(userId);
    setProfile(p);
    return p;
  }, [session?.user?.id]);

  // ---- Auth actions ----------------------------------------------------

  const signUpWithEmail = useCallback(
    async ({ email, password, companyName, contactName, phone }) => {
      if (!supabase) throw new Error('Authentication is not configured yet.');
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // These flow into raw_user_meta_data and are read by the
          // handle_new_user trigger to populate the profile row.
          data: {
            company_name: companyName,
            contact_name: contactName,
            phone,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      return data;
    },
    []
  );

  const signInWithEmail = useCallback(async ({ email, password }) => {
    if (!supabase) throw new Error('Authentication is not configured yet.');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) throw new Error('Authentication is not configured yet.');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  // ---- Derived flags ---------------------------------------------------

  const isAuthenticated = Boolean(session?.user);
  const isAdmin = profile?.role === 'admin';
  const isPending = isAuthenticated && (!profile || profile?.status === 'pending');
  const needsProfileCompletion =
    isAuthenticated && profile && !profile.company_name;

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      configured: isSupabaseConfigured(),
      isAuthenticated,
      isAdmin,
      isPending,
      needsProfileCompletion,
      signUpWithEmail,
      signInWithEmail,
      signInWithGoogle,
      signOut,
      refreshProfile,
    }),
    [
      session,
      profile,
      loading,
      isAuthenticated,
      isAdmin,
      isPending,
      needsProfileCompletion,
      signUpWithEmail,
      signInWithEmail,
      signInWithGoogle,
      signOut,
      refreshProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
