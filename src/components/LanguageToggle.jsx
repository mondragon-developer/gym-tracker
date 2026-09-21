import React from 'react';
import { useLanguage } from '../hooks/useLanguage.js';
import { headerControlStyle, headerControlHover, headerControlRest } from './ui/headerControlStyle.js';

/**
 * Language Toggle Component
 * Displays a button to switch between English and Spanish
 */
const LanguageToggle = () => {
    const { language, toggleLanguage } = useLanguage();

    return (
        <button
            onClick={toggleLanguage}
                        style={headerControlStyle}
            onMouseOver={headerControlHover}
            onMouseOut={headerControlRest}
            title={language === 'en' ? 'Switch to Spanish' : 'Cambiar a Inglés'}
        >
            <span>
                {language === 'en' ? 'Eng ↔ Esp' : 'Esp ↔ Eng'}
            </span>
        </button>
    );
};

export default LanguageToggle;