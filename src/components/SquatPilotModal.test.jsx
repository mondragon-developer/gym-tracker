import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

const mocks = vi.hoisted(() => ({ session: {}, protect: vi.fn(), release: vi.fn(), onFrame: null, context: null }));
vi.mock('../hooks/useSquatSession.js', () => ({ default: options => {
    mocks.onFrame = options.onFrame;
    return mocks.session;
} }));
vi.mock('../services/AppUpdateService.js', () => ({ appUpdates: { protect: mocks.protect } }));
import SquatPilotModal from './SquatPilotModal.jsx';

beforeEach(() => {
    mocks.release.mockReset();
    mocks.protect.mockReset().mockReturnValue(mocks.release);
    mocks.session = { status: 'idle', snapshot: null, summary: null, error: null, timing: null, subject: null,
        confirmingSubject: false, confirmSubject: vi.fn().mockResolvedValue(true),
        startCamera: vi.fn(), startFile: vi.fn(), finish: vi.fn(), cancel: vi.fn() };
    mocks.context = { clearRect: vi.fn(), strokeRect: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(),
        lineTo: vi.fn(), stroke: vi.fn(), arc: vi.fn(), fill: vi.fn() };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(mocks.context);
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

    it('requires an eligible highlighted subject and submits the current confirmation token', () => {
        mocks.session.status = 'running';
        mocks.session.subject = { status: 'unavailable', observedPoses: 0, confirmationToken: null };
        const rendered = render(<SquatPilotModal onClose={vi.fn()} />);
        expect(screen.getByRole('button', { name: 'Measure highlighted person' })).toBeDisabled();
        expect(mocks.session.confirmSubject).not.toHaveBeenCalled();

        mocks.session.subject = { status: 'awaiting_confirmation', observedPoses: 1, confirmationToken: 'candidate-2' };
        rendered.rerender(<SquatPilotModal onClose={vi.fn()} />);
        fireEvent.click(screen.getByRole('button', { name: 'Measure highlighted person' }));
        expect(mocks.session.confirmSubject).toHaveBeenCalledWith('candidate-2');

        mocks.session.confirmingSubject = true;
        rendered.rerender(<SquatPilotModal onClose={vi.fn()} />);
        expect(screen.getByRole('button', { name: 'Confirming person…' })).toBeDisabled();

        mocks.session.confirmingSubject = false;
        mocks.session.subject = { status: 'tracking', observedPoses: 1, confirmationToken: null };
        rendered.rerender(<SquatPilotModal onClose={vi.fn()} />);
        expect(screen.queryByRole('button', { name: 'Measure highlighted person' })).not.toBeInTheDocument();
    });

    it('prevents confirmation of an ambiguous or interrupted subject and explains restart', () => {
        mocks.session.status = 'running';
        mocks.session.subject = { status: 'unavailable', observedPoses: 2, confirmationToken: null };
        const rendered = render(<SquatPilotModal onClose={vi.fn()} />);
        expect(screen.getByRole('status')).toHaveTextContent('More than one person was detected');
        expect(screen.getByRole('button', { name: 'Measure highlighted person' })).toBeDisabled();

        mocks.session.subject = { status: 'confirmation_required', restartRequired: true, confirmationToken: 'stale' };
        rendered.rerender(<SquatPilotModal onClose={vi.fn()} />);
        expect(screen.getByRole('button', { name: 'Measure highlighted person' })).toBeDisabled();
        expect(mocks.session.confirmSubject).not.toHaveBeenCalled();

        mocks.session.status = 'completed';
        mocks.session.stopReason = 'subject_ambiguous';
        mocks.session.summary = { repetitionsCompleted: 2 };
        rendered.rerender(<SquatPilotModal onClose={vi.fn()} />);
        expect(screen.getByText('2 complete repetitions measured.')).toBeVisible();
        expect(screen.getByText(/Completed measurements are preserved/)).toHaveTextContent('start a new session');
    });

    it('explains paused local-video confirmation separately from camera setup', () => {
        mocks.session.status = 'running';
        mocks.session.source = 'file';
        mocks.session.subject = { status: 'awaiting_confirmation', confirmationToken: 'file-subject' };
        render(<SquatPilotModal onClose={vi.fn()} />);
        expect(screen.getByRole('status')).toHaveTextContent('The recording is paused');
        expect(screen.getByRole('button', { name: 'Measure highlighted person' })).toBeEnabled();
    });

    it('explains qualification while keeping subject confirmation disabled', () => {
        mocks.session.status = 'running';
        mocks.session.source = 'file';
        mocks.session.subject = { status: 'unavailable', reason: 'subject_stabilizing',
            observedPoses: 1, confirmationToken: null };
        render(<SquatPilotModal onClose={vi.fn()} />);
        expect(screen.getByRole('status')).toHaveTextContent(
            'Checking that the highlighted person remains clearly visible before confirmation.');
        expect(screen.getByRole('button', { name: 'Measure highlighted person' })).toBeDisabled();
        expect(mocks.session.confirmSubject).not.toHaveBeenCalled();
    });

    it('requires a valid evaluation identifier for local video while keeping camera options unchanged', () => {
        render(<SquatPilotModal onClose={vi.fn()} />);
        fireEvent.click(screen.getByLabelText(/I have confirmed a stable side view/));
        fireEvent.click(screen.getByText('Recording evaluation'));
        fireEvent.click(screen.getByLabelText('Collect an evaluation report'));
        expect(screen.getByRole('button', { name: 'Choose local video' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Start camera' })).toBeEnabled();
        const file = new File(['video'], 'squat.mp4', { type: 'video/mp4' });
        const picker = screen.getByLabelText('Choose a local squat recording');
        fireEvent.change(screen.getByLabelText('Recording identifier'), { target: { value: 'invalid name' } });
        fireEvent.change(picker, { target: { files: [file] } });
        expect(mocks.session.startFile).not.toHaveBeenCalled();

        fireEvent.change(screen.getByLabelText('Recording identifier'), { target: { value: 'squat-side_01.v1' } });
        expect(screen.getByRole('button', { name: 'Choose local video' })).toBeEnabled();
        fireEvent.change(picker, { target: { files: [file] } });
        expect(mocks.session.startFile).toHaveBeenCalledWith(file, {
            sideViewConfirmed: true, tempoTarget: null, evaluation: { clipId: 'squat-side_01.v1' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Start camera' }));
        expect(mocks.session.startCamera).toHaveBeenCalledWith({ sideViewConfirmed: true, tempoTarget: null });

        fireEvent.click(screen.getByLabelText('Collect an evaluation report'));
        fireEvent.change(picker, { target: { files: [file] } });
        expect(mocks.session.startFile).toHaveBeenLastCalledWith(file, { sideViewConfirmed: true, tempoTarget: null });
    });

    it('labels partial evaluation reports without presenting them as full-recording results', () => {
        mocks.session.status = 'completed';
        mocks.session.summary = { repetitionsCompleted: 1, evaluationTrace: { completed: false, truncated: false } };
        render(<SquatPilotModal onClose={vi.fn()} />);
        expect(screen.getByText(/partial evaluation report/)).toHaveTextContent('cannot establish full-recording accuracy');
        expect(screen.getByRole('button', { name: 'Download summary and evaluation report' })).toBeVisible();
    });

    it('draws the selected region in the same image coordinates as the pose and clears missing results', () => {
        render(<SquatPilotModal onClose={vi.fn()} />);
        const video = screen.getByLabelText('Local squat video preview');
        Object.defineProperties(video, { videoWidth: { value: 720 }, videoHeight: { value: 1280 } });
        fireEvent.loadedMetadata(video);
        expect(video.parentElement.style.aspectRatio).toBe('720 / 1280');

        const result = { imageWidth: 360, imageHeight: 640,
            landmarks: Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, visibility: 0.8 })),
            subject: { status: 'awaiting_confirmation', bounds: { x: 0.2, y: 0.1, width: 0.4, height: 0.8 } },
        };
        mocks.onFrame(result);
        const canvas = video.parentElement.querySelector('canvas');
        expect(canvas.width).toBe(360);
        expect(canvas.height).toBe(640);
        expect(mocks.context.strokeRect).toHaveBeenCalledWith(72, 64, 144, 512);
        expect(mocks.context.moveTo).toHaveBeenCalledWith(180, 320);
        mocks.context.strokeRect.mockClear();
        mocks.onFrame({ ...result, landmarks: [], subject: { status: 'unavailable', bounds: null } });
        expect(mocks.context.clearRect).toHaveBeenLastCalledWith(0, 0, 360, 640);
        expect(mocks.context.strokeRect).not.toHaveBeenCalled();
    });
});
