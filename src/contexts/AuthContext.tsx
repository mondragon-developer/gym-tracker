import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean; // true while we resolve the initial session on first load
  isAdmin: boolean; // true when the signed-in user's profile role is 'admin'
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Owns the authentication state for the whole app.
 *
 * On mount it (1) reads any persisted session, then (2) subscribes to auth
 * changes so login/logout anywhere updates the whole tree. It also looks up the
 * user's role from the `profiles` table to expose `isAdmin`. The role is only a
 * UI hint — real authorisation is enforced by the database's RLS policies.
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Look up the role for a given user id (own profile is always readable via RLS).
  const refreshRole = async (userId: string | undefined) => {
    if (!userId) {
      setIsAdmin(false);
      return;
    }
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();
    setIsAdmin(data?.role === 'admin');
  };

  useEffect(() => {
    // 1. Resolve the session that may already be stored from a previous visit.
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      refreshRole(data.session?.user?.id).finally(() => setLoading(false));
    });

    // 2. Keep in sync with future sign-in / sign-out / token-refresh events.
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      refreshRole(newSession?.user?.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (
    email: string,
    password: string
  ): Promise<{ needsConfirmation: boolean }> => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    // If email confirmation is enabled, no session is returned until the user
    // clicks the link in their inbox.
    return { needsConfirmation: !data.session };
  };

  const signOut = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, isAdmin, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};
