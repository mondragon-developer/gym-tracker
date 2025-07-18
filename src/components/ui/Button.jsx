/**
 * Button Component - Reusable button with consistent styling
 * Follows Open/Closed Principle by supporting variants without modification
 */

import React from 'react';

/**
 * Button variant types
 */
export const ButtonVariant = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  DANGER: 'danger',
  SUCCESS: 'success'
};

/**
 * Button size types
 */
export const ButtonSize = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large'
};

/**
 * Base button styles
 */
const baseStyles = {
  border: 'none',
  cursor: 'pointer',
  fontWeight: '500',
  borderRadius: '8px',
  transition: 'all 0.3s ease',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px'
};

/**
 * Variant-specific styles
 */
const variantStyles = {
  [ButtonVariant.PRIMARY]: {
    background: 'linear-gradient(90deg, #06b6d4 0%, #0891b2 50%, #0e7490 100%)',
    color: 'white',
    boxShadow: '0 4px 12px rgba(6, 182, 212, 0.3)'
  },
  [ButtonVariant.SECONDARY]: {
    background: 'linear-gradient(90deg, #e5e7eb 0%, #d1d5db 100%)',
    color: '#374151',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
  },
  [ButtonVariant.DANGER]: {
    background: 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)',
    color: 'white',
    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
  },
  [ButtonVariant.SUCCESS]: {
    background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
    color: 'white',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
  }
};

/**
 * Size-specific styles
 */
const sizeStyles = {
  [ButtonSize.SMALL]: {
    padding: '8px 16px',
    fontSize: '14px'
  },
  [ButtonSize.MEDIUM]: {
    padding: '12px 24px',
    fontSize: '16px'
  },
  [ButtonSize.LARGE]: {
    padding: '16px 32px',
    fontSize: '18px'
  }
};

/**
 * Hover effect styles
 */
const hoverEffects = {
  [ButtonVariant.PRIMARY]: {
    transform: 'scale(1.02)',
    boxShadow: '0 6px 20px rgba(6, 182, 212, 0.4)'
  },
  [ButtonVariant.SECONDARY]: {
    transform: 'scale(1.02)',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)'
  },
  [ButtonVariant.DANGER]: {
    transform: 'scale(1.02)',
    boxShadow: '0 6px 20px rgba(239, 68, 68, 0.4)'
  },
  [ButtonVariant.SUCCESS]: {
    transform: 'scale(1.02)',
    boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)'
  }
};

/**
 * Reusable Button component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Button content
 * @param {string} props.variant - Button variant (primary, secondary, danger, success)
 * @param {string} props.size - Button size (small, medium, large)
 * @param {boolean} props.disabled - Whether button is disabled
 * @param {boolean} props.fullWidth - Whether button takes full width
 * @param {Function} props.onClick - Click handler
 * @param {Object} props.style - Additional styles
 * @param {string} props.className - Additional CSS classes
 * @returns {React.ReactElement} Button component
 */
const Button = ({ 
  children, 
  variant = ButtonVariant.PRIMARY,
  size = ButtonSize.MEDIUM,
  disabled = false,
  fullWidth = false,
  onClick,
  style = {},
  className = '',
  ...rest 
}) => {
  const buttonStyles = {
    ...baseStyles,
    ...variantStyles[variant],
    ...sizeStyles[size],
    ...(fullWidth && { width: '100%' }),
    ...(disabled && { 
      opacity: 0.6, 
      cursor: 'not-allowed',
      transform: 'none'
    }),
    ...style
  };

  const handleMouseEnter = (e) => {
    if (!disabled) {
      Object.assign(e.target.style, hoverEffects[variant]);
    }
  };

  const handleMouseLeave = (e) => {
    if (!disabled) {
      Object.assign(e.target.style, {
        transform: 'scale(1)',
        boxShadow: variantStyles[variant].boxShadow
      });
    }
  };

  return (
    <button
      style={buttonStyles}
      className={className}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
};

export default Button;