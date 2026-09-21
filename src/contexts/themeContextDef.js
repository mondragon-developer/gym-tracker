import { createContext } from 'react';

/**
 * Theme Context - definition only. Provider lives in ThemeContext.jsx,
 * hook lives in useTheme.js, same split as the units context.
 */
export const ThemeContext = createContext(null);
