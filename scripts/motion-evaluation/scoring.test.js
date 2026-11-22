// @vitest-environment node
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { compareRecording, validateAnnotations, validateObservations } from './scoring.mjs';
import { runComparisonCli } from './compare.mjs';

const repetition = (start, offset = 0) => ({ startedAtMs: start + offset, bottomReachedAtMs: start + 1000 + offset,
    ascentStartedAtMs: start + 1200 + offset, completedAtMs: start + 2000 + offset });
const annotations = (repetitions = [repetition(3000)]) => ({
    schemaVersion: 1, kind: 'squat-video-annotations', clipId: 'independently-labelled-clip', durationMs: 12000,
    view: 'side', dataOrigin: 'synthetic_fixture', independentlyReviewed: true,
    repetitions: repetitions.map((rep, index) => ({ id: `reference-${index + 1}`, ...rep })),
});
const observations = (repetitions = [repetition(3000)]) => ({
    schemaVersion: 1, kind: 'squat-video-observations', clipId: 'independently-labelled-clip', durationMs: 12000,
    sourceKind: 'local_video', completed: true, truncated: false,
    modelVersion: 'test-model', profileId: 'bodyweight-squat-side', profileVersion: 'test-version',
    repetitions: repetitions.map((rep, index) => ({ index: index + 1, ...rep })),
});

