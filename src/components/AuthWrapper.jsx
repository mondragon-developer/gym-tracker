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

// A trainer invite link (?trainer=CODE) should land visitors directly on the
// sign-up form with the trainer's code pre-filled.
const inviteCodeFromUrl = () => {
  try {
    return new URLSearchParams(window.location.search).get('trainer') || '';
  } catch {
    return '';
  }
};

export default function AuthWrapper({ children }) {
  const { user, loading, isPasswordRecovery } = useAuth();
  const [inviteCode] = useState(inviteCodeFromUrl);
  const [mode, setMode] = useState(inviteCode ? 'signup' : 'signin'); // 'signin' | 'signup' | 'forgot'

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
      return <SignUp onToggleMode={() => setMode('signin')} initialTrainerCode={inviteCode} />;
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
