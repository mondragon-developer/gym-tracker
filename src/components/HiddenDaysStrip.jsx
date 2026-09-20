/**
 * HiddenDaysStrip
 * Compact row listing the days a user chose to hide (rest or empty days), with
 * a Show action per day. Renders nothing when no day is hidden.
 */

import React from 'react';
import { t } from '../translations/ui';

const HiddenDaysStrip = ({ days, onShow, language = 'en', readOnly = false }) => {
  if (!days || days.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px',
        padding: '10px 14px',
        borderRadius: '12px',
        border: '1px dashed #cbd5e1',
        backgroundColor: '#f8fafc',
        color: '#64748b',
        fontSize: '13px'
      }}
    >
      <span style={{ fontWeight: 600 }}>{t('Hidden days:', language)}</span>
      {days.map(day => (
        <span
          key={day}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '999px',
            backgroundColor: 'white',
            border: '1px solid #e2e8f0'
          }}
        >
          {t(day, language)}
          {!readOnly && (
            <button
              type="button"
              onClick={() => onShow(day)}
              aria-label={`${t('Show', language)} ${t(day, language)}`}
              style={{
                border: 'none',
                background: 'none',
                padding: 0,
                color: '#0e7490',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              {t('Show', language)}
            </button>
          )}
        </span>
      ))}
    </div>
  );
};

export default HiddenDaysStrip;
