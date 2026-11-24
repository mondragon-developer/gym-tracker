import { processingPercentiles } from './processingPercentiles.js';

const MAXIMUM_SAMPLES = 2400;
const copySummary = summary => ({ ...summary, inferenceMs: { ...summary.inferenceMs },
    frameLatencyMs: { ...summary.frameLatencyMs } });

/**
 * Camera processing diagnostics for received worker responses, including setup.
 * A fixed recent window retains timing pairs only. Skipped or failed frames do
 * not become zero-latency samples. Sorting happens once after the client drains.
 */
export function createProcessingRecorder() {
    const inference = new Float64Array(MAXIMUM_SAMPLES);
    const latency = new Float64Array(MAXIMUM_SAMPLES);
    let next = 0, observedResults = 0, validSamples = 0, invalidSamples = 0, finalSummary = null;
    return {
        record(result) {
            if (finalSummary) return;
            observedResults += 1;
            if (!Number.isFinite(result?.inferenceMs) || result.inferenceMs < 0
                || !Number.isFinite(result?.frameLatencyMs) || result.frameLatencyMs < 0) {
                invalidSamples += 1;
                return;
            }
            inference[next] = result.inferenceMs;
            latency[next] = result.frameLatencyMs;
            next = (next + 1) % MAXIMUM_SAMPLES;
            validSamples += 1;
        },
        finalize() {
            if (!finalSummary) {
                const retainedSamples = Math.min(validSamples, MAXIMUM_SAMPLES);
                finalSummary = {
                    sampleScope: 'received_worker_results_including_subject_setup',
                    sampling: 'most_recent_valid_results', percentileMethod: 'nearest_rank',
                    observedResults, validSamples, invalidSamples, retainedSamples,
                    maximumRetainedSamples: MAXIMUM_SAMPLES,
                    overwrittenSamples: Math.max(0, validSamples - MAXIMUM_SAMPLES),
                    inferenceMs: processingPercentiles(inference.subarray(0, retainedSamples)),
                    frameLatencyMs: processingPercentiles(latency.subarray(0, retainedSamples)),
                };
            }
            return copySummary(finalSummary);
        },
    };
}
