import { createSquatEvaluator } from './SquatEvaluator.js';
import { POSE_MODEL_VERSION, POSE_RUNTIME_VERSION } from './modelAssets.js';
import { createSubjectTracker } from './SubjectTracker.js';

const close = resource => {
    try { resource?.close(); } catch { /* Cleanup must also succeed after a detector error. */ }
};

const subjectFeedback = subject => {
    if (subject.restartRequired) return 'Measurement stopped because the selected subject could not be followed. Start a new session to continue.';
    if (subject.status === 'awaiting_confirmation') return 'Confirm that the highlighted person is the subject to measure.';
    if (subject.reason === 'subject_stabilizing') return 'Checking that the highlighted person remains clearly visible before confirmation.';
    if (subject.reason === 'multiple_people') return 'Keep only the intended subject in the camera view before confirming.';
    return 'Keep your full body and feet visible while the subject is located.';
};

const selectionSnapshot = (previous, subject, sessionId) => ({
    sessionId, repetitionsCompleted: 0, incompleteCycles: 0, interruptedCycles: 0, lastRepetition: null,
    ...previous, state: subject.restartRequired ? 'interrupted' : 'subject_selection',
    capture: { status: 'unavailable', reason: subject.reason }, measurements: null,
    feedback: { code: subject.restartRequired ? 'subject_tracking_lost' : 'subject_selection',
        tone: 'neutral', message: subjectFeedback(subject) },
    event: subject.restartRequired ? 'subject_tracking_lost' : null,
    subject,
});

/** The worker protocol, separate from the SDK adapter so lifecycle failures can be tested. */
export function createPoseWorkerRuntime({ createDetector, postMessage, now = () => performance.now(),
    createEvaluator = createSquatEvaluator }) {
    let session = null;
    const report = (sessionId, code, message) => postMessage({ type: 'error', sessionId, code, message });

    const initialize = async message => {
        if (session) {
            report(message.sessionId, 'already_initialized', 'The motion worker already has a session.');
            return;
        }
        const next = { id: message.sessionId, detector: null, evaluator: null, phase: 'preparing',
            tracker: createSubjectTracker(), snapshot: null,
            sideViewConfirmed: message.sideViewConfirmed === true, lastDetectorTimestampMs: 0 };
        session = next;
        try {
            next.detector = await createDetector();
            if (session !== next || next.phase !== 'preparing') {
                close(next.detector);
                return;
            }
            next.evaluator = createEvaluator({ sessionId: next.id, modelVersion: POSE_MODEL_VERSION,
                tempoTarget: message.tempoTarget });
            next.phase = 'running';
            postMessage({ type: 'ready', sessionId: next.id, modelVersion: POSE_MODEL_VERSION,
                runtimeVersion: POSE_RUNTIME_VERSION });
        } catch {
            close(next.detector);
            next.phase = 'failed';
            report(next.id, 'model_initialization_failed',
                'The local motion model could not be prepared. This browser or connection may not support the pilot.');
        }
    };

    const frame = message => {
        const active = session;
        let result = null;
        try {
            if (!active || message.sessionId !== active.id || active.phase !== 'running') return;
            if (!message.bitmap || !Number.isFinite(message.sourceTimestampMs) || message.sourceTimestampMs < 0
                || !Number.isFinite(message.imageWidth) || !Number.isFinite(message.imageHeight)
                || message.imageWidth <= 0 || message.imageHeight <= 0) {
                throw new Error('Invalid frame input.');
            }
            // Detector time never depends on seeking, camera clocks, or source playback speed.
            // Exercise timing uses the original source timestamp below.
            const detectorTimestampMs = Math.max(now(), active.lastDetectorTimestampMs + 1);
            active.lastDetectorTimestampMs = detectorTimestampMs;
            const startedAt = now();
            result = active.detector.detectForVideo(message.bitmap, detectorTimestampMs);
            const inferenceMs = Math.max(0, now() - startedAt);
            const tracked = active.tracker.update({ poses: result.landmarks,
                timestampMs: message.sourceTimestampMs, imageWidth: message.imageWidth, imageHeight: message.imageHeight });
            let { subject } = tracked;
            if (tracked.trackingLost) active.snapshot = active.evaluator.interrupt(subject.reason);
            if (subject.status === 'tracking') {
                active.snapshot = active.evaluator.update({ landmarks: tracked.landmarks, timestampMs: message.sourceTimestampMs,
                    imageWidth: message.imageWidth, imageHeight: message.imageHeight,
                    sideViewConfirmed: active.sideViewConfirmed });
                // A stricter exercise-specific geometry rejection must not let the
                // evaluator silently recalibrate to a different person later.
                if (active.snapshot.state === 'interrupted' || active.snapshot.capture?.status === 'unavailable') {
                    subject = active.tracker.interrupt(active.snapshot.capture?.reason || 'measurement_unavailable');
                }
            }
            const snapshot = subject.status === 'tracking' ? { ...active.snapshot, subject }
                : selectionSnapshot(active.snapshot, subject, active.id);
            active.snapshot = snapshot;
            postMessage({ type: 'result', sessionId: active.id, frameId: message.frameId, snapshot, subject,
                landmarks: subject.restartRequired ? [] : tracked.landmarks,
                imageWidth: message.imageWidth, imageHeight: message.imageHeight, inferenceMs });
        } catch {
            if (active && message.sessionId === active.id) {
                active.phase = 'failed';
                close(active.detector);
                report(active.id, 'inference_failed',
                    'Local pose measurement failed. This session is unfinished; restart to continue.');
            }
        } finally {
            close(result);
            close(message.bitmap);
        }
    };

    const confirmSubject = message => {
        const active = session;
        if (!active || message.sessionId !== active.id || active.phase !== 'running') return;
        const { accepted, subject } = active.tracker.confirm(message.confirmationToken);
        postMessage({ type: accepted ? 'subject_confirmed' : 'subject_confirmation_rejected',
            sessionId: active.id, confirmationToken: message.confirmationToken, subject });
    };

    const finish = message => {
        const active = session;
        if (!active || message.sessionId !== active.id || active.phase !== 'running') return;
        try {
            const summary = { ...active.evaluator.getSummary(), subjectTracking: active.tracker.getSummary() };
            active.phase = 'finished';
            close(active.detector);
            postMessage({ type: 'summary', sessionId: active.id, summary });
        } catch {
            active.phase = 'failed';
            close(active.detector);
            report(active.id, 'summary_failed', 'The final measurements could not be confirmed. This session is unfinished.');
        }
    };

    return {
        handleMessage(message) {
            if (message?.type === 'initialize') return initialize(message);
            if (message?.type === 'frame') frame(message);
            else if (message?.type === 'confirm_subject') confirmSubject(message);
            else if (message?.type === 'finish') finish(message);
        },
    };
}
