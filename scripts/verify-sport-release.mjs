// Read-only verification of the deployed catalog, media integrity and video seeking.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { SPORT_EXERCISES } from '../src/data/sportExercises.js';

const origin = new URL(process.argv[2] || 'https://gym.mdragonsolutions.com');
assert(['https:', 'http:'].includes(origin.protocol));
const expected = JSON.parse(await fs.readFile('public/exercise-media/sports/provenance.json', 'utf8'));
async function get(path, options = {}) {
  const response = await fetch(new URL(path, origin), { signal: AbortSignal.timeout(20000), cache: 'no-store', ...options });
  assert.equal(response.status, options.headers?.Range ? 206 : 200, `${path}: HTTP ${response.status}`);
  return response;
}
const html = await (await get('/')).text();
const script = html.match(/<script[^>]+src="([^"]+\.js)"/);
assert(script, 'Missing application entry script');
const application = await (await get(script[1])).text();
for (const exercise of SPORT_EXERCISES) assert(application.includes(exercise.name), `Missing catalog name: ${exercise.name}`);
assert.deepEqual(await (await get('/exercise-media/sports/provenance.json')).json(), expected);
const files = expected.exercises.flatMap(exercise => exercise.files);
for (let i = 0; i < files.length; i += 4) {
  await Promise.all(files.slice(i, i + 4).map(async file => {
    const response = await get(`/exercise-media/sports/${file.path}`);
    const contentType = file.path.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg';
    assert(response.headers.get('content-type')?.includes(contentType), `${file.path}: wrong content type`);
    const bytes = Buffer.from(await response.arrayBuffer());
    assert.equal(bytes.length, file.bytes, `${file.path}: wrong byte count`);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256, `${file.path}: checksum mismatch`);
    if (file.path.endsWith('.mp4')) {
      const range = await get(`/exercise-media/sports/${file.path}`, { headers: { Range: 'bytes=0-1023' } });
      assert.equal(range.headers.get('content-range'), `bytes 0-1023/${file.bytes}`);
      assert.deepEqual(Buffer.from(await range.arrayBuffer()), bytes.subarray(0, 1024));
    }
  }));
}
console.log(JSON.stringify({ origin: origin.origin, catalogAdditions: SPORT_EXERCISES.length, verifiedFiles: files.length, videoRangeChecks: 5, bytes: files.reduce((sum, file) => sum + file.bytes, 0), status: 'passed' }, null, 2));
