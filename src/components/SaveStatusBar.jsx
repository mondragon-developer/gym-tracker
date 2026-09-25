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
  neutral: { color: 'var(--text-3)', border: 'var(--border)', bg: 'var(--surface)' },
  pending: { color: 'var(--skipped)', border: 'var(--skipped-border)', bg: 'var(--skipped-soft)' },
  ok:      { color: 'var(--done)', border: 'var(--done-border)', bg: 'var(--done-soft)' },
  bad:     { color: 'var(--danger)', border: 'var(--danger-border)', bg: 'var(--danger-soft)' }
};

const buttonStyle = (variant, disabled) => ({
  padding: '10px 16px',
  borderRadius: '10px',
  border: variant === 'primary' ? 'none' : '1px solid var(--border)',
  background: variant === 'primary'
    ? 'var(--brand)'
    : 'var(--surface)',
  color: variant === 'primary' ? 'var(--on-brand)' : 'var(--text-2)',
  fontSize: '14px',
  fontWeight: 600,
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.55 : 1,
  whiteSpace: 'nowrap'
});

const SaveStatusBar = ({ saveState, lastSavedAt, onSave, onReload, onOverwrite, onJumpToToday, onUndo, language = 'en' }) => {
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
        boxShadow: '0 -6px 16px var(--shadow)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        {onJumpToToday && (
          <button
            type="button"
            onClick={onJumpToToday}
            style={{
              padding: '6px 12px',
              borderRadius: '999px',
              border: '1px solid var(--brand-border)',
              backgroundColor: 'var(--brand-soft)',
              color: 'var(--brand)',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {t('Today', language)}
          </button>
        )}
        <span style={{ color: palette.color, fontSize: '14px', fontWeight: 600 }}>
          {message}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        {onUndo && (
          <button
            type="button"
            onClick={onUndo}
            aria-label={t('Undo last change', language)}
            title={t('Undo last change', language)}
            style={buttonStyle('secondary', false)}
          >
            {t('Undo', language)}
          </button>
        )}
        {actions}
      </div>
    </div>
  );
};

export default SaveStatusBar;
