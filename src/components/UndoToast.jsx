/**
 * UndoToast
 * Bottom toast shown after a destructive action (delete, reset, restart)
 * instead of asking first. Undo puts the previous week back; the toast
 * hides itself after a few seconds.
 */

import React, { useEffect } from 'react';
import { t } from '../translations/ui';

const AUTO_HIDE_MS = 6000;

const UndoToast = ({ message, onUndo, onDismiss, language = 'en' }) => {
  useEffect(() => {
    if (!message) return undefined;
    const id = setTimeout(onDismiss, AUTO_HIDE_MS);
    return () => clearTimeout(id);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        left: '50%',
        bottom: '84px',
        transform: 'translateX(-50%)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '12px 16px',
        borderRadius: '12px',
        backgroundColor: '#0f172a',
        color: 'white',
        fontSize: '14px',
        fontWeight: 600,
        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.35)',
        maxWidth: 'calc(100vw - 32px)'
      }}
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={onUndo}
        style={{
          border: 'none',
          background: 'none',
          color: '#67e8f9',
          fontWeight: 700,
          fontSize: '14px',
          cursor: 'pointer',
          padding: 0
        }}
      >
        {t('Undo', language)}
      </button>
    </div>
  );
};

export default UndoToast;
