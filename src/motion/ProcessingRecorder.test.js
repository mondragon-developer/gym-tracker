import { describe, expect, it, vi } from 'vitest';
import { createProcessingRecorder } from './ProcessingRecorder.js';

describe('bounded camera processing diagnostics', () => {
    it('reports an empty window without inventing successful frame measurements', () => {
        const recorder = createProcessingRecorder();
        expect(recorder.finalize()).toMatchObject({
            observedResults: 0, validSamples: 0, invalidSamples: 0, retainedSamples: 0, overwrittenSamples: 0,
            maximumRetainedSamples: 2400, sampling: 'most_recent_valid_results',
            inferenceMs: { p50: null, p95: null }, frameLatencyMs: { p50: null, p95: null },
        });
    });

    it('computes independent nearest-rank percentiles from valid response timing pairs', () => {
        const recorder = createProcessingRecorder();
        recorder.record({ inferenceMs: 8, frameLatencyMs: 20, landmarks: [{ x: 0.5 }], filename: 'private.mp4' });
        recorder.record({ inferenceMs: 4, frameLatencyMs: 30 });
        recorder.record({ inferenceMs: 12, frameLatencyMs: 10 });
        const result = recorder.finalize();
        expect(result).toMatchObject({ observedResults: 3, validSamples: 3, retainedSamples: 3, invalidSamples: 0,
            percentileMethod: 'nearest_rank', sampleScope: 'received_worker_results_including_subject_setup',
            inferenceMs: { p50: 8, p95: 12 }, frameLatencyMs: { p50: 20, p95: 30 } });
        expect(JSON.stringify(result)).not.toMatch(/landmarks|filename|private\.mp4/);
    });

    it('rejects invalid pairs atomically while preserving zero-valued finite timings', () => {
        const recorder = createProcessingRecorder();
        const invalid = [undefined, {}, { inferenceMs: 2 }, { inferenceMs: -1, frameLatencyMs: 4 },
            { inferenceMs: 4, frameLatencyMs: NaN }, { inferenceMs: Infinity, frameLatencyMs: 4 },
            { inferenceMs: '2', frameLatencyMs: 4 }, { inferenceMs: 2, frameLatencyMs: -4 }];
        invalid.forEach(result => recorder.record(result));
        recorder.record({ inferenceMs: 0, frameLatencyMs: 0 });
        expect(recorder.finalize()).toMatchObject({ observedResults: 9, validSamples: 1, invalidSamples: 8,
            retainedSamples: 1, overwrittenSamples: 0, inferenceMs: { p50: 0, p95: 0 }, frameLatencyMs: { p50: 0, p95: 0 } });
    });

    it('keeps the most recent valid pairs across repeated wraparound and discloses overwritten coverage', () => {
        const recorder = createProcessingRecorder();
        for (let sample = 1; sample <= 5000; sample += 1) {
            recorder.record({ inferenceMs: sample, frameLatencyMs: sample * 2 + 1 });
            if (sample % 1000 === 0) recorder.record({ inferenceMs: sample, frameLatencyMs: Infinity });
        }
        expect(recorder.finalize()).toMatchObject({ observedResults: 5005, validSamples: 5000, invalidSamples: 5,
            retainedSamples: 2400, overwrittenSamples: 2600,
            inferenceMs: { p50: 3800, p95: 4880 }, frameLatencyMs: { p50: 7601, p95: 9761 } });
    });

    it('does no per-response sorting, finalizes once, and protects the retained result from callers and late samples', () => {
        const recorder = createProcessingRecorder();
        const sort = vi.spyOn(Array.prototype, 'sort');
        recorder.record({ inferenceMs: 10, frameLatencyMs: 20 });
        recorder.record({ inferenceMs: 20, frameLatencyMs: 30 });
        const sortsDuringRecording = sort.mock.calls.length;
        const first = recorder.finalize();
        const sortsAfterFinalization = sort.mock.calls.length;
        first.inferenceMs.p95 = 999;
        first.validSamples = 999;
        recorder.record({ inferenceMs: 999, frameLatencyMs: 999 });
        const second = recorder.finalize();
        const sortsAfterRepeat = sort.mock.calls.length;
        sort.mockRestore();
        expect(sortsDuringRecording).toBe(0);
        expect(sortsAfterFinalization).toBeGreaterThan(0);
        expect(sortsAfterRepeat).toBe(sortsAfterFinalization);
        expect(second).toMatchObject({ observedResults: 2, validSamples: 2, inferenceMs: { p50: 10, p95: 20 } });
    });
});
