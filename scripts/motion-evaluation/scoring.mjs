/** Local comparison of independently reviewed video labels and bounded app exports. */
export const BOUNDARIES = Object.freeze([
    'startedAtMs', 'bottomReachedAtMs', 'ascentStartedAtMs', 'completedAtMs',
]);
const MAXIMUM_DURATION_MS = 120000;
const MAXIMUM_REPETITIONS = 200;
const MAXIMUM_PROCESSING_SAMPLES = 2400;
const DEFAULT_BOUNDARY_TOLERANCE_MS = 1000;

const invalid = (path, message) => { throw new TypeError(`${path}: ${message}`); };
const object = (value, path, required, optional = []) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) invalid(path, 'must be an object');
    const allowed = new Set([...required, ...optional]);
    for (const key of required) if (!Object.hasOwn(value, key)) invalid(`${path}.${key}`, 'is required');
    for (const key of Object.keys(value)) if (!allowed.has(key)) invalid(`${path}.${key}`, 'is not supported by schema version 1');
};
const text = (value, path, maximum = 160) => {
    if (typeof value !== 'string' || !value.trim() || value.length > maximum) {
        invalid(path, `must be a non-empty string of at most ${maximum} characters`);
    }
};
const number = (value, path, minimum, maximum) => {
    if (!Number.isFinite(value) || value < minimum || value > maximum) {
        invalid(path, `must be a finite number from ${minimum} to ${maximum}`);
    }
};
const constant = (value, expected, path) => {
    if (value !== expected) invalid(path, `must equal ${JSON.stringify(expected)}`);
};
const clipIdentifier = (value, path) => {
    if (typeof value !== 'string' || !/^[A-Za-z0-9._-]{1,80}$/.test(value)) {
        invalid(path, 'must contain 1–80 ASCII letters, digits, periods, underscores, or hyphens');
    }
};
const array = (value, path, maximum) => {
    if (!Array.isArray(value) || value.length > maximum) invalid(path, `must be an array with at most ${maximum} entries`);
};

function validateRepetitions(repetitions, durationMs, annotated) {
    const path = annotated ? 'annotations.repetitions' : 'observations.repetitions';
    array(repetitions, path, MAXIMUM_REPETITIONS);
    const identifiers = new Set();
    let previousEnd = -Infinity;
    repetitions.forEach((repetition, index) => {
        const itemPath = `${path}[${index}]`;
        object(repetition, itemPath, annotated ? ['id', ...BOUNDARIES] : [...BOUNDARIES], annotated ? [] : ['index']);
        if (annotated) {
            text(repetition.id, `${itemPath}.id`);
            if (identifiers.has(repetition.id)) invalid(`${itemPath}.id`, 'must be unique');
            identifiers.add(repetition.id);
        } else if (Object.hasOwn(repetition, 'index')) {
            if (!Number.isInteger(repetition.index) || repetition.index < 1 || identifiers.has(repetition.index)) {
                invalid(`${itemPath}.index`, 'must be a unique positive integer');
            }
            identifiers.add(repetition.index);
        }
        BOUNDARIES.forEach(key => number(repetition[key], `${itemPath}.${key}`, 0, durationMs));
        if (!(repetition.startedAtMs < repetition.bottomReachedAtMs
            && repetition.bottomReachedAtMs <= repetition.ascentStartedAtMs
            && repetition.ascentStartedAtMs < repetition.completedAtMs)) {
            invalid(itemPath, 'boundaries must describe descent, an optional bottom pause, and ascent in order');
        }
        if (repetition.startedAtMs < previousEnd) invalid(itemPath, 'repetitions must be sorted and may not overlap');
        previousEnd = repetition.completedAtMs;
    });
}

export function validateAnnotations(value) {
    const path = 'annotations';
    object(value, path, ['schemaVersion', 'kind', 'clipId', 'durationMs', 'view', 'dataOrigin',
        'independentlyReviewed', 'repetitions'], ['exclusions']);
    constant(value.schemaVersion, 1, `${path}.schemaVersion`);
    constant(value.kind, 'squat-video-annotations', `${path}.kind`);
    clipIdentifier(value.clipId, `${path}.clipId`);
    number(value.durationMs, `${path}.durationMs`, 1, MAXIMUM_DURATION_MS);
    constant(value.view, 'side', `${path}.view`);
    if (!['real_recording', 'synthetic_fixture'].includes(value.dataOrigin)) {
        invalid(`${path}.dataOrigin`, 'must be real_recording or synthetic_fixture');
    }
    constant(value.independentlyReviewed, true, `${path}.independentlyReviewed`);
    validateRepetitions(value.repetitions, value.durationMs, true);
    if (Object.hasOwn(value, 'exclusions')) {
        array(value.exclusions, `${path}.exclusions`, MAXIMUM_REPETITIONS);
        let previousEnd = -Infinity;
        value.exclusions.forEach((interval, index) => {
            const itemPath = `${path}.exclusions[${index}]`;
            object(interval, itemPath, ['startedAtMs', 'endedAtMs', 'reason']);
            number(interval.startedAtMs, `${itemPath}.startedAtMs`, 0, value.durationMs);
            number(interval.endedAtMs, `${itemPath}.endedAtMs`, 0, value.durationMs);
            if (interval.startedAtMs >= interval.endedAtMs || interval.startedAtMs < previousEnd) {
                invalid(itemPath, 'intervals must have positive length, be sorted, and not overlap');
            }
            text(interval.reason, `${itemPath}.reason`, 500);
            if (value.repetitions.some(rep => rep.startedAtMs < interval.endedAtMs
                && rep.completedAtMs > interval.startedAtMs)) {
                invalid(itemPath, 'a descriptive exclusion may not hide an annotated repetition');
            }
            previousEnd = interval.endedAtMs;
        });
    }
    return value;
}

