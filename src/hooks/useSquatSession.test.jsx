import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ createClient: vi.fn(), protect: vi.fn() }));
vi.mock('../motion/PoseWorkerClient.js', () => ({ createPoseWorkerClient: mocks.createClient }));
vi.mock('../services/AppUpdateService.js', () => ({ appUpdates: { protect: mocks.protect } }));
import useSquatSession, { SQUAT_VIDEO_LIMITS } from './useSquatSession.js';

const confirmed = { sideViewConfirmed: true };
const summary = { completion: 'confirmed', repetitionsCompleted: 2 };
const recording = () => new File(['video'], 'squat.mp4', { type: 'video/mp4' });
const deferred = () => {
    let resolve, reject;
    const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
    return { promise, resolve, reject };
};
const makeVideo = () => {
    const video = document.createElement('video');
    for (const [name, value] of Object.entries({ readyState: 4, videoWidth: 640, videoHeight: 480, duration: 10 })) {
        Object.defineProperty(video, name, { configurable: true, writable: true, value });
    }
    video.play = vi.fn().mockResolvedValue();
    video.pause = vi.fn();
    video.load = vi.fn();
    const callbacks = new Map();
    let sequence = 0;
    video.requestVideoFrameCallback = vi.fn(callback => { callbacks.set(++sequence, callback); return sequence; });
    video.cancelVideoFrameCallback = vi.fn(id => callbacks.delete(id));
    return { video, callbacks, frame(time, wallClock = 99999) {
        const [id, callback] = callbacks.entries().next().value;
        callbacks.delete(id);
        video.currentTime = time;
        callback(wallClock, { mediaTime: time });
    } };
};
const makeStream = () => {
    const track = new EventTarget();
    track.stop = vi.fn();
    return { track, stream: { getTracks: () => [track], getVideoTracks: () => [track] } };
};

