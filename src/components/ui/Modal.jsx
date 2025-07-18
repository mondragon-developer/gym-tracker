/**
 * Modal Component - Unified modal implementation
 * Replaces CustomModal and NewModal to follow Interface Segregation Principle
 */

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Button, { ButtonVariant, ButtonSize } from './Button.jsx';

/**
 * Base modal styles
 */
const overlayStyles = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '16px'
};

const modalStyles = {
  backgroundColor: 'white',
  borderRadius: '12px',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  maxWidth: '90vw',
  maxHeight: '90vh',
  overflow: 'auto',
  position: 'relative'
};

const headerStyles = {
  padding: '24px 24px 0 24px',
  borderBottom: '1px solid #e5e7eb'
};

const titleStyles = {
  fontSize: '20px',
  fontWeight: '600',
  color: '#374151',
  margin: '0 0 16px 0'
};

const contentStyles = {
  padding: '24px'
};

const closeButtonStyles = {
  position: 'absolute',
  top: '16px',
  right: '16px',
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '18px'
};

/**
 * Unified Modal component
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Close handler
 * @param {string} props.title - Modal title
 * @param {React.ReactNode} props.children - Modal content
 * @param {boolean} props.showCloseButton - Whether to show close button
 * @param {boolean} props.closeOnOverlayClick - Whether to close when clicking overlay
 * @param {Object} props.style - Additional modal styles
 * @param {string} props.className - Additional CSS classes
 * @returns {React.ReactElement|null} Modal component
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  showCloseButton = true,
  closeOnOverlayClick = true,
  style = {},
  className = ''
}) => {
  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const modal = (
    <div style={overlayStyles} onClick={handleOverlayClick}>
      <div 
        style={{ ...modalStyles, ...style }} 
        className={className}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with title and close button */}
        {(title || showCloseButton) && (
          <div style={headerStyles}>
            {title && <h2 style={titleStyles}>{title}</h2>}
            {showCloseButton && (
              <Button
                variant={ButtonVariant.SECONDARY}
                size={ButtonSize.SMALL}
                onClick={onClose}
                style={closeButtonStyles}
                aria-label="Close modal"
              >
                ×
              </Button>
            )}
          </div>
        )}
        
        {/* Content */}
        <div style={contentStyles}>
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default Modal;