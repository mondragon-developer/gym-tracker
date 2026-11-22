const MAXIMUM_REPETITIONS = 200;
const MAXIMUM_SAMPLES = 2400;
export const isEvaluationClipId = value => typeof value === 'string' && /^[A-Za-z0-9._-]{1,80}$/.test(value);

const percentiles = values => {
    if (!values.length) return { p50: null, p95: null };
    const sorted = [...values].sort((a, b) => a - b);
    // Nearest-rank percentiles, calculated once at the end of the recording.
    return { p50: sorted[Math.ceil(sorted.length * 0.5) - 1], p95: sorted[Math.ceil(sorted.length * 0.95) - 1] };
};

/** Optional local-file diagnostics. No pixels, landmarks, or filenames are retained. */
export function createEvaluationRecorder({ clipId, durationMs }) {
    if (!isEvaluationClipId(clipId) || !Number.isFinite(durationMs) || durationMs <= 0 || durationMs > 120000) {
        throw new Error('Evaluation requires a valid recording identifier and a recording up to two minutes long.');
    }
    const repetitions = [], inference = [], latency = [];
    let lastIndex = 0, truncated = false;
    return {
        record(result) {
            if (Number.isFinite(result.inferenceMs) && result.inferenceMs >= 0
                && Number.isFinite(result.frameLatencyMs) && result.frameLatencyMs >= 0) {
                if (inference.length < MAXIMUM_SAMPLES) {
                    inference.push(result.inferenceMs);
                    latency.push(result.frameLatencyMs);
                } else truncated = true;
            }
            const repetition = result.snapshot?.lastRepetition;
            if (result.snapshot?.event !== 'repetition_completed' || !repetition || repetition.index <= lastIndex) return;
            const { index, startedAtMs, completedAtMs, descentSeconds, bottomPauseSeconds } = repetition;
            const bottomReachedAtMs = startedAtMs + descentSeconds * 1000;
            const ascentStartedAtMs = bottomReachedAtMs + bottomPauseSeconds * 1000;
            if (!Number.isInteger(index) || index !== lastIndex + 1
                || ![startedAtMs, bottomReachedAtMs, ascentStartedAtMs, completedAtMs].every(Number.isFinite)
                || startedAtMs < 0 || bottomReachedAtMs <= startedAtMs || ascentStartedAtMs < bottomReachedAtMs
                || completedAtMs <= ascentStartedAtMs || completedAtMs > durationMs) {
                truncated = true;
                return;
            }
            lastIndex = index;
            if (repetitions.length >= MAXIMUM_REPETITIONS) { truncated = true; return; }
            repetitions.push({ index, startedAtMs, bottomReachedAtMs, ascentStartedAtMs, completedAtMs });
        },
        getTrace({ summary, stopReason }) {
            return {
                schemaVersion: 1, kind: 'squat-video-observations', clipId, durationMs, sourceKind: 'local_video',
                completed: stopReason === 'video_ended' && summary?.completion === 'confirmed'
                    && summary.subjectTracking?.confirmedSegments === 1 && !summary.subjectTracking?.restartRequired,
                truncated: truncated || summary?.repetitionsCompleted !== repetitions.length,
                modelVersion: summary?.modelVersion, profileId: summary?.profileId, profileVersion: summary?.profileVersion,
                trackingVersion: summary?.subjectTracking?.version ?? 'not-recorded',
                repetitions: repetitions.map(repetition => ({ ...repetition })),
                processing: { samples: inference.length, inferenceMs: percentiles(inference), frameLatencyMs: percentiles(latency) },
            };
        },
    };
}
