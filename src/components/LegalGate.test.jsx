import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const legal = vi.hoisted(() => ({ hasAcceptedLocally: vi.fn(), fetchAccepted: vi.fn(), recordAcceptance: vi.fn() }));
vi.mock('../services/LegalService.js', () => legal);

const chatbase = vi.hoisted(() => ({ loadChatbase: vi.fn(), ensureChatbaseStub: vi.fn() }));
vi.mock('../lib/chatbase.js', () => chatbase);

const auth = vi.hoisted(() => ({ user: { id: 'u1' }, signOut: vi.fn() }));
vi.mock('../hooks/useAuth.js', () => ({ useAuth: () => auth }));
const lang = vi.hoisted(() => ({ language: 'en', toggleLanguage: () => {} }));
vi.mock('../hooks/useLanguage.js', () => ({ useLanguage: () => lang }));

import LegalGate from './LegalGate.jsx';

const gate = () => <LegalGate><p>the app</p></LegalGate>;
const accepted = () => document.documentElement.hasAttribute('data-legal-accepted');
const agreeButton = () => screen.findByRole('button', { name: 'Agree and continue' });

beforeEach(() => {
    legal.hasAcceptedLocally.mockReset().mockReturnValue(false);
    legal.fetchAccepted.mockReset();
    legal.recordAcceptance.mockReset();
    chatbase.loadChatbase.mockReset();
    auth.signOut.mockReset();
    auth.user = { id: 'u1' };
    lang.language = 'en';
});

describe('LegalGate', () => {
    it('opens the app at once for an account known to have accepted, and still asks the database', async () => {
        legal.hasAcceptedLocally.mockReturnValue(true);
        legal.fetchAccepted.mockResolvedValue(true);
        render(gate());
        expect(screen.getByText('the app')).toBeInTheDocument();
        expect(accepted()).toBe(true);
        await waitFor(() => expect(legal.fetchAccepted).toHaveBeenCalledWith('u1'));
        expect(screen.getByText('the app')).toBeInTheDocument();
    });

    it('closes the app again when the database has no row behind the local copy', async () => {
        legal.hasAcceptedLocally.mockReturnValue(true);
        legal.fetchAccepted.mockResolvedValue(false);
        render(gate());
        expect(await agreeButton()).toBeInTheDocument();
        expect(screen.queryByText('the app')).not.toBeInTheDocument();
        expect(accepted()).toBe(false);
    });

    it('keeps an account that accepted before working when the database cannot be reached', async () => {
        legal.hasAcceptedLocally.mockReturnValue(true);
        legal.fetchAccepted.mockResolvedValue(null);
        render(gate());
        await waitFor(() => expect(legal.fetchAccepted).toHaveBeenCalled());
        expect(screen.getByText('the app')).toBeInTheDocument();
    });

    it('opens the app when the database has the acceptance', async () => {
        legal.fetchAccepted.mockResolvedValue(true);
        render(gate());
        expect(screen.queryByText('the app')).not.toBeInTheDocument();
        expect(await screen.findByText('the app')).toBeInTheDocument();
    });

    it('keeps the app and the assistant away until both boxes are ticked and the acceptance is stored', async () => {
        legal.fetchAccepted.mockResolvedValue(false);
        legal.recordAcceptance.mockResolvedValue(true);
        render(gate());
        const button = await agreeButton();
        expect(button).toBeDisabled();
        expect(screen.queryByText('the app')).not.toBeInTheDocument();
        expect(accepted()).toBe(false);
        expect(chatbase.loadChatbase).not.toHaveBeenCalled();

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
        expect(chatbase.loadChatbase).toHaveBeenCalledTimes(1);
    });

    it('stays on the consent screen when the acceptance could not be stored', async () => {
        legal.fetchAccepted.mockResolvedValue(false);
        legal.recordAcceptance.mockResolvedValue(false);
        render(gate());
        const button = await agreeButton();
        screen.getAllByRole('checkbox').forEach((box) => fireEvent.click(box));
        fireEvent.click(button);
        expect(await screen.findByRole('alert')).toHaveTextContent('Could not record your acceptance');
        expect(screen.queryByText('the app')).not.toBeInTheDocument();
        expect(chatbase.loadChatbase).not.toHaveBeenCalled();
    });

    it('asks for consent when the check fails and nothing is known locally', async () => {
        legal.fetchAccepted.mockResolvedValue(null);
        render(gate());
        expect(await agreeButton()).toBeInTheDocument();
        expect(screen.queryByText('the app')).not.toBeInTheDocument();
    });

    it('starts the boxes over when the language changes', async () => {
        legal.fetchAccepted.mockResolvedValue(false);
        const view = render(gate());
        await agreeButton();
        screen.getAllByRole('checkbox').forEach((box) => fireEvent.click(box));
        lang.language = 'es';
        view.rerender(gate());
        const button = await screen.findByRole('button', { name: 'Aceptar y continuar' });
        expect(button).toBeDisabled();
        screen.getAllByRole('checkbox').forEach((box) => expect(box).not.toBeChecked());
    });

    it('lets the person sign out without agreeing', async () => {
        legal.fetchAccepted.mockResolvedValue(false);
        render(gate());
        await agreeButton();
        fireEvent.click(screen.getByRole('button', { name: 'Sign Out' }));
        expect(auth.signOut).toHaveBeenCalled();
        expect(legal.recordAcceptance).not.toHaveBeenCalled();
    });

    it('opens the full documents from the consent screen', async () => {
        legal.fetchAccepted.mockResolvedValue(false);
        render(gate());
        await agreeButton();
        fireEvent.click(screen.getByRole('button', { name: 'Privacy Policy' }));
        const dialog = await screen.findByRole('dialog');
        expect(dialog).toHaveTextContent('Who is responsible');
        fireEvent.click(screen.getAllByRole('button', { name: 'Terms of Use' }).pop());
        await waitFor(() => expect(dialog).toHaveTextContent('You train at your own risk'));
    });

    it('does not carry the acceptance of one account over to the next', async () => {
        legal.fetchAccepted.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
        const view = render(gate());
        expect(await screen.findByText('the app')).toBeInTheDocument();
        auth.user = { id: 'u2' };
        view.rerender(gate());
        expect(screen.queryByText('the app')).not.toBeInTheDocument();
        expect(await agreeButton()).toBeInTheDocument();
        expect(accepted()).toBe(false);
    });
});
