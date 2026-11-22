const DEFAULT_TIMEOUTS = Object.freeze({ initializationMs: 45000, frameMs: 5000, summaryMs: 5000, confirmationMs: 5000 });
const MAXIMUM_FRAME_EDGE = 640;
const MAXIMUM_PREPARATION_AGE_MS = 350;

const deferred = () => {
    let resolve, reject;
    const promise = new Promise((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });
    return { promise, resolve, reject };
};

const error = (code, message, unfinished = false) => Object.assign(new Error(message), {
    name: code === 'cancelled' ? 'AbortError' : 'PoseWorkerError', code, unfinished,
});

const closeBitmap = bitmap => {
    try { bitmap?.close(); } catch { /* A detached bitmap may already be closed. */ }
};

const createDefaultWorker = () => new Worker(new URL('./pose.worker.js', import.meta.url), { type: 'module' });
const createDefaultBitmap = (source, options) => globalThis.createImageBitmap(source, options);

/**
 * Owns one worker and at most one admitted frame, including bitmap preparation.
 * There is no pending-frame queue. A new session always receives a new worker.
 * stop() drains its admitted frame before requesting the final summary.
 * dispose() cancels immediately; callers must use stop() when they need a summary.
 */
export function createPoseWorkerClient({
    onResult = () => {}, onError = () => {}, onState = () => {}, onSubject = () => {},
    createWorker = createDefaultWorker, createBitmap = createDefaultBitmap,
    now = () => performance.now(), timeouts = {},
    maximumPreparationAgeMs = MAXIMUM_PREPARATION_AGE_MS,
} = {}) {
    const limits = { ...DEFAULT_TIMEOUTS, ...timeouts };
    let state = 'idle';
    let current = null;
    let lastSummary = null;
    let lastError = null;

    const notify = (callback, value) => {
        // Consumer callbacks must never strand an admitted bitmap or a stop promise.
        try { callback(value); } catch { /* React owns reporting its rendering errors. */ }
    };
    const transition = next => {
        state = next;
        notify(onState, next);
    };
    const isCurrent = session => current === session && state !== 'disposed';
    const release = session => {
        clearTimeout(session.initializationTimer);
        clearTimeout(session.frame?.timer);
        clearTimeout(session.summaryTimer);
        clearTimeout(session.confirmation?.timer);
        session.confirmation?.resolve(false);
        session.confirmation = null;
        session.worker?.removeEventListener('message', session.onMessage);
        session.worker?.removeEventListener('error', session.onWorkerError);
        session.worker?.removeEventListener('messageerror', session.onMessageError);
        session.worker?.terminate();
        // A bitmap still being prepared closes in its asynchronous continuation.
        current = null;
    };
    const fail = (session, failure) => {
        if (!isCurrent(session)) return;
        lastError = failure;
        release(session);
        session.ready.reject(failure);
        session.finish?.reject(failure);
        transition('error');
        notify(onError, failure);
    };
    const requestSummary = session => {
        if (!isCurrent(session) || state !== 'stopping' || session.frame || session.summaryRequested) return;
        session.summaryRequested = true;
        session.summaryTimer = setTimeout(() => fail(session, error('summary_timeout',
            'The final measurements could not be confirmed. This session is unfinished.', true)), limits.summaryMs);
        try {
            session.worker.postMessage({ type: 'finish', sessionId: session.id });
        } catch {
            fail(session, error('summary_failed',
                'The final measurements could not be confirmed. This session is unfinished.', true));
        }
    };
    const receive = (session, message) => {
        if (!isCurrent(session) || message?.sessionId !== session.id) return;
        if (message.type === 'ready' && state === 'preparing') {
            clearTimeout(session.initializationTimer);
            transition('running');
            if (isCurrent(session)) session.ready.resolve();
        } else if (message.type === 'result' && session.frame?.id === message.frameId) {
            const admitted = session.frame;
            clearTimeout(admitted.timer);
            session.frame = null;
            session.processedFrames += 1;
            notify(onResult, {
                snapshot: message.snapshot, landmarks: message.landmarks, subject: message.subject,
                imageWidth: message.imageWidth, imageHeight: message.imageHeight,
                sourceTimestampMs: admitted.sourceTimestampMs,
                inferenceMs: message.inferenceMs,
                frameLatencyMs: Math.max(0, now() - admitted.admittedAt),
            });
            requestSummary(session);
        } else if ((message.type === 'subject_confirmed' || message.type === 'subject_confirmation_rejected')
            && state === 'running' && session.confirmation?.token === message.confirmationToken) {
            const pending = session.confirmation;
            clearTimeout(pending.timer);
            session.confirmation = null;
            notify(onSubject, message.subject);
            pending.resolve(message.type === 'subject_confirmed' && message.subject?.status === 'tracking');
        } else if (message.type === 'summary' && state === 'stopping' && session.summaryRequested) {
            lastSummary = {
                ...message.summary,
                completion: 'confirmed',
                pipeline: { admittedFrames: session.nextFrameId, processedFrames: session.processedFrames,
                    framesDiscardedBeforeInference: session.discardedFrames },
            };
            release(session);
            session.finish.resolve(lastSummary);
            transition('stopped');
        } else if (message.type === 'error') {
            fail(session, error(message.code || 'worker_failed', message.message
                || 'Local motion analysis could not continue.', state !== 'preparing'));
        }
    };

    const start = ({ sessionId, tempoTarget = null, sideViewConfirmed = false } = {}) => {
        if (state === 'disposed') return Promise.reject(error('disposed', 'This motion analysis client has been disposed.'));
        if (current) return Promise.reject(error('already_started', 'Finish the current motion session before starting another.'));
        if (typeof sessionId !== 'string' || !sessionId.trim()) {
            return Promise.reject(error('invalid_session', 'A motion session identifier is required.'));
        }
        if (createBitmap === createDefaultBitmap && typeof globalThis.createImageBitmap !== 'function') {
            const failure = error('unsupported_browser', 'This browser cannot prepare frames for background motion analysis.');
            lastError = failure;
            transition('error');
            notify(onError, failure);
            return Promise.reject(failure);
        }
        lastError = null;
        lastSummary = null;
        const session = { id: sessionId, ready: deferred(), frame: null, finish: null,
            nextFrameId: 0, processedFrames: 0, discardedFrames: 0, lastSourceTimestampMs: -Infinity,
            summaryRequested: false, worker: null, confirmation: null };
        current = session;
        transition('preparing');
        if (!isCurrent(session)) return session.ready.promise;
        try {
            session.worker = createWorker();
            session.onMessage = event => receive(session, event.data);
            session.onWorkerError = event => {
                event.preventDefault?.();
                fail(session, error('worker_failed',
                    'Background motion analysis could not run in this browser. Please restart the session.', state !== 'preparing'));
            };
            session.onMessageError = () => fail(session, error('message_failed',
                'The motion analysis result could not be read. This session is unfinished.', true));
            session.worker.addEventListener('message', session.onMessage);
            session.worker.addEventListener('error', session.onWorkerError);
            session.worker.addEventListener('messageerror', session.onMessageError);
            session.initializationTimer = setTimeout(() => fail(session, error('initialization_timeout',
                'The motion model did not become ready in time. Check the connection and try again.')), limits.initializationMs);
            session.worker.postMessage({ type: 'initialize', sessionId, tempoTarget, sideViewConfirmed });
        } catch {
            fail(session, error('initialization_failed', 'Background motion analysis could not be initialized in this browser.'));
        }
        return session.ready.promise;
    };

    const processFrame = (source, sourceTimestampMs) => {
        const session = current;
        if (!session || state !== 'running' || session.frame) return false;
        if (!Number.isFinite(sourceTimestampMs) || sourceTimestampMs < 0
            || sourceTimestampMs <= session.lastSourceTimestampMs
            || source?.readyState < 2) return false;
        const width = source?.videoWidth;
        const height = source?.videoHeight;
        if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return false;
        const scale = Math.min(1, MAXIMUM_FRAME_EDGE / Math.max(width, height));
        const options = { resizeWidth: Math.max(1, Math.round(width * scale)),
            resizeHeight: Math.max(1, Math.round(height * scale)), resizeQuality: 'low' };
        const admitted = { id: ++session.nextFrameId, admittedAt: now(), sourceTimestampMs,
            sourcePaused: source.paused === true, sourcePosition: source.currentTime };
        session.frame = admitted;
        session.lastSourceTimestampMs = sourceTimestampMs;
        admitted.timer = setTimeout(() => fail(session, error('frame_timeout',
            'A frame could not be measured in time. This session is unfinished.', true)), limits.frameMs);

        // Reserve the slot before calling createBitmap: asynchronous preparation is work in flight.
        Promise.resolve().then(() => {
            if (!isCurrent(session)) return null;
            return createBitmap(source, options);
        }).then(bitmap => {
            if (!bitmap) return;
            if (!isCurrent(session) || session.frame !== admitted) {
                closeBitmap(bitmap);
                return;
            }
            // A delayed preparation must never create a backlog of old images.
            const unchangedPausedFrame = admitted.sourcePaused && source.paused === true
                && Number.isFinite(admitted.sourcePosition) && source.currentTime === admitted.sourcePosition;
            if (state !== 'stopping' && !unchangedPausedFrame && now() - admitted.admittedAt > maximumPreparationAgeMs) {
                closeBitmap(bitmap);
                clearTimeout(admitted.timer);
                session.frame = null;
                session.discardedFrames += 1;
                return;
            }
            try {
                session.worker.postMessage({ type: 'frame', sessionId: session.id, frameId: admitted.id,
                    bitmap, sourceTimestampMs, imageWidth: bitmap.width, imageHeight: bitmap.height }, [bitmap]);
                // Ownership now belongs to the worker, whose inference path closes it in finally.
            } catch {
                closeBitmap(bitmap);
                fail(session, error('frame_transfer_failed',
                    'A camera frame could not be transferred for analysis. This session is unfinished.', true));
            }
        }).catch(() => {
            fail(session, error('frame_preparation_failed',
                'A camera frame could not be prepared for analysis. This session is unfinished.', true));
        });
        return true;
    };

    const stop = () => {
        const session = current;
        if (!session) return lastError ? Promise.reject(lastError) : Promise.resolve(lastSummary);
        if (session.finish) return session.finish.promise;
        if (state === 'preparing') {
            const cancellation = error('cancelled', 'Motion model preparation was cancelled.');
            release(session);
            session.ready.reject(cancellation);
            transition('stopped');
            return Promise.resolve(null);
        }
        session.finish = deferred();
        clearTimeout(session.confirmation?.timer);
        session.confirmation?.resolve(false);
        session.confirmation = null;
        transition('stopping');
        requestSummary(session);
        return session.finish.promise;
    };

    const confirmSubject = confirmationToken => {
        const session = current;
        if (!session || state !== 'running' || typeof confirmationToken !== 'string'
            || !confirmationToken || confirmationToken.length > 128) return Promise.resolve(false);
        if (session.confirmation) return session.confirmation.token === confirmationToken
            ? session.confirmation.promise : Promise.resolve(false);
        const pending = { ...deferred(), token: confirmationToken };
        session.confirmation = pending;
        pending.timer = setTimeout(() => fail(session, error('subject_confirmation_timeout',
            'The selected person could not be confirmed. Start a new session.', true)), limits.confirmationMs);
        try {
            session.worker.postMessage({ type: 'confirm_subject', sessionId: session.id, confirmationToken });
        } catch {
            fail(session, error('subject_confirmation_failed',
                'The selected person could not be confirmed. Start a new session.', true));
        }
        return pending.promise;
    };

    const dispose = () => {
        if (state === 'disposed') return;
        const session = current;
        if (session) {
            const cancellation = error('cancelled', 'Motion analysis was cancelled before a final summary was confirmed.', true);
            lastError = cancellation;
            release(session);
            session.ready.reject(cancellation);
            session.finish?.reject(cancellation);
        }
        transition('disposed');
    };

    return { start, processFrame, confirmSubject, stop, dispose, getState: () => state };
}
