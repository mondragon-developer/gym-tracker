import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

const mocks = vi.hoisted(() => ({ session: {}, protect: vi.fn(), release: vi.fn() }));
vi.mock('../hooks/useSquatSession.js', () => ({ default: () => mocks.session }));
vi.mock('../services/AppUpdateService.js', () => ({ appUpdates: { protect: mocks.protect } }));
import SquatPilotModal from './SquatPilotModal.jsx';

beforeEach(() => {
    mocks.release.mockReset();
    mocks.protect.mockReset().mockReturnValue(mocks.release);
    mocks.session = { status: 'idle', snapshot: null, summary: null, error: null, timing: null,
        startCamera: vi.fn(), startFile: vi.fn(), finish: vi.fn(), cancel: vi.fn() };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ clearRect: vi.fn() });
});

describe('Squat measurement pilot controls', () => {
    it('requires camera-position confirmation and never starts capture on mount', () => {
        render(<SquatPilotModal onClose={vi.fn()} />);
        expect(mocks.session.startCamera).not.toHaveBeenCalled();
        expect(screen.getByRole('button', { name: 'Start camera' })).toBeDisabled();
        fireEvent.click(screen.getByLabelText(/I have confirmed a stable side view/));
        fireEvent.click(screen.getByRole('button', { name: 'Start camera' }));
        expect(mocks.session.startCamera).toHaveBeenCalledWith({ sideViewConfirmed: true, tempoTarget: null });
    });

    it('blocks invalid custom timing ranges and passes explicit valid ranges', () => {
        render(<SquatPilotModal onClose={vi.fn()} />);
        fireEvent.click(screen.getByLabelText(/I have confirmed/));
        fireEvent.click(screen.getByLabelText(/Compare timing/));
        fireEvent.change(screen.getByLabelText('Descent maximum'), { target: { value: '1' } });
        expect(screen.getByRole('button', { name: 'Start camera' })).toBeDisabled();
        expect(screen.getByRole('alert')).toHaveTextContent('Enter valid ranges');
        fireEvent.change(screen.getByLabelText('Descent maximum'), { target: { value: '4' } });
        fireEvent.click(screen.getByRole('button', { name: 'Start camera' }));
        expect(mocks.session.startCamera).toHaveBeenCalledWith({ sideViewConfirmed: true,
            tempoTarget: { descentSeconds: { min: 2, max: 4 }, ascentSeconds: { min: 1, max: 2 } } });
    });

    it('keeps completed local measurements protected until the dialog unmounts', () => {
        const rendered = render(<SquatPilotModal onClose={vi.fn()} />);
        mocks.session = { ...mocks.session, status: 'completed', summary: {
            repetitionsCompleted: 3, incompleteCycles: 1, activeCycleIncomplete: false,
            averages: { descentSeconds: 2.2, ascentSeconds: 1.3, bottomPauseSeconds: 0.4 },
            lastRepetition: { descentSeconds: 2.4, ascentSeconds: 1.1 },
        } };
        rendered.rerender(<SquatPilotModal onClose={vi.fn()} />);
        expect(screen.getByText('3 complete repetitions measured.')).toBeVisible();
        expect(screen.getByText(/excluded from the repetition count/)).toBeVisible();
        expect(mocks.protect).toHaveBeenCalledTimes(1);
        expect(mocks.release).not.toHaveBeenCalled();
        rendered.unmount();
        expect(mocks.release).toHaveBeenCalledTimes(1);
    });

    it('discards capture explicitly when the person closes the pilot', () => {
        mocks.session.status = 'running';
        const onClose = vi.fn();
        render(<SquatPilotModal onClose={onClose} />);
        expect(screen.getByRole('button', { name: 'Start camera' })).toBeDisabled();
        fireEvent.click(screen.getByRole('button', { name: 'Close pilot' }));
        expect(mocks.session.cancel).toHaveBeenCalledTimes(1);
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
