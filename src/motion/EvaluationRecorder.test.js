import { describe, expect, it } from 'vitest';
import { createEvaluationRecorder, isEvaluationClipId } from './EvaluationRecorder.js';
import { compareRecording } from '../../scripts/motion-evaluation/scoring.mjs';

const summary = { completion: 'confirmed', repetitionsCompleted: 1, modelVersion: 'model-test',
    profileId: 'squat-test', profileVersion: '0.1', subjectTracking: { confirmedSegments: 1, restartRequired: false } };
const completed = { inferenceMs: 8, frameLatencyMs: 20, snapshot: { event: 'repetition_completed',
    lastRepetition: { index: 1, startedAtMs: 1000, completedAtMs: 5000, descentSeconds: 2, bottomPauseSeconds: 0.5 } } };

describe('bounded local recording evaluation data', () => {
    it('produces an export accepted by the independent annotation comparator', () => {
        const recorder = createEvaluationRecorder({ clipId: 'contract-fixture', durationMs: 10000 });
        recorder.record(completed);
        const evaluationTrace = recorder.getTrace({ summary: { ...summary, profileId: 'bodyweight-squat-side' }, stopReason: 'video_ended' });
        const report = compareRecording({ schemaVersion: 1, kind: 'squat-video-annotations', clipId: 'contract-fixture',
            durationMs: 10000, view: 'side', dataOrigin: 'synthetic_fixture', independentlyReviewed: true,
            repetitions: [{ id: 'rep-1', startedAtMs: 1000, bottomReachedAtMs: 3000, ascentStartedAtMs: 3500, completedAtMs: 5000 }],
        }, { evaluationTrace });
        expect(report.repetitions).toMatchObject({ truePositives: 1, falsePositives: 0, falseNegatives: 0 });
        expect(report.evidenceScope).toBe('software-regression-only');
        expect(report.subjectIdentity.assessed).toBe(false);
    });
    it('exports source-time boundaries and independently sorted processing percentiles without images', () => {
        const recorder = createEvaluationRecorder({ clipId: 'clip-01', durationMs: 10000 });
        recorder.record(completed);
        recorder.record({ inferenceMs: 4, frameLatencyMs: 30, snapshot: {} });
        recorder.record({ inferenceMs: 12, frameLatencyMs: 10, snapshot: {} });
        const trace = recorder.getTrace({ summary, stopReason: 'video_ended' });
        expect(trace).toMatchObject({ kind: 'squat-video-observations', schemaVersion: 1, sourceKind: 'local_video',
            completed: true, truncated: false, clipId: 'clip-01', durationMs: 10000,
            repetitions: [{ index: 1, startedAtMs: 1000, bottomReachedAtMs: 3000, ascentStartedAtMs: 3500, completedAtMs: 5000 }],
            processing: { samples: 3, inferenceMs: { p50: 8, p95: 12 }, frameLatencyMs: { p50: 20, p95: 30 } },
        });
        expect(JSON.stringify(trace)).not.toMatch(/landmarks|bitmap|filename/);
    });

    it('deduplicates completion events and returns copies so callers cannot alter retained evidence', () => {
        const recorder = createEvaluationRecorder({ clipId: 'clip', durationMs: 10000 });
        recorder.record(completed);
        recorder.record(completed);
        const first = recorder.getTrace({ summary, stopReason: 'video_ended' });
        first.repetitions[0].startedAtMs = 9999;
        const second = recorder.getTrace({ summary, stopReason: 'video_ended' });
        expect(second.repetitions).toHaveLength(1);
        expect(second.repetitions[0].startedAtMs).toBe(1000);
    });

    it('does not label a manually stopped, unconfirmed, or interrupted recording as a complete evaluation', () => {
        const recorder = createEvaluationRecorder({ clipId: 'clip', durationMs: 10000 });
        recorder.record(completed);
        expect(recorder.getTrace({ summary, stopReason: 'user_finished' }).completed).toBe(false);
        expect(recorder.getTrace({ summary: { ...summary, subjectTracking: { confirmedSegments: 0 } }, stopReason: 'video_ended' }).completed).toBe(false);
        expect(recorder.getTrace({ summary: { ...summary, subjectTracking: { confirmedSegments: 1, restartRequired: true } }, stopReason: 'video_ended' }).completed).toBe(false);
    });

    it('marks missing completion evidence and invalid boundaries instead of manufacturing repetitions', () => {
        const recorder = createEvaluationRecorder({ clipId: 'clip', durationMs: 10000 });
        recorder.record({ ...completed, snapshot: { ...completed.snapshot, lastRepetition: { ...completed.snapshot.lastRepetition, descentSeconds: -2 } } });
        const trace = recorder.getTrace({ summary, stopReason: 'video_ended' });
        expect(trace.repetitions).toEqual([]);
        expect(trace.truncated).toBe(true);
    });

    it('caps processing data and discloses truncation rather than reporting an unbounded history', () => {
        const recorder = createEvaluationRecorder({ clipId: 'clip', durationMs: 120000 });
        for (let index = 0; index < 2401; index++) recorder.record({ inferenceMs: index, frameLatencyMs: index });
        const trace = recorder.getTrace({ summary: { ...summary, repetitionsCompleted: 0 }, stopReason: 'video_ended' });
        expect(trace.processing.samples).toBe(2400);
        expect(trace.truncated).toBe(true);
    });

    it('requires a non-identifying recording label and a bounded recording duration', () => {
        for (const clipId of ['', 'a'.repeat(81), 'my video.mp4', '../my video', 'é']) expect(isEvaluationClipId(clipId)).toBe(false);
        expect(isEvaluationClipId('squat-01_side')).toBe(true);
        expect(() => createEvaluationRecorder({ clipId: 'clip', durationMs: Infinity })).toThrow();
        expect(() => createEvaluationRecorder({ clipId: 'clip', durationMs: 120001 })).toThrow();
    });
});