function validateProcessing(processing) {
    const path = 'observations.processing';
    object(processing, path, ['samples', 'inferenceMs', 'frameLatencyMs']);
    if (!Number.isInteger(processing.samples) || processing.samples < 0
        || processing.samples > MAXIMUM_PROCESSING_SAMPLES) {
        invalid(`${path}.samples`, `must be an integer from 0 to ${MAXIMUM_PROCESSING_SAMPLES}`);
    }
    for (const key of ['inferenceMs', 'frameLatencyMs']) {
        object(processing[key], `${path}.${key}`, ['p50', 'p95']);
        if (processing.samples === 0) {
            constant(processing[key].p50, null, `${path}.${key}.p50`);
            constant(processing[key].p95, null, `${path}.${key}.p95`);
        } else {
            number(processing[key].p50, `${path}.${key}.p50`, 0, MAXIMUM_DURATION_MS);
            number(processing[key].p95, `${path}.${key}.p95`, processing[key].p50, MAXIMUM_DURATION_MS);
        }
    }
}

export function validateObservations(input) {
    // A normal pilot summary may contain the explicitly enabled local evaluation trace.
    const value = input && Object.hasOwn(input, 'evaluationTrace') ? input.evaluationTrace : input;
    const path = 'observations';
    object(value, path, ['schemaVersion', 'kind', 'clipId', 'durationMs', 'sourceKind', 'completed',
        'truncated', 'modelVersion', 'profileId', 'profileVersion', 'repetitions'], ['processing', 'trackingVersion']);
    constant(value.schemaVersion, 1, `${path}.schemaVersion`);
    constant(value.kind, 'squat-video-observations', `${path}.kind`);
    constant(value.sourceKind, 'local_video', `${path}.sourceKind`);
    constant(value.completed, true, `${path}.completed (full recording required)`);
    constant(value.truncated, false, `${path}.truncated`);
    clipIdentifier(value.clipId, `${path}.clipId`);
    number(value.durationMs, `${path}.durationMs`, 1, MAXIMUM_DURATION_MS);
    for (const key of ['modelVersion', 'profileId', 'profileVersion']) text(value[key], `${path}.${key}`);
    constant(value.profileId, 'bodyweight-squat-side', `${path}.profileId`);
    if (Object.hasOwn(value, 'trackingVersion')) text(value.trackingVersion, `${path}.trackingVersion`);
    validateRepetitions(value.repetitions, value.durationMs, false);
    if (Object.hasOwn(value, 'processing')) validateProcessing(value.processing);
    return value;
}

const overlap = (a, b) => Math.min(a.completedAtMs, b.completedAtMs) > Math.max(a.startedAtMs, b.startedAtMs);
const boundaryCost = (a, b) => Math.abs(a.startedAtMs - b.startedAtMs) + Math.abs(a.completedAtMs - b.completedAtMs);
const better = (candidate, current) => candidate.matches > current.matches
    || (candidate.matches === current.matches && candidate.cost < current.cost);

/** Bounded dynamic programming: maximize monotone one-to-one matches, then minimize boundary error. */
function matchRepetitions(expected, observed, toleranceMs) {
    const columns = observed.length + 1;
    const table = Array.from({ length: (expected.length + 1) * columns }, () => ({ matches: 0, cost: 0, action: null }));
    const at = (i, j) => table[i * columns + j];
    for (let i = 1; i <= expected.length; i += 1) {
        for (let j = 1; j <= observed.length; j += 1) {
            let best = { ...at(i - 1, j), action: 'skip_expected' };
            const skipObserved = { ...at(i, j - 1), action: 'skip_observed' };
            if (better(skipObserved, best)) best = skipObserved;
            const a = expected[i - 1], b = observed[j - 1];
            if (overlap(a, b) && Math.abs(a.startedAtMs - b.startedAtMs) <= toleranceMs
                && Math.abs(a.completedAtMs - b.completedAtMs) <= toleranceMs) {
                const previous = at(i - 1, j - 1);
                const match = { matches: previous.matches + 1, cost: previous.cost + boundaryCost(a, b), action: 'match' };
                if (better(match, best)) best = match;
            }
            table[i * columns + j] = best;
        }
    }
    let i = expected.length, j = observed.length;
    const pairs = [];
    while (i && j) {
        const action = at(i, j).action;
        if (action === 'match') { pairs.push({ expected: --i, observed: --j }); }
        else if (action === 'skip_expected') i -= 1;
        else j -= 1;
    }
    return pairs.reverse();
}

