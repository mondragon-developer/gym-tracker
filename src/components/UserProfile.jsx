/**
 * User Profile Component
 * Displays user information, backup and restore of the workout data, and
 * the sign out button in the header
 */

import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { useLanguage } from '../hooks/useLanguage.js';
import { t } from '../translations/ui';
import Button from './ui/Button';
import { ButtonVariant } from './ui/Button.constants.js';
import { headerControlStyle, headerControlHover, headerControlRest } from './ui/headerControlStyle.js';

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
  const { user, signOut, joinTrainer, isTrainer, isAdmin } = useAuth();
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  // Clients can link themselves to another trainer at any time.
  const [trainerCode, setTrainerCode] = useState('');
  const [joinState, setJoinState] = useState('idle'); // idle | joining | joined | invalid

  const handleJoinTrainer = async (e) => {
    e.preventDefault();
    const code = trainerCode.trim();
    if (!code) return;
    setJoinState('joining');
    const { joined } = await joinTrainer(code);
    setJoinState(joined ? 'joined' : 'invalid');
    if (joined) setTrainerCode('');
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

            {/* Trainer code: link this account to one more trainer */}
            {!isTrainer && !isAdmin && (
              <form onSubmit={handleJoinTrainer} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <label
                  htmlFor="profile-trainer-code"
                  style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '6px' }}
                >
                  {t('Trainer code', language)}
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    id="profile-trainer-code"
                    value={trainerCode}
                    onChange={(e) => { setTrainerCode(e.target.value.toUpperCase()); setJoinState('idle'); }}
                    placeholder="ABC123"
                    autoComplete="off"
                    style={{
                      flex: 1,
                      minWidth: 0,
                      padding: '8px 10px',
                      border: '1px solid var(--border-strong)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: 'var(--surface)',
                      color: 'var(--text)',
                      textTransform: 'uppercase'
                    }}
                  />
                  <Button
                    type="submit"
                    variant={ButtonVariant.SECONDARY}
                    disabled={joinState === 'joining' || !trainerCode.trim()}
                    style={{ fontSize: '13px', padding: '8px 12px' }}
                  >
                    {joinState === 'joining' ? t('Connecting...', language) : t('Connect', language)}
                  </Button>
                </div>
                {joinState === 'joined' && (
                  <p style={{ margin: '8px 0 0', fontSize: '12px', color: 'var(--done)', fontWeight: 600 }}>
                    {t('Connected to your trainer.', language)}
                  </p>
                )}
                {joinState === 'invalid' && (
                  <p style={{ margin: '8px 0 0', fontSize: '12px', color: 'var(--danger)', fontWeight: 600 }}>
                    {t('That trainer code is not valid.', language)}
                  </p>
                )}
              </form>
            )}

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
    </div>
  );
}
