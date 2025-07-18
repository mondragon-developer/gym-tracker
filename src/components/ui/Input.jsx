/**
 * Input Component - Reusable input with consistent styling
 * Follows Single Responsibility Principle by focusing on input behavior
 */

import React from 'react';

/**
 * Input variant types
 */
export const InputVariant = {
  DEFAULT: 'default',
  SUCCESS: 'success',
  ERROR: 'error'
};

/**
 * Input size types
 */
export const InputSize = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large'
};

/**
 * Base input styles
 */
const baseStyles = {
  border: '2px solid #e5e7eb',
  borderRadius: '8px',
  padding: '8px 12px',
  fontSize: '14px',
  fontFamily: 'inherit',
  transition: 'all 0.2s ease',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box'
};

/**
 * Variant-specific styles
 */
const variantStyles = {
  [InputVariant.DEFAULT]: {
    borderColor: '#e5e7eb',
    focusBorderColor: '#06b6d4'
  },
  [InputVariant.SUCCESS]: {
    borderColor: '#10b981',
    focusBorderColor: '#059669'
  },
  [InputVariant.ERROR]: {
    borderColor: '#ef4444',
    focusBorderColor: '#dc2626'
  }
};

/**
 * Size-specific styles
 */
const sizeStyles = {
  [InputSize.SMALL]: {
    padding: '6px 10px',
    fontSize: '12px'
  },
  [InputSize.MEDIUM]: {
    padding: '8px 12px',
    fontSize: '14px'
  },
  [InputSize.LARGE]: {
    padding: '12px 16px',
    fontSize: '16px'
  }
};

/**
 * Reusable Input component
 * @param {Object} props - Component props
 * @param {string} props.type - Input type (text, number, etc.)
 * @param {string} props.value - Input value
 * @param {Function} props.onChange - Change handler
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.variant - Input variant (default, success, error)
 * @param {string} props.size - Input size (small, medium, large)
 * @param {boolean} props.disabled - Whether input is disabled
 * @param {number} props.min - Minimum value (for number inputs)
 * @param {number} props.max - Maximum value (for number inputs)
 * @param {Object} props.style - Additional styles
 * @param {string} props.className - Additional CSS classes
 * @returns {React.ReactElement} Input component
 */
const Input = ({
  type = 'text',
  value,
  onChange,
  placeholder = '',
  variant = InputVariant.DEFAULT,
  size = InputSize.MEDIUM,
  disabled = false,
  min,
  max,
  style = {},
  className = '',
  ...rest
}) => {
  const inputStyles = {
    ...baseStyles,
    ...sizeStyles[size],
    borderColor: variantStyles[variant].borderColor,
    ...(disabled && { 
      backgroundColor: '#f9fafb',
      cursor: 'not-allowed',
      opacity: 0.6
    }),
    ...style
  };

  const handleFocus = (e) => {
    if (!disabled) {
      e.target.style.borderColor = variantStyles[variant].focusBorderColor;
      e.target.style.boxShadow = `0 0 0 3px ${variantStyles[variant].focusBorderColor}20`;
    }
  };

  const handleBlur = (e) => {
    if (!disabled) {
      e.target.style.borderColor = variantStyles[variant].borderColor;
      e.target.style.boxShadow = 'none';
    }
  };

  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={inputStyles}
      className={className}
      disabled={disabled}
      min={min}
      max={max}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...rest}
    />
  );
};

export default Input;