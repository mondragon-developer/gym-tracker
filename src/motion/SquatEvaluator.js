import { SQUAT_SIDE_PROFILE } from './squatProfile.js';
import { compareTempo, normalizeTempoTarget, repetitionFeedback } from './squatFeedback.js';

const profile = SQUAT_SIDE_PROFILE;
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const degrees = (a, b, c) => {
    const ab = { x: a.x - b.x, y: a.y - b.y };
    const cb = { x: c.x - b.x, y: c.y - b.y };
    const denominator = Math.hypot(ab.x, ab.y) * Math.hypot(cb.x, cb.y);
    return Math.acos(Math.max(-1, Math.min(1, (ab.x * cb.x + ab.y * cb.y) / denominator))) * 180 / Math.PI;
};
const message = (code, text) => ({ code, tone: 'neutral', message: text });
const copyRepetition = value => value ? { ...value, tempo: { ...value.tempo } } : null;

const visible = (point) => point && Number.isFinite(point.visibility)
    && point.visibility >= profile.capture.minimumVisibility
    && (point.presence == null || (Number.isFinite(point.presence) && point.presence >= profile.capture.minimumPresence));

/** Convert normalized image coordinates to common height units before geometry. */
const measure = (frame, lockedSide) => {
    if (!Number.isFinite(frame.imageWidth) || !Number.isFinite(frame.imageHeight)
        || frame.imageWidth <= 0 || frame.imageHeight <= 0) return { issue: 'invalid_dimensions' };
    if (!Array.isArray(frame.landmarks) || frame.landmarks.length !== 33
        || frame.landmarks.some(point => !point || !Number.isFinite(point.x) || !Number.isFinite(point.y)
            || (point.z != null && !Number.isFinite(point.z)))) return { issue: 'invalid_landmarks' };
    const ratio = frame.imageWidth / frame.imageHeight;
    if (!Number.isFinite(ratio) || ratio <= 0) return { issue: 'invalid_dimensions' };
    const point = index => ({ x: frame.landmarks[index].x * ratio, y: frame.landmarks[index].y });
    const candidate = (side) => {
        const indices = profile.landmarks[side];
        const required = Object.values(indices).map(index => frame.landmarks[index]);
        if (required.some(p => !visible(p))) return null;
        const margin = profile.capture.frameMargin;
        if (required.some(p => p.x < margin || p.x > 1 - margin || p.y < margin || p.y > 1 - margin)) return null;
        const points = Object.fromEntries(Object.entries(indices).map(([name, index]) => [name, point(index)]));
        const thigh = distance(points.hip, points.knee);
        const shin = distance(points.knee, points.ankle);
        const torso = distance(points.shoulder, points.hip);
        // Stabilize floating-point threshold comparisons across mirrored/aspect
        // equivalent inputs. This is not a claim of angular measurement precision.
        const kneeAngle = Math.round(degrees(points.hip, points.knee, points.ankle) * 1e6) / 1e6;
        if (![thigh, shin, torso, kneeAngle].every(Number.isFinite)) return null;
        if (Math.min(thigh, shin) < profile.capture.minimumSegmentLength
            || torso < profile.capture.minimumTorsoLength
            || distance(points.heel, points.toe) < profile.capture.minimumFootLength) return null;
        return { ...points, side, legLength: thigh + shin, torso, kneeAngle,
            visibility: Math.min(...required.map(p => p.visibility)), ratio };
    };
    const choices = (lockedSide ? [lockedSide] : ['left', 'right']).map(candidate).filter(Boolean);
    const result = choices.sort((a, b) => b.visibility - a.visibility)[0];
    if (!result) return { issue: 'required_landmarks_unavailable' };
    // A plausibility rejection only. Passing this check never certifies camera orientation.
    for (const pair of [[11, 12], [23, 24]]) {
        if (pair.every(index => visible(frame.landmarks[index]))
            && Math.abs(point(pair[0]).x - point(pair[1]).x) / result.torso > profile.capture.maximumBilateralWidthToTorso) {
            return { issue: 'view_not_supported' };
        }
    }
    return result;
};

