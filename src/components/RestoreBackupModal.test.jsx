import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RestoreBackupModal from './RestoreBackupModal.jsx';
import { buildBackup } from '../utils/backup.js';
import WeekPlanService from '../services/WeekPlanService.js';

const fileFrom = (text, name = 'gym-tracker-backup-2026-09-25.json') => {
    const file = new File([text], name, { type: 'application/json' });
    // jsdom's File lacks text() in some versions.
    file.text = () => Promise.resolve(text);
    return file;
};

const pick = (file, label = 'Backup file') => fireEvent.change(screen.getByLabelText(label), { target: { files: [file] } });

describe('RestoreBackupModal', () => {
    it('shows what the backup holds and restores after a second tap', async () => {
        const onRestore = vi.fn();
        render(<RestoreBackupModal isOpen onClose={vi.fn()} onRestore={onRestore} />);
        expect(screen.getByRole('button', { name: 'Restore' })).toBeDisabled();

        pick(fileFrom(JSON.stringify(buildBackup(WeekPlanService.migrate(null)))));
        await waitFor(() => expect(screen.getByTestId('backup-summary')).toHaveTextContent('1 week'));

        fireEvent.click(screen.getByRole('button', { name: 'Restore' }));
        expect(onRestore).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button', { name: 'Replace all my weeks?' }));
        expect(onRestore).toHaveBeenCalledTimes(1);
        expect(onRestore.mock.calls[0][0].weeks).toBeDefined();
    });

    it('explains a wrong file and keeps Restore off', async () => {
        render(<RestoreBackupModal isOpen onClose={vi.fn()} onRestore={vi.fn()} language="es" />);
        pick(fileFrom('{"hello":1}', 'notes.json'), 'Archivo de copia');
        await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Este archivo no es una copia de Gym Tracker.'));
        expect(screen.getByRole('button', { name: 'Restaurar' })).toBeDisabled();
    });
});
