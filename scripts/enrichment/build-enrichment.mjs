/**
 * Reproducible builder for src/data/exerciseEnrichment.js.
 *
 * Joins our EXERCISE_DATABASE (generic names) to the MIT-licensed text of the
 * open exercises-dataset (equipment-specific names) by token containment, plus
 * the hand-verified overrides in ./overrides.mjs, and emits equipment / target /
 * secondary muscles / EN+ES step instructions keyed by our exercise id.
 *
 * The dataset's images/GIFs are (c) Gym Visual and are NOT redistributable — we
 * take only the MIT-licensed text. The 17MB source JSON is fetched at run time
 * and cached under scripts/enrichment/.cache/ (git-ignored), never committed.
 *
 * Usage:  node scripts/enrichment/build-enrichment.mjs
 *         npm run build:enrichment
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { OVERRIDES } from './overrides.mjs';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '../..');
const APP_CONSTANTS = path.join(REPO_ROOT, 'src/constants/index.js');
const OUT = path.join(REPO_ROOT, 'src/data/exerciseEnrichment.js');
const INDEX_OUT = path.join(REPO_ROOT, 'src/data/exerciseEnrichmentIndex.js');
const CACHE_DIR = path.join(SCRIPT_DIR, '.cache');
const CACHE = path.join(CACHE_DIR, 'exercises.json');
const DATASET_URL = 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json';

async function loadDataset() {
  if (fs.existsSync(CACHE)) {
    return JSON.parse(fs.readFileSync(CACHE, 'utf8'));
  }
  console.log('Fetching dataset (~17MB) from', DATASET_URL);
  const res = await fetch(DATASET_URL);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  const text = await res.text();
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(CACHE, text);
  console.log('Cached to', CACHE);
  return JSON.parse(text);
}

// --- normalization + light stemming ------------------------------------------
const IRREGULAR = {
  flyes: 'fly', flys: 'fly', flye: 'fly', flies: 'fly', presses: 'press',
  crunches: 'crunch', pushes: 'push', ups: 'up',
  pushups: 'pushup', pullups: 'pullup', chinups: 'chinup', situps: 'situp',
};
const STOP = new Set(['the', 'a', 'an', 'of', 'with', 'for', 'to', 'and', 'on', 'in']);
const GENERIC_EQUIP = new Set(['barbell', 'dumbbell', 'cable', 'smith', 'lever', 'band',
  'machine', 'sled', 'weighted', 'assisted', 'kettlebell', 'ez', 'olympic', 'trap',
  'resistance', 'bodyweight', 'body', 'weight', 'roller', 'wheel', 'stability', 'ball']);

function stem(t) {
  if (IRREGULAR[t]) return IRREGULAR[t];
  if (t.length > 4 && /(ch|sh|x|z|ss)es$/.test(t)) return t.slice(0, -2);
  if (t.length > 2 && t.endsWith('s') && !t.endsWith('ss')) return t.slice(0, -1);
  return t;
}
const tokens = n => n.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/)
  .filter(t => t && !STOP.has(t)).map(stem);
const setKey = n => [...new Set(tokens(n))].sort().join(' ');
const subset = (a, b) => { for (const t of a) if (!b.has(t)) return false; return true; };

const MG = {
  Chest: ['chest', 'pectoral'], Back: ['back', 'lat', 'trap', 'rhomboid'],
  Shoulders: ['shoulder', 'delt'], Biceps: ['bicep', 'upper arm'],
  Triceps: ['tricep', 'upper arm'], Forearms: ['forearm', 'lower arm', 'wrist'],
  Legs: ['leg', 'quad', 'glute', 'hamstring', 'calf', 'calv', 'adductor', 'abductor'],
  Abs: ['ab', 'waist', 'oblique', 'core'], Cardio: ['cardio'], Combat: [],
};

// sentence splitter fallback if a language's step array is empty
const toSteps = (rec, lang) => {
  const steps = rec.instruction_steps?.[lang];
  if (Array.isArray(steps) && steps.length) return steps;
  const para = rec.instructions?.[lang];
  if (para) return para.split(/(?<=\.)\s+/).map(s => s.trim()).filter(Boolean);
  return [];
};

function match(appDb, dataset) {
  const byId = new Map(dataset.map(d => [d.id, d]));
  const dsIndex = dataset.map(d => ({
    ref: d, set: new Set(tokens(d.name)), setKey: setKey(d.name),
    primaryBag: `${d.body_part} ${d.target}`.toLowerCase(),
    weakBag: `${(d.secondary_muscles || []).join(' ')} ${d.muscle_group || ''}`.toLowerCase(),
  }));
  const dsBySetKey = new Map();
  for (const d of dsIndex) if (!dsBySetKey.has(d.setKey)) dsBySetKey.set(d.setKey, d);

  const results = [];
  for (const app of appDb) {
    // 1) explicit override wins
    if (OVERRIDES[app.id] && byId.has(OVERRIDES[app.id])) {
      results.push({ app, tier: 'override', rec: byId.get(OVERRIDES[app.id]) });
      continue;
    }
    const aSet = new Set(tokens(app.name));
    const aSetKey = setKey(app.name);
    const mgKeys = MG[app.muscleGroup] || [];
    const mgStrong = d => mgKeys.some(k => d.primaryBag.includes(k));
    const mgWeak = d => mgKeys.some(k => d.weakBag.includes(k));

    const exact = dsBySetKey.get(aSetKey);
    if (exact) { results.push({ app, tier: 'exact', rec: exact.ref }); continue; }

    const contained = [];
    for (const d of dsIndex) {
      if (subset(aSet, d.set)) {
        const extra = [...d.set].filter(t => !aSet.has(t));
        contained.push({ d, extra: extra.length, nonEquipExtra: extra.filter(t => !GENERIC_EQUIP.has(t)).length, s: mgStrong(d), w: mgWeak(d) });
      } else if (subset(d.set, aSet) && d.set.size >= 2) {
        const extra = [...aSet].filter(t => !d.set.has(t));
        contained.push({ d, extra: extra.length, nonEquipExtra: 0, s: mgStrong(d), w: mgWeak(d) });
      }
    }
    if (contained.length) {
      contained.sort((x, y) => (y.s - x.s) || (y.w - x.w) || (x.nonEquipExtra - y.nonEquipExtra) || (x.extra - y.extra));
      results.push({ app, tier: 'strong', rec: contained[0].d.ref });
    } else {
      results.push({ app, tier: 'none', rec: null });
    }
  }
  return results;
}

function emit(results) {
  const entries = [];
  for (const { app, tier, rec } of results) {
    if (tier === 'none' || !rec) continue;
    entries.push({
      appId: app.id, sourceId: rec.id, sourceName: rec.name,
      equipment: rec.equipment, target: rec.target,
      secondaryMuscles: rec.secondary_muscles || [],
      instructions: { en: toSteps(rec, 'en'), es: toSteps(rec, 'es') },
    });
  }
  entries.sort((a, b) => a.appId - b.appId);

  const body = entries.map(e => {
    const en = e.instructions.en.map(s => '      ' + JSON.stringify(s)).join(',\n');
    const es = e.instructions.es.map(s => '      ' + JSON.stringify(s)).join(',\n');
    return `  ${e.appId}: {
    sourceId: ${JSON.stringify(e.sourceId)},
    sourceName: ${JSON.stringify(e.sourceName)},
    equipment: ${JSON.stringify(e.equipment)},
    target: ${JSON.stringify(e.target)},
    secondaryMuscles: ${JSON.stringify(e.secondaryMuscles)},
    instructions: {
      en: [
${en}
      ],
      es: [
${es}
      ],
    },
  },`;
  }).join('\n');

  const file = `/**
 * Exercise enrichment — equipment, target muscle, secondary muscles, and
 * step-by-step EN/ES instructions, keyed by EXERCISE_DATABASE.id.
 *
 * GENERATED FILE — do not edit by hand. Run: npm run build:enrichment
 * (scripts/enrichment/build-enrichment.mjs). Add name-synonym fixes to
 * scripts/enrichment/overrides.mjs, not here.
 *
 * Source: hasaneyldrm/exercises-dataset (data released under the MIT License).
 * Only the MIT-licensed textual data is used — the dataset's images/GIFs are
 * (c) Gym Visual and are intentionally NOT included or referenced.
 *
 * ${entries.length} of our exercises are covered; the rest (combat drills, some
 * cardio, grip-only work) have no dataset equivalent. Kept free of Vite/
 * browser-only syntax so Node tooling can import it.
 */
