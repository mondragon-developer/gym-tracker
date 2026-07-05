/**
 * One-off: mirror the exercise demo frames into Supabase Storage so the app
 * self-hosts them instead of depending on a third-party CDN at runtime.
 *
 * Downloads each mapped exercise's 0.jpg / 1.jpg from the free source dataset
 * and uploads it to a public `exercise-media` bucket, preserving the same
 * `<folder>/0.jpg` paths the app already expects. Idempotent (upsert) — safe to
 * re-run after adding new mappings.
 *
 * Run it yourself (needs your SECRET service_role key, which never leaves your
 * machine — add it to your git-ignored .env, do NOT commit it):
 *
 *   1. In .env add:  SUPABASE_SERVICE_ROLE_KEY=<your service_role key>
 *      (Supabase dashboard → Settings → API → service_role, "secret")
 *   2. npm run upload:media
 */

import { createClient } from '@supabase/supabase-js';
import { MEDIA_FOLDERS } from '../src/data/exerciseMediaFolders.js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SOURCE = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises';
const BUCKET = 'exercise-media';
const CONCURRENCY = 8;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing env. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (in .env), then run with:');
  console.error('  node --env-file=.env scripts/upload-exercise-media.mjs   (or: npm run upload:media)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

async function ensureBucket() {
  const { data } = await supabase.storage.getBucket(BUCKET);
  if (data) return;
  const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
  if (error && !/already exists/i.test(error.message)) throw error;
  console.log(`Bucket "${BUCKET}" ready (public).`);
}

async function uploadFrame(folder, n) {
  const path = `${folder}/${n}.jpg`;
  const res = await fetch(`${SOURCE}/${path}`);
  if (!res.ok) return { path, status: `download ${res.status}` };
  const bytes = Buffer.from(await res.arrayBuffer());
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: 'image/jpeg', upsert: true });
  return { path, status: error ? `upload ${error.message}` : 'ok' };
}

async function run() {
  await ensureBucket();

  const folders = [...new Set(Object.values(MEDIA_FOLDERS))];
  const jobs = folders.flatMap(f => [[f, 0], [f, 1]]);
  console.log(`Uploading ${jobs.length} frames for ${folders.length} exercises…`);

  let done = 0;
  const failures = [];
  // Simple concurrency pool.
  for (let i = 0; i < jobs.length; i += CONCURRENCY) {
    const batch = jobs.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(([f, n]) => uploadFrame(f, n)));
    for (const r of results) {
      done++;
      if (r.status !== 'ok') failures.push(r);
    }
    process.stdout.write(`\r${done}/${jobs.length}`);
  }
  process.stdout.write('\n');

  if (failures.length) {
    console.warn(`\n${failures.length} frame(s) failed:`);
    failures.forEach(f => console.warn(`  ${f.path} — ${f.status}`));
  }
  console.log(`\nDone. ${jobs.length - failures.length}/${jobs.length} frames in Supabase Storage.`);
  console.log(`Public base: ${SUPABASE_URL}/storage/v1/object/public/${BUCKET}`);
}

run().catch(err => {
  console.error('Upload failed:', err.message || err);
  process.exit(1);
});
