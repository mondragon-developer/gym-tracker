/**
 * Invite Notice Banner
 * One-time, dismissible explanation shown when a trainer invitation did not
 * take effect (consumed before the signup completed), so the account was
 * created as a regular one. Purely presentational; visibility and dismissal
 * persistence are handled by the caller.
 */

import React from 'react';
import { t } from '../translations/ui';

export default function InviteNoticeBanner({ onDismiss, language = 'en' }) {
    return (
        <div
            role="status"
            style={{
                margin: '16px 32px 0 32px',
                padding: '12px 16px',
                backgroundColor: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: '10px',
                color: '#92400e',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                flexWrap: 'wrap'
            }}
        >
            <span>
                {t('Your trainer invitation was already used or had expired, so your account was created as a regular account. Ask your admin for a new invitation.', language)}
            </span>
            <button
                onClick={onDismiss}
                style={{
                    padding: '6px 14px',
                    backgroundColor: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    flexShrink: 0
                }}
            >
                {t('Got it', language)}
            </button>
        </div>
    );
}
