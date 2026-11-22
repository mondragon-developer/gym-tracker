import { readFile, stat, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compareRecording } from './scoring.mjs';

const MAXIMUM_FILE_BYTES = 1024 * 1024;
const USAGE = `Compare independently reviewed squat annotations with an opt-in local-video evaluation export.

Usage:
  node scripts/motion-evaluation/compare.mjs --annotations labels.json --observations summary.json
  node scripts/motion-evaluation/compare.mjs --annotations labels.json --observations summary.json --output comparison.json

Options:
  --boundary-tolerance-ms NUMBER  Maximum start/end mismatch for matching (default 1000).
  --output PATH                  Create a new report; existing files are never overwritten.
  --help                         Show this message.

Inputs are JSON, at most 1 MiB each. Observations may be a trace or a summary containing evaluationTrace.
This command does not decode video or run pose inference. See docs/SQUAT_VIDEO_EVALUATION.md.
`;

async function readJson(path) {
    const metadata = await stat(path);
    if (!metadata.isFile() || metadata.size > MAXIMUM_FILE_BYTES) throw new Error(`${path}: expected a JSON file of at most 1 MiB`);
    const contents = await readFile(path, 'utf8');
    if (Buffer.byteLength(contents) > MAXIMUM_FILE_BYTES) throw new Error(`${path}: file exceeds 1 MiB`);
    try { return JSON.parse(contents); }
    catch { throw new Error(`${path}: invalid JSON`); }
}

export async function runComparisonCli(argumentsList, { stdout = process.stdout, stderr = process.stderr } = {}) {
    try {
        if (argumentsList.length === 1 && argumentsList[0] === '--help') { stdout.write(USAGE); return 0; }
        const options = {};
        const allowed = new Set(['--annotations', '--observations', '--output', '--boundary-tolerance-ms']);
        for (let index = 0; index < argumentsList.length; index += 2) {
            const flag = argumentsList[index], value = argumentsList[index + 1];
            if (!allowed.has(flag) || Object.hasOwn(options, flag) || !value || value.startsWith('--')) {
                throw new Error(`Invalid or duplicate option ${flag}. Use --help for usage.`);
            }
            options[flag] = value;
        }
        if (!options['--annotations'] || !options['--observations']) {
            throw new Error('Both --annotations and --observations are required. Use --help for usage.');
        }
        const [annotations, observations] = await Promise.all([
            readJson(options['--annotations']), readJson(options['--observations']),
        ]);
        const comparisonOptions = {};
        if (options['--boundary-tolerance-ms'] != null) {
            if (!options['--boundary-tolerance-ms'].trim()) throw new Error('--boundary-tolerance-ms must be a number');
            comparisonOptions.boundaryToleranceMs = Number(options['--boundary-tolerance-ms']);
        }
        const report = JSON.stringify(compareRecording(annotations, observations, comparisonOptions), null, 2) + '\n';
        if (options['--output']) {
            await writeFile(options['--output'], report, { flag: 'wx', mode: 0o600 });
            stdout.write(`Created ${options['--output']}\n`);
        } else stdout.write(report);
        return 0;
    } catch (failure) {
        stderr.write(`Comparison failed: ${failure.message}\n`);
        return 2;
    }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    process.exitCode = await runComparisonCli(process.argv.slice(2));
}
