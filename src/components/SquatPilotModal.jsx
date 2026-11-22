import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import Modal from './ui/Modal.jsx';
import useSquatSession from '../hooks/useSquatSession.js';
import { appUpdates } from '../services/AppUpdateService.js';
import './SquatPilotModal.css';

const SEGMENTS = [[11, 23], [23, 25], [25, 27], [27, 29], [29, 31], [12, 24], [24, 26], [26, 28], [28, 30], [30, 32]];
const DRAWN_LANDMARKS = [...new Set(SEGMENTS.flat())];
const RECORDING_IDENTIFIER = /^[A-Za-z0-9._-]{1,80}$/;
const seconds = value => Number.isFinite(value) ? `${value.toFixed(2)} s` : 'Not available';
const stopMessages = {
    page_hidden: 'The session ended when this page was hidden.',
    video_seek: 'The session ended because the recording position changed.',
    source_time_changed: 'The session ended because the recording timeline changed.',
    playback_rate_changed: 'The session ended because playback speed changed.',
    camera_ended: 'The session ended because camera access stopped.',
    subject_lost: 'Measurement stopped because the confirmed person could no longer be followed. Completed measurements are preserved. Start a new session to continue.',
    subject_ambiguous: 'Measurement stopped because another person was detected or the subject became unclear. Completed measurements are preserved. Keep only the intended person in view and start a new session.',
};

function drawPose(canvas, result) {
    if (!canvas) return;
    const { imageWidth, imageHeight, landmarks, snapshot, subject } = result;
    if (!Number.isFinite(imageWidth) || !Number.isFinite(imageHeight) || imageWidth <= 0 || imageHeight <= 0) return;
    if (canvas.width !== imageWidth) canvas.width = imageWidth;
    if (canvas.height !== imageHeight) canvas.height = imageHeight;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.clearRect(0, 0, imageWidth, imageHeight);
    if (!landmarks?.length) return;
    const visible = index => landmarks[index] && landmarks[index].visibility >= 0.6;
    context.strokeStyle = subject?.status === 'tracking' && snapshot?.capture?.status === 'tracking' ? '#66e3bc' : '#ffd185';
    context.fillStyle = context.strokeStyle;
    context.lineWidth = Math.max(2, imageWidth / 220);
    const bounds = subject?.bounds;
    if (bounds && [bounds.x, bounds.y, bounds.width, bounds.height].every(Number.isFinite)
        && bounds.width > 0 && bounds.height > 0) {
        context.strokeRect(bounds.x * imageWidth, bounds.y * imageHeight, bounds.width * imageWidth, bounds.height * imageHeight);
    }
    for (const [from, to] of SEGMENTS) {
        if (!visible(from) || !visible(to)) continue;
        context.beginPath();
        context.moveTo(landmarks[from].x * imageWidth, landmarks[from].y * imageHeight);
        context.lineTo(landmarks[to].x * imageWidth, landmarks[to].y * imageHeight);
        context.stroke();
    }
    for (const index of DRAWN_LANDMARKS) {
        if (!visible(index)) continue;
        context.beginPath();
        context.arc(landmarks[index].x * imageWidth, landmarks[index].y * imageHeight, Math.max(3, imageWidth / 160), 0, Math.PI * 2);
        context.fill();
    }
}

function subjectFeedback(session) {
    if (session.status !== 'running') return null;
    const subject = session.subject;
    if (subject?.restartRequired) return 'Tracking was interrupted. Finish this session and start again to confirm the person.';
    if (session.confirmingSubject) return 'Confirming the highlighted person…';
    if (subject?.status === 'awaiting_confirmation' && subject.confirmationToken) {
        return session.source === 'file'
            ? 'The recording is paused. Confirm the highlighted person to continue.'
            : 'Confirm the highlighted person, then stand still before your first repetition.';
    }
    if (subject?.status === 'tracking') return null;
    if (subject?.observedPoses > 1) return 'More than one person was detected. Keep only the intended person in view.';
    return 'Waiting for a clearly visible person. Keep your full body and feet in view.';
}

