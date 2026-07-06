/**
 * AuthWrapper Component
 * Handles authentication state and displays appropriate UI
 * Shows sign in/sign up for unauthenticated users
 * Shows protected content for authenticated users
 */

import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import SignIn from '../pages/SignIn';
import SignUp from '../pages/SignUp';
import ForgotPassword from '../pages/ForgotPassword';
import UpdatePassword from '../pages/UpdatePassword';

// Invite links land visitors directly on the sign-up form:
//   ?trainer=CODE         — client invite, pre-fills the trainer's code
//   ?trainer-invite=CODE  — super-admin invitation to create a TRAINER account
const paramFromUrl = (name) => {
  try {
    return new URLSearchParams(window.location.search).get(name) || '';
  } catch {
    return '';
  }
};

export default function AuthWrapper({ children }) {
  const { user, loading, isPasswordRecovery } = useAuth();
  const [inviteCode] = useState(() => paramFromUrl('trainer'));
  const [trainerInvite] = useState(() => paramFromUrl('trainer-invite'));
  const [mode, setMode] = useState((inviteCode || trainerInvite) ? 'signup' : 'signin'); // 'signin' | 'signup' | 'forgot'

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f9fafb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e5e7eb',
            borderTopColor: '#06b6d4',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ color: '#6b7280', fontSize: '16px' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // A reset-email link signs the user in with a recovery session; force them
  // to choose a new password before showing the app.
  if (isPasswordRecovery) {
    return <UpdatePassword />;
  }

  // Show sign in / sign up / forgot password if not authenticated
  if (!user) {
    if (mode === 'signup') {
      return (
        <SignUp
          onToggleMode={() => setMode('signin')}
          initialTrainerCode={inviteCode}
          trainerInvite={trainerInvite}
        />
      );
    }
    if (mode === 'forgot') {
      return <ForgotPassword onBackToSignIn={() => setMode('signin')} />;
    }
    return (
      <SignIn
        onToggleMode={() => setMode('signup')}
        onForgotPassword={() => setMode('forgot')}
      />
    );
  }

  // Show protected content if authenticated
  return children;
}