/**
 * Pure, bounded-state experimental evaluator for SQUAT_SIDE_PROFILE.
 * update accepts MediaPipe's 33 normalized landmarks and source timestampMs.
 * sideViewConfirmed is explicit user setup confirmation, not inferred validity.
 * No frames, landmark history, or per-repetition history are retained.
 */
export function createSquatEvaluator({ sessionId = null, modelVersion = 'not-specified', tempoTarget = null } = {}) {
    const target = normalizeTempoTarget(tempoTarget);
    let state, capture, feedback, event, lastTimestamp, firstTimestamp, lastMeasure, aspectRatio;
    let calibration, baseline, selectedSide, pendingDescent, repetition, lastRepetition;
    let completed, incomplete, interrupted, acceptedSamples, validSamples, rejectedSamples, totals, matchedTempo;

    const resetTracking = () => {
        calibration = null; baseline = null; selectedSide = null; pendingDescent = null; repetition = null; lastMeasure = null;
    };
    const snapshot = (inputAccepted = true, inputIssue = null) => ({
        sessionId, profileId: profile.id, profileVersion: profile.version, modelVersion,
        scope: profile.scope, validationStatus: profile.validationStatus, state,
        capture: { ...capture, viewAssessment: 'user-confirmation-and-plausibility-only' },
        repetitionsCompleted: completed, incompleteCycles: incomplete, interruptedCycles: interrupted,
        measurements: lastMeasure ? { sourceTimestampMs: lastTimestamp, side: selectedSide,
            kneeAngleDegrees: lastMeasure.kneeAngle,
            hipDescentLegLengths: baseline ? (lastMeasure.hip.y - baseline.hipY) / baseline.legLength : null } : null,
        lastRepetition: copyRepetition(lastRepetition), feedback: { ...feedback }, event, inputAccepted, inputIssue,
    });
    const interrupt = (reason) => {
        if (repetition) interrupted += 1;
        resetTracking();
        state = 'interrupted';
        capture = { status: 'unavailable', reason };
        feedback = message('capture_interrupted', 'Measurement paused. Restore the side view and return to standing.');
        event = 'capture_interrupted';
    };
    const reset = () => {
        resetTracking();
        state = 'setup'; capture = { status: 'setup_required', reason: 'side_view_confirmation_required' };
        feedback = message('confirm_setup', 'Confirm the supported side view before beginning.');
        event = null; lastTimestamp = null; firstTimestamp = null; aspectRatio = null; lastRepetition = null;
        completed = 0; incomplete = 0; interrupted = 0; acceptedSamples = 0; validSamples = 0; rejectedSamples = 0; matchedTempo = 0;
        totals = { descentSeconds: 0, ascentSeconds: 0, bottomPauseSeconds: 0, totalSeconds: 0 };
        return snapshot(false);
    };
    const calibrate = (m, time) => {
        state = 'calibrating'; capture = { status: 'calibrating', reason: 'stable_standing_required' };
        feedback = message('stand_still', 'Stand still in the supported side view.');
        if (m.kneeAngle < profile.calibration.minimumStandingKneeAngle) { calibration = null; return; }
        if (!calibration) calibration = { since: time, count: 0, minAngle: m.kneeAngle, maxAngle: m.kneeAngle,
            minX: m.hip.x, maxX: m.hip.x, minY: m.hip.y, maxY: m.hip.y, angle: 0, hipY: 0, leg: 0, ankleX: 0, ankleY: 0 };
        const c = calibration;
        c.minAngle = Math.min(c.minAngle, m.kneeAngle); c.maxAngle = Math.max(c.maxAngle, m.kneeAngle);
        c.minX = Math.min(c.minX, m.hip.x); c.maxX = Math.max(c.maxX, m.hip.x);
        c.minY = Math.min(c.minY, m.hip.y); c.maxY = Math.max(c.maxY, m.hip.y);
        if (c.maxAngle - c.minAngle > profile.calibration.maximumKneeRangeDegrees
            || Math.max(c.maxX - c.minX, c.maxY - c.minY) > profile.calibration.maximumHipRange) {
            calibration = null; return;
        }
        c.count += 1; c.angle += m.kneeAngle; c.hipY += m.hip.y; c.leg += m.legLength;
        c.ankleX += m.ankle.x; c.ankleY += m.ankle.y;
        if (time - c.since >= profile.calibration.durationMs && c.count >= profile.calibration.minimumSamples) {
            baseline = { angle: c.angle / c.count, hipY: c.hipY / c.count, legLength: c.leg / c.count,
                ankle: { x: c.ankleX / c.count, y: c.ankleY / c.count } };
            calibration = null; state = 'ready'; capture = { status: 'tracking', reason: null };
            feedback = message('ready', 'Ready to begin.'); event = 'ready';
        }
    };
    const finishCycle = () => {
        const r = repetition;
        const durations = { descentSeconds: (r.bottomFirst - r.startedAtMs) / 1000,
            bottomPauseSeconds: Math.max(0, r.bottomLast - r.bottomFirst) / 1000,
            ascentSeconds: (r.standingSince - r.bottomLast) / 1000,
            totalSeconds: (r.standingSince - r.startedAtMs) / 1000 };
        const d = profile.detector;
        const evaluable = r.ascentConfirmed && r.depthObserved && baseline.angle - r.minimumAngle >= d.minimumCycleDropDegrees
            && (r.maximumHipY - baseline.hipY) / baseline.legLength >= d.minimumHipDescentLegRatio
            && durations.descentSeconds * 1000 >= d.minimumPhaseMs
            && durations.ascentSeconds * 1000 >= d.minimumPhaseMs;
        if (evaluable) {
            completed += 1;
            lastRepetition = { index: completed, startedAtMs: r.startedAtMs, completedAtMs: r.standingSince,
                ...durations, timingSource: 'source_timestamps' };
            lastRepetition.tempo = compareTempo(lastRepetition, target);
            if (lastRepetition.tempo.status === 'within_target') matchedTempo += 1;
            Object.keys(totals).forEach(key => { totals[key] += durations[key]; });
            feedback = repetitionFeedback(lastRepetition); event = 'repetition_completed';
        } else {
            incomplete += 1;
            feedback = message('cycle_not_measured', 'This movement did not produce a complete measurable cycle.');
            event = 'cycle_incomplete';
        }
        repetition = null; pendingDescent = null; state = 'ready';
    };

    const update = (frame) => {
        event = null;
        const time = frame?.timestampMs;
        if (!Number.isFinite(time) || time < 0 || (lastTimestamp != null && time <= lastTimestamp)) {
            rejectedSamples += 1;
            return snapshot(false, Number.isFinite(time) && time >= 0 ? 'non_monotonic_timestamp' : 'invalid_timestamp');
        }
        const previousTime = lastTimestamp;
        lastTimestamp = time; firstTimestamp ??= time; acceptedSamples += 1;
        if (frame.sideViewConfirmed !== true) {
            if (repetition) interrupted += 1;
            resetTracking(); state = 'setup'; capture = { status: 'setup_required', reason: 'side_view_confirmation_required' };
            feedback = message('confirm_setup', 'Confirm the supported side view before beginning.');
            return snapshot();
        }
        if (previousTime != null && time - previousTime > profile.capture.maximumObservationGapMs) {
            interrupt('observation_gap'); return snapshot();
        }
        const m = measure(frame, selectedSide);
        if (m.issue) {
            interrupt(m.issue);
            if (m.issue === 'invalid_dimensions' || m.issue === 'invalid_landmarks') {
                acceptedSamples -= 1; rejectedSamples += 1;
                return snapshot(false, m.issue);
            }
            return snapshot();
        }
        if (aspectRatio != null && Math.abs(m.ratio / aspectRatio - 1) > profile.capture.maximumAspectRatioChange) {
            aspectRatio = m.ratio; interrupt('frame_geometry_changed'); return snapshot();
        }
        aspectRatio = m.ratio; selectedSide ??= m.side; lastMeasure = m;
        if (!baseline) { validSamples += 1; calibrate(m, time); return snapshot(); }
        if (Math.abs(m.legLength / baseline.legLength - 1) > profile.capture.maximumScaleChangeRatio
            || distance(m.ankle, baseline.ankle) / baseline.legLength > profile.capture.maximumAnkleDriftLegRatio) {
            interrupt('setup_changed'); return snapshot();
        }
        validSamples += 1;
        capture = { status: 'tracking', reason: null };
        const d = profile.detector;
        const drop = baseline.angle - m.kneeAngle;
        if (!repetition) {
            if (drop < d.startDropDegrees) { pendingDescent = null; return snapshot(); }
            pendingDescent ??= { startedAtMs: previousTime ?? time, since: time };
            if ((m.hip.y - baseline.hipY) / baseline.legLength < d.minimumStartHipDescentLegRatio) return snapshot();
            if (drop < d.confirmDescentDropDegrees || time - pendingDescent.since < d.phaseEvidenceMs) return snapshot();
            repetition = { startedAtMs: pendingDescent.startedAtMs, minimumAngle: m.kneeAngle,
                maximumHipY: m.hip.y, bottomFirst: time, bottomLast: time, ascentSince: null,
                ascentConfirmed: false, standingSince: null, ascentPeak: m.kneeAngle, depthSince: null, depthObserved: false };
            state = 'descending'; feedback = message('measuring', 'Measuring your repetition.');
        }
        const r = repetition;
        if (time - r.startedAtMs > d.maximumCycleMs) { interrupt('cycle_timeout'); return snapshot(); }
        r.maximumHipY = Math.max(r.maximumHipY, m.hip.y);
        // A single confident but erroneous deep pose must not satisfy the cycle
        // excursion requirement. Require repeated temporal evidence instead.
        if (drop >= d.minimumCycleDropDegrees
            && (m.hip.y - baseline.hipY) / baseline.legLength >= d.minimumHipDescentLegRatio) {
            r.depthSince ??= time;
            if (time - r.depthSince >= d.phaseEvidenceMs) r.depthObserved = true;
        } else r.depthSince = null;
        if (!r.ascentConfirmed) {
            if (m.kneeAngle < r.minimumAngle - d.bottomBandDegrees) {
                r.minimumAngle = m.kneeAngle; r.bottomFirst = time; r.bottomLast = time; r.ascentSince = null;
            } else if (m.kneeAngle <= r.minimumAngle + d.bottomBandDegrees) {
                r.minimumAngle = Math.min(r.minimumAngle, m.kneeAngle); r.bottomLast = time; r.ascentSince = null;
            }
            if (m.kneeAngle >= r.minimumAngle + d.ascentRiseDegrees) {
                r.ascentSince ??= time;
                if (time - r.ascentSince >= d.phaseEvidenceMs) {
                    r.ascentConfirmed = true; r.ascentPeak = m.kneeAngle; state = 'ascending';
                }
            } else r.ascentSince = null;
        } else if (m.kneeAngle < r.ascentPeak - d.maximumAscentReversalDegrees) {
            interrupt('ambiguous_direction_change'); return snapshot();
        }
        if (r.ascentConfirmed) r.ascentPeak = Math.max(r.ascentPeak, m.kneeAngle);
        if (drop <= d.returnDropDegrees) {
            r.standingSince ??= time;
            if (time - r.standingSince >= d.standingEvidenceMs) finishCycle();
        } else r.standingSince = null;
        return snapshot();
    };

    const getSummary = () => ({
        sessionId, profileId: profile.id, profileVersion: profile.version, modelVersion,
        scope: profile.scope, validationStatus: profile.validationStatus,
        startedAtMs: firstTimestamp, lastObservationAtMs: lastTimestamp,
        repetitionsCompleted: completed, incompleteCycles: incomplete, interruptedCycles: interrupted,
        activeCycleIncomplete: repetition != null || pendingDescent != null,
        averages: Object.fromEntries(Object.entries(totals).map(([key, total]) => [key, completed ? total / completed : null])),
        tempoTarget: target, repetitionsWithinTempoTarget: target ? matchedTempo : null,
        capture: { acceptedSamples, validSamples, rejectedSamples,
            validSampleRatio: acceptedSamples ? validSamples / acceptedSamples : null,
            coverageBasis: 'Accepted samples; this is not coverage of independently annotated attempted repetitions.' },
        lastRepetition: copyRepetition(lastRepetition),
        criteriaUnavailable: profile.unavailableCriteria.map(item => ({ ...item })),
    });
    reset();
    return { update, getSummary, reset };
}