function downloadSummary(summary) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(summary, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'squat-measurement-summary.json';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function SquatPilotModal({ onClose }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const fileRef = useRef(null);
    const [sideConfirmed, setSideConfirmed] = useState(false);
    const [useTarget, setUseTarget] = useState(false);
    const [collectEvaluation, setCollectEvaluation] = useState(false);
    const [recordingId, setRecordingId] = useState('');
    const [targetValues, setTargetValues] = useState({ descentMin: '2', descentMax: '3', ascentMin: '1', ascentMax: '2' });
    const [aspectRatio, setAspectRatio] = useState('4 / 3');
    const onFrame = useCallback(result => drawPose(canvasRef.current, result), []);
    const session = useSquatSession({ videoRef, onFrame });
    const active = ['preparing', 'running', 'stopping'].includes(session.status);
    const summary = session.summary;
    const snapshot = session.snapshot;
    const subject = session.subject;
    const last = summary?.lastRepetition ?? snapshot?.lastRepetition;
    const canConfirmSubject = session.status === 'running' && subject?.status === 'awaiting_confirmation'
        && Boolean(subject.confirmationToken) && !subject.restartRequired && !session.confirmingSubject;

    // Keep a completed local result reviewable until the person closes it.
    useLayoutEffect(() => appUpdates.protect(), []);

    const target = useTarget ? {
        descentSeconds: { min: Number(targetValues.descentMin), max: Number(targetValues.descentMax) },
        ascentSeconds: { min: Number(targetValues.ascentMin), max: Number(targetValues.ascentMax) },
    } : null;
    const invalidTarget = useTarget && (Object.values(targetValues).some(value => !value.trim())
        || Object.values(target).some(range => !Number.isFinite(range.min) || !Number.isFinite(range.max)
            || range.min < 0 || range.max <= 0 || range.min > range.max));
    const canStart = sideConfirmed && !invalidTarget && !active;
    const invalidEvaluation = collectEvaluation && !RECORDING_IDENTIFIER.test(recordingId);
    const options = { sideViewConfirmed: sideConfirmed, tempoTarget: target };
    const clearOverlay = () => {
        const canvas = canvasRef.current;
        canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    };
    const close = () => { session.cancel(); onClose(); };
    const startCamera = () => { clearOverlay(); session.startCamera(options); };
    const selectFile = event => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (file && canStart && !invalidEvaluation) {
            clearOverlay();
            session.startFile(file, collectEvaluation ? { ...options, evaluation: { clipId: recordingId } } : options);
        }
    };

    return <Modal isOpen onClose={close} title="Squat measurement pilot" className="squat-pilot" style={{ width: 1040 }} closeOnOverlayClick={false}>
        <div className="squat-pilot-intro">
            <span className="squat-pilot-label">Experimental · Bodyweight squat · Side view</span>
            <p>Measure complete repetitions and movement timing. This pilot does not grade technique or establish whether a movement is safe.</p>
        </div>
        <div className="squat-pilot-layout">
            <section aria-label="Movement preview">
                <div className="squat-pilot-preview" style={{ aspectRatio }}>
                    <video ref={videoRef} muted playsInline aria-label="Local squat video preview"
                        onLoadedMetadata={() => {
                            const video = videoRef.current;
                            if (video?.videoWidth && video.videoHeight) setAspectRatio(`${video.videoWidth} / ${video.videoHeight}`);
                        }} />
                    <canvas ref={canvasRef} aria-hidden="true" />
                    {!active && !summary && <div className="squat-pilot-placeholder">Position the camera, then start.</div>}
                    {session.status === 'preparing' && <div className="squat-pilot-placeholder">Preparing the camera and movement model…</div>}
                    {summary && <div className="squat-pilot-placeholder">Session complete. Review your measurements below.</div>}
                </div>
                <p className="squat-pilot-privacy">Your video stays on this device. First use downloads the movement model. Recordings are not uploaded or saved by this pilot.</p>
                <div className="squat-pilot-feedback" role="status" aria-live="polite">
                    {session.status === 'stopping' ? 'Finishing your measurements…'
                        : subjectFeedback(session) ?? snapshot?.feedback?.message ?? 'Stand still with your full body and feet visible before the first repetition.'}
                </div>
                {session.status === 'running' && subject?.status !== 'tracking' && <div className="squat-pilot-subject">
                    <p>Check that the highlighted body is the person you intend to measure. Counting starts after confirmation and a standing calibration.</p>
                    <button type="button" className="squat-pilot-button squat-pilot-primary" disabled={!canConfirmSubject}
                        onClick={() => session.confirmSubject(subject.confirmationToken)}>
                        {session.confirmingSubject ? 'Confirming person…' : 'Measure highlighted person'}
                    </button>
                </div>}
                {session.error && <p className="squat-pilot-error" role="alert">{session.error}</p>}
                {stopMessages[session.stopReason] && <p>{stopMessages[session.stopReason]}</p>}
                <dl className="squat-pilot-metrics">
                    <div><dt>Complete repetitions</dt><dd>{summary?.repetitionsCompleted ?? snapshot?.repetitionsCompleted ?? 0}</dd></div>
                    <div><dt>Last descent</dt><dd>{seconds(last?.descentSeconds)}</dd></div>
                    <div><dt>Last ascent</dt><dd>{seconds(last?.ascentSeconds)}</dd></div>
                </dl>
                {summary && <section className="squat-pilot-summary" aria-label="Session measurements">
                    <h3>Session measurements</h3>
                    <p>{summary.repetitionsCompleted ? `${summary.repetitionsCompleted} complete repetition${summary.repetitionsCompleted === 1 ? '' : 's'} measured.` : 'No complete repetitions were measurable in this session.'}</p>
                    <dl className="squat-pilot-details">
                        <div><dt>Average descent</dt><dd>{seconds(summary.averages?.descentSeconds)}</dd></div>
                        <div><dt>Average bottom pause</dt><dd>{seconds(summary.averages?.bottomPauseSeconds)}</dd></div>
                        <div><dt>Average ascent</dt><dd>{seconds(summary.averages?.ascentSeconds)}</dd></div>
                    </dl>
                    {summary.tempoTarget && <p>{summary.repetitionsWithinTempoTarget} of {summary.repetitionsCompleted} measured repetitions matched your timing target.</p>}
                    {(summary.incompleteCycles > 0 || summary.interruptedCycles > 0 || summary.activeCycleIncomplete) && <p>Some movement was incomplete or interrupted and was excluded from the repetition count.</p>}
                    <p className="squat-pilot-note">These measurements are experimental and have not been validated against annotated recordings. They are not a form or safety score.</p>
                    {summary.evaluationTrace && <p className="squat-pilot-note">{summary.evaluationTrace.completed && !summary.evaluationTrace.truncated
                        ? 'The download includes an evaluation report. Compare it with independently reviewed annotations for this recording.'
                        : 'The download includes a partial evaluation report for troubleshooting. It cannot establish full-recording accuracy.'}</p>}
                    <button type="button" className="squat-pilot-button" onClick={() => downloadSummary(summary)}>
                        {summary.evaluationTrace ? 'Download summary and evaluation report' : 'Download measurement summary'}
                    </button>
                </section>}
            </section>
            <section aria-label="Camera setup and session controls" className="squat-pilot-controls">
                <h3>Set up the side view</h3>
                <ol>
                    <li>Place the phone on a stable support beside you, approximately at hip height, with a level view.</li>
                    <li>Keep your full body and both feet in the frame, with space above and below. Use even lighting and keep other people out of view.</li>
                    <li>Face across the image. Confirm the highlighted person in the preview, then stand still before the first repetition.</li>
                </ol>
                <p className="squat-pilot-note">This pilot supports one clearly visible person. It checks landmark visibility and framing; it cannot certify the camera angle or guarantee that every bystander will be detected.</p>
                <fieldset disabled={active} className="squat-pilot-settings">
                    <label className="squat-pilot-check"><input type="checkbox" checked={sideConfirmed} onChange={event => setSideConfirmed(event.target.checked)} />
                        <span>I have confirmed a stable side view with my full body and feet visible.</span></label>
                    <label className="squat-pilot-check"><input type="checkbox" checked={useTarget} onChange={event => setUseTarget(event.target.checked)} />
                        <span>Compare timing with a custom target.</span></label>
                    {useTarget && <div className="squat-pilot-targets">
                        <p>Enter your chosen duration ranges in seconds. The example values are not a recommended or optimal tempo.</p>
                        {[
                            ['descentMin', 'Descent minimum'], ['descentMax', 'Descent maximum'],
                            ['ascentMin', 'Ascent minimum'], ['ascentMax', 'Ascent maximum'],
                        ].map(([key, label]) => <label key={key}>{label}<input type="number" min="0" step="0.1" inputMode="decimal" value={targetValues[key]}
                            onChange={event => setTargetValues(previous => ({ ...previous, [key]: event.target.value }))} /></label>)}
                        {invalidTarget && <p role="alert">Enter valid ranges with a maximum greater than zero and no smaller than the minimum.</p>}
                    </div>}
                </fieldset>
                <details className="squat-pilot-scope">
                    <summary>Recording evaluation</summary>
                    <fieldset disabled={active} className="squat-pilot-settings">
                        <label className="squat-pilot-check"><input type="checkbox" checked={collectEvaluation} onChange={event => setCollectEvaluation(event.target.checked)} />
                            <span>Collect an evaluation report</span></label>
                        <p className="squat-pilot-note">For local videos only. Include repetition timestamps and processing measurements in the downloaded summary, then compare them with independently reviewed annotations.</p>
                        {collectEvaluation && <div className="squat-pilot-recording">
                            <label>Recording identifier<input type="text" value={recordingId} maxLength={80} autoComplete="off" spellCheck={false}
                                aria-invalid={invalidEvaluation} aria-describedby="squat-recording-id-help"
                                onChange={event => setRecordingId(event.target.value)} /></label>
                            <p id="squat-recording-id-help" className="squat-pilot-note">Use the same anonymous identifier in the annotations, such as squat-side-01. Use 1–80 letters, numbers, periods, underscores, or hyphens.</p>
                            {invalidEvaluation && <p className="squat-pilot-error" role="alert">Enter a valid recording identifier before choosing a local video.</p>}
                        </div>}
                    </fieldset>
                </details>
                <div className="squat-pilot-actions">
                    <button type="button" className="squat-pilot-button squat-pilot-primary" disabled={!canStart} onClick={startCamera}>Start camera</button>
                    <button type="button" className="squat-pilot-button" disabled={!canStart || invalidEvaluation} onClick={() => fileRef.current?.click()}>Choose local video</button>
                    <input ref={fileRef} type="file" accept="video/*" aria-label="Choose a local squat recording" hidden onChange={selectFile} />
                    {session.status === 'running' && <button type="button" className="squat-pilot-button squat-pilot-primary" onClick={() => session.finish()}>Finish session</button>}
                    {session.status === 'preparing' && <button type="button" className="squat-pilot-button" onClick={session.cancel}>Cancel preparation</button>}
                </div>
                <p className="squat-pilot-note">Local recordings: up to two minutes and 100 MiB, with a standing lead-in. Playback pauses for subject confirmation, then continues at normal speed. Leaving this page ends the session.</p>
                <details className="squat-pilot-scope">
                    <summary>What this view can assess</summary>
                    <p>The pilot measures visible movement cycles, phase durations, and change in the two-dimensional knee angle. A custom timing target can be compared with measured repetitions.</p>
                    <p>Stance width, inward knee movement, spinal curvature, appropriate depth, foot pressure, pain, and overall technique are not assessed. Knee travel beyond the toes is not treated as a universal fault.</p>
                </details>
                {session.timing && <details className="squat-pilot-scope">
                    <summary>Session diagnostics</summary>
                    <p>Latest inference: {Math.round(session.timing.inferenceMs)} ms. Frame admission to worker response: {Math.round(session.timing.frameLatencyMs)} ms. These are processing measurements, not total camera-to-display latency.</p>
                </details>}
                <button type="button" className="squat-pilot-button" onClick={close}>Close pilot</button>
                <p className="squat-pilot-note">Closing discards the local session. Download the summary first if you wish to retain it.</p>
            </section>
        </div>
    </Modal>;
}
