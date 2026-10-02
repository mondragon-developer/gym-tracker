/**
 * User Profile Component
 * Displays user information, backup and restore of the workout data, and
 * the sign out button in the header
 */

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { useLanguage } from '../hooks/useLanguage.js';
import { t } from '../translations/ui';
import Button from './ui/Button';
import { ButtonVariant } from './ui/Button.constants.js';
import { headerControlStyle, headerControlHover, headerControlRest } from './ui/headerControlStyle.js';
import LazyFallback from './ui/LazyFallback.jsx';

const TrainerAccessModal = React.lazy(() => import('./TrainerAccessModal.jsx'));

const LegalModal = React.lazy(() => import('./LegalModal.jsx'));

const menuItemStyle = {
  display: 'block',
  width: '100%',
  padding: '10px 16px',
  border: 'none',
  background: 'none',
  textAlign: 'left',
  fontSize: '14px',
  fontWeight: 600,
  color: 'var(--text)',
  cursor: 'pointer'
};

export default function UserProfile({ onBackup, onRestore, onDeleteAccount }) {
  const { user, signOut, updateProfile, isAdmin } = useAuth();
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);
  // An invite only opens a review. No relationship is written on navigation.
  const [inviteCode] = useState(() => new URLSearchParams(window.location.search).get('trainer')
    || user?.user_metadata?.pending_trainer_code || '');
  const [trainerAccessOpen, setTrainerAccessOpen] = useState(Boolean(inviteCode));
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has('trainer')) {
      url.searchParams.delete('trainer');
      window.history.replaceState({}, '', url);
    }
  }, []);
  const closeTrainerAccess = () => {
    setTrainerAccessOpen(false);
    // This metadata is an invitation reminder, never authorization.
    if (user?.user_metadata?.pending_trainer_code) {
      updateProfile({ pending_trainer_code: null });
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    setIsSigningOut(false);
  };

  if (!user) return null;

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
                style={{ ...headerControlStyle, padding: '0 14px 0 6px' }}
        onMouseOver={headerControlHover}
        onMouseOut={headerControlRest}
      >
                <div style={{
          width: '30px',
          height: '30px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: '700',
          fontSize: '14px'
        }}>
          {user.email ? user.email[0].toUpperCase() : '?'}
        </div>
        <span style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {user.user_metadata?.name || user.email}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999
            }}
          />

          {/* Dropdown */}
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              minWidth: '240px',
              backgroundColor: 'var(--surface)',
              borderRadius: '12px',
              boxShadow: '0 10px 40px var(--shadow-strong)',
              overflow: 'hidden',
              zIndex: 1000,
              border: '1px solid var(--border)'
            }}
          >
            {/* User Info */}
            <div style={{
              padding: '16px',
              borderBottom: '1px solid var(--border)'
            }}>
              <p style={{
                margin: '0 0 4px 0',
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text)'
              }}>
                {user.user_metadata?.name || 'User'}
              </p>
              <p style={{
                margin: 0,
                fontSize: '13px',
                color: 'var(--text-3)',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {user.email}
              </p>
            </div>

            <button type="button" style={menuItemStyle} onClick={() => { setIsOpen(false); setTrainerAccessOpen(true); }}>
              {t('Connected trainers', language)}
            </button>

            {(onBackup || onRestore) && (
              <div style={{ padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                {onBackup && (
                  <button type="button" style={menuItemStyle} onClick={() => { setIsOpen(false); onBackup(); }}>
                    {t('Back up my data', language)}
                  </button>
                )}
                {onRestore && (
                  <button type="button" style={menuItemStyle} onClick={() => { setIsOpen(false); onRestore(); }}>
                    {t('Restore from backup', language)}
                  </button>
                )}
              </div>
            )}

            <div style={{ padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
              <button type="button" style={menuItemStyle} onClick={() => { setIsOpen(false); setLegalOpen(true); }}>
                {t('Terms and privacy', language)}
              </button>
            </div>

            {/* Admins are demoted first so the last admin cannot vanish. */}
            {onDeleteAccount && !isAdmin && (
              <div style={{ padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                <button
                  type="button"
                  style={{ ...menuItemStyle, color: 'var(--danger)' }}
                  onClick={() => { setIsOpen(false); onDeleteAccount(); }}
                >
                  {t('Delete my account', language)}
                </button>
              </div>
            )}

            {/* Sign Out Button */}
            <div style={{ padding: '8px' }}>
              <Button
                onClick={handleSignOut}
                variant={ButtonVariant.DANGER}
                disabled={isSigningOut}
                fullWidth
                style={{ fontSize: '14px' }}
              >
                {isSigningOut ? t('Signing out...', language) : t('Sign Out', language)}
              </Button>
            </div>
          </div>
        </>
      )}

      {trainerAccessOpen && (
        <Suspense fallback={<LazyFallback language={language} />}>
          <TrainerAccessModal key={language} language={language} initialCode={inviteCode} onClose={closeTrainerAccess} />
        </Suspense>
      )}

      {legalOpen && (
        <Suspense fallback={<LazyFallback language={language} />}>
          <LegalModal isOpen onClose={() => setLegalOpen(false)} language={language} />
        </Suspense>
      )}
    </div>
  );
}
