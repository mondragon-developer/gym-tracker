/**
 * StepperInput
 * A text field with minus and plus buttons for one-thumb entry on a phone.
 * The value stays a string (the plan stores "3", "8-10", "135"), and the
 * caller decides how a step changes it through `onStep`, so ranges like
 * "8-10" can move both ends while plain numbers move by `step`.
 */

import React from 'react';
import { stepNumbers } from '../../utils/stepNumbers.js';

const buttonStyle = (color, disabled) => ({
  width: '32px',
  minWidth: '32px',
  border: 'none',
  background: 'transparent',
  color,
  fontSize: '18px',
  fontWeight: 700,
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.4 : 1,
  padding: 0,
  lineHeight: 1
});

const StepperInput = ({
  value,
  onChange,
  step = 1,
  min = 0,
  max = Infinity,
  fallback = 0,
  inputMode = 'numeric',
  placeholder = '',
  ariaLabel,
  // Visual theme so each field keeps its existing color coding.
  background,
  borderColor,
  focusColor,
  focusShadow,
  disabled = false
}) => {
  const bump = (direction) => {
    if (disabled) return;
    onChange(stepNumbers(value, direction * step, { min, max, fallback }));
  };

  return (
    <div
      className="stepper-input"
      style={{
        display: 'flex',
        alignItems: 'stretch',
        width: '100%',
        background,
        border: `2px solid ${borderColor}`,
        borderRadius: '12px',
        boxSizing: 'border-box',
        transition: 'all 0.3s ease',
        overflow: 'hidden'
      }}
    >
      <button
        type="button"
        onClick={() => bump(-1)}
        aria-label={ariaLabel ? `${ariaLabel} -${step}` : `-${step}`}
        disabled={disabled}
        className="stepper-button"
        style={buttonStyle(focusColor, disabled)}
      >
        -
      </button>
      <input
        type="text"
        inputMode={inputMode}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          // Keyboard users step with the arrows without leaving the field.
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            bump(e.key === 'ArrowUp' ? 1 : -1);
          }
        }}
        placeholder={placeholder}
        aria-label={ariaLabel}
        disabled={disabled}
        className="stepper-field"
        style={{
          flex: 1,
          minWidth: 0,
          width: '100%',
          padding: '9px 2px',
          border: 'none',
          background: 'transparent',
          fontSize: '14px',
          fontWeight: '500',
          color: 'var(--text)',
          textAlign: 'center',
          outline: 'none'
        }}
        onFocus={(e) => {
          e.target.parentElement.style.boxShadow = focusShadow;
          e.target.parentElement.style.borderColor = focusColor;
        }}
        onBlur={(e) => {
          e.target.parentElement.style.boxShadow = 'none';
          e.target.parentElement.style.borderColor = borderColor;
        }}
      />
      <button
        type="button"
        onClick={() => bump(1)}
        aria-label={ariaLabel ? `${ariaLabel} +${step}` : `+${step}`}
        disabled={disabled}
        className="stepper-button"
        style={buttonStyle(focusColor, disabled)}
      >
        +
      </button>
    </div>
  );
};

export default StepperInput;
