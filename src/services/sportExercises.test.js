import { describe, it, expect, vi, afterEach } from 'vitest';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { SPORT_EXERCISES } from '../data/sportExercises.js';
import { getExerciseMedia, hasExerciseMedia } from './ExerciseMediaService.js';
import { getExerciseEnrichment, getExerciseEquipment } from './ExerciseEnrichmentService.js';
import { parsePlanText, buildWeekFromImport } from '../utils/planImport.js';
import { resolveExerciseName } from '../utils/exerciseResolver.js';

afterEach(() => vi.unstubAllEnvs());

describe('licensed sports demonstrations', () => {
  it('resolves both languages and keeps all drills on minutes-based tracking', async () => {
    expect(SPORT_EXERCISES.map(ex => ex.id)).toEqual([290, 291, 292, 293, 294]);
    for (const exercise of SPORT_EXERCISES) {
      const record = await getExerciseEnrichment(exercise.id);
      for (const language of ['en', 'es']) {
        const name = language === 'en' ? exercise.name : exercise.nameEs;
        expect(resolveExerciseName(name).dbId).toBe(exercise.id);
        expect(record.instructions[language]).toHaveLength(4);
        expect(record.description[language].length).toBeGreaterThan(40);
        const parsed = parsePlanText(`GYMPLAN v1\nMonday: ${exercise.muscleGroup}\n- ${name} 5 min`);
        expect(parsed.errors).toEqual([]);
        expect(parsed.warnings).toEqual([]);
        expect(parsed.days.Monday.exercises[0].match.dbId).toBe(exercise.id);
        expect(parsed.days.Monday.exercises[0].minutes).toBe('5');
        const result = buildWeekFromImport(parsed);
        expect(result.plan.Monday.exercises[0].sets).toBe('5');
        expect(result.plan.Monday.exercises[0].reps).toBe('');
        expect(result.warnings).toEqual([]);
      }
      expect(getExerciseEquipment(exercise.id)).toBe(exercise.equipment);
      expect(record.attribution.url).toMatch(/^https:/);
      expect(record.attribution.licenseUrl).toMatch(/^https:/);
    }
  });

  it('ships matching licensed video and poster files with no audio track', () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    const provenance = JSON.parse(fs.readFileSync('public/exercise-media/sports/provenance.json', 'utf8'));
    const selection = JSON.parse(fs.readFileSync('scripts/enrichment/sport-selection.json', 'utf8'));
    expect(provenance.exercises).toHaveLength(5);
    for (const exercise of SPORT_EXERCISES) {
      const record = provenance.exercises.find(row => row.id === exercise.id);
      expect(record.source).toEqual(selection.find(row => row.id === exercise.id).source);
      expect(record.output.streams.map(stream => stream.codec_type)).toEqual(['video']);
      expect(record.output.streams[0].codec_name).toBe('h264');
      expect(Number(record.output.format.duration)).toBeLessThanOrEqual(10.1);
      expect(hasExerciseMedia(String(exercise.id))).toBe(true);
      const media = getExerciseMedia(exercise.id);
      expect(media.video).toBe(`/exercise-media/sports/${exercise.id}.mp4`);
      expect(media.poster).toBe(`/exercise-media/sports/${exercise.id}.jpg`);
      for (const file of record.files) {
        const bytes = fs.readFileSync(`public/exercise-media/sports/${file.path}`);
        expect(bytes.length).toBe(file.bytes);
        expect(createHash('sha256').update(bytes).digest('hex')).toBe(file.sha256);
      }
    }
  });
});
