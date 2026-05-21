import { useEffect, useState, ReactNode, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase, supabaseConfigError } from '../lib/supabase';
import type { Profile } from '../lib/database.types';
import { AuthContext } from './auth-context';
import toast from 'react-hot-toast';

function buildFallbackProfile(user: User): Profile {
  const meta = user.user_metadata as { full_name?: string } | undefined;
  const fromMeta = typeof meta?.full_name === 'string' ? meta.full_name : '';
  return {
    id: user.id,
    full_name: fromMeta || user.email?.split('@')[0] || 'User',
    email: user.email ?? '',
    avatar_url: null,
    created_at: user.created_at || new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (authUser: User) => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (error) {
      console.error('Failed to load profile', error);
      setProfile(buildFallbackProfile(authUser));
      setLoading(false);
      return;
    }

    if (data) {
      const row = data as Profile;
      setProfile({
        ...row,
        email: row.email || authUser.email || '',
        full_name: row.full_name || buildFallbackProfile(authUser).full_name,
      });
    } else {
      setProfile(buildFallbackProfile(authUser));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth
      .getSession()
      .then(({ data: { session: s } }) => {
        setSession(s);
        const u = s?.user ?? null;
        setUser(u);
        if (u) {
          void fetchProfile(u);
        } else {
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error('Failed to restore auth session', error);
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      const u = nextSession?.user ?? null;
      setUser(u);
      if (u) {
        void fetchProfile(u);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  async function signUp(email: string, password: string, fullName: string) {
    if (!isSupabaseConfigured) return { error: new Error(supabaseConfigError), hasSession: false };

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    return { error, hasSession: Boolean(data.session) };
  }

  async function signIn(email: string, password: string) {
    if (!isSupabaseConfigured) return { error: new Error(supabaseConfigError) };

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }

  async function signOut() {
    if (!isSupabaseConfigured) {
      setUser(null);
      setSession(null);
      setProfile(null);
      return;
    }
    await supabase.auth.signOut();
  }

  async function updateProfile(data: Partial<Profile>) {
    if (!user || !isSupabaseConfigured) return false;
    const { error } = await supabase.from('profiles').update(data).eq('id', user.id);
    if (error) {
      console.error('Failed to update profile', error);
      toast.error('Unable to save profile. Check your connection and try again.');
      return false;
    }
    await fetchProfile(user);
    return true;
  }

  return (
    <AuthContext.Provider
      value={{ user, session, profile, loading, signUp, signIn, signOut, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}
