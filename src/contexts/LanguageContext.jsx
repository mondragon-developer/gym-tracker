import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * Language Context for managing app-wide language settings
 * Supports English (en) and Spanish (es)
 */
const LanguageContext = createContext();

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

    // Save language preference to localStorage when it changes
    useEffect(() => {
        localStorage.setItem('gym-tracker-language', language);
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