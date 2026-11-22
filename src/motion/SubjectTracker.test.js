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
const selected = () => {
    const tracker = createSubjectTracker();
    const { subject } = tracker.update(frame());
    expect(tracker.confirm(subject.confirmationToken).accepted).toBe(true);
    return tracker;
};

describe('subject confirmation and continuity', () => {
    it('offers one eligible highlighted candidate and preserves its token across continuous frames', () => {
        const tracker = createSubjectTracker();
        const first = tracker.update(frame());
        const next = tracker.update(frame([pose({ offsetX: 0.001 })], 50));
        expect(first.subject).toEqual(expect.objectContaining({ status: 'awaiting_confirmation', restartRequired: false }));
        expect(first.subject.bounds.width).toBeGreaterThan(0);
        expect(next.subject.confirmationToken).toBe(first.subject.confirmationToken);
        expect(tracker.confirm(first.subject.confirmationToken)).toEqual({ accepted: true,
            subject: expect.objectContaining({ status: 'tracking', confirmationToken: null }) });
        expect(tracker.confirm(first.subject.confirmationToken).accepted).toBe(false);
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
        const lost = tracker.update(frame([pose(), second], 50));
        expect(lost.trackingLost).toBe(true);
        expect(lost.subject).toEqual(expect.objectContaining({ status: 'confirmation_required',
            reason: 'multiple_people', restartRequired: true, confirmationToken: null }));
        expect(tracker.update(frame([pose()], 100)).subject.restartRequired).toBe(true);
        expect(tracker.getSummary()).toEqual(expect.objectContaining({ interruptions: 1, confirmedSegments: 1 }));
    });

    it('does not resume after target disappearance or accept a replacement at the same position', () => {
        const tracker = createSubjectTracker();
        const token = tracker.update(frame()).subject.confirmationToken;
        tracker.confirm(token);
        expect(tracker.update(frame([], 50)).trackingLost).toBe(true);
        const replacement = tracker.update(frame([pose()], 100));
        expect(replacement.trackingLost).toBe(false);
        expect(replacement.subject.status).toBe('confirmation_required');
        expect(replacement.landmarks).toEqual([]);
        expect(tracker.confirm(token).accepted).toBe(false);
        expect(tracker.getSummary().interruptions).toBe(1);
    });

    it('invalidates a stale preview token when the unconfirmed candidate changes', () => {
        const tracker = createSubjectTracker();
        const oldToken = tracker.update(frame()).subject.confirmationToken;
        const changed = tracker.update(frame([pose({ offsetX: 0.2 })], 50));
        expect(changed.subject.reason).toBe('subject_changed');
        expect(tracker.confirm(oldToken).accepted).toBe(false);
        const offered = tracker.update(frame([pose({ offsetX: 0.2 })], 100));
        expect(offered.subject.confirmationToken).not.toBe(oldToken);
        expect(tracker.confirm(offered.subject.confirmationToken).accepted).toBe(true);
    });

    it('ends tracking on an implausible positional jump', () => {
        const tracker = selected();
        expect(tracker.update(frame([pose({ offsetX: 0.2 })], 50))).toEqual(expect.objectContaining({
            trackingLost: true, subject: expect.objectContaining({ reason: 'subject_changed', restartRequired: true }),
        }));
    });

    it('permits gradual squat-like hip movement while the foot and torso remain continuous', () => {
        const tracker = selected();
        for (let step = 1; step <= 10; step += 1) {
            const result = tracker.update(frame([pose({ hipOffsetY: step * 0.01 })], step * 50));
            expect(result.subject.status).toBe('tracking');
            expect(result.trackingLost).toBe(false);
        }
    });

    it('does not bridge an observation gap after confirmation', () => {
        const tracker = selected();
        const result = tracker.update(frame([pose()], SUBJECT_TRACKER_PROFILE.maximumObservationGapMs + 1));
        expect(result.subject.reason).toBe('observation_gap');
        expect(result.subject.restartRequired).toBe(true);
    });

    it('requires a new preview after an unconfirmed observation gap', () => {
        const tracker = createSubjectTracker();
        const token = tracker.update(frame()).subject.confirmationToken;
        const result = tracker.update(frame([pose()], 1000));
        expect(result.subject.restartRequired).toBe(false);
        expect(tracker.confirm(token).accepted).toBe(false);
        expect(tracker.update(frame([pose()], 1050)).subject.status).toBe('awaiting_confirmation');
    });

    it.each([[-1], [0], [NaN]])('rejects an invalid or non-increasing source timestamp (%s)', timestampMs => {
        const tracker = selected();
        const result = tracker.update(frame([pose()], timestampMs));
        expect(result.subject.reason).toBe('invalid_timestamp');
        expect(result.subject.restartRequired).toBe(true);
    });

    it('ends tracking after frame geometry changes', () => {
        const tracker = selected();
        const result = tracker.update(frame([pose()], 50, { imageWidth: 360, imageHeight: 640 }));
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
        expect(tracker.update(frame([obscured], 50)).subject.restartRequired).toBe(true);
    });

    it('supports an explicit exercise-specific interruption while preserving tracking metadata', () => {
        const tracker = selected();
        const subject = tracker.interrupt('setup_changed');
        expect(subject.restartRequired).toBe(true);
        expect(subject.reason).toBe('setup_changed');
        expect(tracker.getSummary()).toEqual(expect.objectContaining({ version: SUBJECT_TRACKER_PROFILE.version,
            validationStatus: 'not-validated', lossPolicy: 'finish-segment-and-restart', interruptions: 1 }));
    });

    it('returns copies of the candidate bounds', () => {
        const tracker = createSubjectTracker();
        const { subject } = tracker.update(frame());
        const x = subject.bounds.x;
        subject.bounds.x = 999;
        expect(tracker.getSnapshot().bounds.x).toBe(x);
    });
});
