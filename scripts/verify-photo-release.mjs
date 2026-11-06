// Read-only production check: verify deployed catalog and every new media file.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { PHOTO_EXERCISES } from '../src/data/photoExercises.js';

const origin = new URL(process.argv[2] || 'https://gym.mdragonsolutions.com');
assert(['https:', 'http:'].includes(origin.protocol));
const expected = JSON.parse(await fs.readFile('public/exercise-media/photos/provenance.json', 'utf8'));
async function get(path) {
  const response = await fetch(new URL(path, origin), { signal: AbortSignal.timeout(20000), cache: 'no-store' });
  assert.equal(response.status, 200, `${path}: HTTP ${response.status}`);
  return response;
}
const html = await (await get('/')).text();
const script = html.match(/<script[^>]+src="([^"]+\.js)"/);
assert(script, 'Missing application entry script');
const application = await (await get(script[1])).text();
for (const exercise of PHOTO_EXERCISES) assert(application.includes(exercise.name), `Missing catalog name: ${exercise.name}`);
const provenance = await (await get('/exercise-media/photos/provenance.json')).json();
assert.deepEqual(provenance, expected, 'Deployed provenance does not match this checkout');
const files = expected.exercises.flatMap(exercise => exercise.images);
for (let i = 0; i < files.length; i += 4) {
  await Promise.all(files.slice(i, i + 4).map(async file => {
    const response = await get(`/exercise-media/photos/${file.path}`);
    assert(response.headers.get('content-type')?.includes('image/jpeg'), `${file.path}: wrong content type`);
    const bytes = Buffer.from(await response.arrayBuffer());
    assert.equal(bytes.length, file.bytes, `${file.path}: wrong byte count`);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256, `${file.path}: checksum mismatch`);
  }));
}
console.log(JSON.stringify({ origin: origin.origin, catalogAdditions: PHOTO_EXERCISES.length, verifiedPhotos: files.length, revision: expected.revision, status: 'passed' }, null, 2));
