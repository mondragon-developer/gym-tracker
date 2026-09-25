import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const account = vi.hoisted(() => ({ deleteMyAccount: vi.fn(), DELETE_CONFIRM_WORD: 'DELETE' }));
vi.mock('../services/AccountService.js', () => account);

import DeleteAccountModal from './DeleteAccountModal.jsx';

const setup = (props = {}) => {
    const handlers = { onClose: vi.fn(), onBackup: vi.fn(), onDeleted: vi.fn() };
    render(<DeleteAccountModal isOpen {...handlers} {...props} />);
    return handlers;
};

const deleteButton = () => screen.getAllByRole('button', { name: 'Delete my account' }).pop();

beforeEach(() => account.deleteMyAccount.mockReset());

describe('DeleteAccountModal', () => {
    it('stays locked until the word is typed, then deletes', async () => {
        account.deleteMyAccount.mockResolvedValue({ ok: true });
        const { onDeleted } = setup();
        expect(deleteButton()).toBeDisabled();
        fireEvent.change(screen.getByLabelText('Type DELETE to confirm'), { target: { value: 'delet' } });
        expect(deleteButton()).toBeDisabled();
        fireEvent.change(screen.getByLabelText('Type DELETE to confirm'), { target: { value: 'delete' } });
        fireEvent.click(deleteButton());
        await waitFor(() => expect(onDeleted).toHaveBeenCalledTimes(1));
    });

    it('offers a backup first', () => {
        const { onBackup } = setup();
        fireEvent.click(screen.getByRole('button', { name: 'Back up my data first' }));
        expect(onBackup).toHaveBeenCalled();
    });

    it('explains an admin refusal and a failure without signing out', async () => {
        account.deleteMyAccount.mockResolvedValueOnce({ ok: false, reason: 'admin' });
        const { onDeleted } = setup();
        fireEvent.change(screen.getByLabelText('Type DELETE to confirm'), { target: { value: 'DELETE' } });
        fireEvent.click(deleteButton());
        await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Admin accounts cannot be deleted here'));

        account.deleteMyAccount.mockResolvedValueOnce({ ok: false, reason: 'failed' });
        fireEvent.click(deleteButton());
        await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Could not delete the account'));
        expect(onDeleted).not.toHaveBeenCalled();
    });

    it('tells a trainer what happens to clients, in Spanish', () => {
        setup({ isTrainer: true, language: 'es' });
        expect(screen.getByText(/Tus clientes quedarán desvinculados/)).toBeInTheDocument();
        expect(screen.getByLabelText('Escribe DELETE para confirmar')).toBeInTheDocument();
    });
});
