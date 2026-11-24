import { describe, expect, it, vi } from 'vitest';
import { createPoseWorkerRuntime } from './PoseWorkerRuntime.js';
import { POSE_MODEL_VERSION, POSE_RUNTIME_VERSION } from './modelAssets.js';
import { SUBJECT_TRACKER_PROFILE } from './SubjectTracker.js';

const image = () => ({ width: 640, height: 360, close: vi.fn() });
const pose = () => {
    const points = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.2, visibility: 0.9 }));
    for (const [side, x] of [[0, 0.47], [1, 0.49]]) {
        for (const [index, y, dx] of [[11 + side, 0.2, 0], [23 + side, 0.45, 0], [25 + side, 0.66, 0.02],
            [27 + side, 0.85, 0], [29 + side, 0.86, -0.025], [31 + side, 0.86, 0.06]]) {
            points[index] = { x: x + dx, y, visibility: 0.9 };
        }
    }
    return points;
};
const setup = overrides => {
    const result = { landmarks: [pose()], close: vi.fn() };
    const detector = { detectForVideo: vi.fn(() => result), close: vi.fn() };
    const evaluator = { update: vi.fn(frame => ({ lastObservationAtMs: frame.timestampMs })),
        interrupt: vi.fn(reason => ({ state: 'interrupted', capture: { status: 'unavailable', reason }, repetitionsCompleted: 1 })),
        getSummary: vi.fn(() => ({ repetitionsCompleted: 1, activeCycleIncomplete: false })) };
    const createEvaluator = vi.fn(() => evaluator);
    const createDetector = vi.fn(async () => detector);
    const postMessage = vi.fn();
    const runtime = createPoseWorkerRuntime({ createDetector, createEvaluator, postMessage, now: () => 10, ...overrides });
    const offer = (sourceTimestampMs = 1150) => {
        for (let step = 0; step < 6; step += 1) {
            runtime.handleMessage(frame(image(), { frameId: step,
                sourceTimestampMs: sourceTimestampMs - 300 + step * 60 }));
        }
        return postMessage.mock.calls.at(-1)[0].subject.confirmationToken;
    };
    return { runtime, detector, evaluator, result, createDetector, createEvaluator, postMessage,
        async initialize() {
            await runtime.handleMessage({ type: 'initialize', sessionId: 'session-1', sideViewConfirmed: true,
                tempoTarget: { descentSeconds: 3 } });
        },
        offer,
        select(sourceTimestampMs = 1150) {
            const confirmationToken = offer(sourceTimestampMs);
            runtime.handleMessage({ type: 'confirm_subject', sessionId: 'session-1', confirmationToken });
            return confirmationToken;
        },
    };
};
const frame = (bitmap = image(), values = {}) => ({ type: 'frame', sessionId: 'session-1', frameId: 1,
    bitmap, sourceTimestampMs: 1200, imageWidth: 640, imageHeight: 360, ...values });

