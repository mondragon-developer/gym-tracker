import { describe, expect, it } from 'vitest';
import { createSubjectTracker, SUBJECT_TRACKER_PROFILE } from './SubjectTracker.js';

const pose = ({ offsetX = 0, hipOffsetY = 0 } = {}) => {
    const points = Array.from({ length: 33 }, () => ({ x: 0.5 + offsetX, y: 0.2, z: 0, visibility: 0.9 }));
    for (const [side, x] of [[0, 0.47], [1, 0.49]]) {
        for (const [index, y, dx] of [[11 + side, 0.2 + hipOffsetY, 0], [23 + side, 0.45 + hipOffsetY, 0],
            [25 + side, 0.66, 0.02], [27 + side, 0.85, 0], [29 + side, 0.86, -0.025], [31 + side, 0.86, 0.06]]) {
            points[index] = { x: x + offsetX + dx, y, z: 0, visibility: 0.9 };
        }
    }
    return points;
};
const frame = (poses = [pose()], timestampMs = 0, overrides = {}) => ({ poses, timestampMs,
    imageWidth: 640, imageHeight: 360, ...overrides });
const offer = (tracker, { start = 0, points = pose() } = {}) => {
    let result;
    for (let step = 0; step < 6; step += 1) result = tracker.update(frame([points], start + step * 60));
    return result;
};
const selected = () => {
    const tracker = createSubjectTracker();
    const { subject } = offer(tracker);
    expect(tracker.confirm(subject.confirmationToken).accepted).toBe(true);
    return tracker;
};

