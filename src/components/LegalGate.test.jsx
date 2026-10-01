import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const legal = vi.hoisted(() => ({ hasAcceptedLocally: vi.fn(), fetchAccepted: vi.fn(), recordAcceptance: vi.fn() }));
vi.mock('../services/LegalService.js', () => legal);

const auth = vi.hoisted(() => ({ user: { id: 'u1' }, signOut: vi.fn() }));
vi.mock('../hooks/useAuth.js', () => ({ useAuth: () => auth }));
vi.mock('../hooks/useLanguage.js', () => ({ useLanguage: () => ({ language: 'en', toggleLanguage: vi.fn() }) }));

import LegalGate from './LegalGate.jsx';

const gate = <LegalGate><p>the app</p></LegalGate>;
const accepted = () => document.documentElement.hasAttribute('data-legal-accepted');
const agreeButton = () => screen.findByRole('button', { name: 'Agree and continue' });

beforeEach(() => {
    legal.hasAcceptedLocally.mockReset().mockReturnValue(false);
    legal.fetchAccepted.mockReset();
    legal.recordAcceptance.mockReset();
    auth.signOut.mockReset();
    auth.user = { id: 'u1' };
});

describe('LegalGate', () => {
    it('opens the app at once for an account known to have accepted', () => {
        legal.hasAcceptedLocally.mockReturnValue(true);
        render(gate);
        expect(screen.getByText('the app')).toBeInTheDocument();
        expect(legal.fetchAccepted).not.toHaveBeenCalled();
        expect(accepted()).toBe(true);
    });

    it('opens the app when the database has the acceptance', async () => {
        legal.fetchAccepted.mockResolvedValue(true);
        render(gate);
        expect(screen.queryByText('the app')).not.toBeInTheDocument();
        expect(await screen.findByText('the app')).toBeInTheDocument();
    });

    it('keeps the app closed until both boxes are ticked and the acceptance is stored', async () => {
        legal.fetchAccepted.mockResolvedValue(false);
        legal.recordAcceptance.mockResolvedValue(true);
        render(gate);
        const button = await agreeButton();
        expect(button).toBeDisabled();
        expect(screen.queryByText('the app')).not.toBeInTheDocument();
        expect(accepted()).toBe(false);

        const boxes = screen.getAllByRole('checkbox');
        expect(boxes).toHaveLength(2);
        boxes.forEach((box) => expect(box).not.toBeChecked());
        fireEvent.click(boxes[0]);
        expect(button).toBeDisabled();
        fireEvent.click(boxes[1]);
        fireEvent.click(button);

        expect(await screen.findByText('the app')).toBeInTheDocument();
        expect(legal.recordAcceptance).toHaveBeenCalledWith('u1', 'en');
        expect(accepted()).toBe(true);
    });

    it('stays on the consent screen when the acceptance could not be stored', async () => {
        legal.fetchAccepted.mockResolvedValue(false);
        legal.recordAcceptance.mockResolvedValue(false);
        render(gate);
        const button = await agreeButton();
        screen.getAllByRole('checkbox').forEach((box) => fireEvent.click(box));
        fireEvent.click(button);
        expect(await screen.findByRole('alert')).toHaveTextContent('Could not record your acceptance');
        expect(screen.queryByText('the app')).not.toBeInTheDocument();
    });

    it('asks for consent when the check itself fails', async () => {
        legal.fetchAccepted.mockResolvedValue(null);
        render(gate);
        expect(await agreeButton()).toBeInTheDocument();
        expect(screen.queryByText('the app')).not.toBeInTheDocument();
    });

    it('lets the person sign out without agreeing', async () => {
        legal.fetchAccepted.mockResolvedValue(false);
        render(gate);
        await agreeButton();
        fireEvent.click(screen.getByRole('button', { name: 'Sign Out' }));
        expect(auth.signOut).toHaveBeenCalled();
        expect(legal.recordAcceptance).not.toHaveBeenCalled();
    });

    it('opens the full documents from the consent screen', async () => {
        legal.fetchAccepted.mockResolvedValue(false);
        render(gate);
        await agreeButton();
        fireEvent.click(screen.getByRole('button', { name: 'Privacy Policy' }));
        const dialog = await screen.findByRole('dialog');
        expect(dialog).toHaveTextContent('Who is responsible');
        fireEvent.click(screen.getAllByRole('button', { name: 'Terms of Use' }).pop());
        await waitFor(() => expect(dialog).toHaveTextContent('You train at your own risk'));
    });

    it('does not carry the acceptance of one account over to the next', async () => {
        legal.fetchAccepted.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
        const view = render(gate);
        expect(await screen.findByText('the app')).toBeInTheDocument();
        auth.user = { id: 'u2' };
        view.rerender(<LegalGate><p>the app</p></LegalGate>);
        expect(screen.queryByText('the app')).not.toBeInTheDocument();
        expect(await agreeButton()).toBeInTheDocument();
        expect(accepted()).toBe(false);
    });
});