describe('useSquatSession capture lifecycle', () => {
    let clients, guards, getUserMedia;
    beforeEach(() => {
        clients = [];
        guards = [];
        mocks.protect.mockReset().mockImplementation(() => {
            const release = vi.fn();
            guards.push(release);
            return release;
        });
        mocks.createClient.mockReset().mockImplementation(callbacks => {
            const client = { callbacks, start: vi.fn().mockResolvedValue(), processFrame: vi.fn().mockReturnValue(true),
                confirmSubject: vi.fn().mockResolvedValue(true), stop: vi.fn().mockResolvedValue(summary), dispose: vi.fn() };
            clients.push(client);
            return client;
        });
        vi.stubGlobal('Worker', vi.fn());
        vi.stubGlobal('createImageBitmap', vi.fn());
        const OriginalURL = URL;
        class TestURL extends OriginalURL {
            static createObjectURL = vi.fn(() => 'blob:local-recording');
            static revokeObjectURL = vi.fn();
        }
        vi.stubGlobal('URL', TestURL);
        getUserMedia = vi.fn().mockResolvedValue(makeStream().stream);
        Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia } });
    });
    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        vi.useRealTimers();
        delete navigator.mediaDevices;
        delete document.visibilityState;
    });
    const setup = (options = {}) => {
        const media = makeVideo();
        const videoRef = { current: media.video };
        return { ...media, ...renderHook(() => useSquatSession({ videoRef, ...options })) };
    };

    const candidate = { status: 'awaiting_confirmation', confirmationToken: 'candidate-1', restartRequired: false };
    const candidateResult = { subject: candidate, snapshot: { state: 'setup', capture: { status: 'setup_required' } } };

    it('pauses a local recording for subject confirmation and resumes only after the worker acknowledges it', async () => {
        const { result, frame, video, callbacks } = setup();
        await act(async () => result.current.startFile(recording(), confirmed));
        act(() => { frame(0); clients[0].callbacks.onResult(candidateResult); });
        expect(video.pause).toHaveBeenCalledOnce();
        expect(callbacks.size).toBe(0);
        expect(result.current.subject).toEqual(candidate);
        const ack = deferred();
        clients[0].confirmSubject.mockReturnValue(ack.promise);
        let confirmation;
        act(() => { confirmation = result.current.confirmSubject('candidate-1'); });
        expect(result.current.confirmingSubject).toBe(true);
        expect(video.play).toHaveBeenCalledTimes(1);
        await act(async () => {
            clients[0].callbacks.onSubject({ status: 'tracking', confirmationToken: null });
            ack.resolve(true);
            expect(await confirmation).toBe(true);
        });
        expect(video.play).toHaveBeenCalledTimes(2);
        expect(callbacks.size).toBe(1);
        expect(result.current.subject.status).toBe('tracking');
        expect(result.current.confirmingSubject).toBe(false);
    });

    it('keeps the camera preview running while awaiting confirmation and rejects a stale UI token', async () => {
        const { result, frame, video, callbacks } = setup();
        await act(async () => result.current.startCamera(confirmed));
        act(() => { frame(0); clients[0].callbacks.onResult(candidateResult); });
        expect(video.pause).not.toHaveBeenCalled();
        expect(callbacks.size).toBe(1);
        await act(async () => { expect(await result.current.confirmSubject('old-candidate')).toBe(false); });
        expect(clients[0].confirmSubject).not.toHaveBeenCalled();
    });

    it('freezes a recording before frame preparation so inference delay cannot advance the confirmed image', async () => {
        const { result, frame, video, callbacks } = setup();
        let playing = false;
        video.play.mockImplementation(async () => { playing = true; });
        video.pause.mockImplementation(() => { playing = false; });
        await act(async () => result.current.startFile(recording(), confirmed));
        act(() => frame(0));
        expect(video.pause.mock.invocationCallOrder[0]).toBeLessThan(clients[0].processFrame.mock.invocationCallOrder[0]);
        // Simulate 800 ms of inference wall time: the paused video must not advance.
        if (playing) video.currentTime += 0.8;
        expect(video.currentTime).toBe(0);
        expect(callbacks.size).toBe(0);
        act(() => clients[0].callbacks.onResult(candidateResult));
        await act(async () => {
            clients[0].confirmSubject.mockImplementation(async () => {
                clients[0].callbacks.onSubject({ status: 'tracking', confirmationToken: null });
                return true;
            });
            expect(await result.current.confirmSubject('candidate-1')).toBe(true);
        });
        act(() => frame(0.05));
        expect(clients[0].processFrame.mock.calls.map(([, time]) => time)).toEqual([0, 50]);
    });

    it('advances the paused preview when the inspected frame contains no eligible subject', async () => {
        const { result, frame, video, callbacks } = setup();
        await act(async () => result.current.startFile(recording(), confirmed));
        act(() => frame(0));
        expect(callbacks.size).toBe(0);
        await act(async () => clients[0].callbacks.onResult({ subject: { status: 'unavailable', reason: 'subject_missing' }, snapshot: {} }));
        expect(video.play).toHaveBeenCalledTimes(2);
        expect(callbacks.size).toBe(1);
        act(() => frame(0.05));
        expect(clients[0].processFrame).toHaveBeenCalledTimes(2);
    });

    it('advances the file preview during qualification and holds it only for a qualified confirmation token', async () => {
        const { result, frame, video, callbacks } = setup();
        let playing = false;
        video.play.mockImplementation(async () => { playing = true; });
        video.pause.mockImplementation(() => { playing = false; });
        await act(async () => result.current.startFile(recording(), confirmed));
        const stabilizing = { status: 'unavailable', reason: 'subject_stabilizing', confirmationToken: null };
        for (const time of [0, 0.06, 0.12, 0.18, 0.24]) {
            act(() => frame(time));
            // Preparation freezes each inspected image; an unqualified result must resume it.
            expect(playing).toBe(false);
            await act(async () => clients[0].callbacks.onResult({ subject: stabilizing, snapshot: {} }));
            expect(playing).toBe(true);
            expect(callbacks.size).toBe(1);
            await act(async () => { expect(await result.current.confirmSubject('candidate-1')).toBe(false); });
        }
        act(() => { frame(0.30); clients[0].callbacks.onResult(candidateResult); });
        expect(playing).toBe(false);
        expect(callbacks.size).toBe(0);
        expect(video.play).toHaveBeenCalledTimes(6);
        expect(clients[0].processFrame.mock.calls.map(([, time]) => time)).toEqual([0, 60, 120, 180, 240, 300]);
        expect(clients[0].confirmSubject).not.toHaveBeenCalled();
        expect(result.current.subject).toEqual(candidate);
    });

    it('preserves confirmed results and closes capture when subject continuity is lost', async () => {
        const capture = makeStream();
        getUserMedia.mockResolvedValue(capture.stream);
        const { result } = setup();
        await act(async () => result.current.startCamera(confirmed));
        await act(async () => clients[0].callbacks.onResult({ subject: { status: 'confirmation_required',
            confirmationToken: null, restartRequired: true, reason: 'multiple_people' },
        snapshot: { state: 'interrupted', capture: { status: 'unavailable' }, repetitionsCompleted: 2 } }));
        expect(result.current.status).toBe('completed');
        expect(result.current.stopReason).toBe('subject_ambiguous');
        expect(result.current.summary).toMatchObject(summary);
        expect(result.current.summary.processingDiagnostics.processing.observedResults).toBe(1);
        expect(clients[0].stop).toHaveBeenCalledOnce();
        expect(capture.track.stop).toHaveBeenCalledOnce();
        await act(async () => { expect(await result.current.confirmSubject('candidate-1')).toBe(false); });
    });

    it('does not resume a paused recording when a confirmation arrives after cancellation', async () => {
        const { result, frame, video } = setup();
        await act(async () => result.current.startFile(recording(), confirmed));
        act(() => { frame(0); clients[0].callbacks.onResult(candidateResult); });
        const ack = deferred();
        clients[0].confirmSubject.mockReturnValue(ack.promise);
        let confirmation;
        act(() => { confirmation = result.current.confirmSubject('candidate-1'); });
        act(() => result.current.cancel());
        await act(async () => { ack.resolve(true); expect(await confirmation).toBe(false); });
        expect(video.play).toHaveBeenCalledTimes(1);
        expect(result.current.status).toBe('idle');
    });

    it('bounds resumed playback even when the browser leaves play pending', async () => {
        vi.useFakeTimers();
        const { result, frame, video } = setup();
        await act(async () => result.current.startFile(recording(), confirmed));
        act(() => { frame(0); clients[0].callbacks.onResult(candidateResult); });
        video.play.mockReturnValue(new Promise(() => {}));
        let confirmation;
        act(() => { confirmation = result.current.confirmSubject('candidate-1'); });
        await act(async () => { await vi.advanceTimersByTimeAsync(15001); expect(await confirmation).toBe(false); });
        expect(result.current.status).toBe('error');
        expect(result.current.error).toMatch(/ready in time/);
        expect(guards[0]).toHaveBeenCalledOnce();
    });

    it('collects evaluation data only for explicitly enabled local videos and marks an early stop as partial', async () => {
        const { result } = setup();
        await act(async () => result.current.startFile(recording(), { ...confirmed, evaluation: { clipId: 'clip-01' } }));
        clients[0].stop.mockResolvedValue({ ...summary, repetitionsCompleted: 1, modelVersion: 'model-test', profileId: 'squat-test',
            profileVersion: '0.1', subjectTracking: { confirmedSegments: 1, restartRequired: false } });
        act(() => clients[0].callbacks.onResult({ subject: { status: 'tracking' }, inferenceMs: 8, frameLatencyMs: 15,
            snapshot: { event: 'repetition_completed', repetitionsCompleted: 1, lastRepetition: {
                index: 1, startedAtMs: 1000, completedAtMs: 5000, descentSeconds: 2, bottomPauseSeconds: 0.5,
            } } }));
        await act(async () => result.current.finish());
        expect(result.current.summary.evaluationTrace).toMatchObject({ clipId: 'clip-01', durationMs: 10000,
            completed: false, truncated: false, repetitions: [{ startedAtMs: 1000, bottomReachedAtMs: 3000,
                ascentStartedAtMs: 3500, completedAtMs: 5000 }], processing: { samples: 1 } });
    });

    it('rejects evaluation options for cameras or invalid recording identifiers before acquiring resources', async () => {
        const { result } = setup();
        await act(async () => { expect(await result.current.startCamera({ ...confirmed, evaluation: { clipId: 'clip' } })).toBe(false); });
        await act(async () => { expect(await result.current.startFile(recording(), { ...confirmed, evaluation: { clipId: 'my video' } })).toBe(false); });
        expect(mocks.createClient).not.toHaveBeenCalled();
        expect(getUserMedia).not.toHaveBeenCalled();
    });

    it('requires explicit setup and browser capability before requesting media or downloading a model', async () => {
        const { result } = setup();
        await act(async () => { expect(await result.current.startCamera()).toBe(false); });
        expect(result.current.error).toMatch(/Confirm/);
        vi.stubGlobal('Worker', undefined);
        await act(async () => { expect(await result.current.startCamera(confirmed)).toBe(false); });
        expect(result.current.error).toMatch(/does not support/);
        expect(getUserMedia).not.toHaveBeenCalled();
        expect(mocks.createClient).not.toHaveBeenCalled();
        expect(mocks.protect).not.toHaveBeenCalled();
    });

    it('rejects oversized files without creating a playback URL or a worker', async () => {
        const { result } = setup();
        const file = { size: SQUAT_VIDEO_LIMITS.maximumBytes + 1, type: 'video/mp4' };
        await act(async () => { expect(await result.current.startFile(file, confirmed)).toBe(false); });
        expect(result.current.error).toMatch(/100 MiB/);
        expect(URL.createObjectURL).not.toHaveBeenCalled();
        expect(mocks.createClient).not.toHaveBeenCalled();
    });

    it('rejects long recordings and releases decoding and worker resources', async () => {
        const { result, video } = setup();
        video.duration = 121;
        await act(async () => { expect(await result.current.startFile(recording(), confirmed)).toBe(false); });
        expect(result.current.status).toBe('error');
        expect(result.current.error).toMatch(/two minutes/);
        expect(clients[0].dispose).toHaveBeenCalledTimes(1);
        expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:local-recording');
        expect(guards[0]).toHaveBeenCalledTimes(1);
    });

    it('uses bounded camera constraints without audio and submits source times with backpressure', async () => {
        const { result, frame, video } = setup();
        await act(async () => { expect(await result.current.startCamera(confirmed)).toBe(true); });
        expect(getUserMedia).toHaveBeenCalledWith({ audio: false, video: {
            facingMode: { ideal: 'environment' }, width: { ideal: 640, max: 1280 },
            height: { ideal: 480, max: 720 }, frameRate: { ideal: 30, max: 30 },
        } });
        clients[0].processFrame.mockReturnValueOnce(true).mockReturnValueOnce(false).mockReturnValueOnce(true);
        act(() => { frame(0); frame(0.025); frame(0.050); frame(0.075); });
        expect(clients[0].processFrame.mock.calls).toEqual([[video, 0], [video, 50], [video, 75]]);
        expect(result.current.status).toBe('running');
        expect(guards[0]).not.toHaveBeenCalled();
    });

    it('waits for the admitted final frame and confirmed summary before stopping tracks', async () => {
        const capture = makeStream();
        getUserMedia.mockResolvedValue(capture.stream);
        const { result, frame, callbacks, video } = setup();
        await act(async () => result.current.startCamera(confirmed));
        act(() => frame(0.5));
        const stopped = deferred();
        clients[0].stop.mockReturnValue(stopped.promise);
        let finishing;
        act(() => { finishing = result.current.finish(); });
        expect(result.current.status).toBe('stopping');
        expect(callbacks.size).toBe(0);
        expect(capture.track.stop).not.toHaveBeenCalled();
        expect(video.srcObject).toBe(capture.stream);
        expect(guards[0]).not.toHaveBeenCalled();
        await act(async () => {
            clients[0].callbacks.onResult({ inferenceMs: 12, frameLatencyMs: 24, subject: { status: 'tracking' }, snapshot: {} });
            stopped.resolve(summary);
            await finishing;
        });
        expect(result.current.summary).toMatchObject(summary);
        expect(result.current.summary.processingDiagnostics).toMatchObject({ schemaVersion: 1, sourceKind: 'camera',
            processing: { observedResults: 1, validSamples: 1, retainedSamples: 1, invalidSamples: 0,
                inferenceMs: { p50: 12, p95: 12 }, frameLatencyMs: { p50: 24, p95: 24 } } });
        expect(result.current.status).toBe('completed');
        expect(capture.track.stop).toHaveBeenCalledTimes(1);
        expect(video.srcObject).toBeNull();
        expect(guards[0]).toHaveBeenCalledTimes(1);
    });

    it('stops a permission result that arrives after cancellation without attaching it', async () => {
        const permission = deferred();
        getUserMedia.mockReturnValue(permission.promise);
        const capture = makeStream();
        const { result, video } = setup();
        let starting;
        act(() => { starting = result.current.startCamera(confirmed); });
        act(() => result.current.cancel());
        expect(result.current.status).toBe('idle');
        expect(guards[0]).toHaveBeenCalledTimes(1);
        await act(async () => { permission.resolve(capture.stream); expect(await starting).toBe(false); });
        expect(capture.track.stop).toHaveBeenCalledTimes(1);
        expect(video.srcObject).toBeNull();
        expect(result.current.status).toBe('idle');
    });

    it('records overlapping preparation intervals with the monotonic clock before subject confirmation', async () => {
        let clock = 100;
        vi.spyOn(performance, 'now').mockImplementation(() => clock);
        const workerReady = deferred(), permission = deferred(), finalPlay = deferred();
        const createClient = mocks.createClient.getMockImplementation();
        mocks.createClient.mockImplementation(callbacks => {
            const client = createClient(callbacks);
            client.start.mockReturnValue(workerReady.promise);
            return client;
        });
        getUserMedia.mockReturnValue(permission.promise);
        const { result, video } = setup();
        video.play.mockResolvedValueOnce().mockReturnValueOnce(finalPlay.promise);
        let starting;
        act(() => { starting = result.current.startCamera(confirmed); });
        clock = 250;
        await act(async () => workerReady.resolve());
        clock = 600;
        await act(async () => permission.resolve(makeStream().stream));
        expect(video.play).toHaveBeenCalledTimes(2);
        clock = 700;
        await act(async () => { finalPlay.resolve(); expect(await starting).toBe(true); });
        clock = 9000;
        act(() => clients[0].callbacks.onResult({ sourceTimestampMs: 800000, inferenceMs: 7, frameLatencyMs: 18,
            subject: candidate, snapshot: { state: 'setup' } }));
        await act(async () => result.current.finish());
        expect(result.current.summary.processingDiagnostics.preparationMs).toEqual({
            workerReady: 150, mediaReady: 500, sessionReady: 600,
        });
        expect(clients[0].confirmSubject).not.toHaveBeenCalled();
        expect(result.current.summary.processingDiagnostics.preparationScope).toMatch(/overlap.*excludes subject confirmation/);
        expect(result.current.summary.processingDiagnostics.frameLatencyScope).toMatch(/Camera capture and display presentation are excluded/);
    });

    it('starts camera diagnostics fresh after cancellation and ignores late readiness and results from the old session', async () => {
        let clock = 100;
        vi.spyOn(performance, 'now').mockImplementation(() => clock);
        const oldWorkerReady = deferred(), oldPermission = deferred();
        const createClient = mocks.createClient.getMockImplementation();
        let created = 0;
        mocks.createClient.mockImplementation(callbacks => {
            const client = createClient(callbacks);
            if (created++ === 0) client.start.mockReturnValue(oldWorkerReady.promise);
            return client;
        });
        getUserMedia.mockReturnValueOnce(oldPermission.promise);
        const { result } = setup();
        let oldStart;
        act(() => { oldStart = result.current.startCamera(confirmed); });
        act(() => result.current.cancel());
        clock = 300;
        await act(async () => result.current.startCamera(confirmed));
        clock = 10000;
        await act(async () => {
            oldWorkerReady.resolve();
            oldPermission.resolve(makeStream().stream);
            expect(await oldStart).toBe(false);
        });
        act(() => {
            clients[0].callbacks.onResult({ inferenceMs: 999, frameLatencyMs: 999, snapshot: {} });
            clients[1].callbacks.onResult({ inferenceMs: 5, frameLatencyMs: 9, snapshot: {} });
        });
        await act(async () => result.current.finish());
        expect(result.current.summary.processingDiagnostics).toMatchObject({
            preparationMs: { workerReady: 0, mediaReady: 0, sessionReady: 0 },
            processing: { observedResults: 1, validSamples: 1, inferenceMs: { p50: 5, p95: 5 } },
        });
        expect(result.current.summary.evaluationTrace).toBeUndefined();
    });

    it('stops a permission result that arrives after unmount', async () => {
        const permission = deferred();
        getUserMedia.mockReturnValue(permission.promise);
        const capture = makeStream();
        const { result, unmount } = setup();
        let starting;
        act(() => { starting = result.current.startCamera(confirmed); });
        unmount();
        await act(async () => { permission.resolve(capture.stream); await starting; });
        expect(capture.track.stop).toHaveBeenCalledTimes(1);
        expect(clients[0].dispose).toHaveBeenCalledTimes(1);
        expect(guards[0]).toHaveBeenCalledTimes(1);
    });

    it('releases protection and worker resources after a permission rejection', async () => {
        getUserMedia.mockRejectedValue(new DOMException('Permission denied', 'NotAllowedError'));
        const { result } = setup();
        await act(async () => { expect(await result.current.startCamera(confirmed)).toBe(false); });
        expect(result.current.status).toBe('error');
        expect(result.current.error).toMatch(/not permitted/);
        expect(result.current.summary).toBeNull();
        expect(clients[0].dispose).toHaveBeenCalledTimes(1);
        expect(guards[0]).toHaveBeenCalledTimes(1);
    });

    it('stops a late permission grant after the worker has failed', async () => {
        const permission = deferred();
        getUserMedia.mockReturnValue(permission.promise);
        const capture = makeStream();
        const { result, video } = setup();
        let starting;
        act(() => { starting = result.current.startCamera(confirmed); });
        act(() => clients[0].callbacks.onError(new Error('The local model could not load.')));
        await act(async () => { permission.resolve(capture.stream); await starting; });
        expect(result.current.status).toBe('error');
        expect(result.current.error).toMatch(/could not load/);
        expect(capture.track.stop).toHaveBeenCalledTimes(1);
        expect(video.srcObject).toBeNull();
        expect(guards[0]).toHaveBeenCalledTimes(1);
    });

    it('uses video source time in the animation-frame fallback and cancels its scheduled work', async () => {
        let scheduled;
        const request = vi.fn(callback => { scheduled = callback; return 41; });
        const cancel = vi.fn();
        vi.stubGlobal('requestAnimationFrame', request);
        vi.stubGlobal('cancelAnimationFrame', cancel);
        const { result, video } = setup();
        delete video.requestVideoFrameCallback;
        await act(async () => result.current.startFile(recording(), confirmed));
        video.currentTime = 1.25;
        act(() => scheduled(98765));
        expect(clients[0].processFrame).toHaveBeenCalledWith(video, 1250);
        act(() => scheduled(98800));
        expect(clients[0].processFrame).toHaveBeenCalledTimes(1);
        await act(async () => clients[0].callbacks.onResult({ subject: { status: 'unavailable' }, snapshot: {} }));
        act(() => result.current.cancel());
        expect(cancel).toHaveBeenCalledWith(41);
    });

    it.each([
        ['ended', 'video_ended'], ['seeking', 'video_seek'],
    ])('finishes local playback on %s and preserves only the confirmed summary', async (event, reason) => {
        const { result, video } = setup();
        await act(async () => result.current.startFile(recording(), confirmed));
        await act(async () => video.dispatchEvent(new Event(event)));
        expect(clients[0].stop).toHaveBeenCalledTimes(1);
        expect(result.current.stopReason).toBe(reason);
        expect(result.current.summary).toEqual(summary);
        expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
    });

    it('finishes when hidden and marks failed finalization as unfinished rather than completed', async () => {
        const { result } = setup();
        await act(async () => result.current.startCamera(confirmed));
        act(() => clients[0].callbacks.onResult({ inferenceMs: 8, frameLatencyMs: 16, snapshot: {} }));
        clients[0].stop.mockRejectedValue(new Error('The final measurements are unfinished.'));
        await act(async () => {
            Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
            document.dispatchEvent(new Event('visibilitychange'));
        });
        expect(result.current.stopReason).toBe('page_hidden');
        expect(result.current.status).toBe('error');
        expect(result.current.error).toMatch(/unfinished/);
        expect(result.current.summary).toBeNull();
        expect(guards[0]).toHaveBeenCalledTimes(1);
    });

    it('ignores results from a cancelled session after a restart', async () => {
        const onFrame = vi.fn();
        const { result } = setup({ onFrame });
        await act(async () => result.current.startCamera(confirmed));
        await act(async () => result.current.startFile(recording(), confirmed));
        const latest = { snapshot: { state: 'calibrating', capture: { status: 'calibrating' } }, inferenceMs: 12, frameLatencyMs: 15 };
        act(() => {
            clients[0].callbacks.onResult({ snapshot: { state: 'stale' } });
            clients[1].callbacks.onResult(latest);
        });
        expect(result.current.source).toBe('file');
        expect(result.current.snapshot.state).toBe('calibrating');
        expect(result.current.timing).toEqual({ inferenceMs: 12, frameLatencyMs: 15 });
        expect(onFrame).toHaveBeenCalledTimes(1);
        expect(onFrame).toHaveBeenCalledWith(latest);
        expect(guards[0]).toHaveBeenCalledTimes(1);
        expect(guards[1]).not.toHaveBeenCalled();
    });

    it('throttles repeated snapshots while forwarding overlays and immediate repetition events', async () => {
        const onFrame = vi.fn();
        const { result } = setup({ onFrame });
        await act(async () => result.current.startCamera(confirmed));
        const now = vi.spyOn(performance, 'now').mockReturnValue(0);
        const frame = number => ({ snapshot: { state: 'ready', capture: { status: 'tracking' }, number, repetitionsCompleted: 0 } });
        act(() => clients[0].callbacks.onResult(frame(1)));
        now.mockReturnValue(20);
        act(() => clients[0].callbacks.onResult(frame(2)));
        expect(result.current.snapshot.number).toBe(1);
        now.mockReturnValue(220);
        act(() => clients[0].callbacks.onResult(frame(3)));
        expect(result.current.snapshot.number).toBe(3);
        now.mockReturnValue(230);
        act(() => clients[0].callbacks.onResult({ snapshot: { ...frame(4).snapshot, event: 'repetition_completed', repetitionsCompleted: 1 } }));
        expect(result.current.snapshot.number).toBe(4);
        expect(onFrame).toHaveBeenCalledTimes(4);
    });

    it('times out media readiness and removes pending media listeners', async () => {
        vi.useFakeTimers();
        const { result, video } = setup();
        video.readyState = 0;
        let starting;
        act(() => { starting = result.current.startFile(recording(), confirmed); });
        await act(async () => { await vi.advanceTimersByTimeAsync(15001); await starting; });
        expect(result.current.status).toBe('error');
        expect(result.current.error).toMatch(/ready in time/);
        expect(guards[0]).toHaveBeenCalledTimes(1);
        await act(async () => { video.readyState = 4; video.dispatchEvent(new Event('loadeddata')); });
        expect(result.current.status).toBe('error');
    });

    it.each([
        ['camera', 1], ['camera', 2], ['file', 1],
    ])('bounds a pending %s play promise on call %i even after the worker is ready', async (source, pendingCall) => {
        vi.useFakeTimers();
        const capture = makeStream();
        getUserMedia.mockResolvedValue(capture.stream);
        const { result, video } = setup();
        let calls = 0;
        video.play.mockImplementation(() => ++calls === pendingCall ? new Promise(() => {}) : Promise.resolve());
        let starting;
        act(() => { starting = source === 'camera'
            ? result.current.startCamera(confirmed) : result.current.startFile(recording(), confirmed); });
        await act(async () => { await vi.advanceTimersByTimeAsync(1); });
        expect(video.play).toHaveBeenCalledTimes(pendingCall);
        expect(result.current.status).toBe('preparing');
        expect(guards[0]).not.toHaveBeenCalled();
        await act(async () => { await vi.advanceTimersByTimeAsync(15000); expect(await starting).toBe(false); });
        expect(result.current.status).toBe('error');
        expect(result.current.error).toMatch(/ready in time/);
        expect(clients[0].dispose).toHaveBeenCalledTimes(1);
        expect(guards[0]).toHaveBeenCalledTimes(1);
        if (source === 'camera') expect(capture.track.stop).toHaveBeenCalledTimes(1);
        else expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('settles startup immediately when cancellation aborts a pending play promise', async () => {
        vi.useFakeTimers();
        const capture = makeStream();
        getUserMedia.mockResolvedValue(capture.stream);
        const { result, video } = setup();
        const playing = deferred();
        video.play.mockReturnValue(playing.promise);
        let starting;
        act(() => { starting = result.current.startCamera(confirmed); });
        await act(async () => { await vi.advanceTimersByTimeAsync(1); });
        expect(video.play).toHaveBeenCalledTimes(1);
        await act(async () => { result.current.cancel(); expect(await starting).toBe(false); });
        expect(result.current.status).toBe('idle');
        expect(capture.track.stop).toHaveBeenCalledTimes(1);
        expect(guards[0]).toHaveBeenCalledTimes(1);
        expect(vi.getTimerCount()).toBe(0);
        await act(async () => playing.resolve());
        expect(result.current.status).toBe('idle');
    });

    it('observes a playback error emitted synchronously by play before its promise settles', async () => {
        const { result, video } = setup();
        video.play.mockImplementation(() => {
            video.dispatchEvent(new Event('error'));
            return new Promise(() => {});
        });
        await act(async () => { expect(await result.current.startFile(recording(), confirmed)).toBe(false); });
        expect(result.current.status).toBe('error');
        expect(result.current.error).toMatch(/could not be decoded/);
        expect(guards[0]).toHaveBeenCalledTimes(1);
    });
});
