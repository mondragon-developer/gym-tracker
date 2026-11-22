import { useCallback, useEffect, useRef, useState } from 'react';
import { createPoseWorkerClient } from '../motion/PoseWorkerClient.js';
import { createEvaluationRecorder, isEvaluationClipId } from '../motion/EvaluationRecorder.js';
import { appUpdates } from '../services/AppUpdateService.js';

export const SQUAT_VIDEO_LIMITS = Object.freeze({ maximumBytes: 100 * 1024 * 1024, maximumSeconds: 120 });
const FRAME_INTERVAL_MS = 50;
const RENDER_INTERVAL_MS = 200;
const MEDIA_READY_TIMEOUT_MS = 15000;
let sessionSequence = 0;
const initialView = () => ({ status: 'idle', error: null, snapshot: null, summary: null,
    source: null, timing: null, stopReason: null, subject: null, confirmingSubject: false });

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
        updateView({ status: 'error', error: describeFailure(failure), summary: null, confirmingSubject: false });
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
        updateView({ status: 'stopping', stopReason: reason, confirmingSubject: false });
        session.finishPromise = (async () => {
            try {
                const workerSummary = await session.client?.stop();
                if (current.current !== session) return null;
                const summary = workerSummary && session.evaluationRecorder
                    ? { ...workerSummary, evaluationTrace: session.evaluationRecorder.getTrace({ summary: workerSummary, stopReason: reason }) }
                    : workerSummary;
                current.current = null;
                updateView({ status: summary ? 'completed' : 'idle', summary: summary ?? null,
                    snapshot: session.latestSnapshot, subject: session.latestSubject,
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

    const confirmSubject = useCallback(async confirmationToken => {
        const session = current.current;
        if (!session || session.phase !== 'running' || session.confirmingSubject
            || !confirmationToken || session.latestSubject?.confirmationToken !== confirmationToken
            || session.latestSubject?.status !== 'awaiting_confirmation') return false;
        session.confirmingSubject = true;
        updateView({ confirmingSubject: true, error: null });
        try {
            const accepted = await session.client.confirmSubject(confirmationToken);
            if (current.current !== session || session.phase !== 'running') return false;
            if (!accepted) {
                updateView({ error: 'The highlighted person changed. Review the preview and confirm again.' });
                return false;
            }
            if (session.source === 'file' && session.previewPaused) {
                if (!await session.resumeFilePreview()) return false;
            }
            return true;
        } catch (failure) {
            if (current.current === session && session.phase === 'running') failSession(session, failure);
            return false;
        } finally {
            session.confirmingSubject = false;
            if (current.current === session) updateView({ confirmingSubject: false });
        }
    }, [failSession, updateView]);

    const start = useCallback(async (source, file, { sideViewConfirmed = false, tempoTarget = null, evaluation = null } = {}) => {
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
        if (evaluation && (source !== 'file' || !isEvaluationClipId(evaluation.clipId))) {
            updateView({ error: 'Evaluation reports require a local video and a recording identifier of 1–80 letters, numbers, dots, underscores, or hyphens.' });
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
            frameHandle: null, frameScheduler: null, finishPromise: null, latestSnapshot: null, latestSubject: null,
            confirmingSubject: false, previewPaused: false, schedule: null, resumeFilePreview: null, evaluationRecorder: null,
            lastSourceTime: -Infinity, lastAdmittedTime: -Infinity, lastRenderAt: -Infinity,
            lastSignature: null, lastEvent: null, releaseUpdate };
        current.current = session;
        updateView({ ...initialView(), status: 'preparing', source });
        const isCurrent = () => current.current === session;
        session.resumeFilePreview = async () => {
            if (!isCurrent() || session.phase !== 'running' || !session.previewPaused) return false;
            await waitForMedia(video, session.abort.signal, { play: true });
            if (!isCurrent() || session.phase !== 'running') return false;
            session.previewPaused = false;
            session.schedule?.();
            return true;
        };
        const resumeUnconfirmedPreview = () => {
            void session.resumeFilePreview().catch(failure => {
                if (isCurrent() && session.phase === 'running') failSession(session, failure);
            });
        };
        video.muted = true;
        video.playsInline = true;
        video.preload = 'auto';
        video.playbackRate = 1;

        try {
            session.client = createPoseWorkerClient({
                onError: failure => failSession(session, failure),
                onSubject: subject => {
                    if (!isCurrent() || session.phase !== 'running') return;
                    session.latestSubject = subject;
                    updateView({ subject });
                },
                onResult: result => {
                    if (!isCurrent()) return;
                    session.latestSnapshot = result.snapshot;
                    session.latestSubject = result.subject ?? null;
                    session.evaluationRecorder?.record(result);
                    // Overlay drawing is optional and cannot strand session cleanup.
                    try { frameListener.current?.(result); } catch { /* Drawing does not control capture. */ }
                    const signature = `${result.snapshot?.state}:${result.snapshot?.capture?.status}:${result.snapshot?.capture?.reason}:${result.subject?.status}:${result.subject?.reason}:${result.subject?.confirmationToken}`;
                    const event = result.snapshot?.event
                        ? `${result.snapshot.event}:${result.snapshot.repetitionsCompleted}:${result.snapshot.incompleteCycles}` : null;
                    const now = performance.now();
                    if ((event && event !== session.lastEvent) || signature !== session.lastSignature
                        || now - session.lastRenderAt >= RENDER_INTERVAL_MS) {
                        session.lastRenderAt = now;
                        session.lastSignature = signature;
                        session.lastEvent = event;
                        updateView({ snapshot: result.snapshot, subject: result.subject ?? null,
                            timing: { inferenceMs: result.inferenceMs, frameLatencyMs: result.frameLatencyMs } });
                    }
                    if (session.phase !== 'running') return;
                    if (result.subject?.restartRequired) {
                        finishRef.current?.(result.subject.reason === 'multiple_people' ? 'subject_ambiguous' : 'subject_lost');
                    } else if (source === 'file' && session.previewPaused
                        && result.subject?.status !== 'awaiting_confirmation') {
                        // No eligible candidate: advance the preview and try again.
                        // A candidate result remains frozen until explicit confirmation.
                        resumeUnconfirmedPreview();
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
                if (evaluation) session.evaluationRecorder = createEvaluationRecorder({ clipId: evaluation.clipId, durationMs: video.duration * 1000 });
            })();
            await Promise.all([workerReady, mediaReady]);
            if (!isCurrent() || session.phase !== 'preparing') return false;
            await waitForMedia(video, session.abort.signal, { play: true });
            if (!isCurrent() || session.phase !== 'preparing') return false;
            session.phase = 'running';
            updateView({ status: 'running' });

            const frame = (_displayTime, metadata) => {
                session.frameHandle = null;
                if (!isCurrent() || session.phase !== 'running' || session.previewPaused) return;
                const sourceTime = (metadata?.mediaTime ?? video.currentTime) * 1000;
                if (Number.isFinite(sourceTime) && sourceTime < session.lastSourceTime) {
                    finishRef.current?.('source_time_changed');
                    return;
                }
                if (Number.isFinite(sourceTime)) session.lastSourceTime = sourceTime;
                if (sourceTime - session.lastAdmittedTime >= FRAME_INTERVAL_MS) {
                    const selectingFileSubject = source === 'file' && session.latestSubject?.status !== 'tracking';
                    if (selectingFileSubject) {
                        // Freeze before asynchronous bitmap preparation/inference so
                        // the displayed image and confirmation token share a frame.
                        session.previewPaused = true;
                        video.pause();
                    }
                    if (session.client.processFrame(video, sourceTime)) session.lastAdmittedTime = sourceTime;
                    else if (selectingFileSubject) resumeUnconfirmedPreview();
                }
                schedule();
            };
            const schedule = () => {
                if (!isCurrent() || session.phase !== 'running' || session.previewPaused || session.frameHandle != null) return;
                if (typeof video.requestVideoFrameCallback === 'function') {
                    session.frameScheduler = 'video';
                    session.frameHandle = video.requestVideoFrameCallback(frame);
                } else {
                    session.frameScheduler = 'animation';
                    session.frameHandle = requestAnimationFrame(frame);
                }
            };
            session.schedule = schedule;
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
    return { ...view, startCamera, startFile, confirmSubject, finish, cancel };
}
