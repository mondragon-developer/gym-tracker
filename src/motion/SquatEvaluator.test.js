import { describe, expect, it } from 'vitest';
import { createSquatEvaluator } from './SquatEvaluator.js';
import { SQUAT_SIDE_PROFILE } from './squatProfile.js';

// An independent geometric fixture: rotate the thigh about the knee relative to
// the shin, then normalize physical image coordinates using each image's size.
// It tests algorithm behavior; it is not a recording or biomechanical validation.
const makePose = (angle, { width = 1000, height = 1000, kneeTravel = 0, hipOffset = 0 } = {}) => {
    const landmarks = Array.from({ length: 33 }, () => ({ x: 0.4, y: 0.3, z: 0, visibility: 1, presence: 1 }));
    const forward = kneeTravel * Math.max(0, (180 - angle) / 90);
    const shinLength = Math.hypot(forward, 0.25);
    const shin = { x: -forward / shinLength, y: 0.25 / shinLength };
    const radians = angle * Math.PI / 180;
    const hip = {
        x: 0.32 + forward + 0.25 * (shin.x * Math.cos(radians) - shin.y * Math.sin(radians)),
        y: 0.65 + 0.25 * (shin.x * Math.sin(radians) + shin.y * Math.cos(radians)) + hipOffset,
    };
    for (const [side, indices] of Object.entries(SQUAT_SIDE_PROFILE.landmarks)) {
        const offset = side === 'left' ? 0 : 0.015;
        const points = {
            shoulder: { x: hip.x, y: hip.y - 0.25 }, hip,
            knee: { x: 0.32 + forward, y: 0.65 }, ankle: { x: 0.32, y: 0.9 },
            heel: { x: 0.29, y: 0.93 }, toe: { x: 0.43, y: 0.93 },
        };
        Object.entries(indices).forEach(([name, index]) => {
            landmarks[index].x = (points[name].x + offset) * height / width;
            landmarks[index].y = points[name].y;
        });
    }
    return landmarks;
};

const COMPLETE_CYCLE = [180, 175, 170, 165, 155, 145, 135, 125, 115, 105, 95, 90, 90, 90, 90,
    100, 110, 120, 130, 140, 150, 160, 170, 180, 180, 180];
const harness = (options = {}, image = {}) => {
    const evaluator = createSquatEvaluator({ sessionId: 'test-session', modelVersion: 'fixture-v1', ...options });
    let time = 0;
    const send = (angle, overrides = {}, step = 100) => {
        const result = evaluator.update({ landmarks: makePose(angle, image), timestampMs: time,
            imageWidth: image.width ?? 1000, imageHeight: image.height ?? 1000,
            sideViewConfirmed: true, ...overrides });
        time += step;
        return result;
    };
    const run = (angles, step = 100) => angles.map(angle => send(angle, {}, step));
    const calibrate = () => run(Array(7).fill(180)).at(-1);
    return { evaluator, send, run, calibrate, get time() { return time; }, jump: delta => { time += delta; } };
};

const DESCENT_AND_RETURN = [155, 145, 135, 125, 115, 105, 95, 90, 90, 90,
    100, 110, 120, 130, 140, 150, 160, 170, 180, 180, 180, 180];
const onsetHarness = () => {
    const h = harness();
    h.run(Array(13).fill(180), 50);
    const sample = (angle, hipOffset = 0, step = 50, overrides = {}) => h.send(angle,
        { landmarks: makePose(angle, { hipOffset }), ...overrides }, step);
    return { h, sample };
};
const hipOffsetForY = (angle, y) => y - (0.65 + 0.25 * Math.cos(angle * Math.PI / 180));
const holdPendingUntil = (h, timestamp, overrides = {}) => {
    while (h.time + 50 < timestamp) h.send(170, overrides, 50);
    h.jump(timestamp - h.time);
};
const expiredStartHarness = () => {
    const h = harness(); h.calibrate();
    const onset = h.evaluator.getSummary().lastObservationAtMs;
    h.send(170, {}, 50);
    holdPendingUntil(h, onset + 5000);
    const expired = h.send(170, {}, 50);
    return { h, onset, expired };
};

