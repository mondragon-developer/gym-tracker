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
                stop: vi.fn().mockResolvedValue(summary), dispose: vi.fn() };
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
        await act(async () => { stopped.resolve(summary); await finishing; });
        expect(result.current.summary).toEqual(summary);
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
