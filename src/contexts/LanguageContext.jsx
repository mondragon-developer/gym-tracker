import React, { useState, useEffect } from 'react';
import { LanguageContext } from './languageContextDef.js';

/**
 * Language Provider component
 * Manages language state and persists to localStorage
 */
export const LanguageProvider = ({ children }) => {
    // Initialize language from localStorage or default to English
    const [language, setLanguage] = useState(() => {
        const savedLanguage = localStorage.getItem('gym-tracker-language');
        return savedLanguage || 'en';
    });

    // Persist preference and keep <html lang> in sync for screen readers
    useEffect(() => {
        localStorage.setItem('gym-tracker-language', language);
        if (typeof document !== 'undefined') {
            document.documentElement.lang = language;
        }
    }, [language]);

    // Toggle between English and Spanish
    const toggleLanguage = () => {
        setLanguage(prevLang => prevLang === 'en' ? 'es' : 'en');
    };

    // Set specific language
    const setLanguageDirectly = (lang) => {
        if (lang === 'en' || lang === 'es') {
            setLanguage(lang);
        }
    };

    const value = {
        language,
        toggleLanguage,
        setLanguage: setLanguageDirectly,
        isSpanish: language === 'es',
        isEnglish: language === 'en'
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};
