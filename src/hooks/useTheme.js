import { useContext } from 'react';
import { ThemeContext } from '../contexts/themeContextDef.js';

/**
 * Custom hook to use the Theme Context
 * @returns {Object} { theme, resolvedTheme, setTheme, cycleTheme }
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
