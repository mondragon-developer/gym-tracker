/**
 * Sign In Page Component
 * Allows users to sign in to their account
 */

import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { useLanguage } from '../hooks/useLanguage.js';
import { t } from '../translations/ui';
import { friendlyAuthError, isEmailNotConfirmed } from '../utils/authErrors.js';
import GoogleSignInButton from '../components/GoogleSignInButton';
import Button from '../components/ui/Button';
import { ButtonVariant } from '../components/ui/Button.constants.js';
import Input from '../components/ui/Input';
import PasswordInput from '../components/ui/PasswordInput';
import mdLogo from '../assets/mdlogo.jpeg';

export default function SignIn({ onToggleMode, onForgotPassword }) {
  const { signIn, resendConfirmation } = useAuth();
  const { language } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // Offer to resend the confirmation email when sign-in fails because the
  // account's email was never confirmed.
  const [showResend, setShowResend] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleResend = async () => {
    setResending(true);
    const { error: resendError } = await resendConfirmation(email);
    setResending(false);
    if (!resendError) {
      setResent(true);
      setShowResend(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setShowResend(false);
    setResent(false);
    setLoading(true);

    // Basic validation
    if (!email || !password) {
      setError(t('Please fill in all fields', language));
      setLoading(false);
      return;
    }

    const { error: signInError } = await signIn(email, password);

    if (signInError) {
      setError(t(friendlyAuthError(signInError), language));
      setShowResend(isEmailNotConfirmed(signInError));
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-page)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: 'var(--surface)',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px var(--shadow-strong)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '40px 32px',
          background: 'var(--header-bg)',
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
              boxShadow: '0 8px 25px var(--shadow-strong)'
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
                backgroundColor: 'var(--danger-soft)',
                border: '1px solid var(--danger-border)',
                borderRadius: '8px',
                color: 'var(--danger)',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            {showResend && (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--brand)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0,
                  fontSize: '14px',
                  textAlign: 'left'
                }}
              >
                {resending ? t('Sending...', language) : t('Resend confirmation email', language)}
              </button>
            )}

            {resent && (
              <div style={{
                padding: '12px 16px',
                backgroundColor: 'var(--done-soft)',
                border: '1px solid var(--done-border)',
                borderRadius: '8px',
                color: 'var(--done)',
                fontSize: '14px'
              }}>
                {t('Confirmation email sent!', language)}
              </div>
            )}

            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-2)'
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
                color: 'var(--text-2)'
              }}>
                {t('Password', language)}
              </label>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('Enter your password', language)}
                disabled={loading}
                required
              />
              <div style={{ textAlign: 'right', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={onForgotPassword}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--brand)',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: '0'
                  }}
                >
                  {t('Forgot password?', language)}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant={ButtonVariant.PRIMARY}
              disabled={loading}
              fullWidth
            >
              {loading ? t('Signing in...', language) : t('Sign In', language)}
            </Button>

            <GoogleSignInButton />

            <div style={{
              textAlign: 'center',
              fontSize: '14px',
              color: 'var(--text-3)',
              marginTop: '8px'
            }}>
              {t("Don't have an account?", language)}{' '}
              <button
                type="button"
                onClick={onToggleMode}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--brand)',
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
