/**
 * Sign Up Page Component
 * Allows users to create a new account
 */

import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { useLanguage } from '../hooks/useLanguage.js';
import { t } from '../translations/ui';
import Button from '../components/ui/Button';
import { ButtonVariant } from '../components/ui/Button.constants.js';
import Input from '../components/ui/Input';
import PasswordInput from '../components/ui/PasswordInput';
import mdLogo from '../assets/mdlogo.jpeg';

export default function SignUp({ onToggleMode }) {
  const { signUp, lookupTrainerCode } = useAuth();
  const { language } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [trainerCode, setTrainerCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!email || !password || !confirmPassword || !name) {
      setError(t('Please fill in all fields', language));
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError(t('Password must be at least 6 characters', language));
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError(t('Passwords do not match', language));
      setLoading(false);
      return;
    }

    // The trainer code is optional, but if one was typed it must be real —
    // silently ignoring a typo would create an unassigned account.
    const code = trainerCode.trim().toUpperCase();
    if (code) {
      const { trainerEmail } = await lookupTrainerCode(code);
      if (!trainerEmail) {
        setError(t('Invalid trainer code', language));
        setLoading(false);
        return;
      }
    }

    const metadata = code ? { name, trainer_code: code } : { name };
    const { error: signUpError } = await signUp(email, password, metadata);

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
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
          <div style={{
            padding: '40px 32px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px'
            }}>
              ✓
            </div>
            <h1 style={{
              color: 'white',
              fontSize: '28px',
              margin: '0',
              fontWeight: '700'
            }}>
              {t('Check Your Email', language)}
            </h1>
          </div>
          <div style={{ padding: '32px', textAlign: 'center' }}>
            <p style={{
              color: '#6b7280',
              fontSize: '16px',
              lineHeight: '1.6',
              margin: '0 0 24px 0'
            }}>
              {t('We sent a confirmation link to', language)} <strong>{email}</strong>
            </p>
            <p style={{
              color: '#6b7280',
              fontSize: '14px',
              lineHeight: '1.6',
              margin: '0 0 24px 0'
            }}>
              {t('Please check your email and click the link to verify your account', language)}
            </p>
            <Button
              variant={ButtonVariant.SECONDARY}
              onClick={onToggleMode}
              fullWidth
            >
              {t('Back to Sign In', language)}
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
              {t('Create Account', language)}
            </h1>
            <p style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '14px',
              margin: '0'
            }}>
              {t('Start tracking your fitness journey', language)}
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
                {t('Name', language)}
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('Enter your name', language)}
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
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('At least 6 characters', language)}
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
                {t('Confirm Password', language)}
              </label>
              <PasswordInput
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('Re-enter your password', language)}
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
                {t('Trainer code (optional)', language)}
              </label>
              <Input
                type="text"
                value={trainerCode}
                onChange={(e) => setTrainerCode(e.target.value)}
                placeholder={t("Enter your trainer's code", language)}
                disabled={loading}
                maxLength={12}
                style={{ textTransform: 'uppercase' }}
              />
              <p style={{
                fontSize: '12px',
                color: '#6b7280',
                margin: '6px 0 0 0'
              }}>
                {t('Leave it empty if you train on your own.', language)}
              </p>
            </div>

            <Button
              type="submit"
              variant={ButtonVariant.PRIMARY}
              disabled={loading}
              fullWidth
            >
              {loading ? t('Creating account...', language) : t('Create Account', language)}
            </Button>

            <div style={{
              textAlign: 'center',
              fontSize: '14px',
              color: '#6b7280',
              marginTop: '8px'
            }}>
              {t('Already have an account?', language)}{' '}
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
                {t('Sign In', language)}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