describe('subject confirmation and continuity', () => {
    it('offers one qualified highlighted candidate and preserves its token across continuous frames', () => {
        const tracker = createSubjectTracker();
        const first = offer(tracker);
        const next = tracker.update(frame([pose({ offsetX: 0.001 })], 350));
        expect(first.subject).toEqual(expect.objectContaining({ status: 'awaiting_confirmation', restartRequired: false }));
        expect(first.subject.bounds.width).toBeGreaterThan(0);
        expect(next.subject.confirmationToken).toBe(first.subject.confirmationToken);
        expect(tracker.confirm(first.subject.confirmationToken)).toEqual({ accepted: true,
            subject: expect.objectContaining({ status: 'tracking', confirmationToken: null }) });
        expect(tracker.confirm(first.subject.confirmationToken).accepted).toBe(false);
    });

    it('withholds confirmation until both six observations and 300 source milliseconds are reached', () => {
        const tracker = createSubjectTracker();
        for (const time of [0, 50, 100, 150, 200, 250, 299]) {
            const result = tracker.update(frame([pose()], time));
            expect(result.subject).toEqual(expect.objectContaining({ status: 'unavailable',
                reason: 'subject_stabilizing', confirmationToken: null, restartRequired: false }));
            expect(result.subject.bounds.width).toBeGreaterThan(0);
            expect(result.landmarks).toHaveLength(33);
            expect(tracker.confirm('candidate-1').accepted).toBe(false);
        }
        expect(tracker.update(frame([pose()], 300)).subject.status).toBe('awaiting_confirmation');
        expect(tracker.getSummary().confirmedSegments).toBe(0);
    });

    it('requires six observations even after the minimum source duration has elapsed', () => {
        const tracker = createSubjectTracker();
        for (const time of [0, 100, 200, 300, 400]) {
            expect(tracker.update(frame([pose()], time)).subject.confirmationToken).toBeNull();
        }
        expect(tracker.update(frame([pose()], 450)).subject).toEqual(expect.objectContaining({
            status: 'awaiting_confirmation', confirmationToken: 'candidate-1',
        }));
    });

    it('recovers from a second-frame visibility dropout before offering an explicit confirmation', () => {
        const tracker = createSubjectTracker();
        const obscured = pose();
        obscured[27].visibility = 0.1;
        obscured[28].visibility = 0.1;
        expect(tracker.update(frame()).subject.confirmationToken).toBeNull();
        const dropout = tracker.update(frame([obscured], 200 / 3));
        expect(dropout.subject).toEqual(expect.objectContaining({ reason: 'required_landmarks_unavailable',
            confirmationToken: null, restartRequired: false }));
        for (let index = 2; index <= 6; index += 1) {
            expect(tracker.update(frame([pose()], index * 200 / 3)).subject.confirmationToken).toBeNull();
        }
        const qualified = tracker.update(frame([pose()], 1400 / 3));
        expect(qualified.subject.status).toBe('awaiting_confirmation');
        expect(tracker.getSummary().interruptions).toBe(0);
        expect(tracker.confirm(qualified.subject.confirmationToken).accepted).toBe(true);
        expect(tracker.update(frame([pose()], 1600 / 3)).subject.status).toBe('tracking');
    });

    it.each([
        ['missing', [], 180, {}, 'subject_missing'],
        ['ambiguous', [pose(), pose({ offsetX: 0.2 })], 180, {}, 'multiple_people'],
        ['unusable', [pose().map(point => ({ ...point, visibility: 0.1 }))], 180, {}, 'required_landmarks_unavailable'],
        ['invalid geometry', [pose()], 180, { imageHeight: 0 }, 'invalid_geometry'],
        ['gap', [pose()], 471, {}, 'observation_gap'],
        ['jump', [pose({ offsetX: 0.2 })], 180, {}, 'subject_changed'],
        ['non-increasing time', [pose()], 120, {}, 'invalid_timestamp'],
        ['invalid time', [pose()], NaN, {}, 'invalid_timestamp'],
    ])('restarts the full qualification window after an unconfirmed %s observation', (_name, poses, time, overrides, reason) => {
        const tracker = createSubjectTracker();
        for (const at of [0, 60, 120]) tracker.update(frame([pose()], at));
        const rejected = tracker.update(frame(poses, time, overrides));
        expect(rejected.subject).toEqual(expect.objectContaining({ reason, confirmationToken: null, restartRequired: false }));
        const restart = Number.isFinite(time) ? Math.max(120, time) + 60 : 180;
        for (let step = 0; step < 5; step += 1) {
            expect(tracker.update(frame([pose()], restart + step * 60)).subject.confirmationToken).toBeNull();
        }
        const qualified = tracker.update(frame([pose()], restart + 300));
        expect(qualified.subject.status).toBe('awaiting_confirmation');
        expect(tracker.getSummary().interruptions).toBe(0);
    });

    it('requires a valid explicit token and never starts tracking from detections alone', () => {
        const tracker = createSubjectTracker();
        for (let time = 0; time <= 1500; time += 50) tracker.update(frame([pose()], time));
        expect(tracker.getSnapshot().status).toBe('awaiting_confirmation');
        for (const token of [null, undefined, '', 'candidate-999']) expect(tracker.confirm(token).accepted).toBe(false);
        expect(tracker.getSummary().confirmedSegments).toBe(0);
    });

    it('rejects multiple poses regardless of ordering and never selects the first by default', () => {
        const tracker = createSubjectTracker();
        const first = pose(), second = pose({ offsetX: 0.2 });
        for (const [time, poses] of [[0, [first, second]], [50, [second, first]]]) {
            const result = tracker.update(frame(poses, time));
            expect(result.subject).toEqual(expect.objectContaining({ status: 'unavailable', reason: 'multiple_people',
                confirmationToken: null, observedPoses: 2 }));
            expect(result.landmarks).toEqual([]);
        }
        expect(tracker.getSummary().ambiguousFrames).toBe(2);
    });

    it('ends a confirmed segment when another returned body appears, including a low-visibility second pose', () => {
        const tracker = selected();
        const second = pose({ offsetX: 0.2 }).map(point => ({ ...point, visibility: 0.1 }));
        const lost = tracker.update(frame([pose(), second], 350));
        expect(lost.trackingLost).toBe(true);
        expect(lost.subject).toEqual(expect.objectContaining({ status: 'confirmation_required',
            reason: 'multiple_people', restartRequired: true, confirmationToken: null }));
        expect(tracker.update(frame([pose()], 400)).subject.restartRequired).toBe(true);
        expect(tracker.getSummary()).toEqual(expect.objectContaining({ interruptions: 1, confirmedSegments: 1 }));
    });

    it('does not resume after target disappearance or accept a replacement at the same position', () => {
        const tracker = createSubjectTracker();
        const token = offer(tracker).subject.confirmationToken;
        tracker.confirm(token);
        expect(tracker.update(frame([], 350)).trackingLost).toBe(true);
        const replacement = tracker.update(frame([pose()], 400));
        expect(replacement.trackingLost).toBe(false);
        expect(replacement.subject.status).toBe('confirmation_required');
        expect(replacement.landmarks).toEqual([]);
        expect(tracker.confirm(token).accepted).toBe(false);
        expect(tracker.getSummary().interruptions).toBe(1);
    });

    it('invalidates a stale preview token when the unconfirmed candidate changes', () => {
        const tracker = createSubjectTracker();
        const oldToken = offer(tracker).subject.confirmationToken;
        const changed = tracker.update(frame([pose({ offsetX: 0.2 })], 350));
        expect(changed.subject.reason).toBe('subject_changed');
        expect(tracker.confirm(oldToken).accepted).toBe(false);
        const offered = offer(tracker, { start: 400, points: pose({ offsetX: 0.2 }) });
        expect(offered.subject.confirmationToken).not.toBe(oldToken);
        expect(tracker.confirm(oldToken).accepted).toBe(false);
        expect(tracker.confirm(offered.subject.confirmationToken).accepted).toBe(true);
    });

    it.each([
        ['missing', []],
        ['ambiguous', [pose(), pose({ offsetX: 0.2 })]],
        ['unusable', [pose().map(point => ({ ...point, visibility: 0.1 }))]],
    ])('invalidates an offered token after an unconfirmed %s frame and requires requalification', (_name, poses) => {
        const tracker = createSubjectTracker();
        const token = offer(tracker).subject.confirmationToken;
        expect(tracker.update(frame(poses, 350)).subject.confirmationToken).toBeNull();
        expect(tracker.confirm(token).accepted).toBe(false);
        for (let step = 0; step < 5; step += 1) {
            expect(tracker.update(frame([pose()], 400 + step * 60)).subject.confirmationToken).toBeNull();
        }
        const next = tracker.update(frame([pose()], 700));
        expect(next.subject.status).toBe('awaiting_confirmation');
        expect(next.subject.confirmationToken).not.toBe(token);
        expect(tracker.confirm(token).accepted).toBe(false);
        expect(tracker.confirm(next.subject.confirmationToken).accepted).toBe(true);
    });

    it('ends tracking on an implausible positional jump', () => {
        const tracker = selected();
        expect(tracker.update(frame([pose({ offsetX: 0.2 })], 350))).toEqual(expect.objectContaining({
            trackingLost: true, subject: expect.objectContaining({ reason: 'subject_changed', restartRequired: true }),
        }));
    });

    it('permits gradual squat-like hip movement while the foot and torso remain continuous', () => {
        const tracker = selected();
        for (let step = 1; step <= 10; step += 1) {
            const result = tracker.update(frame([pose({ hipOffsetY: step * 0.01 })], 300 + step * 50));
            expect(result.subject.status).toBe('tracking');
            expect(result.trackingLost).toBe(false);
        }
    });

    it('does not bridge an observation gap after confirmation', () => {
        const tracker = selected();
        const result = tracker.update(frame([pose()], 300 + SUBJECT_TRACKER_PROFILE.maximumObservationGapMs + 1));
        expect(result.subject.reason).toBe('observation_gap');
        expect(result.subject.restartRequired).toBe(true);
    });

    it('requires a new preview after an unconfirmed observation gap', () => {
        const tracker = createSubjectTracker();
        const token = offer(tracker).subject.confirmationToken;
        const result = tracker.update(frame([pose()], 1000));
        expect(result.subject.restartRequired).toBe(false);
        expect(tracker.confirm(token).accepted).toBe(false);
        expect(tracker.update(frame([pose()], 1050)).subject).toEqual(expect.objectContaining({
            status: 'unavailable', reason: 'subject_stabilizing', confirmationToken: null,
        }));
        const qualified = offer(tracker, { start: 1110 });
        expect(qualified.subject.status).toBe('awaiting_confirmation');
        expect(qualified.subject.confirmationToken).not.toBe(token);
    });

    it.each([[-1], [0], [NaN]])('rejects an invalid or non-increasing source timestamp (%s)', timestampMs => {
        const tracker = selected();
        const result = tracker.update(frame([pose()], timestampMs));
        expect(result.subject.reason).toBe('invalid_timestamp');
        expect(result.subject.restartRequired).toBe(true);
    });

    it('ends tracking after frame geometry changes', () => {
        const tracker = selected();
        const result = tracker.update(frame([pose()], 350, { imageWidth: 360, imageHeight: 640 }));
        expect(result.subject.reason).toBe('subject_changed');
        expect(result.subject.restartRequired).toBe(true);
    });

    it.each([
        [[], 'subject_missing'],
        [[[]], 'required_landmarks_unavailable'],
        [[pose().map(point => ({ ...point, visibility: 0.1 }))], 'required_landmarks_unavailable'],
        [[pose().map(point => ({ ...point, x: NaN }))], 'required_landmarks_unavailable'],
    ])('offers no token for missing or unusable landmarks', (poses, reason) => {
        const tracker = createSubjectTracker();
        expect(tracker.update(frame(poses)).subject).toEqual(expect.objectContaining({ status: 'unavailable',
            reason, confirmationToken: null }));
    });

    it('ends confirmed tracking when the required body landmarks become obscured', () => {
        const tracker = selected();
        const obscured = pose();
        obscured[27].visibility = 0.1;
        obscured[28].visibility = 0.1;
        for (let time = 350; time <= 1000; time += 50) tracker.update(frame([pose()], time));
        expect(tracker.update(frame([obscured], 1050)).subject.restartRequired).toBe(true);
        expect(tracker.update(frame([pose()], 1100)).subject).toEqual(expect.objectContaining({
            status: 'confirmation_required', restartRequired: true, confirmationToken: null,
        }));
    });

    it('supports an explicit exercise-specific interruption while preserving tracking metadata', () => {
        const tracker = selected();
        const subject = tracker.interrupt('setup_changed');
        expect(subject.restartRequired).toBe(true);
        expect(subject.reason).toBe('setup_changed');
        expect(tracker.getSummary()).toEqual(expect.objectContaining({ version: SUBJECT_TRACKER_PROFILE.version,
            validationStatus: 'not-validated', lossPolicy: 'finish-segment-and-restart', interruptions: 1,
            confirmationQualification: { minimumDurationMs: 300, minimumObservations: 6, validationStatus: 'not-validated' } }));
    });

    it('returns copies of the candidate bounds', () => {
        const tracker = createSubjectTracker();
        const { subject } = tracker.update(frame());
        const x = subject.bounds.x;
        subject.bounds.x = 999;
        expect(tracker.getSnapshot().bounds.x).toBe(x);
    });
});
