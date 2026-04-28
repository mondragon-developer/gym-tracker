import { createContext } from 'react';

/**
 * Language Context — definition only. Provider lives in LanguageContext.jsx,
 * hook lives in useLanguage.js. Splitting these three keeps the JSX file
 * component-only (satisfies eslint react-refresh/only-export-components).
 */
export const LanguageContext = createContext(null);
