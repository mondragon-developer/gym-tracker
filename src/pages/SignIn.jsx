/**
 * Sign In Page Component
 * Allows users to sign in to their account
 */

import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { useLanguage } from '../hooks/useLanguage.js';
import { t } from '../translations/ui';
import Button from '../components/ui/Button';
import { ButtonVariant } from '../components/ui/Button.constants.js';
import Input from '../components/ui/Input';
import mdLogo from '../assets/mdlogo.jpeg';

export default function SignIn({ onToggleMode }) {
  const { signIn } = useAuth();
  const { language } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Basic validation
    if (!email || !password) {
      setError(t('Please fill in all fields', language));
      setLoading(false);
      return;
    }

    const { error: signInError } = await signIn(email, password);

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '40px 32px',
          background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 20%, #0e7490 40%, #155e75 60%, #164e63 80%, #0f172a 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <img
            src={mdLogo}
            alt="MD Logo"
            style={{
              width: '100px',
              height: '100px',
              objectFit: 'cover',
              borderRadius: '50%',
              border: '4px solid rgba(255, 255, 255, 0.4)',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4)'
            }}
          />
          <div style={{ textAlign: 'center' }}>
            <h1 style={{
              color: 'white',
              fontSize: '28px',
              margin: '0 0 8px 0',
              fontWeight: '700'
            }}>
              {t('Welcome Back', language)}
            </h1>
            <p style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '14px',
              margin: '0'
            }}>
              {t('Sign in to track your progress', language)}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {error && (
              <div style={{
                padding: '12px 16px',
                backgroundColor: '#fee2e2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#991b1b',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                {t('Email', language)}
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('Enter your email', language)}
                disabled={loading}
                required
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                {t('Password', language)}
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('Enter your password', language)}
                disabled={loading}
                required
              />
            </div>

            <Button
              type="submit"
              variant={ButtonVariant.PRIMARY}
              disabled={loading}
              fullWidth
            >
              {loading ? t('Signing in...', language) : t('Sign In', language)}
            </Button>

            <div style={{
              textAlign: 'center',
              fontSize: '14px',
              color: '#6b7280',
              marginTop: '8px'
            }}>
              {t("Don't have an account?", language)}{' '}
              <button
                type="button"
                onClick={onToggleMode}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#06b6d4',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: '0'
                }}
              >
                {t('Sign Up', language)}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
