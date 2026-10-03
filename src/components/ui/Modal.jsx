/**
 * Modal Component - Unified modal implementation
 * Replaces CustomModal and NewModal to follow Interface Segregation Principle
 */

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

// Open modals, outermost first. Modals can nest (a demo on top of the
// exercise picker), so only the topmost one answers Escape and the body
// scroll lock is released only when the last one closes.
const openModals = [];
import Button from './Button.jsx';
import { ButtonVariant, ButtonSize } from './Button.constants.js';

/**
 * Base modal styles
 */
const overlayStyles = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'var(--overlay)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '16px'
};

const modalStyles = {
  backgroundColor: 'var(--surface)',
  borderRadius: '12px',
  boxShadow: '0 25px 50px -12px var(--shadow-strong)',
  maxWidth: '90vw',
  maxHeight: '90vh',
  overflow: 'auto',
  position: 'relative'
};

const headerStyles = {
  padding: '24px 24px 0 24px',
  borderBottom: '1px solid var(--border)'
};

const titleStyles = {
  fontSize: '20px',
  fontWeight: '600',
  color: 'var(--text)',
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
  fontSize: '18px',
  color: 'var(--text-3)'
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
  // Latest onClose without re-registering the listener on every render.
  const titleId = React.useId();
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const entry = {};
    const opener = document.activeElement;
    const dialog = dialogRef.current;
    const focusable = () => [...dialog.querySelectorAll('button, input, select, textarea, a[href], [tabindex]')].filter(el => !el.disabled && el.tabIndex >= 0 && !el.closest('[hidden]'));
    openModals.push(entry);
    document.body.style.overflow = 'hidden';
    dialog.focus();
    const containFocus = (e) => {
      if (openModals.at(-1) === entry && !dialog.contains(e.target)) dialog.focus();
    };
    document.addEventListener('focusin', containFocus);

    const handleEscape = (e) => {
      if (openModals.at(-1) !== entry) return;
      if (e.key === 'Tab') {
        const items = focusable();
        const first = items[0];
        const last = items.at(-1);
        if (!first || (e.shiftKey && (document.activeElement === first || document.activeElement === dialog))) {
          e.preventDefault(); (last || dialog).focus();
        } else if (!e.shiftKey && (document.activeElement === last || document.activeElement === dialog)) {
          e.preventDefault(); (first || dialog).focus();
        }
      }
      if (e.key === 'Escape' && openModals[openModals.length - 1] === entry) {
        onCloseRef.current();
      }
    };
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('focusin', containFocus);
      const index = openModals.indexOf(entry);
      if (index !== -1) openModals.splice(index, 1);
      if (openModals.length === 0) document.body.style.overflow = 'unset';
      if (opener?.isConnected) opener.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const modal = (
    <div style={overlayStyles} onClick={handleOverlayClick}>
      <div
        role="dialog"
        ref={dialogRef}
        tabIndex={-1}
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        style={{ ...modalStyles, ...style }}
        className={className}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with title and close button */}
        {(title || showCloseButton) && (
          <div style={headerStyles}>
            {title && <h2 id={titleId} style={titleStyles}>{title}</h2>}
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
