import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import TrainerAccessModal from './TrainerAccessModal.jsx';
import * as access from '../services/TrainerAccessService.js';

vi.mock('../services/TrainerAccessService.js', () => ({
    listMyTrainers: vi.fn(), previewTrainer: vi.fn(), approveTrainer: vi.fn(), removeTrainerAccess: vi.fn()
}));

beforeEach(() => {
    vi.resetAllMocks();
    access.listMyTrainers.mockResolvedValue([]);
    access.previewTrainer.mockResolvedValue({ trainer_id: 't1', display_name: 'Alex' });
    access.approveTrainer.mockResolvedValue(undefined);
    access.removeTrainerAccess.mockResolvedValue(undefined);
});

const open = (props = {}) => render(<TrainerAccessModal language="en" initialCode="ABC123" onClose={vi.fn()} {...props} />);
const review = async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Review invitation' }));
    return screen.findByRole('button', { name: 'Allow this trainer to view and edit my workouts' });
};

describe('trainer access consent', () => {
    it('an invitation only pre-fills the code; reading the identity still grants no access', async () => {
        open();
        await screen.findByText('No connected trainers.');
        expect(access.previewTrainer).not.toHaveBeenCalled();
        expect(access.approveTrainer).not.toHaveBeenCalled();
        const allow = await review();
        expect(screen.getByText('Alex')).toBeInTheDocument();
        expect(access.approveTrainer).not.toHaveBeenCalled();
        fireEvent.click(allow);
        await screen.findByText('Connected to your trainer.');
        expect(access.approveTrainer).toHaveBeenCalledExactlyOnceWith('ABC123', 't1', 'en');
    });

    it('changing the code invalidates the reviewed identity', async () => {
        open();
        await review();
        fireEvent.change(screen.getByLabelText('Trainer code'), { target: { value: 'NEW123' } });
        expect(screen.queryByRole('button', { name: 'Allow this trainer to view and edit my workouts' })).not.toBeInTheDocument();
        expect(access.approveTrainer).not.toHaveBeenCalled();
    });

    it('closing a review does not approve it', async () => {
        const onClose = vi.fn();
        open({ onClose });
        await review();
        fireEvent.click(screen.getByRole('button', { name: 'Close', exact: true }));
        expect(onClose).toHaveBeenCalledOnce();
        expect(access.approveTrainer).not.toHaveBeenCalled();
    });

    it('keeps the connection visible when removal fails', async () => {
        access.listMyTrainers.mockResolvedValue([{ trainer_id: 't1', display_name: 'Alex' }]);
        access.removeTrainerAccess.mockRejectedValue(new Error('offline'));
        open();
        fireEvent.click(await screen.findByRole('button', { name: 'Remove access: Alex' }));
        await screen.findByRole('alert');
        expect(screen.getByText('Alex')).toBeInTheDocument();
        expect(screen.queryByText('Trainer access removed.')).not.toBeInTheDocument();
    });

    it('removes only the selected trainer and refreshes the list', async () => {
        access.listMyTrainers.mockResolvedValueOnce([{ trainer_id: 't1', display_name: 'Alex' }, { trainer_id: 't2', display_name: 'Sam' }])
            .mockResolvedValue([{ trainer_id: 't2', display_name: 'Sam' }]);
        open();
        fireEvent.click(await screen.findByRole('button', { name: 'Remove access: Alex' }));
        await waitFor(() => expect(screen.queryByText('Alex')).not.toBeInTheDocument());
        expect(screen.getByText('Sam')).toBeInTheDocument();
        expect(access.removeTrainerAccess).toHaveBeenCalledExactlyOnceWith('t1');
    });

    it('does not turn a refresh failure into an apparent removal failure', async () => {
        access.listMyTrainers.mockResolvedValueOnce([{ trainer_id: 't1', display_name: 'Alex' }]).mockRejectedValue(new Error('offline'));
        open();
        fireEvent.click(await screen.findByRole('button', { name: 'Remove access: Alex' }));
        await screen.findByText('Access was updated, but the list could not refresh. Close this window and try again.');
        expect(screen.getByText('Trainer access removed.')).toBeInTheDocument();
    });

    it('uses Spanish disclosure and records its language', async () => {
        open({ language: 'es' });
        fireEvent.click(screen.getByRole('button', { name: 'Revisar invitación' }));
        fireEvent.click(await screen.findByRole('button', { name: 'Permitir que este entrenador vea y edite mis entrenamientos' }));
        await waitFor(() => expect(access.approveTrainer).toHaveBeenCalledExactlyOnceWith('ABC123', 't1', 'es'));
    });

    it('reports an invalid invitation without offering approval', async () => {
        access.previewTrainer.mockResolvedValue(null);
        open();
        fireEvent.click(screen.getByRole('button', { name: 'Review invitation' }));
        await screen.findByText('That trainer code is not valid.');
        expect(access.approveTrainer).not.toHaveBeenCalled();
    });
});
