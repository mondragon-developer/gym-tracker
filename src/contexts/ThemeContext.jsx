import React, { useState, useEffect } from 'react';
import { ThemeContext } from './themeContextDef.js';

const STORAGE_KEY = 'gym-tracker-theme';
const CHOICES = ['system', 'light', 'dark'];

const readStored = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return CHOICES.includes(saved) ? saved : 'system';
    } catch {
        return 'system';
    }
};

const systemPrefersDark = () => {
    try {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
        return false;
    }
};

/**
 * Theme Provider
 * Holds the user's choice (system / light / dark). The tokens in
 * src/theme/tokens.css already follow the phone setting on their own; a
 * manual choice is written to <html data-theme> so the stylesheet can
 * override it. "system" removes the attribute again.
 */
export const ThemeProvider = ({ children }) => {
    const [choice, setChoice] = useState(readStored);
    const [systemDark, setSystemDark] = useState(systemPrefersDark);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, choice);
        } catch {
            // Private mode: the choice lasts for this page only.
        }
        const root = document.documentElement;
        if (choice === 'system') {
            delete root.dataset.theme;
        } else {
            root.dataset.theme = choice;
        }
    }, [choice]);

    useEffect(() => {
        let media;
        try {
            media = window.matchMedia('(prefers-color-scheme: dark)');
        } catch {
            return undefined;
        }
        const onChange = (event) => setSystemDark(event.matches);
        media.addEventListener('change', onChange);
        return () => media.removeEventListener('change', onChange);
    }, []);

    const setTheme = (next) => {
        if (CHOICES.includes(next)) setChoice(next);
    };

    const cycleTheme = () => {
        setChoice(prev => CHOICES[(CHOICES.indexOf(prev) + 1) % CHOICES.length]);
    };

    const value = {
        theme: choice,
        resolvedTheme: choice === 'system' ? (systemDark ? 'dark' : 'light') : choice,
        setTheme,
        cycleTheme
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};
