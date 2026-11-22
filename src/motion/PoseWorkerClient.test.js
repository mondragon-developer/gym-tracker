import { afterEach, describe, expect, it, vi } from 'vitest';
import { createPoseWorkerClient } from './PoseWorkerClient.js';

const pending = () => {
    let resolve, reject;
    const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
    return { promise, resolve, reject };
};
const flush = async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); };
const video = { readyState: 2, videoWidth: 1920, videoHeight: 1080 };
const bitmap = () => ({ width: 640, height: 360, close: vi.fn() });

class MockWorker {
    listeners = new Map();
    postMessage = vi.fn();
    terminate = vi.fn();
    addEventListener(type, callback) {
        const listeners = this.listeners.get(type) ?? new Set();
        listeners.add(callback);
        this.listeners.set(type, listeners);
    }
    removeEventListener(type, callback) { this.listeners.get(type)?.delete(callback); }
    emit(data) { this.listeners.get('message')?.forEach(callback => callback({ data })); }
    emitError() { this.listeners.get('error')?.forEach(callback => callback({ preventDefault: vi.fn() })); }
}

const clients = [];
const setup = overrides => {
    const workers = [];
    const onResult = vi.fn(), onError = vi.fn(), onState = vi.fn();
    const createBitmap = vi.fn(async () => bitmap());
    let time = 0;
    const client = createPoseWorkerClient({
        createWorker: () => { const worker = new MockWorker(); workers.push(worker); return worker; },
        createBitmap, now: () => time, onResult, onError, onState,
        timeouts: { initializationMs: 100, frameMs: 100, summaryMs: 100 }, ...overrides,
    });
    clients.push(client);
    return { client, workers, onResult, onError, onState, createBitmap,
        advanceClock: value => { time = value; },
        async start(sessionId = 'session-1') {
            const ready = client.start({ sessionId, sideViewConfirmed: true });
            workers.at(-1).emit({ type: 'ready', sessionId });
            await ready;
            return workers.at(-1);
        },
    };
};
const frameResult = (worker, frameId = 1, sessionId = 'session-1') => worker.emit({
    type: 'result', sessionId, frameId, snapshot: { repetitionsCompleted: frameId },
    landmarks: [{ x: 0.5, y: 0.5 }], imageWidth: 640, imageHeight: 360, inferenceMs: 7,
});
const frameMessages = worker => worker.postMessage.mock.calls.filter(([message]) => message.type === 'frame');
const finishMessages = worker => worker.postMessage.mock.calls.filter(([message]) => message.type === 'finish');

afterEach(() => {
    clients.splice(0).forEach(client => client.dispose());
    vi.useRealTimers();
    vi.unstubAllGlobals();
});