describe('experimental side-view squat measurements', () => {
    it('requires explicit side-view confirmation and never certifies the camera view', () => {
        const h = harness();
        for (const angle of [...Array(7).fill(180), ...COMPLETE_CYCLE]) {
            expect(h.send(angle, { sideViewConfirmed: false }).state).toBe('setup');
        }
        expect(h.evaluator.getSummary().repetitionsCompleted).toBe(0);
        const ready = h.calibrate();
        expect(ready.state).toBe('ready');
        expect(ready.capture.viewAssessment).toBe('user-confirmation-and-plausibility-only');
        expect(ready.scope).toBe('measurement-only');
        expect(ready.validationStatus).toBe('not-validated');
    });

    it('does not count setup movement and requires stable standing before measurement', () => {
        const h = harness();
        h.run(COMPLETE_CYCLE.slice(3));
        expect(h.evaluator.getSummary().repetitionsCompleted).toBe(0);
        expect(h.calibrate().state).toBe('ready');
        h.run(COMPLETE_CYCLE);
        expect(h.evaluator.getSummary().repetitionsCompleted).toBe(1);
    });

    it('restarts calibration when the standing subject is still moving', () => {
        const h = harness();
        for (let i = 0; i < 30; i += 1) {
            const landmarks = makePose(180);
            Object.values(SQUAT_SIDE_PROFILE.landmarks).forEach(indices => {
                landmarks[indices.hip].x += i % 2 ? 0.025 : -0.025;
                landmarks[indices.shoulder].x += i % 2 ? 0.025 : -0.025;
            });
            expect(h.send(180, { landmarks }).state).toBe('calibrating');
        }
        expect(h.calibrate().state).toBe('ready');
    });

    it('counts a complete cycle once, using observed timestamps and a separate bottom pause', () => {
        const h = harness();
        h.calibrate();
        const events = h.run(COMPLETE_CYCLE).filter(result => result.event === 'repetition_completed');
        expect(events).toHaveLength(1);
        expect(events[0].lastRepetition).toMatchObject({ index: 1, completedAtMs: 3000,
            descentSeconds: 1.1, bottomPauseSeconds: 0.3, ascentSeconds: 0.9, totalSeconds: 2.3,
            timingSource: 'source_timestamps' });
        // The count is confirmed after standing evidence, but the measured end
        // belongs to the first observed return rather than the confirmation time.
        expect(events[0].lastRepetition.completedAtMs).toBeLessThan(h.time - 100);
        h.run(Array(80).fill(180));
        expect(h.evaluator.getSummary().repetitionsCompleted).toBe(1);
    });

    it('measures elapsed source time instead of assuming an inference frame rate', () => {
        const fast = harness(); const slow = harness();
        fast.calibrate(); slow.calibrate();
        fast.run(COMPLETE_CYCLE, 100); slow.run(COMPLETE_CYCLE, 200);
        const a = fast.evaluator.getSummary(); const b = slow.evaluator.getSummary();
        expect(a.repetitionsCompleted).toBe(1); expect(b.repetitionsCompleted).toBe(1);
        for (const metric of ['descentSeconds', 'ascentSeconds', 'bottomPauseSeconds', 'totalSeconds']) {
            expect(b.averages[metric]).toBeCloseTo(a.averages[metric] * 2);
        }
    });

    it('does not count standing jitter or a partial cycle as a complete repetition', () => {
        const h = harness();
        h.calibrate();
        h.run(Array.from({ length: 100 }, (_, i) => 178 + i % 3));
        h.run([175, 170, 160, 150, 150, 160, 170, 180, 180, 180]);
        const summary = h.evaluator.getSummary();
        expect(summary.repetitionsCompleted).toBe(0);
        expect(summary.incompleteCycles).toBe(1);
        h.run(COMPLETE_CYCLE);
        expect(h.evaluator.getSummary().repetitionsCompleted).toBe(1);
    });

    it('preserves onset through one brief knee rebound corroborated by continuing hip descent', () => {
        const { h, sample } = onsetHarness();
        const onset = h.time - 50;
        sample(170, 0.025); sample(169, 0.025);
        const weak = sample(176, 0.04);
        expect(weak.measurements.kneeAngleDegrees).toBeGreaterThan(180 - SQUAT_SIDE_PROFILE.detector.startDropDegrees);
        expect(h.evaluator.getSummary()).toMatchObject({ activeCycleIncomplete: true, repetitionsCompleted: 0 });
        sample(168, 0.04); h.run(DESCENT_AND_RETURN, 50);
        expect(h.evaluator.getSummary()).toMatchObject({ repetitionsCompleted: 1,
            lastRepetition: { startedAtMs: onset } });
    });

    it.each(['knee jitter', 'hip lowering'])('does not start a complete cycle from %s alone', kind => {
        const { h, sample } = onsetHarness();
        for (let i = 0; i < 80; i += 1) {
            if (kind === 'knee jitter') sample([180, 174, 178, 170, 180][i % 5]);
            else sample(180, 0.04);
        }
        expect(h.evaluator.getSummary()).toMatchObject({ repetitionsCompleted: 0, activeCycleIncomplete: false });
    });

    it.each([0, -0.001])('discards a weak onset when the hip is stationary or rising (%s)', hipChange => {
        const { h, sample } = onsetHarness();
        sample(170, 0.025); sample(169, 0.04);
        const previousHipY = makePose(169, { hipOffset: 0.04 })[23].y;
        const weakTime = h.time;
        const weak = sample(176, hipOffsetForY(176, previousHipY + hipChange));
        expect(weak.measurements.kneeAngleDegrees).toBeGreaterThan(175);
        expect(h.evaluator.getSummary().activeCycleIncomplete).toBe(false);
        h.run([170, 165, ...DESCENT_AND_RETURN], 50);
        expect(h.evaluator.getSummary()).toMatchObject({ repetitionsCompleted: 1,
            lastRepetition: { startedAtMs: weakTime } });
    });

    it.each([
        { initialProgress: false, hipStep: 0.0001 },
        { initialProgress: true, hipStep: 0.0001 },
        { initialProgress: false, hipStep: 0.009 },
    ])('does not reuse an onset through correlated hip/knee noise (%j)', ({ initialProgress, hipStep }) => {
        const { h, sample } = onsetHarness();
        if (initialProgress) sample(170, 0.025);
        const hipY = initialProgress ? 0.445 : 0.425;
        for (let i = 0; i < 200; i += 1) {
            const angle = i % 2 ? 176 : 170;
            const result = sample(angle, hipOffsetForY(angle, hipY + (i % 2 ? hipStep : 0)));
            if (i % 2) expect(result.measurements.kneeAngleDegrees).toBeGreaterThan(175);
        }
        expect(h.evaluator.getSummary()).toMatchObject({ repetitionsCompleted: 0, activeCycleIncomplete: false });
        const freshOnset = h.time - 50;
        h.run([170, 165, ...DESCENT_AND_RETURN], 50);
        expect(h.evaluator.getSummary()).toMatchObject({ repetitionsCompleted: 1,
            lastRepetition: { startedAtMs: freshOnset } });
    });

    it.each([99, 100, 150])('expires retained weak evidence before recovery at %i ms of source time', delay => {
        const { h, sample } = onsetHarness();
        const initialOnset = h.time - 50;
        sample(170, 0.025); sample(169, 0.025);
        const weakTime = h.time;
        sample(176, 0.04);
        expect(h.evaluator.getSummary().activeCycleIncomplete).toBe(true);
        h.jump(delay - 50); sample(168, 0.045);
        h.run(DESCENT_AND_RETURN, 50);
        const expectedOnset = delay < SQUAT_SIDE_PROFILE.detector.phaseEvidenceMs ? initialOnset : weakTime;
        expect(h.evaluator.getSummary()).toMatchObject({ repetitionsCompleted: 1,
            lastRepetition: { startedAtMs: expectedOnset } });
    });

    it('expires prolonged weak knee evidence even while the hip continues descending, and clears a long pause', () => {
        const { h, sample } = onsetHarness();
        sample(170, 0.025); sample(169, 0.025);
        sample(176, 0.04);
        expect(h.evaluator.getSummary().activeCycleIncomplete).toBe(true);
        sample(176, 0.045);
        expect(h.evaluator.getSummary().activeCycleIncomplete).toBe(true);
        sample(176, 0.05);
        expect(h.evaluator.getSummary().activeCycleIncomplete).toBe(false);
        for (let i = 0; i < 100; i += 1) sample(176, 0.05);
        expect(h.evaluator.getSummary()).toMatchObject({ repetitionsCompleted: 0, activeCycleIncomplete: false });
        const freshOnset = h.time - 50;
        h.run([170, 165, ...DESCENT_AND_RETURN], 50);
        expect(h.evaluator.getSummary()).toMatchObject({ repetitionsCompleted: 1,
            lastRepetition: { startedAtMs: freshOnset } });
    });

    it.each(['observation_gap', 'required_landmarks_unavailable'])('discards a retained onset on %s', reason => {
        const { h, sample } = onsetHarness();
        sample(170, 0.025); sample(169, 0.025); sample(176, 0.04);
        expect(h.evaluator.getSummary().activeCycleIncomplete).toBe(true);
        let interrupted;
        if (reason === 'observation_gap') {
            h.jump(SQUAT_SIDE_PROFILE.capture.maximumObservationGapMs - 50 + 1);
            interrupted = sample(168, 0.04);
        } else {
            const landmarks = makePose(168, { hipOffset: 0.04 });
            landmarks[27].visibility = 0.1; landmarks[28].visibility = 0.1;
            interrupted = sample(168, 0.04, 50, { landmarks });
        }
        expect(interrupted.capture.reason).toBe(reason);
        expect(h.evaluator.getSummary()).toMatchObject({ repetitionsCompleted: 0, activeCycleIncomplete: false });
    });

    it.each([4999, 5000, 5001])('checks the pending-start budget before confirmation at %i ms', elapsed => {
        const h = harness(); h.calibrate();
        const onset = h.evaluator.getSummary().lastObservationAtMs;
        h.send(170, {}, 50); holdPendingUntil(h, onset + elapsed);
        const result = h.send(165, {}, 50);
        expect(result.capture).toMatchObject({ status: 'tracking', reason: null });
        if (elapsed < 5000) {
            expect(result).toMatchObject({ state: 'descending', startRecoveryRequired: false });
            h.run(DESCENT_AND_RETURN, 50);
            expect(h.evaluator.getSummary()).toMatchObject({ repetitionsCompleted: 1,
                lastRepetition: { startedAtMs: onset } });
        } else {
            expect(result).toMatchObject({ state: 'awaiting_standing', event: 'start_discarded',
                startRecoveryRequired: true, feedback: { code: 'start_not_measured' } });
            h.run(DESCENT_AND_RETURN, 50);
            expect(h.evaluator.getSummary()).toMatchObject({ repetitionsCompleted: 0,
                activeCycleIncomplete: false, startRecoveryRequired: false });
            h.run([...COMPLETE_CYCLE, 180], 50);
            expect(h.evaluator.getSummary().repetitionsCompleted).toBe(1);
            expect(h.evaluator.getSummary().lastRepetition.startedAtMs).toBeGreaterThan(onset + elapsed);
        }
    });

    it.each([4500, 6000])('preserves a continuous slow start within the supported budget and abstains beyond it (%i ms)', duration => {
        const { h, sample } = onsetHarness();
        const onset = h.evaluator.getSummary().lastObservationAtMs;
        const steps = duration / 50;
        for (let i = 0; i <= steps; i += 1) sample(175 - 10 * i / steps);
        if (duration < 5000) {
            expect(h.evaluator.getSummary().startRecoveryRequired).toBe(false);
            h.run(DESCENT_AND_RETURN, 50);
            expect(h.evaluator.getSummary()).toMatchObject({ repetitionsCompleted: 1,
                lastRepetition: { startedAtMs: onset } });
        } else {
            expect(h.evaluator.getSummary()).toMatchObject({ repetitionsCompleted: 0,
                activeCycleIncomplete: false, startRecoveryRequired: true });
            h.run(DESCENT_AND_RETURN, 50);
            expect(h.evaluator.getSummary()).toMatchObject({ repetitionsCompleted: 0, startRecoveryRequired: false });
        }
    });

    it('does not invent a new onset during a long shallow hold or its later descent', () => {
        const { h, expired } = expiredStartHarness();
        expect(expired.feedback.message).toContain('Return to standing');
        for (let i = 0; i < 200; i += 1) h.send(170 + (i % 3) * 0.1, {}, 50);
        expect(h.evaluator.getSummary()).toMatchObject({ repetitionsCompleted: 0,
            activeCycleIncomplete: false, startRecoveryRequired: true });
        h.run(DESCENT_AND_RETURN, 50);
        expect(h.evaluator.getSummary()).toMatchObject({ repetitionsCompleted: 0, startRecoveryRequired: false });
        h.run([...COMPLETE_CYCLE, 180], 50);
        expect(h.evaluator.getSummary().repetitionsCompleted).toBe(1);
        expect(h.evaluator.getSummary().lastRepetition.totalSeconds).toBeLessThan(3);
    });

    it('does not re-arm inside the overlapping five-to-seven-degree return band', () => {
        const { h } = expiredStartHarness();
        for (const angle of [175, 174, 173]) h.run(Array(12).fill(angle), 50);
        expect(h.evaluator.getSummary().startRecoveryRequired).toBe(true);
        h.run(Array(3).fill(180), 50);
        expect(h.evaluator.getSummary().startRecoveryRequired).toBe(true);
        expect(h.send(180, {}, 50)).toMatchObject({ state: 'ready', event: 'ready', startRecoveryRequired: false });
    });

    it('requires hip recovery and a continuous standing interval without changing calibration', () => {
        const { h } = expiredStartHarness();
        const loweredHip = makePose(180, { hipOffset: 0.02 });
        for (let i = 0; i < 12; i += 1) h.send(180, { landmarks: loweredHip }, 50);
        expect(h.evaluator.getSummary().startRecoveryRequired).toBe(true);
        h.run(Array(3).fill(180), 50);
        h.send(175, {}, 50); // Leaving recovery resets its source-time evidence.
        h.run(Array(3).fill(180), 50);
        expect(h.evaluator.getSummary().startRecoveryRequired).toBe(true);
        const ready = h.send(180, {}, 50);
        expect(ready).toMatchObject({ state: 'ready', startRecoveryRequired: false,
            measurements: { kneeAngleDegrees: 180 } });
        expect(ready.measurements.hipDescentLegLengths).toBeCloseTo(0, 12);
    });

    it('expires a long candidate before a brief hip-corroborated weak episode can recover it', () => {
        const { h, sample } = onsetHarness();
        const onset = h.evaluator.getSummary().lastObservationAtMs;
        sample(170, 0.025);
        holdPendingUntil(h, onset + 4950, { landmarks: makePose(170, { hipOffset: 0.025 }) });
        const weak = sample(176, 0.04);
        expect(weak.measurements.kneeAngleDegrees).toBeGreaterThan(175);
        expect(h.evaluator.getSummary().activeCycleIncomplete).toBe(true);
        const expired = sample(165, 0.04);
        expect(expired).toMatchObject({ event: 'start_discarded', startRecoveryRequired: true });
        expect(h.evaluator.getSummary()).toMatchObject({ repetitionsCompleted: 0, activeCycleIncomplete: false });
    });

    it('preserves prior completed measurements and subject capture during onset abstention', () => {
        const h = harness(); h.calibrate(); h.run(COMPLETE_CYCLE);
        const before = h.evaluator.getSummary();
        const onset = before.lastObservationAtMs;
        h.send(170, {}, 50); holdPendingUntil(h, onset + 5000);
        const expired = h.send(170, {}, 50);
        expect(expired).toMatchObject({ state: 'awaiting_standing', startRecoveryRequired: true,
            repetitionsCompleted: 1, interruptedCycles: 0, capture: { status: 'tracking', reason: null } });
        expect(h.evaluator.getSummary().lastRepetition).toEqual(before.lastRepetition);
        expect(h.evaluator.getSummary().averages).toEqual(before.averages);
    });

    it('does not let invalid or out-of-order timestamps advance standing recovery', () => {
        const { h } = expiredStartHarness();
        h.send(180, {}, 50);
        const previous = h.evaluator.getSummary().lastObservationAtMs;
        for (const timestampMs of [NaN, Infinity, previous, previous - 1]) {
            const result = h.evaluator.update({ timestampMs, landmarks: makePose(180),
                imageWidth: 1000, imageHeight: 1000, sideViewConfirmed: true });
            expect(result).toMatchObject({ inputAccepted: false, startRecoveryRequired: true });
            expect(h.evaluator.getSummary().lastObservationAtMs).toBe(previous);
        }
    });

    it.each(['reset', 'external interruption', 'observation gap', 'setup withdrawn', 'confidence loss'])('clears the standing-recovery gate on %s', cause => {
        const { h } = expiredStartHarness();
        h.send(180, {}, 50);
        let result;
        if (cause === 'reset') result = h.evaluator.reset();
        else if (cause === 'external interruption') result = h.evaluator.interrupt('subject_tracking_lost');
        else if (cause === 'observation gap') {
            h.jump(351); result = h.send(180, {}, 50);
        } else if (cause === 'setup withdrawn') result = h.send(180, { sideViewConfirmed: false }, 50);
        else {
            const landmarks = makePose(180); landmarks[27].visibility = 0;
            result = h.send(180, { landmarks }, 50);
        }
        expect(result.startRecoveryRequired).toBe(false);
        expect(h.evaluator.getSummary()).toMatchObject({ startRecoveryRequired: false,
            repetitionsCompleted: 0, activeCycleIncomplete: false });
        expect(h.calibrate().state).toBe('ready');
    });

    it('does not finalize a repetition while still descending or before returning to standing', () => {
        const h = harness(); h.calibrate();
        h.run(COMPLETE_CYCLE.slice(0, 18));
        expect(h.evaluator.getSummary()).toMatchObject({ repetitionsCompleted: 0, activeCycleIncomplete: true });
    });

    it('does not let one transient deep-pose estimate qualify a shallow cycle', () => {
        const h = harness(); h.calibrate();
        h.run([180, 175, 170, 165, 155, 145, 90, 145, 155, 165, 175, 180, 180, 180]);
        expect(h.evaluator.getSummary()).toMatchObject({ repetitionsCompleted: 0, incompleteCycles: 1 });
    });

    it('abstains across a timestamp gap and resumes only after a new standing calibration', () => {
        const h = harness(); h.calibrate(); h.run(COMPLETE_CYCLE);
        h.run(COMPLETE_CYCLE.slice(0, 10)); h.jump(1000);
        const interrupted = h.send(95);
        expect(interrupted.capture.reason).toBe('observation_gap');
        expect(interrupted.repetitionsCompleted).toBe(1);
        expect(interrupted.interruptedCycles).toBe(1);
        h.run(COMPLETE_CYCLE.slice(10));
        expect(h.evaluator.getSummary().repetitionsCompleted).toBe(1);
        h.calibrate(); h.run(COMPLETE_CYCLE);
        expect(h.evaluator.getSummary().repetitionsCompleted).toBe(2);
    });

    it('does not switch sides mid-cycle or fabricate a result through confidence loss', () => {
        const h = harness(); h.calibrate(); h.run(COMPLETE_CYCLE.slice(0, 10));
        const landmarks = makePose(95);
        landmarks[23].visibility = 0.1; // The other side remains visible.
        expect(h.send(95, { landmarks }).capture.reason).toBe('required_landmarks_unavailable');
        h.run(COMPLETE_CYCLE.slice(10));
        expect(h.evaluator.getSummary()).toMatchObject({ repetitionsCompleted: 0, interruptedCycles: 1 });
        h.calibrate(); h.run(COMPLETE_CYCLE);
        expect(h.evaluator.getSummary().repetitionsCompleted).toBe(1);
    });

    it('abandons a cycle when the side-view setup confirmation is withdrawn', () => {
        const h = harness(); h.calibrate(); h.run(COMPLETE_CYCLE.slice(0, 10));
        expect(h.send(95, { sideViewConfirmed: false }).state).toBe('setup');
        h.run(COMPLETE_CYCLE.slice(10));
        expect(h.evaluator.getSummary()).toMatchObject({ repetitionsCompleted: 0, interruptedCycles: 1 });
    });

    it('rejects duplicate, reversed, and invalid source timestamps without advancing measurement', () => {
        const h = harness(); h.calibrate();
        for (const timestampMs of [600, 500, -1, NaN, Infinity]) {
            const result = h.evaluator.update({ landmarks: makePose(90), timestampMs,
                imageWidth: 1000, imageHeight: 1000, sideViewConfirmed: true });
            expect(result.inputAccepted).toBe(false);
            expect(result.state).toBe('ready');
            expect(result.repetitionsCompleted).toBe(0);
        }
        h.run(COMPLETE_CYCLE);
        expect(h.evaluator.getSummary().repetitionsCompleted).toBe(1);
        expect(h.evaluator.getSummary().capture.rejectedSamples).toBe(5);
    });

    it.each([{ imageWidth: 0 }, { imageHeight: -1 }, { imageWidth: Infinity }, { imageHeight: NaN }])(
        'rejects invalid image dimensions %j', (invalid) => {
            const h = harness();
            const result = h.send(180, invalid);
            expect(result.capture.reason).toBe('invalid_dimensions');
            expect(result.inputAccepted).toBe(false);
        },
    );

    it.each(['x', 'y', 'z'])('rejects a nonfinite %s coordinate', coordinate => {
        const h = harness(); const landmarks = makePose(180);
        landmarks[23][coordinate] = NaN;
        const result = h.send(180, { landmarks });
        expect(result.capture.reason).toBe('invalid_landmarks');
        expect(result.inputAccepted).toBe(false);
    });

    it('rejects missing landmarks, low presence, and cropped required landmarks', () => {
        const missing = harness();
        expect(missing.send(180, { landmarks: [] }).capture.reason).toBe('invalid_landmarks');
        for (const mutate of [p => { p.presence = 0.1; }, p => { p.x = 1.1; }]) {
            const h = harness(); h.calibrate();
            const landmarks = makePose(180); mutate(landmarks[31]);
            expect(h.send(180, { landmarks }).capture.reason).toBe('required_landmarks_unavailable');
        }
    });

    it.each([[1000, 1000], [1600, 900], [720, 1280]])(
        'uses aspect-correct angles for %i by %i frames', (width, height) => {
            const h = harness({}, { width, height }); h.calibrate();
            h.run(COMPLETE_CYCLE);
            const summary = h.evaluator.getSummary();
            expect(summary.repetitionsCompleted).toBe(1);
            expect(summary.capture.validSampleRatio).toBe(1);
            expect(h.send(110).measurements.kneeAngleDegrees).toBeCloseTo(110, 6);
        },
    );

    it('requires recalibration after an aspect-ratio change but accepts same-ratio resizing', () => {
        const resized = harness(); resized.calibrate();
        for (const angle of COMPLETE_CYCLE) resized.send(angle, { imageWidth: 2000, imageHeight: 2000 });
        expect(resized.evaluator.getSummary().repetitionsCompleted).toBe(1);
        const rotated = harness(); rotated.calibrate(); rotated.run(COMPLETE_CYCLE.slice(0, 10));
        const result = rotated.send(95, { imageWidth: 1600, imageHeight: 900,
            landmarks: makePose(95, { width: 1600, height: 900 }) });
        expect(result.capture.reason).toBe('frame_geometry_changed');
        expect(result.interruptedCycles).toBe(1);
        expect(result.repetitionsCompleted).toBe(0);
    });

    it('produces equivalent measurements for a consistently mirrored side view', () => {
        const h = harness();
        for (const angle of [...Array(7).fill(180), ...COMPLETE_CYCLE]) {
            const landmarks = makePose(angle).map(point => ({ ...point, x: 1 - point.x }));
            h.send(angle, { landmarks });
        }
        expect(h.evaluator.getSummary().repetitionsCompleted).toBe(1);
        expect(h.evaluator.getSummary().averages).toMatchObject({ descentSeconds: 1.1, ascentSeconds: 0.9 });
    });

    it('rejects clearly inconsistent frontal projection without claiming to verify the view', () => {
        const h = harness(); const landmarks = makePose(180);
        landmarks[11].x = 0.1; landmarks[12].x = 0.6;
        const result = h.send(180, { landmarks });
        expect(result.capture.reason).toBe('view_not_supported');
        expect(result.capture.viewAssessment).toBe('user-confirmation-and-plausibility-only');
    });

    it('abstains when the stance or camera position changes during measurement', () => {
        const h = harness(); h.calibrate(); h.run(COMPLETE_CYCLE.slice(0, 6));
        const landmarks = makePose(135);
        for (const point of landmarks) point.x += 0.12;
        expect(h.send(135, { landmarks }).capture.reason).toBe('setup_changed');
        expect(h.evaluator.getSummary().interruptedCycles).toBe(1);
    });

    it('does not classify knees beyond toes as an automatic fault', () => {
        const h = harness({}, { kneeTravel: 0.14 }); h.calibrate();
        const bottom = makePose(90, { kneeTravel: 0.14 });
        expect(bottom[25].x).toBeGreaterThan(bottom[31].x);
        h.run(COMPLETE_CYCLE);
        const summary = h.evaluator.getSummary();
        expect(summary.repetitionsCompleted).toBe(1);
        expect(summary.criteriaUnavailable.map(item => item.id)).toContain('knee_over_toe_correctness');
        expect(summary.criteriaUnavailable.map(item => item.id)).toContain('spinal_curvature');
        expect(summary).not.toHaveProperty('score');
        expect(summary).not.toHaveProperty('techniqueScore');
    });

    it('provides positive feedback only for configured, measured timing criteria', () => {
        const h = harness({ tempoTarget: { descentSeconds: { min: 0.9, max: 1.1 }, ascentSeconds: { min: 0.8, max: 1 } } });
        h.calibrate(); const result = h.run(COMPLETE_CYCLE).at(-1);
        expect(result.feedback.code).toBe('tempo_target_met');
        expect(result.feedback.message).toBe('Your repetition timing matched the selected target.');
        expect(h.evaluator.getSummary().repetitionsWithinTempoTarget).toBe(1);
    });

    it('distinguishes faster and slower phases without inventing an optimal tempo', () => {
        const h = harness({ tempoTarget: { descentSeconds: { min: 1.5, max: 2 }, ascentSeconds: { min: 0.5, max: 0.8 } } });
        h.calibrate(); const result = h.run(COMPLETE_CYCLE).at(-1);
        expect(result.lastRepetition.tempo).toMatchObject({ descentSeconds: 'faster', ascentSeconds: 'slower', status: 'outside_target' });
        expect(result.feedback.message).toContain('selected target');
        expect(result.feedback.message).not.toMatch(/perfect|safe|optimal|incorrect/i);
    });

    it('rejects malformed tempo targets and preserves the configured target during reset', () => {
        expect(() => createSquatEvaluator({ tempoTarget: { descentSeconds: { min: 3, max: 1 } } })).toThrow(RangeError);
        expect(() => createSquatEvaluator({ tempoTarget: { ascentSeconds: { min: 0, max: Infinity } } })).toThrow(RangeError);
        const h = harness({ tempoTarget: { descentSeconds: { min: 0.5, max: 2 } } });
        h.calibrate(); h.run(COMPLETE_CYCLE);
        expect(h.evaluator.reset().repetitionsCompleted).toBe(0);
        expect(h.evaluator.getSummary()).toMatchObject({ sessionId: 'test-session', modelVersion: 'fixture-v1',
            startedAtMs: null, tempoTarget: { descentSeconds: { min: 0.5, max: 2 } } });
        expect(h.evaluator.update({ landmarks: makePose(180), timestampMs: 0,
            imageWidth: 1000, imageHeight: 1000, sideViewConfirmed: true }).inputAccepted).toBe(true);
    });

    it('interrupts an overlong cycle and keeps summaries compact across many repetitions', () => {
        const stalled = harness(); stalled.calibrate(); stalled.run(COMPLETE_CYCLE.slice(0, 12));
        stalled.run(Array(460).fill(90));
        expect(stalled.evaluator.getSummary()).toMatchObject({ repetitionsCompleted: 0, interruptedCycles: 1 });
        const h = harness(); h.calibrate();
        for (let i = 0; i < 100; i += 1) h.run(COMPLETE_CYCLE);
        expect(h.evaluator.getSummary().repetitionsCompleted).toBe(100);
        expect(JSON.stringify(h.evaluator.getSummary()).length).toBeLessThan(4000);
    });

    it('does not expose mutable internal repetition or unavailable-criteria state', () => {
        const h = harness(); h.calibrate(); const result = h.run(COMPLETE_CYCLE).at(-1);
        result.lastRepetition.tempo.status = 'fabricated';
        const summary = h.evaluator.getSummary(); summary.criteriaUnavailable[0].reason = 'fabricated';
        expect(h.evaluator.getSummary().lastRepetition.tempo.status).toBe('not_configured');
        expect(h.evaluator.getSummary().criteriaUnavailable[0].reason).not.toBe('fabricated');
    });
});
