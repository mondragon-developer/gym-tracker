import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import UnitsToggle from './UnitsToggle.jsx';
import { UnitsProvider } from '../contexts/UnitsContext.jsx';

vi.mock('../hooks/useLanguage.js', () => ({
    useLanguage: () => ({ language: 'en' }),
}));

const renderToggle = () =>
    render(
        <UnitsProvider>
            <UnitsToggle />
        </UnitsProvider>
    );

describe('UnitsToggle', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('defaults to lbs and toggles to kg on click, persisting the choice', () => {
        renderToggle();
        fireEvent.click(screen.getByRole('button', { name: 'lbs ↔ kg' }));

        expect(screen.getByRole('button', { name: 'kg ↔ lbs' })).toBeInTheDocument();
        expect(localStorage.getItem('gym-tracker-weight-unit')).toBe('kg');
    });

    it('restores a saved unit from localStorage', () => {
        localStorage.setItem('gym-tracker-weight-unit', 'kg');
        renderToggle();
        expect(screen.getByRole('button', { name: 'kg ↔ lbs' })).toBeInTheDocument();
    });

    it('falls back to lbs on a corrupt stored value', () => {
        localStorage.setItem('gym-tracker-weight-unit', 'stones');
        renderToggle();
        expect(screen.getByRole('button', { name: 'lbs ↔ kg' })).toBeInTheDocument();
    });
});