const mean = values => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
const errorStats = values => ({
    samples: values.length,
    meanSignedErrorMs: mean(values),
    meanAbsoluteErrorMs: mean(values.map(Math.abs)),
    maximumAbsoluteErrorMs: values.length ? Math.max(...values.map(Math.abs)) : null,
});
const phases = repetition => ({
    descent: repetition.bottomReachedAtMs - repetition.startedAtMs,
    bottomPause: repetition.ascentStartedAtMs - repetition.bottomReachedAtMs,
    ascent: repetition.completedAtMs - repetition.ascentStartedAtMs,
    total: repetition.completedAtMs - repetition.startedAtMs,
});

export function compareRecording(annotationInput, observationInput, { boundaryToleranceMs = DEFAULT_BOUNDARY_TOLERANCE_MS } = {}) {
    number(boundaryToleranceMs, 'boundaryToleranceMs', 0, 10000);
    const annotations = validateAnnotations(annotationInput);
    const observations = validateObservations(observationInput);
    if (annotations.clipId !== observations.clipId) invalid('clipId', 'the annotation and observation identifiers differ');
    if (Math.abs(annotations.durationMs - observations.durationMs) > 1) {
        invalid('durationMs', 'annotation and observation durations must agree within 1 ms');
    }
    const expected = annotations.repetitions, observed = observations.repetitions;
    const pairs = matchRepetitions(expected, observed, boundaryToleranceMs);
    const matchedExpected = new Set(pairs.map(pair => pair.expected));
    const matchedObserved = new Set(pairs.map(pair => pair.observed));
    const matches = pairs.map(pair => {
        const a = expected[pair.expected], b = observed[pair.observed];
        const aPhases = phases(a), bPhases = phases(b);
        return {
            annotationId: a.id, observationIndex: b.index ?? pair.observed + 1,
            boundaryErrorMs: Object.fromEntries(BOUNDARIES.map(key => [key, b[key] - a[key]])),
            phaseDurationErrorMs: Object.fromEntries(Object.keys(aPhases).map(key => [key, bPhases[key] - aPhases[key]])),
        };
    });
    const truePositives = pairs.length;
    const precision = observed.length ? truePositives / observed.length : null;
    const recall = expected.length ? truePositives / expected.length : null;
    return {
        schemaVersion: 1,
        kind: 'squat-video-comparison',
        clipId: annotations.clipId,
        dataOrigin: annotations.dataOrigin,
        evidenceScope: annotations.dataOrigin === 'synthetic_fixture' ? 'software-regression-only' : 'reviewer-declared-real-recording',
        evaluationPolicy: {
            version: '1.0.0', boundaryToleranceMs,
            matching: 'Maximize monotone one-to-one matches with positive temporal overlap and start/end errors within tolerance; then minimize start/end absolute error.',
            exclusions: 'Descriptive only. Predictions in these intervals still count as false positives when unmatched.',
            timing: 'Source-video timestamps. Positive signed errors mean later detection or longer observed duration.',
        },
        versions: { model: observations.modelVersion, profileId: observations.profileId,
            profile: observations.profileVersion, tracking: observations.trackingVersion ?? null },
        repetitions: {
            annotated: expected.length, observed: observed.length, truePositives,
            falsePositives: observed.length - truePositives, falseNegatives: expected.length - truePositives,
            precision, recall, f1: expected.length + observed.length ? 2 * truePositives / (expected.length + observed.length) : null,
            missedAnnotationIds: expected.filter((_, index) => !matchedExpected.has(index)).map(rep => rep.id),
            unmatchedObservationIndices: observed.flatMap((rep, index) => matchedObserved.has(index) ? [] : [rep.index ?? index + 1]),
        },
        timing: {
            basis: 'Matched repetitions only; missing and extra repetitions are reported separately.',
            boundaries: Object.fromEntries(BOUNDARIES.map(key => [key, errorStats(matches.map(match => match.boundaryErrorMs[key]))])),
            phaseDurations: Object.fromEntries(['descent', 'bottomPause', 'ascent', 'total']
                .map(key => [key, errorStats(matches.map(match => match.phaseDurationErrorMs[key]))])),
        },
        matches,
        processing: observations.processing ? structuredClone(observations.processing) : null,
        processingScope: 'Optional measured inference and frame-admission-to-response latency; neither is total camera-to-display latency.',
        subjectIdentity: { assessed: false, reason: 'This schema does not contain independently annotated identity trajectories.' },
        techniqueQuality: { assessed: false, reason: 'Repetition and timing agreement do not establish technique quality or exercise safety.' },
    };
}
