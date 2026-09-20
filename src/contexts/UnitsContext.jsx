import React, { useState, useEffect } from 'react';
import { UnitsContext } from './unitsContextDef.js';

const STORAGE_KEY = 'gym-tracker-weight-unit';
const VALID_UNITS = ['lbs', 'kg'];

/**
 * Units Provider component
 * Manages the preferred weight unit (lbs or kg) and persists it to
 * localStorage. Display-only: stored workout weights are plain numbers and
 * are never converted when the unit changes.
 */
export const UnitsProvider = ({ children }) => {
    // Initialize from localStorage, defaulting to lbs (the historical label)
    const [unit, setUnit] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return VALID_UNITS.includes(saved) ? saved : 'lbs';
    });

    // Persist every change
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, unit);
    }, [unit]);

    // Toggle between lbs and kg
    const toggleUnit = () => {
        setUnit(prevUnit => prevUnit === 'lbs' ? 'kg' : 'lbs');
    };

    // Set a specific unit
    const setUnitDirectly = (next) => {
        if (VALID_UNITS.includes(next)) {
            setUnit(next);
        }
    };

    const value = {
        unit,
        toggleUnit,
        setUnit: setUnitDirectly,
        isLbs: unit === 'lbs',
        isKg: unit === 'kg'
    };

    return (
        <UnitsContext.Provider value={value}>
            {children}
        </UnitsContext.Provider>
    );
};