describe('background pose client', () => {
    it('uses a module worker by default', async () => {
        const worker = new MockWorker();
        const WorkerConstructor = vi.fn(function () { return worker; });
        vi.stubGlobal('Worker', WorkerConstructor);
        vi.stubGlobal('createImageBitmap', vi.fn());
        const client = createPoseWorkerClient();
        clients.push(client);
        const readiness = client.start({ sessionId: 'session-1' });
        expect(WorkerConstructor).toHaveBeenCalledWith(expect.any(URL), { type: 'module' });
        worker.emit({ type: 'ready', sessionId: 'session-1' });
        await readiness;
    });

    it('waits for model readiness and forwards setup options', async () => {
        const { client, workers, onState } = setup();
        const readiness = client.start({ sessionId: 'session-1', sideViewConfirmed: true,
            tempoTarget: { descentSeconds: 3, ascentSeconds: 1 } });
        expect(client.getState()).toBe('preparing');
        expect(client.processFrame(video, 0)).toBe(false);
        expect(workers[0].postMessage).toHaveBeenCalledWith({ type: 'initialize', sessionId: 'session-1',
            sideViewConfirmed: true, tempoTarget: { descentSeconds: 3, ascentSeconds: 1 } });
        workers[0].emit({ type: 'ready', sessionId: 'session-1' });
        await readiness;
        expect(onState.mock.calls.map(([state]) => state)).toEqual(['preparing', 'running']);
    });

    it('admits only one frame through asynchronous preparation, transfer, and inference', async () => {
        const preparation = pending();
        const createBitmap = vi.fn(() => preparation.promise);
        const { client, start, onResult, advanceClock } = setup({ createBitmap });
        const worker = await start();
        expect(client.processFrame(video, 1250)).toBe(true);
        expect(client.processFrame(video, 1300)).toBe(false);
        await flush();
        expect(createBitmap).toHaveBeenCalledOnce();
        expect(createBitmap).toHaveBeenCalledWith(video, { resizeWidth: 640, resizeHeight: 360, resizeQuality: 'low' });
        const image = bitmap();
        preparation.resolve(image);
        await flush();
        expect(frameMessages(worker)).toHaveLength(1);
        expect(frameMessages(worker)[0]).toEqual([{ type: 'frame', sessionId: 'session-1', frameId: 1,
            bitmap: image, sourceTimestampMs: 1250, imageWidth: 640, imageHeight: 360 }, [image]]);
        expect(client.processFrame(video, 1350)).toBe(false);
        advanceClock(24);
        frameResult(worker);
        expect(onResult).toHaveBeenCalledWith(expect.objectContaining({ sourceTimestampMs: 1250,
            inferenceMs: 7, frameLatencyMs: 24, snapshot: { repetitionsCompleted: 1 } }));
        expect(image.close).not.toHaveBeenCalled();
        expect(client.processFrame(video, 1400)).toBe(true);
    });

    it('ignores duplicate and nonmonotonic source frames without creating bitmaps', async () => {
        const { client, start, createBitmap } = setup();
        const worker = await start();
        for (const value of [NaN, Infinity, -1]) expect(client.processFrame(video, value)).toBe(false);
        expect(client.processFrame({ ...video, videoWidth: 0 }, 0)).toBe(false);
        expect(client.processFrame({ ...video, readyState: 1 }, 0)).toBe(false);
        expect(client.processFrame(video, 100)).toBe(true);
        await flush();
        frameResult(worker);
        expect(client.processFrame(video, 100)).toBe(false);
        expect(client.processFrame(video, 99)).toBe(false);
        expect(createBitmap).toHaveBeenCalledOnce();
    });

    it('discards and closes a stale preparation without retaining a queued frame', async () => {
        const preparation = pending();
        const { client, start, advanceClock } = setup({ createBitmap: () => preparation.promise });
        const worker = await start();
        client.processFrame(video, 0);
        await flush();
        advanceClock(500);
        const image = bitmap();
        preparation.resolve(image);
        await flush();
        expect(image.close).toHaveBeenCalledOnce();
        expect(frameMessages(worker)).toHaveLength(0);
        expect(client.processFrame(video, 500)).toBe(true);
    });

    it('closes a bitmap whose asynchronous preparation finishes after disposal', async () => {
        const preparation = pending();
        const { client, start, onResult, onError } = setup({ createBitmap: () => preparation.promise });
        const worker = await start();
        client.processFrame(video, 0);
        await flush();
        client.dispose();
        const image = bitmap();
        preparation.resolve(image);
        await flush();
        expect(image.close).toHaveBeenCalledOnce();
        expect(frameMessages(worker)).toHaveLength(0);
        expect(worker.terminate).toHaveBeenCalledOnce();
        expect(onResult).not.toHaveBeenCalled();
        expect(onError).not.toHaveBeenCalled();
        await expect(client.stop()).rejects.toMatchObject({ code: 'cancelled', unfinished: true });
        await expect(client.start({ sessionId: 'next' })).rejects.toMatchObject({ code: 'disposed' });
    });

    it('closes the locally owned bitmap if transfer fails and reports an unfinished session', async () => {
        const image = bitmap();
        const { client, start, onError } = setup({ createBitmap: async () => image });
        const worker = await start();
        worker.postMessage.mockImplementation(message => { if (message.type === 'frame') throw new Error('DataCloneError'); });
        client.processFrame(video, 0);
        await flush();
        expect(image.close).toHaveBeenCalledOnce();
        expect(worker.terminate).toHaveBeenCalledOnce();
        expect(client.getState()).toBe('error');
        expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: 'frame_transfer_failed', unfinished: true }));
    });

    it('reports bitmap preparation errors instead of falling back to main-thread inference', async () => {
        const { client, start, onError } = setup({ createBitmap: async () => { throw new Error('Unsupported input'); } });
        const worker = await start();
        client.processFrame(video, 0);
        await vi.waitFor(() => expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: 'frame_preparation_failed' })));
        expect(frameMessages(worker)).toHaveLength(0);
        expect(worker.terminate).toHaveBeenCalledOnce();
    });

    it('drains the last admitted frame before finalizing, including delayed bitmap preparation', async () => {
        const preparation = pending();
        const { client, start, advanceClock } = setup({ createBitmap: () => preparation.promise });
        const worker = await start();
        client.processFrame(video, 9000);
        await flush();
        const completion = client.stop();
        expect(client.stop()).toBe(completion);
        expect(client.getState()).toBe('stopping');
        expect(client.processFrame(video, 9100)).toBe(false);
        expect(finishMessages(worker)).toHaveLength(0);
        advanceClock(500);
        preparation.resolve(bitmap());
        await flush();
        expect(frameMessages(worker)).toHaveLength(1);
        expect(finishMessages(worker)).toHaveLength(0);
        frameResult(worker);
        expect(finishMessages(worker)).toHaveLength(1);
        worker.emit({ type: 'summary', sessionId: 'session-1', summary: { repetitionsCompleted: 1 } });
        await expect(completion).resolves.toEqual({ repetitionsCompleted: 1, completion: 'confirmed',
            pipeline: { admittedFrames: 1, processedFrames: 1, framesDiscardedBeforeInference: 0 } });
        expect(worker.terminate).toHaveBeenCalledOnce();
        expect(client.getState()).toBe('stopped');
    });

    it('cancels preparation when stopped before the model is ready', async () => {
        const { client, workers } = setup();
        const readiness = client.start({ sessionId: 'session-1' });
        const rejection = expect(readiness).rejects.toMatchObject({ name: 'AbortError', code: 'cancelled' });
        await expect(client.stop()).resolves.toBeNull();
        await rejection;
        expect(workers[0].terminate).toHaveBeenCalledOnce();
        expect(client.getState()).toBe('stopped');
    });

    it('ignores old-worker callbacks even when a session identifier is reused', async () => {
        const { client, start, onResult } = setup();
        const first = await start();
        const oldCallback = [...first.listeners.get('message')][0];
        const completion = client.stop();
        first.emit({ type: 'summary', sessionId: 'session-1', summary: { repetitionsCompleted: 0 } });
        await completion;
        const second = await start();
        client.processFrame(video, 100);
        await flush();
        oldCallback({ data: { type: 'result', sessionId: 'session-1', frameId: 1, snapshot: { repetitionsCompleted: 99 } } });
        oldCallback({ data: { type: 'error', sessionId: 'session-1', code: 'old_error' } });
        expect(onResult).not.toHaveBeenCalled();
        expect(client.getState()).toBe('running');
        expect(client.processFrame(video, 110)).toBe(false);
        frameResult(second);
        expect(onResult).toHaveBeenCalledOnce();
    });

    it('does not let an abandoned bitmap clear a replacement session frame', async () => {
        const oldPreparation = pending();
        const newPreparation = pending();
        const createBitmap = vi.fn().mockReturnValueOnce(oldPreparation.promise).mockReturnValueOnce(newPreparation.promise);
        const { client, start, onResult } = setup({ createBitmap });
        const first = await start();
        client.processFrame(video, 10);
        await flush();
        first.emitError();
        const second = await start('session-2');
        client.processFrame(video, 20);
        await flush();
        const oldImage = bitmap();
        oldPreparation.resolve(oldImage);
        await flush();
        expect(oldImage.close).toHaveBeenCalledOnce();
        expect(frameMessages(second)).toHaveLength(0);
        expect(client.processFrame(video, 30)).toBe(false);
        newPreparation.resolve(bitmap());
        await flush();
        frameResult(second, 1, 'session-2');
        expect(onResult).toHaveBeenCalledOnce();
    });

    it('terminates a timed-out initialization and rejects readiness visibly', async () => {
        vi.useFakeTimers();
        const { client, workers, onError } = setup();
        const readiness = client.start({ sessionId: 'session-1' });
        const rejection = expect(readiness).rejects.toMatchObject({ code: 'initialization_timeout', unfinished: false });
        await vi.advanceTimersByTimeAsync(101);
        await rejection;
        expect(workers[0].terminate).toHaveBeenCalledOnce();
        expect(onError).toHaveBeenCalledOnce();
        expect(client.getState()).toBe('error');
    });

    it('surfaces an explicit model-load error and ignores subsequent readiness', async () => {
        const { client, workers, onError } = setup();
        const readiness = client.start({ sessionId: 'session-1' });
        const rejection = expect(readiness).rejects.toMatchObject({ code: 'model_initialization_failed' });
        const callback = [...workers[0].listeners.get('message')][0];
        workers[0].emit({ type: 'error', sessionId: 'session-1', code: 'model_initialization_failed',
            message: 'The model could not be prepared.' });
        await rejection;
        callback({ data: { type: 'ready', sessionId: 'session-1' } });
        expect(client.getState()).toBe('error');
        expect(onError).toHaveBeenCalledOnce();
    });

    it('rejects worker construction errors without leaving preparation active', async () => {
        const { client, onError } = setup({ createWorker: () => { throw new Error('Worker unavailable'); } });
        await expect(client.start({ sessionId: 'session-1' })).rejects.toMatchObject({ code: 'initialization_failed' });
        expect(client.getState()).toBe('error');
        expect(onError).toHaveBeenCalledOnce();
    });

    it('bounds the complete frame lifetime and closes a preparation that resolves after timeout', async () => {
        vi.useFakeTimers();
        const preparation = pending();
        const { client, start, onError } = setup({ createBitmap: () => preparation.promise });
        const worker = await start();
        client.processFrame(video, 10);
        await flush();
        const completion = client.stop();
        const rejection = expect(completion).rejects.toMatchObject({ code: 'frame_timeout', unfinished: true });
        await vi.advanceTimersByTimeAsync(101);
        await rejection;
        const image = bitmap();
        preparation.resolve(image);
        await flush();
        expect(image.close).toHaveBeenCalledOnce();
        expect(worker.terminate).toHaveBeenCalledOnce();
        expect(onError).toHaveBeenCalledOnce();
    });

    it('rejects an unavailable final summary instead of publishing an incomplete success', async () => {
        vi.useFakeTimers();
        const { client, start } = setup();
        const worker = await start();
        const completion = client.stop();
        const rejection = expect(completion).rejects.toMatchObject({ code: 'summary_timeout', unfinished: true });
        await vi.advanceTimersByTimeAsync(101);
        await rejection;
        expect(worker.terminate).toHaveBeenCalledOnce();
        await expect(client.stop()).rejects.toMatchObject({ unfinished: true });
    });

    it('rejects overlapping starts and permits a fresh session after a completed stop', async () => {
        const { client, workers, start } = setup();
        const readiness = client.start({ sessionId: 'session-1' });
        await expect(client.start({ sessionId: 'session-2' })).rejects.toMatchObject({ code: 'already_started' });
        workers[0].emit({ type: 'ready', sessionId: 'session-1' });
        await readiness;
        const completion = client.stop();
        await expect(client.start({ sessionId: 'session-2' })).rejects.toMatchObject({ code: 'already_started' });
        workers[0].emit({ type: 'summary', sessionId: 'session-1', summary: {} });
        await completion;
        await start('session-2');
        expect(workers).toHaveLength(2);
    });

    it('settles an outstanding stop on disposal and prevents later callbacks', async () => {
        const { client, start, onResult } = setup();
        const worker = await start();
        const oldCallback = [...worker.listeners.get('message')][0];
        client.processFrame(video, 0);
        await flush();
        const completion = client.stop();
        const rejection = expect(completion).rejects.toMatchObject({ name: 'AbortError', unfinished: true });
        client.dispose();
        await rejection;
        oldCallback({ data: { type: 'result', sessionId: 'session-1', frameId: 1 } });
        expect(onResult).not.toHaveBeenCalled();
    });

    it('does not strand cleanup when a consumer callback throws', async () => {
        const { client, start } = setup({ onResult: () => { throw new Error('Render failed'); } });
        const worker = await start();
        client.processFrame(video, 0);
        await flush();
        const completion = client.stop();
        frameResult(worker);
        expect(finishMessages(worker)).toHaveLength(1);
        worker.emit({ type: 'summary', sessionId: 'session-1', summary: {} });
        await expect(completion).resolves.toMatchObject({ completion: 'confirmed' });
    });
});
