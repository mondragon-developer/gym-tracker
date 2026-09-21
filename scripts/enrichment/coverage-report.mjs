/**
 * Coverage report: which library exercises still have no demo, which of
 * those have a same-movement candidate in the public-domain source the demos
 * come from (yuhonas/free-exercise-db), what that source covers that our
 * muscle groups do not, and how big its dumbbell-only and body-only pools
 * are. Read-only; prints to stdout.
 *
 *   npm run report:coverage
 */

import { EXERCISE_DATABASE } from '../../src/constants/index.js';
import { MEDIA_FOLDERS } from '../../src/data/exerciseMediaFolders.js';
import * as equipmentModule from '../../src/data/exerciseEquipment.js';

const SOURCE = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/dist/exercises.json';
const equipment = equipmentModule.default ?? equipmentModule.EXERCISE_EQUIPMENT ?? Object.values(equipmentModule)[0] ?? {};

const fold = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const STOP = new Set(['the', 'and', 'with', 'machine']);
const tokens = (s) => new Set(fold(s).split(' ').filter(w => w.length > 2 && !STOP.has(w)));
// Share of our name's tokens that prefix-match a token of theirs.
const score = (ours, theirs) => {
  const a = tokens(ours);
  const b = [...tokens(theirs)];
  let hit = 0;
  a.forEach(t => { if (b.some(x => x.startsWith(t) || t.startsWith(x))) hit++; });
  return hit / Math.max(1, a.size);
};

const response = await fetch(SOURCE);
if (!response.ok) {
  console.error(`Could not fetch ${SOURCE}: HTTP ${response.status}`);
  process.exit(1);
}
const source = (await response.json()).filter(e => e.images?.length);

const missing = EXERCISE_DATABASE.filter(e => !MEDIA_FOLDERS[e.id]);
console.log(`Library: ${EXERCISE_DATABASE.length} exercises, ${EXERCISE_DATABASE.length - missing.length} with a demo, ${missing.length} without.`);
console.log(`Source: ${source.length} exercises with frames.\n`);

console.log('Missing demo -> best source candidates (token score >= 0.6):');
for (const e of missing) {
  const candidates = source
    .map(f => ({ id: f.id, s: score(e.name, f.name) }))
    .filter(c => c.s >= 0.6)
    .sort((a, b) => b.s - a.s)
    .slice(0, 2)
    .map(c => `${c.id} (${c.s.toFixed(2)})`);
  console.log(`  ${String(e.id).padStart(3)}  ${e.name.padEnd(36)} ${e.muscleGroup.padEnd(9)} ${candidates.join(', ') || '-'}`);
}

const ourGroups = new Set(EXERCISE_DATABASE.map(e => e.muscleGroup.toLowerCase()));
const byMuscle = {};
source.forEach(f => (f.primaryMuscles || []).forEach(m => { byMuscle[m] = (byMuscle[m] || 0) + 1; }));
console.log('\nSource primary muscles (count), * = not one of our group names:');
console.log('  ' + Object.entries(byMuscle).sort((a, b) => b[1] - a[1])
  .map(([m, c]) => `${ourGroups.has(m) ? '' : '*'}${m}:${c}`).join(', '));

const pool = (predicate, label) => {
  const list = source.filter(predicate);
  const counts = {};
  list.forEach(f => (f.primaryMuscles || []).forEach(m => { counts[m] = (counts[m] || 0) + 1; }));
  console.log(`\n${label}: ${list.length} in source; ` + Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([m, c]) => `${m}:${c}`).join(', '));
};
pool(f => f.equipment === 'dumbbell', 'Dumbbell-only pool');
pool(f => f.equipment === 'body only', 'Body-only pool');

const ours = {};
EXERCISE_DATABASE.forEach(e => { const k = equipment[e.id] ?? 'unknown'; ours[k] = (ours[k] || 0) + 1; });
console.log('\nOur equipment coverage: ' + Object.entries(ours).sort((a, b) => b[1] - a[1]).map(([k, c]) => `${k}:${c}`).join(', '));
