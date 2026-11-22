import { useCallback, useEffect, useRef, useState } from 'react';
import { createPoseWorkerClient } from '../motion/PoseWorkerClient.js';
import { appUpdates } from '../services/AppUpdateService.js';

export const SQUAT_VIDEO_LIMITS = Object.freeze({ maximumBytes: 100 * 1024 * 1024, maximumSeconds: 120 });
const FRAME_INTERVAL_MS = 50;
const RENDER_INTERVAL_MS = 200;
const MEDIA_READY_TIMEOUT_MS = 15000;
let sessionSequence = 0;
const initialView = () => ({ status: 'idle', error: null, snapshot: null, summary: null,
    source: null, timing: null, stopReason: null });

const stopTracks = stream => stream?.getTracks().forEach(track => track.stop());
const cancelFrames = session => {
    if (session.frameHandle == null) return;
    if (session.frameScheduler === 'video') session.video.cancelVideoFrameCallback?.(session.frameHandle);
    else cancelAnimationFrame(session.frameHandle);
    session.frameHandle = null;
};
const releaseSession = session => {
    cancelFrames(session);
    session.abort.abort();
    session.listeners.forEach(remove => remove());
    session.listeners = [];
    session.client?.dispose();
    stopTracks(session.stream);
    session.stream = null;
    session.video.pause();
    session.video.srcObject = null;
    session.video.removeAttribute('src');
    session.video.load();
    if (session.objectUrl) URL.revokeObjectURL(session.objectUrl);
    session.objectUrl = null;
    session.releaseUpdate();
};
const listen = (session, target, name, handler) => {
    target.addEventListener(name, handler);
    session.listeners.push(() => target.removeEventListener(name, handler));
};
const waitForMedia = (video, signal, { play = false, prepare = () => {} } = {}) => new Promise((resolve, reject) => {
    let timer;
    let settled = false;
    let playbackReady = !play;
    const cleanup = () => {
        clearTimeout(timer);
        ['loadedmetadata', 'loadeddata', 'canplay'].forEach(name => video.removeEventListener(name, ready));
        video.removeEventListener('error', failed);
        signal.removeEventListener('abort', aborted);
    };
    const settle = failure => {
        if (settled) return;
        settled = true;
        cleanup();
        if (failure) reject(failure);
        else resolve();
    };
    const ready = () => {
        if (!playbackReady || video.readyState < 2 || !video.videoWidth || !video.videoHeight) return;
        settle();
    };
    const failed = () => {
        settle(new Error('This video could not be decoded. Try a supported MP4 or WebM recording.'));
    };
    const aborted = () => {
        settle(new DOMException('The motion session was cancelled.', 'AbortError'));
    };
    if (signal.aborted) { aborted(); return; }
    ['loadedmetadata', 'loadeddata', 'canplay'].forEach(name => video.addEventListener(name, ready));
    video.addEventListener('error', failed);
    signal.addEventListener('abort', aborted, { once: true });
    timer = setTimeout(() => {
        settle(new Error('The video did not become ready in time. Please try again.'));
    }, MEDIA_READY_TIMEOUT_MS);
    // Browsers may leave play() pending indefinitely. Readiness, playback,
    // errors, and cancellation share this deadline, installed before either
    // source attachment or play() can emit an event.
    try {
        prepare();
        if (settled) return;
        if (video.error) { failed(); return; }
        if (play) {
            Promise.resolve(video.play()).then(() => {
                playbackReady = true;
                ready();
            }, settle);
        }
    } catch (failure) {
        settle(failure);
    }
    ready();
});
const describeFailure = failure => {
    if (failure?.name === 'NotAllowedError') return 'Camera access or video playback was not permitted. Allow access and start again.';
    if (failure?.name === 'NotFoundError') return 'No camera was found on this device. You can select a local recording instead.';
    if (failure?.name === 'NotReadableError') return 'The camera is unavailable or in use by another application.';
    return failure?.message || 'The motion session could not continue. Please start again.';
};

/**
 * Owns capture and playback resources, not pose inference or movement rules.
 * Frames stay local; one worker admission is attempted per decoded source time.
 * finish() drains admitted work; cancel() discards it and releases resources.
 */