describe('pose worker runtime', () => {
    it('announces readiness only after detector initialization completes', async () => {
        let resolve;
        const preparation = new Promise(yes => { resolve = yes; });
        const { runtime, detector, createEvaluator, postMessage } = setup({ createDetector: () => preparation });
        const readiness = runtime.handleMessage({ type: 'initialize', sessionId: 'session-1', sideViewConfirmed: true });
        expect(postMessage).not.toHaveBeenCalled();
        resolve(detector);
        await readiness;
        expect(createEvaluator).toHaveBeenCalledWith({ sessionId: 'session-1', modelVersion: POSE_MODEL_VERSION,
            tempoTarget: undefined });
        expect(postMessage).toHaveBeenCalledWith({ type: 'ready', sessionId: 'session-1',
            modelVersion: POSE_MODEL_VERSION, runtimeVersion: POSE_RUNTIME_VERSION });
    });

    it('preserves source timestamps for measurement while keeping detector time strictly increasing', async () => {
        const { runtime, initialize, select, detector, evaluator, result, postMessage } = setup();
        await initialize();
        select();
        const lastDetectorTime = detector.detectForVideo.mock.calls.at(-1)[1];
        detector.detectForVideo.mockClear();
        result.close.mockClear();
        const first = image(), second = image();
        runtime.handleMessage(frame(first));
        runtime.handleMessage(frame(second, { frameId: 2, sourceTimestampMs: 1250 }));
        expect(detector.detectForVideo.mock.calls).toEqual([[first, lastDetectorTime + 1], [second, lastDetectorTime + 2]]);
        expect(evaluator.update.mock.calls.map(([input]) => input.timestampMs)).toEqual([1200, 1250]);
        expect(evaluator.update).toHaveBeenCalledWith({ landmarks: result.landmarks[0], timestampMs: 1250,
            imageWidth: 640, imageHeight: 360, sideViewConfirmed: true });
        expect(postMessage).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'result', frameId: 2,
            subject: expect.objectContaining({ status: 'tracking' }),
            snapshot: expect.objectContaining({ lastObservationAtMs: 1250 }) }));
        expect(first.close).toHaveBeenCalledOnce();
        expect(second.close).toHaveBeenCalledOnce();
        expect(result.close).toHaveBeenCalledTimes(2);
    });

    it('closes stale-session and not-ready input bitmaps without inference', async () => {
        const { runtime, initialize, detector } = setup();
        const beforeReady = image();
        runtime.handleMessage(frame(beforeReady));
        await initialize();
        const stale = image();
        runtime.handleMessage(frame(stale, { sessionId: 'old-session' }));
        expect(beforeReady.close).toHaveBeenCalledOnce();
        expect(stale.close).toHaveBeenCalledOnce();
        expect(detector.detectForVideo).not.toHaveBeenCalled();
    });

    it('closes the bitmap and detector after an inference failure and stops accepting frames', async () => {
        const { runtime, initialize, detector, postMessage } = setup();
        await initialize();
        detector.detectForVideo.mockImplementation(() => { throw new Error('GPU context was lost'); });
        const first = image(), next = image();
        runtime.handleMessage(frame(first));
        runtime.handleMessage(frame(next, { frameId: 2 }));
        expect(first.close).toHaveBeenCalledOnce();
        expect(next.close).toHaveBeenCalledOnce();
        expect(detector.close).toHaveBeenCalledOnce();
        expect(detector.detectForVideo).toHaveBeenCalledOnce();
        expect(postMessage).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'error', code: 'inference_failed' }));
    });

    it('publishes the final evaluator summary after processed frames and closes the detector', async () => {
        const { runtime, initialize, select, detector, evaluator, postMessage } = setup();
        await initialize();
        select();
        runtime.handleMessage(frame());
        runtime.handleMessage({ type: 'finish', sessionId: 'session-1' });
        expect(evaluator.update).toHaveBeenCalledOnce();
        expect(evaluator.getSummary).toHaveBeenCalledOnce();
        expect(postMessage).toHaveBeenLastCalledWith({ type: 'summary', sessionId: 'session-1',
            summary: { repetitionsCompleted: 1, activeCycleIncomplete: false,
                subjectTracking: expect.objectContaining({ version: SUBJECT_TRACKER_PROFILE.version, confirmedSegments: 1 }) } });
        expect(detector.close).toHaveBeenCalledOnce();
        const afterFinish = image();
        runtime.handleMessage(frame(afterFinish));
        expect(afterFinish.close).toHaveBeenCalledOnce();
        expect(detector.detectForVideo).toHaveBeenCalledTimes(7);
    });

    it('reports a model initialization failure without announcing readiness', async () => {
        const { initialize, postMessage } = setup({ createDetector: async () => { throw new Error('Model unavailable'); } });
        await initialize();
        expect(postMessage).toHaveBeenCalledOnce();
        expect(postMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'error',
            code: 'model_initialization_failed', sessionId: 'session-1' }));
    });

    it('interrupts measurement on target loss and never automatically resumes on a replacement', async () => {
        const { initialize, select, runtime, detector, evaluator, result, postMessage } = setup();
        await initialize();
        select();
        runtime.handleMessage(frame());
        detector.detectForVideo.mockReturnValue({ landmarks: [], close: vi.fn() });
        runtime.handleMessage(frame(image(), { frameId: 2, sourceTimestampMs: 1250 }));
        expect(evaluator.interrupt).toHaveBeenCalledWith('subject_missing');
        detector.detectForVideo.mockReturnValue(result);
        runtime.handleMessage(frame(image(), { frameId: 3, sourceTimestampMs: 1300 }));
        expect(evaluator.update).toHaveBeenCalledOnce();
        expect(evaluator.interrupt).toHaveBeenCalledOnce();
        expect(postMessage).toHaveBeenLastCalledWith(expect.objectContaining({
            subject: expect.objectContaining({ restartRequired: true }), landmarks: [],
            snapshot: expect.objectContaining({ repetitionsCompleted: 1 }),
        }));
    });

    it('marks finalization failures explicitly and still closes detector resources', async () => {
        const { initialize, runtime, detector, evaluator, postMessage } = setup();
        await initialize();
        evaluator.getSummary.mockImplementation(() => { throw new Error('Summary unavailable'); });
        runtime.handleMessage({ type: 'finish', sessionId: 'session-1' });
        expect(postMessage).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'error', code: 'summary_failed' }));
        expect(detector.close).toHaveBeenCalledOnce();
    });

    it('does not evaluate any frame before explicit subject confirmation', async () => {
        const { initialize, offer, evaluator, postMessage } = setup();
        await initialize();
        offer();
        expect(evaluator.update).not.toHaveBeenCalled();
        expect(postMessage).toHaveBeenLastCalledWith(expect.objectContaining({
            subject: expect.objectContaining({ status: 'awaiting_confirmation' }),
            snapshot: expect.objectContaining({ state: 'subject_selection', repetitionsCompleted: 0 }),
        }));
    });

    it('explains startup qualification and rejects confirmation until the stable candidate is offered', async () => {
        const { initialize, runtime, evaluator, postMessage } = setup();
        await initialize();
        for (const sourceTimestampMs of [0, 60, 120, 180, 240]) {
            runtime.handleMessage(frame(image(), { sourceTimestampMs }));
            expect(postMessage.mock.calls.at(-1)[0]).toEqual(expect.objectContaining({
                subject: expect.objectContaining({ status: 'unavailable', reason: 'subject_stabilizing', confirmationToken: null }),
                snapshot: expect.objectContaining({ feedback: expect.objectContaining({
                    message: 'Checking that the highlighted person remains clearly visible before confirmation.',
                }) }),
            }));
        }
        runtime.handleMessage({ type: 'confirm_subject', sessionId: 'session-1', confirmationToken: 'candidate-1' });
        expect(postMessage.mock.calls.at(-1)[0].type).toBe('subject_confirmation_rejected');
        runtime.handleMessage(frame(image(), { sourceTimestampMs: 300 }));
        const subject = postMessage.mock.calls.at(-1)[0].subject;
        expect(subject.status).toBe('awaiting_confirmation');
        expect(evaluator.update).not.toHaveBeenCalled();
        runtime.handleMessage({ type: 'confirm_subject', sessionId: 'session-1', confirmationToken: subject.confirmationToken });
        runtime.handleMessage(frame(image(), { sourceTimestampMs: 350 }));
        expect(evaluator.update).toHaveBeenCalledOnce();
    });

    it('acknowledges confirmation with the request token and current subject state', async () => {
        const { initialize, offer, runtime, postMessage } = setup();
        await initialize();
        const confirmationToken = offer(1200);
        runtime.handleMessage({ type: 'confirm_subject', sessionId: 'session-1', confirmationToken });
        expect(postMessage).toHaveBeenLastCalledWith({ type: 'subject_confirmed', sessionId: 'session-1', confirmationToken,
            subject: expect.objectContaining({ status: 'tracking', confirmationToken: null }) });
    });

    it('rejects stale confirmation without failing the worker or selecting a new candidate', async () => {
        const { initialize, offer, runtime, detector, result, evaluator, postMessage } = setup();
        await initialize();
        const confirmationToken = offer(1200);
        detector.detectForVideo.mockReturnValue({ landmarks: [], close: vi.fn() });
        runtime.handleMessage(frame(image(), { frameId: 2, sourceTimestampMs: 1250 }));
        detector.detectForVideo.mockReturnValue(result);
        runtime.handleMessage(frame(image(), { frameId: 3, sourceTimestampMs: 1300 }));
        runtime.handleMessage({ type: 'confirm_subject', sessionId: 'session-1', confirmationToken });
        expect(postMessage).toHaveBeenLastCalledWith({ type: 'subject_confirmation_rejected', sessionId: 'session-1',
            confirmationToken, subject: expect.objectContaining({ status: 'unavailable', reason: 'subject_stabilizing' }) });
        expect(evaluator.update).not.toHaveBeenCalled();
        expect(detector.close).not.toHaveBeenCalled();
    });

    it('ignores confirmation commands from a different session', async () => {
        const { initialize, offer, runtime, postMessage } = setup();
        await initialize();
        const confirmationToken = offer(1200);
        postMessage.mockClear();
        runtime.handleMessage({ type: 'confirm_subject', sessionId: 'previous-session', confirmationToken });
        expect(postMessage).not.toHaveBeenCalled();
        runtime.handleMessage(frame(image(), { frameId: 2, sourceTimestampMs: 1250 }));
        expect(postMessage.mock.calls.at(-1)[0].subject.status).toBe('awaiting_confirmation');
    });

    it('ends the segment if the evaluator rejects exercise-specific geometry after selection', async () => {
        const { initialize, select, runtime, evaluator, postMessage } = setup();
        await initialize();
        const confirmationToken = select();
        evaluator.update.mockReturnValue({ state: 'interrupted', capture: { status: 'unavailable', reason: 'setup_changed' },
            repetitionsCompleted: 2 });
        runtime.handleMessage(frame());
        expect(postMessage.mock.calls.at(-1)[0].subject).toEqual(expect.objectContaining({
            restartRequired: true, reason: 'setup_changed', confirmationToken: null,
        }));
        runtime.handleMessage({ type: 'confirm_subject', sessionId: 'session-1', confirmationToken });
        expect(postMessage.mock.calls.at(-1)[0].type).toBe('subject_confirmation_rejected');
        runtime.handleMessage(frame(image(), { frameId: 2, sourceTimestampMs: 1250 }));
        expect(evaluator.update).toHaveBeenCalledOnce();
        expect(postMessage.mock.calls.at(-1)[0].snapshot.repetitionsCompleted).toBe(2);
    });

    it('records an unselected segment as unconfirmed in the final summary', async () => {
        const { initialize, runtime, evaluator, postMessage } = setup();
        await initialize();
        runtime.handleMessage(frame());
        runtime.handleMessage({ type: 'finish', sessionId: 'session-1' });
        expect(evaluator.update).not.toHaveBeenCalled();
        expect(postMessage.mock.calls.at(-1)[0].summary.subjectTracking).toEqual(expect.objectContaining({
            confirmedSegments: 0, interruptions: 0, maximumPoses: 2, lossPolicy: 'finish-segment-and-restart',
        }));
    });
});
