import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ThemeToggle from './ThemeToggle.jsx';
import { ThemeProvider } from '../contexts/ThemeContext.jsx';
import { LanguageProvider } from '../contexts/LanguageContext.jsx';

const renderToggle = () => render(
    <LanguageProvider>
        <ThemeProvider>
            <ThemeToggle />
        </ThemeProvider>
    </LanguageProvider>
);

describe('ThemeToggle', () => {
    beforeEach(() => {
        localStorage.clear();
        delete document.documentElement.dataset.theme;
    });

    it('starts on the phone setting and writes no attribute', () => {
        renderToggle();
        expect(screen.getByRole('button', { name: 'Theme: System' })).toBeInTheDocument();
        expect(document.documentElement.dataset.theme).toBeUndefined();
    });

    it('cycles system, light, dark and marks the document for a manual choice', () => {
        renderToggle();
        fireEvent.click(screen.getByRole('button'));
        expect(document.documentElement.dataset.theme).toBe('light');
        fireEvent.click(screen.getByRole('button'));
        expect(document.documentElement.dataset.theme).toBe('dark');
        expect(screen.getByRole('button', { name: 'Theme: Dark' })).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button'));
        expect(document.documentElement.dataset.theme).toBeUndefined();
    });

    it('remembers the choice across mounts', () => {
        localStorage.setItem('gym-tracker-theme', 'dark');
        renderToggle();
        expect(screen.getByRole('button', { name: 'Theme: Dark' })).toBeInTheDocument();
        expect(document.documentElement.dataset.theme).toBe('dark');
    });
});
