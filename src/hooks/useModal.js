/**
 * Custom hook for modal state management
 * Follows Single Responsibility Principle by handling only modal state
 */

import { useState } from 'react';

/**
 * Custom hook for managing modal state
 * @param {boolean} initialState - Initial modal state
 * @returns {Object} Modal state and actions
 */
const useModal = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState);
  const [data, setData] = useState(null);

  /**
   * Opens the modal
   * @param {*} modalData - Optional data to associate with modal
   */
  const open = (modalData = null) => {
    setData(modalData);
    setIsOpen(true);
  };

  /**
   * Closes the modal and clears data
   */
  const close = () => {
    setIsOpen(false);
    setData(null);
  };

  /**
   * Toggles modal state
   * @param {*} modalData - Optional data to associate when opening
   */
  const toggle = (modalData = null) => {
    if (isOpen) {
      close();
    } else {
      open(modalData);
    }
  };

  return {
    isOpen,
    data,
    open,
    close,
    toggle
  };
};

export default useModal;