export default function useSquatSession({ videoRef, onFrame } = {}) {
    const [view, setView] = useState(initialView);
    const mounted = useRef(true);
    const current = useRef(null);
    const frameListener = useRef(onFrame);
    const finishRef = useRef(null);
    useEffect(() => { frameListener.current = onFrame; }, [onFrame]);

    const updateView = useCallback(patch => {
        if (mounted.current) setView(previous => ({ ...previous, ...patch }));
    }, []);
    const failSession = useCallback((session, failure) => {
        if (current.current !== session) return;
        current.current = null;
        updateView({ status: 'error', error: describeFailure(failure), summary: null });
        releaseSession(session);
    }, [updateView]);
    const cancel = useCallback(() => {
        const session = current.current;
        current.current = null;
        if (mounted.current) setView(initialView());
        if (session) releaseSession(session);
    }, []);

    const finish = useCallback((reason = 'user_finished') => {
        const session = current.current;
        if (!session) return Promise.resolve(null);
        if (session.finishPromise) return session.finishPromise;
        session.phase = 'stopping';
        cancelFrames(session);
        session.video.pause();
        updateView({ status: 'stopping', stopReason: reason });
        session.finishPromise = (async () => {
            try {
                const summary = await session.client?.stop();
                if (current.current !== session) return null;
                current.current = null;
                updateView({ status: summary ? 'completed' : 'idle', summary: summary ?? null,
                    snapshot: session.latestSnapshot,
                    error: summary ? null : 'The session ended before measurements were ready. Start a new session.' });
                releaseSession(session);
                return summary ?? null;
            } catch (failure) {
                failSession(session, failure);
                return null;
            }
        })();
        return session.finishPromise;
    }, [failSession, updateView]);
    useEffect(() => { finishRef.current = finish; }, [finish]);

    const start = useCallback(async (source, file, { sideViewConfirmed = false, tempoTarget = null } = {}) => {
        if (!sideViewConfirmed) {
            updateView({ error: 'Confirm the supported side view before starting.' });
            return false;
        }
        if (!videoRef?.current) {
            updateView({ error: 'The video preview is not ready. Please try again.' });
            return false;
        }
        if (typeof Worker !== 'function' || typeof createImageBitmap !== 'function') {
            updateView({ error: 'This browser does not support background video analysis. Use a current browser on a supported device.' });
            return false;
        }
        if (source === 'camera' && !navigator.mediaDevices?.getUserMedia) {
            updateView({ error: 'Camera access requires a supported browser and a secure connection.' });
            return false;
        }
        if (source === 'file' && (!file || !Number.isFinite(file.size) || file.size <= 0
            || file.size > SQUAT_VIDEO_LIMITS.maximumBytes || (file.type && !file.type.startsWith('video/')))) {
            updateView({ error: 'Select a video recording no larger than 100 MiB.' });
            return false;
        }

        // Acquire the next guard before releasing a previous session, so a
        // deferred update cannot reload in the middle of an explicit restart.
        const releaseUpdate = appUpdates.protect();
        cancel();
        const video = videoRef.current;
        const session = { id: globalThis.crypto?.randomUUID?.() ?? `squat-${Date.now()}-${++sessionSequence}`,
            source, video, phase: 'preparing', client: null,
            abort: new AbortController(), stream: null, objectUrl: null, listeners: [],
            frameHandle: null, frameScheduler: null, finishPromise: null, latestSnapshot: null,
            lastSourceTime: -Infinity, lastAdmittedTime: -Infinity, lastRenderAt: -Infinity,
            lastSignature: null, lastEvent: null, releaseUpdate };
        current.current = session;
        updateView({ ...initialView(), status: 'preparing', source });
        const isCurrent = () => current.current === session;
        video.muted = true;
        video.playsInline = true;
        video.preload = 'auto';
        video.playbackRate = 1;

        try {
            session.client = createPoseWorkerClient({
                onError: failure => failSession(session, failure),
                onResult: result => {
                    if (!isCurrent()) return;
                    session.latestSnapshot = result.snapshot;
                    // Overlay drawing is optional and cannot strand session cleanup.
                    try { frameListener.current?.(result); } catch { /* Drawing does not control capture. */ }
                    const signature = `${result.snapshot?.state}:${result.snapshot?.capture?.status}:${result.snapshot?.capture?.reason}`;
                    const event = result.snapshot?.event
                        ? `${result.snapshot.event}:${result.snapshot.repetitionsCompleted}:${result.snapshot.incompleteCycles}` : null;
                    const now = performance.now();
                    if ((event && event !== session.lastEvent) || signature !== session.lastSignature
                        || now - session.lastRenderAt >= RENDER_INTERVAL_MS) {
                        session.lastRenderAt = now;
                        session.lastSignature = signature;
                        session.lastEvent = event;
                        updateView({ snapshot: result.snapshot,
                            timing: { inferenceMs: result.inferenceMs, frameLatencyMs: result.frameLatencyMs } });
                    }
                },
            });
            const workerReady = session.client.start({ sessionId: session.id, tempoTarget, sideViewConfirmed });
            const mediaReady = (async () => {
                if (!isCurrent()) return;
                if (source === 'camera') {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: {
                        facingMode: { ideal: 'environment' }, width: { ideal: 640, max: 1280 },
                        height: { ideal: 480, max: 720 }, frameRate: { ideal: 30, max: 30 },
                    } });
                    if (!isCurrent()) { stopTracks(stream); return; }
                    session.stream = stream;
                    stream.getVideoTracks().forEach(track => listen(session, track, 'ended', () => finishRef.current?.('camera_ended')));
                    await waitForMedia(video, session.abort.signal, {
                        play: true, prepare: () => { video.srcObject = stream; },
                    });
                } else {
                    await waitForMedia(video, session.abort.signal, { prepare: () => {
                        session.objectUrl = URL.createObjectURL(file);
                        video.src = session.objectUrl;
                        video.load();
                    } });
                }
                if (!isCurrent()) return;
                if (source === 'file' && (!Number.isFinite(video.duration) || video.duration <= 0
                    || video.duration > SQUAT_VIDEO_LIMITS.maximumSeconds)) {
                    throw new Error('Select a recording up to two minutes long. Trim the video before starting.');
                }
            })();
            await Promise.all([workerReady, mediaReady]);
            if (!isCurrent() || session.phase !== 'preparing') return false;
            await waitForMedia(video, session.abort.signal, { play: true });
            if (!isCurrent() || session.phase !== 'preparing') return false;
            session.phase = 'running';
            updateView({ status: 'running' });

            const frame = (_displayTime, metadata) => {
                session.frameHandle = null;
                if (!isCurrent() || session.phase !== 'running') return;
                const sourceTime = (metadata?.mediaTime ?? video.currentTime) * 1000;
                if (Number.isFinite(sourceTime) && sourceTime < session.lastSourceTime) {
                    finishRef.current?.('source_time_changed');
                    return;
                }
                if (Number.isFinite(sourceTime)) session.lastSourceTime = sourceTime;
                if (sourceTime - session.lastAdmittedTime >= FRAME_INTERVAL_MS
                    && session.client.processFrame(video, sourceTime)) session.lastAdmittedTime = sourceTime;
                schedule();
            };
            const schedule = () => {
                if (!isCurrent() || session.phase !== 'running') return;
                if (typeof video.requestVideoFrameCallback === 'function') {
                    session.frameScheduler = 'video';
                    session.frameHandle = video.requestVideoFrameCallback(frame);
                } else {
                    session.frameScheduler = 'animation';
                    session.frameHandle = requestAnimationFrame(frame);
                }
            };
            listen(session, video, 'ended', () => finishRef.current?.('video_ended'));
            listen(session, video, 'error', () => failSession(session, new Error('Video playback stopped unexpectedly. This session is unfinished.')));
            listen(session, video, 'seeking', () => finishRef.current?.('video_seek'));
            listen(session, video, 'ratechange', () => {
                if (video.playbackRate !== 1) finishRef.current?.('playback_rate_changed');
            });
            schedule();
            return true;
        } catch (failure) {
            if (isCurrent() && session.phase !== 'stopping') failSession(session, failure);
            return false;
        }
    }, [cancel, failSession, updateView, videoRef]);

    useEffect(() => {
        mounted.current = true;
        const onVisibility = () => {
            if (document.visibilityState === 'hidden' && current.current) finishRef.current?.('page_hidden');
        };
        document.addEventListener('visibilitychange', onVisibility);
        return () => {
            mounted.current = false;
            document.removeEventListener('visibilitychange', onVisibility);
            const session = current.current;
            current.current = null;
            if (session) releaseSession(session);
        };
    }, []);

    const startCamera = useCallback(options => start('camera', null, options), [start]);
    const startFile = useCallback((file, options) => start('file', file, options), [start]);
    return { ...view, startCamera, startFile, finish, cancel };
}
