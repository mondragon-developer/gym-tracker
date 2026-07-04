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

export default function AuthWrapper({ children }) {
  const { user, loading } = useAuth();
  const [showSignUp, setShowSignUp] = useState(false);

  const toggleMode = () => {
    setShowSignUp(!showSignUp);
  };

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

  // Show sign in/sign up if not authenticated
  if (!user) {
    return showSignUp ? (
      <SignUp onToggleMode={toggleMode} />
    ) : (
      <SignIn onToggleMode={toggleMode} />
    );
  }

  // Show protected content if authenticated
  return children;
}
