/**
 * PasswordInput Component - Password field with a show/hide visibility toggle
 * Wraps the base Input component and adds an "eye" button that switches
 * the input type between password and text so users can check their typing.
 */

import React, { useState } from 'react';
import Input from './Input.jsx';
import { useLanguage } from '../../hooks/useLanguage.js';
import { t } from '../../translations/ui';

const iconProps = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round'
};

const EyeIcon = () => (
  <svg {...iconProps} aria-hidden="true">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg {...iconProps} aria-hidden="true">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c6.5 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3.5 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" x2="22" y1="2" y2="22" />
  </svg>
);

/**
 * Password input with visibility toggle
 * Accepts all Input props except `type`, which it controls.
 * @param {Object} props - Component props (forwarded to Input)
 * @returns {React.ReactElement} PasswordInput component
 */
const PasswordInput = ({ style = {}, disabled = false, ...rest }) => {
  const { language } = useLanguage();
  const [visible, setVisible] = useState(false);

  const label = visible
    ? t('Hide password', language)
    : t('Show password', language);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <Input
        type={visible ? 'text' : 'password'}
        disabled={disabled}
        style={{ paddingRight: '42px', ...style }}
        {...rest}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        disabled={disabled}
        aria-label={label}
        title={label}
        aria-pressed={visible}
        style={{
          position: 'absolute',
          right: '8px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          padding: '6px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          color: '#6b7280',
          display: 'flex',
          alignItems: 'center',
          opacity: disabled ? 0.6 : 1
        }}
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
};

export default PasswordInput;
