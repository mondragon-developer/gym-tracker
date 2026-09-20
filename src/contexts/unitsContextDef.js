import { createContext } from 'react';

/**
 * Units Context - definition only. Provider lives in UnitsContext.jsx,
 * hook lives in useUnits.js. Splitting these three keeps the JSX file
 * component-only (satisfies eslint react-refresh/only-export-components).
 */
export const UnitsContext = createContext(null);