export const EXERCISE_ENRICHMENT = {
${body}
};
`;
  fs.writeFileSync(OUT, file);

  // Tiny synchronous companion: just the covered ids, so the UI can decide
  // whether to show the demo button without importing the heavy data above.
  const index = `/**
 * GENERATED FILE — do not edit by hand. Run: npm run build:enrichment
 *
 * The EXERCISE_DATABASE.ids that have enrichment. This lightweight index is
 * imported synchronously by the UI to decide whether to show the demo button;
 * the heavy exerciseEnrichment.js is loaded lazily (dynamic import) only when a
 * demo modal actually opens, keeping it out of the initial bundle.
 */
export const ENRICHED_IDS = [${entries.map(e => e.appId).join(', ')}];
`;
  fs.writeFileSync(INDEX_OUT, index);
  return { entries, file };
}

// --- main ---------------------------------------------------------------------
const raw = fs.readFileSync(APP_CONSTANTS, 'utf8');
const appDb = JSON.parse(raw.slice(raw.indexOf('['), raw.lastIndexOf(']') + 1));
const dataset = await loadDataset();

const results = match(appDb, dataset);
const count = t => results.filter(r => r.tier === t).length;
const { entries, file } = emit(results);

console.log(`\nApp exercises: ${appDb.length}   Dataset records: ${dataset.length}`);
for (const t of ['override', 'exact', 'strong', 'none']) console.log(`  ${t.padEnd(8)} ${count(t)}`);
console.log(`\nCovered: ${entries.length}/${appDb.length}`);
const missingSteps = entries.filter(e => !e.instructions.en.length || !e.instructions.es.length);
if (missingSteps.length) console.warn(`WARNING: ${missingSteps.length} entries missing EN or ES steps`);
console.log(`\nWrote ${path.relative(REPO_ROOT, OUT)} (${(file.length / 1024).toFixed(0)} KB)`);
console.log(`Wrote ${path.relative(REPO_ROOT, INDEX_OUT)} (${entries.length} ids)`);
console.log('Still uncovered:', results.filter(r => r.tier === 'none').map(r => r.app.name).join(', '));
