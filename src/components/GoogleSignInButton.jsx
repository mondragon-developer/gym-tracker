/**
 * Google Sign-In Button
 * OAuth alternative to email/password, shown below the auth forms with a
 * divider. Callers hide it when a trainer invite/code is in play, because
 * those codes only attach during an email sign-up (they cannot survive the
 * OAuth redirect).
 */

import React from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { useLanguage } from '../hooks/useLanguage.js';
import { t } from '../translations/ui';
import Button from './ui/Button';
import { ButtonVariant } from './ui/Button.constants.js';

export default function GoogleSignInButton() {
  const { signInWithGoogle } = useAuth();
  const { language } = useLanguage();

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '4px 0' }}>
        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }} />
        <span style={{ color: 'var(--text-3)', fontSize: '13px' }}>{t('or', language)}</span>
        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }} />
      </div>
      <Button
        type="button"
        variant={ButtonVariant.SECONDARY}
        onClick={signInWithGoogle}
        fullWidth
      >
        <span style={{ fontWeight: 800, color: 'var(--info)' }}>G</span>
        &nbsp;{t('Continue with Google', language)}
      </Button>
    </div>
  );
}
