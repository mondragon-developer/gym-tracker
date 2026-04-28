import { useContext } from 'react';
import { LanguageContext } from '../contexts/languageContextDef.js';

/**
 * Custom hook to use the Language Context
 * @returns {Object} Language context value
 */
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
