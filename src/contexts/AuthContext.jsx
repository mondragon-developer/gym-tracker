/**
 * Authentication Context
 * Manages user authentication state and provides auth methods throughout the app
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AuthContext } from './authContextDef.js';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('user');
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state (sign in, sign out, etc.).
    // PASSWORD_RECOVERY fires when the user arrives via a reset-email link:
    // Supabase signs them in from the link's token, and we must show a
    // "set new password" screen before letting them into the app.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Role lives in public.profiles (auto-created by a signup trigger); RLS lets
  // every user read their own row, so this is safe to run for non-admins too.
  useEffect(() => {
    if (!user) {
      setRole('user');
      return;
    }

    let cancelled = false;
    supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!cancelled) {
          setRole(!error && data?.role ? data.role : 'user');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  // Sign up with email and password
  const signUp = async (email, password, metadata = {}) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  // Sign in with email and password
  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  // Send a password-reset email. The link redirects to the site root: this
  // SPA has no routes, so the PASSWORD_RECOVERY auth event (not a URL) is
  // what switches the UI to the update-password screen.
  const resetPassword = async (email) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  // Set a new password for the signed-in user (recovery-link session)
  const updatePassword = async (newPassword) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      setIsPasswordRecovery(false);
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  // Resolve a trainer invite code to the trainer's email (used by the sign-up
  // form to validate the optional code before creating the account).
  const lookupTrainerCode = async (code) => {
    try {
      const { data, error } = await supabase.rpc('lookup_trainer_code', { code });
      if (error) throw error;
      return { trainerEmail: data ?? null, error: null };
    } catch (error) {
      return { trainerEmail: null, error };
    }
  };

  // Update user profile
  const updateProfile = async (updates) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: updates
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const value = {
    user,
    loading,
    role,
    isAdmin: role === 'admin',
    isTrainer: role === 'trainer',
    isPasswordRecovery,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    lookupTrainerCode
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
