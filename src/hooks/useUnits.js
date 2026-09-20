import { useContext } from 'react';
import { UnitsContext } from '../contexts/unitsContextDef.js';

/**
 * Custom hook to use the Units Context
 * @returns {Object} Units context value ({ unit, toggleUnit, setUnit, isLbs, isKg })
 */
export const useUnits = () => {
  const context = useContext(UnitsContext);
  if (!context) {
    throw new Error('useUnits must be used within a UnitsProvider');
  }
  return context;
};
