import React from 'react';
import { useUnits } from '../hooks/useUnits.js';
import { useLanguage } from '../hooks/useLanguage.js';
import { t } from '../translations/ui';
import { headerControlStyle, headerControlHover, headerControlRest } from './ui/headerControlStyle.js';

/**
 * Units Toggle Component
 * Header button that switches the weight unit between lbs and kg.
 * Mirrors the LanguageToggle visual style.
 */
const UnitsToggle = () => {
    const { unit, toggleUnit } = useUnits();
    const { language } = useLanguage();

    return (
        <button
            onClick={toggleUnit}
                        style={headerControlStyle}
            onMouseOver={headerControlHover}
            onMouseOut={headerControlRest}
            title={t('Switch weight unit', language)}
        >
            <span>
                {unit === 'lbs' ? 'lbs ↔ kg' : 'kg ↔ lbs'}
            </span>
        </button>
    );
};

export default UnitsToggle;