describe('independently annotated video comparison', () => {
    it('reports missed and extra movements separately from errors among matched repetitions', () => {
        const result = compareRecording(annotations([repetition(3000), repetition(7000)]),
            observations([repetition(0), repetition(3000, 100)]));
        expect(result.repetitions).toEqual({ annotated: 2, observed: 2, truePositives: 1,
            falsePositives: 1, falseNegatives: 1, precision: 0.5, recall: 0.5, f1: 0.5,
            missedAnnotationIds: ['reference-2'], unmatchedObservationIndices: [1] });
        expect(result.timing.boundaries.startedAtMs).toEqual({ samples: 1,
            meanSignedErrorMs: 100, meanAbsoluteErrorMs: 100, maximumAbsoluteErrorMs: 100 });
        expect(result.timing.phaseDurations.total.meanAbsoluteErrorMs).toBe(0);
        expect(result.subjectIdentity.assessed).toBe(false);
        expect(result.techniqueQuality.assessed).toBe(false);
        expect(result.evidenceScope).toBe('software-regression-only');
        expect(result).not.toHaveProperty('accuracy');
    });

    it('measures bottom and ascent errors independently of start/end matching', () => {
        const observed = repetition(3000);
        observed.bottomReachedAtMs += 50;
        observed.ascentStartedAtMs += 150;
        const result = compareRecording(annotations(), observations([observed]));
        expect(result.repetitions.truePositives).toBe(1);
        expect(result.matches[0].phaseDurationErrorMs).toEqual({ descent: 50, bottomPause: 100, ascent: -150, total: 0 });
        expect(result.timing.phaseDurations.ascent.meanSignedErrorMs).toBe(-150);
        expect(result.timing.phaseDurations.ascent.meanAbsoluteErrorMs).toBe(150);
    });

    it('chooses a bounded monotone matching that maximizes total matches instead of greedily taking the nearest event', () => {
        const short = start => ({ startedAtMs: start, bottomReachedAtMs: start + 60,
            ascentStartedAtMs: start + 70, completedAtMs: start + 100 });
        const expected = [short(0), short(110)];
        const first = { startedAtMs: 10, bottomReachedAtMs: 20, ascentStartedAtMs: 30, completedAtMs: 40 };
        const second = { startedAtMs: 50, bottomReachedAtMs: 80, ascentStartedAtMs: 100, completedAtMs: 170 };
        const result = compareRecording(annotations(expected), observations([first, second]), { boundaryToleranceMs: 100 });
        expect(result.repetitions.truePositives).toBe(2);
        expect(result.matches.map(match => match.observationIndex)).toEqual([1, 2]);
    });

    it('never counts two observations as matching the same reference and minimizes error among equal match counts', () => {
        const expected = { startedAtMs: 0, bottomReachedAtMs: 900, ascentStartedAtMs: 1000, completedAtMs: 2000 };
        const left = { startedAtMs: 0, bottomReachedAtMs: 100, ascentStartedAtMs: 200, completedAtMs: 500 };
        const right = { startedAtMs: 500, bottomReachedAtMs: 900, ascentStartedAtMs: 1100, completedAtMs: 2000 };
        const result = compareRecording(annotations([expected]), observations([left, right]), { boundaryToleranceMs: 2000 });
        expect(result.repetitions).toMatchObject({ truePositives: 1, falsePositives: 1, falseNegatives: 0 });
        expect(result.matches[0].observationIndex).toBe(2);
    });

    it('does not pair non-overlapping events even when a loose boundary tolerance would permit them', () => {
        const result = compareRecording(annotations([repetition(0)]), observations([repetition(2000)]),
            { boundaryToleranceMs: 3000 });
        expect(result.repetitions.truePositives).toBe(0);
        expect(result.timing.boundaries.startedAtMs.meanAbsoluteErrorMs).toBeNull();
    });

    it('reports null for undefined precision or recall instead of declaring a zero-event clip perfect', () => {
        expect(compareRecording(annotations([]), observations([])).repetitions).toMatchObject({ precision: null, recall: null, f1: null });
        expect(compareRecording(annotations(), observations([])).repetitions).toMatchObject({ precision: null, recall: 0, f1: 0 });
        expect(compareRecording(annotations([]), observations()).repetitions).toMatchObject({ precision: 0, recall: null, f1: 0 });
    });

    it('does not use descriptive exclusion intervals to hide false-positive movements', () => {
        const labels = annotations();
        labels.exclusions = [{ startedAtMs: 0, endedAtMs: 2500, reason: 'Standing setup with no complete repetition.' }];
        const result = compareRecording(labels, observations([repetition(0), repetition(3000)]));
        expect(result.repetitions.falsePositives).toBe(1);
        expect(() => validateAnnotations({ ...labels, exclusions: [{ startedAtMs: 3500, endedAtMs: 4500, reason: 'Must not hide a repetition.' }] }))
            .toThrow(/may not hide/);
    });

    it('accepts a summary wrapper and copies optional measured processing diagnostics without making camera latency claims', () => {
        const trace = observations();
        trace.processing = { samples: 12, inferenceMs: { p50: 10, p95: 20 }, frameLatencyMs: { p50: 20, p95: 30 } };
        const result = compareRecording(annotations(), { completion: 'confirmed', evaluationTrace: trace });
        expect(result.processing).toEqual(trace.processing);
        result.processing.inferenceMs.p50 = 999;
        expect(trace.processing.inferenceMs.p50).toBe(10);
        expect(result.processingScope).toMatch(/neither is total camera-to-display latency/);
    });

    it('rejects incompatible clips and durations rather than scoring unrelated data', () => {
        expect(() => compareRecording(annotations(), { ...observations(), clipId: 'another-clip' })).toThrow(/identifiers differ/);
        expect(() => compareRecording(annotations(), { ...observations(), durationMs: 12010 })).toThrow(/durations/);
    });

    it.each([
        { independentlyReviewed: false }, { independentlyReviewed: undefined }, { dataOrigin: 'generated-human-image' },
        { view: 'front' }, { schemaVersion: 2 }, { durationMs: 120001 }, { unexpected: true }, { exclusions: null },
    ])('rejects invalid or unreviewed annotations %j', changes => {
        expect(() => validateAnnotations({ ...annotations(), ...changes })).toThrow(TypeError);
    });

    it.each([
        { completed: false }, { truncated: true }, { sourceKind: 'camera' }, { schemaVersion: 2 }, { durationMs: 0 },
        { modelVersion: '' }, { profileId: 'another-exercise' }, { unknown: 1 }, { repetitions: Array(201).fill(repetition(0)) }, { processing: null },
    ])('rejects incomplete or invalid observations %j', changes => {
        expect(() => validateObservations({ ...observations(), ...changes })).toThrow(TypeError);
    });

    it('rejects missing, reordered, overlapping, duplicate, nonfinite, or out-of-range repetition data', () => {
        for (const reps of [
            [{ startedAtMs: 0 }],
            [{ ...repetition(0), bottomReachedAtMs: 1800, ascentStartedAtMs: 1000 }],
            [repetition(2000), repetition(1000)],
            [repetition(2000), repetition(3000)],
            [{ ...repetition(0), startedAtMs: NaN }],
            [repetition(11500)],
        ]) expect(() => validateObservations(observations(reps))).toThrow(TypeError);
        const duplicates = annotations([repetition(1000), repetition(5000)]);
        duplicates.repetitions[1].id = duplicates.repetitions[0].id;
        expect(() => validateAnnotations(duplicates)).toThrow(/unique/);
        expect(() => validateObservations({ ...observations(), repetitions: [{ ...repetition(0), index: 0 }] })).toThrow(/positive integer/);
    });

    it('validates measured processing percentiles and sample bounds', () => {
        const trace = observations();
        trace.processing = { samples: 0, inferenceMs: { p50: null, p95: null }, frameLatencyMs: { p50: null, p95: null } };
        expect(validateObservations(trace)).toBe(trace);
        for (const processing of [
            { ...trace.processing, samples: 2401 },
            { ...trace.processing, samples: 1 },
            { samples: 2, inferenceMs: { p50: 20, p95: 10 }, frameLatencyMs: { p50: 10, p95: 20 } },
        ]) expect(() => validateObservations({ ...trace, processing })).toThrow(TypeError);
    });

    it('uses an explicit configurable boundary-matching policy without changing the input', () => {
        const labels = annotations();
        const trace = observations([repetition(3000, 200)]);
        expect(compareRecording(labels, trace, { boundaryToleranceMs: 100 }).repetitions.truePositives).toBe(0);
        expect(compareRecording(labels, trace, { boundaryToleranceMs: 200 }).repetitions.truePositives).toBe(1);
        expect(labels.repetitions[0].startedAtMs).toBe(3000);
        expect(() => compareRecording(labels, trace, { boundaryToleranceMs: Infinity })).toThrow(TypeError);
    });
});

