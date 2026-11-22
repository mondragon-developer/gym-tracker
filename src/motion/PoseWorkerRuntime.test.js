import { describe, expect, it, vi } from 'vitest';
import { createPoseWorkerRuntime } from './PoseWorkerRuntime.js';
import { POSE_MODEL_VERSION, POSE_RUNTIME_VERSION } from './modelAssets.js';

const image = () => ({ width: 640, height: 360, close: vi.fn() });
const setup = overrides => {
    const result = { landmarks: [[{ x: 0.5, y: 0.5, visibility: 0.9 }]], close: vi.fn() };
    const detector = { detectForVideo: vi.fn(() => result), close: vi.fn() };
    const evaluator = { update: vi.fn(frame => ({ lastObservationAtMs: frame.timestampMs })),
        getSummary: vi.fn(() => ({ repetitionsCompleted: 1, activeCycleIncomplete: false })) };
    const createEvaluator = vi.fn(() => evaluator);
    const createDetector = vi.fn(async () => detector);
    const postMessage = vi.fn();
    const runtime = createPoseWorkerRuntime({ createDetector, createEvaluator, postMessage, now: () => 10, ...overrides });
    return { runtime, detector, evaluator, result, createDetector, createEvaluator, postMessage,
        async initialize() {
            await runtime.handleMessage({ type: 'initialize', sessionId: 'session-1', sideViewConfirmed: true,
                tempoTarget: { descentSeconds: 3 } });
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
        const { runtime, initialize, detector, evaluator, result, postMessage } = setup();
        await initialize();
        const first = image(), second = image();
        runtime.handleMessage(frame(first));
        runtime.handleMessage(frame(second, { frameId: 2, sourceTimestampMs: 1250 }));
        expect(detector.detectForVideo.mock.calls).toEqual([[first, 10], [second, 11]]);
        expect(evaluator.update.mock.calls.map(([input]) => input.timestampMs)).toEqual([1200, 1250]);
        expect(evaluator.update).toHaveBeenCalledWith({ landmarks: result.landmarks[0], timestampMs: 1250,
            imageWidth: 640, imageHeight: 360, sideViewConfirmed: true });
        expect(postMessage).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'result', frameId: 2,
            snapshot: { lastObservationAtMs: 1250 } }));
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
        const { runtime, initialize, detector, evaluator, postMessage } = setup();
        await initialize();
        runtime.handleMessage(frame());
        runtime.handleMessage({ type: 'finish', sessionId: 'session-1' });
        expect(evaluator.update).toHaveBeenCalledOnce();
        expect(evaluator.getSummary).toHaveBeenCalledOnce();
        expect(postMessage).toHaveBeenLastCalledWith({ type: 'summary', sessionId: 'session-1',
            summary: { repetitionsCompleted: 1, activeCycleIncomplete: false } });
        expect(detector.close).toHaveBeenCalledOnce();
        const afterFinish = image();
        runtime.handleMessage(frame(afterFinish));
        expect(afterFinish.close).toHaveBeenCalledOnce();
        expect(detector.detectForVideo).toHaveBeenCalledOnce();
    });

    it('reports a model initialization failure without announcing readiness', async () => {
        const { initialize, postMessage } = setup({ createDetector: async () => { throw new Error('Model unavailable'); } });
        await initialize();
        expect(postMessage).toHaveBeenCalledOnce();
        expect(postMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'error',
            code: 'model_initialization_failed', sessionId: 'session-1' }));
    });

    it('passes missing detections to the evaluator so confidence loss interrupts measurement', async () => {
        const { initialize, runtime, detector, evaluator } = setup();
        await initialize();
        detector.detectForVideo.mockReturnValue({ landmarks: [], close: vi.fn() });
        runtime.handleMessage(frame());
        expect(evaluator.update).toHaveBeenCalledWith(expect.objectContaining({ landmarks: [] }));
    });

    it('marks finalization failures explicitly and still closes detector resources', async () => {
        const { initialize, runtime, detector, evaluator, postMessage } = setup();
        await initialize();
        evaluator.getSummary.mockImplementation(() => { throw new Error('Summary unavailable'); });
        runtime.handleMessage({ type: 'finish', sessionId: 'session-1' });
        expect(postMessage).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'error', code: 'summary_failed' }));
        expect(detector.close).toHaveBeenCalledOnce();
    });
});
