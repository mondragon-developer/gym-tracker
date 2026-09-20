/**
 * SaveStatusBar
 * Sticky footer for the current week that tells the user whether their edits
 * are on the server, and gives them a button to force it. Autosave still runs
 * behind the scenes; this is the visible confirmation of it.
 */

import React from 'react';
import { SaveState } from '../hooks/useWorkoutPlan.js';
import { t } from '../translations/ui';

const formatTime = (date, language) => {
  if (!date) return '';
  try {
    return date.toLocaleTimeString(language === 'es' ? 'es' : 'en', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

const tone = {
  neutral: { color: '#6b7280', border: '#e5e7eb', bg: '#ffffff' },
  pending: { color: '#b45309', border: '#fcd34d', bg: '#fffbeb' },
  ok:      { color: '#047857', border: '#a7f3d0', bg: '#ecfdf5' },
  bad:     { color: '#b91c1c', border: '#fecaca', bg: '#fef2f2' }
};

const buttonStyle = (variant, disabled) => ({
  padding: '10px 16px',
  borderRadius: '10px',
  border: variant === 'primary' ? 'none' : '1px solid #d1d5db',
  background: variant === 'primary'
    ? 'linear-gradient(90deg, #06b6d4 0%, #0e7490 100%)'
    : '#ffffff',
  color: variant === 'primary' ? '#ffffff' : '#374151',
  fontSize: '14px',
  fontWeight: 600,
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.55 : 1,
  whiteSpace: 'nowrap'
});

const SaveStatusBar = ({ saveState, lastSavedAt, onSave, onReload, onOverwrite, language = 'en' }) => {
  let message;
  let palette;
  let actions;

  const savedAt = lastSavedAt
    ? `${t('Saved at', language)} ${formatTime(lastSavedAt, language)}`
    : t('All changes saved', language);

  switch (saveState) {
    case SaveState.DIRTY:
      message = t('Unsaved changes', language);
      palette = tone.pending;
      actions = (
        <button type="button" onClick={onSave} style={buttonStyle('primary', false)}>
          {t('Save changes', language)}
        </button>
      );
      break;
    case SaveState.SAVING:
      message = t('Saving...', language);
      palette = tone.pending;
      actions = (
        <button type="button" disabled style={buttonStyle('primary', true)}>
          {t('Saving...', language)}
        </button>
      );
      break;
    case SaveState.ERROR:
      message = t('Could not save your changes. Check your connection and try again.', language);
      palette = tone.bad;
      actions = (
        <button type="button" onClick={onSave} style={buttonStyle('primary', false)}>
          {t('Retry', language)}
        </button>
      );
      break;
    case SaveState.CONFLICT:
      message = t('This plan was updated from another device or by your trainer.', language);
      palette = tone.bad;
      actions = (
        <>
          <button type="button" onClick={onReload} style={buttonStyle('primary', false)}>
            {t('Load latest', language)}
          </button>
          <button type="button" onClick={onOverwrite} style={buttonStyle('secondary', false)}>
            {t('Keep mine', language)}
          </button>
        </>
      );
      break;
    case SaveState.SAVED:
      message = savedAt;
      palette = tone.ok;
      actions = (
        <button type="button" disabled style={buttonStyle('primary', true)}>
          {t('Saved', language)}
        </button>
      );
      break;
    default:
      message = savedAt;
      palette = tone.neutral;
      actions = (
        <button type="button" disabled style={buttonStyle('primary', true)}>
          {t('Save changes', language)}
        </button>
      );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'sticky',
        bottom: 0,
        zIndex: 5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        flexWrap: 'wrap',
        padding: '12px 16px',
        margin: '20px -32px -24px',
        borderTop: `1px solid ${palette.border}`,
        backgroundColor: palette.bg,
        boxShadow: '0 -6px 16px rgba(15, 23, 42, 0.08)'
      }}
    >
      <span style={{ color: palette.color, fontSize: '14px', fontWeight: 600 }}>
        {message}
      </span>
      <div style={{ display: 'flex', gap: '8px' }}>
        {actions}
      </div>
    </div>
  );
};

export default SaveStatusBar;