describe('comparison CLI', () => {
    const folders = [];
    const fixtures = fileURLToPath(new URL('./fixtures/', import.meta.url));
    const argumentsList = ['--annotations', join(fixtures, 'synthetic-annotations.json'),
        '--observations', join(fixtures, 'synthetic-observations.json')];
    const output = () => {
        let stdout = '', stderr = '';
        return { streams: { stdout: { write: text => { stdout += text; } }, stderr: { write: text => { stderr += text; } } },
            get stdout() { return stdout; }, get stderr() { return stderr; } };
    };
    afterEach(async () => { await Promise.all(folders.splice(0).map(path => rm(path, { recursive: true, force: true }))); });

    it('runs the explicitly synthetic example without claiming real-video evidence', async () => {
        const capture = output();
        expect(await runComparisonCli(argumentsList, capture.streams)).toBe(0);
        const report = JSON.parse(capture.stdout);
        expect(report.evidenceScope).toBe('software-regression-only');
        expect(report.repetitions).toMatchObject({ truePositives: 1, falseNegatives: 1, recall: 0.5 });
        expect(capture.stderr).toBe('');
    });

    it('creates a new output but never overwrites an existing report or input', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'squat-evaluation-'));
        folders.push(directory);
        const reportPath = join(directory, 'report.json');
        const capture = output();
        expect(await runComparisonCli([...argumentsList, '--output', reportPath], capture.streams)).toBe(0);
        const original = await readFile(reportPath, 'utf8');
        expect(await runComparisonCli([...argumentsList, '--output', reportPath], capture.streams)).toBe(2);
        expect(await readFile(reportPath, 'utf8')).toBe(original);
    });

    it('fails on missing arguments, invalid JSON, unknown options, and oversized input', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'squat-evaluation-'));
        folders.push(directory);
        const invalidPath = join(directory, 'invalid.json');
        await writeFile(invalidPath, 'not-json');
        for (const args of [[], [...argumentsList, '--unrecognized', 'true'],
            ['--annotations', invalidPath, '--observations', argumentsList[3]]]) {
            const capture = output();
            expect(await runComparisonCli(args, capture.streams)).toBe(2);
            expect(capture.stdout).toBe('');
            expect(capture.stderr).toContain('Comparison failed:');
        }
        await writeFile(invalidPath, ' '.repeat(1024 * 1024 + 1));
        const capture = output();
        expect(await runComparisonCli(['--annotations', invalidPath, '--observations', argumentsList[3]], capture.streams)).toBe(2);
        expect(capture.stderr).toContain('at most 1 MiB');
    });
});
