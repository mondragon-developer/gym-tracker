import { describe, it, expect } from 'vitest';
import { parsePlanText, buildWeekFromImport, normalizeLine, looksLikePlan, IMPORT_PRESETS, DAY_MODES } from './planImport.js';
import { EXERCISE_DATABASE } from '../constants/index.js';
import { DAYS_OF_WEEK, INDIVIDUAL_MUSCLE_GROUPS } from '../constants/AppConstants.js';

const idOf = (name) => EXERCISE_DATABASE.find(e => e.name === name).id;
const validGroups = new Set(INDIVIDUAL_MUSCLE_GROUPS);

const FULL_WEEK = `GYMPLAN v1
Monday: Chest & Triceps
- Barbell Bench Press 4x6-8
- Incline Dumbbell Press 3x8-10
- Rope Pushdowns 3x12-15
note: Warm up 5 min on the bike first
Tuesday: Legs
- Barbell Squats 4x6-8
- Plank 3x30-60s
Wednesday: Rest
Thursday: Cardio & Abs
- Stationary Bike 20 min
- custom: Sled Push with rope 4x20
Friday: Back & Biceps
- Lat Pulldowns 3x10-12
Saturday: Rest
Sunday: Rest`;

const SPANISH = `GYMPLAN v1
Lunes: Pecho y Tríceps
- Press de Banca con Barra 4x6-8
- Jalón al Pecho 3x10
nota: Calienta antes
Miércoles: Descanso
Jueves: Cardio
- Bicicleta Estática 20 min`;

const existingWeek = () => ({
    Monday: { name: 'Back', exercises: [{ id: 'old-1', dbId: idOf('Lat Pulldowns'), name: 'Lat Pulldowns', sets: '3', reps: '10', weight: '100', effectiveSets: '', status: 'incomplete' }], note: 'keep me' },
    Tuesday: { name: 'Rest', exercises: [], hidden: true },
    Wednesday: { name: 'Legs', exercises: [] },
    Thursday: { name: 'Rest', exercises: [] },
    Friday: { name: 'Rest', exercises: [] },
    Saturday: { name: 'Rest', exercises: [], hidden: true },
    Sunday: { name: 'Rest', exercises: [] }
});

describe('normalizeLine', () => {
    it('strips markdown and maps typographic characters', () => {
        expect(normalizeLine('- **Barbell Bench Press** 4×6–8')).toBe('Barbell Bench Press 4x6-8');
        expect(normalizeLine('• Plank 3× 30s')).toBe('Plank 3x 30s');
        expect(normalizeLine('1. Lat Pulldowns 3x10')).toBe('Lat Pulldowns 3x10');
        expect(normalizeLine('> Monday: Chest')).toBe('Monday: Chest');
        expect(normalizeLine('Farmer’s Walk 3x40')).toBe("Farmer's Walk 3x40");
    });
});

describe('parsePlanText', () => {
    it('reads a full English week', () => {
        const parsed = parsePlanText(FULL_WEEK);
        expect(parsed.errors).toEqual([]);
        expect(parsed.version).toBe(1);
        expect(Object.keys(parsed.days)).toEqual(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);
        expect(parsed.days.Monday.groups).toEqual(['Chest', 'Triceps']);
        expect(parsed.days.Monday.note).toBe('Warm up 5 min on the bike first');
        expect(parsed.days.Monday.exercises.map(e => e.match.confidence)).toEqual(['exact', 'exact', 'exact']);
        expect(parsed.days.Monday.exercises[0]).toMatchObject({ sets: '4', reps: '6-8', minutes: null });
        expect(parsed.days.Tuesday.exercises[1]).toMatchObject({ name: 'Plank', reps: '30-60s' });
        expect(parsed.days.Wednesday.rest).toBe(true);
        expect(parsed.days.Thursday.exercises[0]).toMatchObject({ minutes: '20', match: { confidence: 'exact' } });
        expect(parsed.days.Thursday.exercises[1]).toMatchObject({ typedName: 'Sled Push with rope', match: { dbId: null, confidence: 'none' } });
    });

    it('reads Spanish days, groups, names and notes', () => {
        const parsed = parsePlanText(SPANISH);
        expect(parsed.errors).toEqual([]);
        expect(parsed.days.Monday.groups).toEqual(['Chest', 'Triceps']);
        expect(parsed.days.Monday.exercises[0]).toMatchObject({ match: { dbId: idOf('Barbell Bench Press'), confidence: 'spanish' } });
        expect(parsed.days.Monday.note).toBe('Calienta antes');
        expect(parsed.days.Wednesday.rest).toBe(true);
        expect(parsed.days.Thursday.exercises[0]).toMatchObject({ minutes: '20', match: { dbId: idOf('Stationary Bike') } });
    });

    it('gives the same result for a messy copy from a chat window', () => {
        const messy = '```\nGYMPLAN v1\n**Monday:** Chest & Triceps\n• Barbell Bench Press 4×6–8\n* Incline Dumbbell Press 3 x 8-10\n- Rope Pushdowns 3×12–15\nnote: Warm up 5 min on the bike first\n```\nCopy this into Import plan.';
        const clean = parsePlanText('GYMPLAN v1\nMonday: Chest & Triceps\n- Barbell Bench Press 4x6-8\n- Incline Dumbbell Press 3x8-10\n- Rope Pushdowns 3x12-15\nnote: Warm up 5 min on the bike first');
        const parsed = parsePlanText(messy);
        expect(parsed.errors).toEqual([]);
        const strip = (days) => JSON.parse(JSON.stringify(days, (key, value) => (key === 'line' ? undefined : value)));
        expect(strip(parsed.days)).toEqual(strip(clean.days));
        expect(parsed.warnings.some(w => w.message === 'Skipped line')).toBe(true);
    });

    it('accepts sets and reps words, a weight column and a trailing parenthetical', () => {
        const parsed = parsePlanText('Monday: Chest\n- Barbell Bench Press 4 sets x 8 reps @ 60 kg\n- Pull-ups 3x6-10 (or Lat Pulldowns)');
        const [bench, pullups] = parsed.days.Monday.exercises;
        expect(bench).toMatchObject({ sets: '4', reps: '8', weight: '60', weightUnit: 'kg' });
        expect(pullups).toMatchObject({ name: 'Pull-ups', match: { confidence: 'exact' } });
        expect(parsed.warnings.some(w => w.message === 'Dropped a note in parentheses')).toBe(true);
        expect(parsed.warnings.some(w => w.message === 'Missing GYMPLAN header')).toBe(true);
    });

    it('reports structural errors', () => {
        expect(parsePlanText('GYMPLAN v1\nMonday: Chest\n- Push-Ups 3x10\nMonday: Back').errors[0]).toMatchObject({ message: 'Day listed twice', name: 'Monday' });
        expect(parsePlanText('GYMPLAN v1\n- Push-Ups 3x10').errors[0]).toMatchObject({ message: 'Exercise before any day line' });
        expect(parsePlanText('GYMPLAN v2\nMonday: Chest').errors[0].message).toBe('Unsupported plan version');
        expect(parsePlanText('').errors).toEqual([{ line: 1, message: 'No plan found in the text' }]);
        expect(parsePlanText('Hello, here is some prose.').errors[0].message).toBe('No plan found in the text');
    });

    it('warns on unknown groups, too many groups and empty days', () => {
        const parsed = parsePlanText('GYMPLAN v1\nMonday: Chest & Neck & Back & Legs & Abs\nTuesday: Legs');
        expect(parsed.days.Monday.groups).toEqual(['Chest', 'Back', 'Legs']);
        const messages = parsed.warnings.map(w => w.message);
        expect(messages).toContain('Unknown muscle group');
        expect(messages).toContain('Only three muscle groups per day');
        expect(messages).toContain('Day has no exercises');
    });

    it('keeps parentheses that belong to a library name', () => {
        const parsed = parsePlanText('Monday: Legs\n- Squats (Wide Stance) 3x10\n- Glute-Ham Raises (GHR) 3x8');
        expect(parsed.days.Monday.exercises.map(e => e.match.confidence)).toEqual(['exact', 'exact']);
        expect(parsed.warnings.some(w => w.message === 'Dropped a note in parentheses')).toBe(false);
    });

    it('accepts a single day', () => {
        const parsed = parsePlanText('Friday: Back\n- Lat Pulldowns 3x10');
        expect(Object.keys(parsed.days)).toEqual(['Friday']);
        expect(parsed.errors).toEqual([]);
    });
});

describe('buildWeekFromImport', () => {
    it('replaces the whole week with the same shape as a workout template', () => {
        const { plan } = buildWeekFromImport(parsePlanText(FULL_WEEK), existingWeek(), { preset: IMPORT_PRESETS.REPLACE });
        const ids = new Set();
        DAYS_OF_WEEK.forEach(day => {
            expect(plan[day]).toBeTruthy();
            plan[day].name.split(' & ').forEach(part => expect(validGroups.has(part)).toBe(true));
            plan[day].exercises.forEach(item => {
                if (item.dbId !== null) {
                    const entry = EXERCISE_DATABASE.find(e => e.id === item.dbId);
                    expect(item.name).toBe(entry.name);
                }
                expect(item.status).toBe('incomplete');
                expect(item.effectiveSets).toBe('');
                expect(ids.has(item.id)).toBe(false);
                ids.add(item.id);
            });
        });
        expect(plan.Monday.name).toBe('Chest & Triceps');
        expect(plan.Monday.exercises).toHaveLength(3);
        expect(plan.Monday.note).toBe('Warm up 5 min on the bike first');
        expect(plan.Monday.exercises[0].weight).toBe('');
        expect(plan.Thursday.exercises[0]).toMatchObject({ dbId: idOf('Stationary Bike'), sets: '20', reps: '' });
        expect(plan.Thursday.exercises[1]).toMatchObject({ dbId: null, name: 'Sled Push with rope', sets: '4', reps: '20' });
        expect(plan.Wednesday).toMatchObject({ name: 'Rest', exercises: [] });
    });

    it('keeps notes and hidden flags of days the import turns into Rest', () => {
        const parsed = parsePlanText('GYMPLAN v1\nMonday: Chest\n- Push-Ups 3x10\nTuesday: Legs\n- Barbell Squats 3x8\nThursday: Abs\n- Plank 3x30s\nFriday: Back\n- Lat Pulldowns 3x10');
        const { plan } = buildWeekFromImport(parsed, existingWeek());
        expect(plan.Saturday).toMatchObject({ name: 'Rest', exercises: [], hidden: true });
        expect(plan.Monday.note).toBe('keep me');
        expect(plan.Tuesday.hidden).toBeUndefined();
    });

    it('merges into the week, leaving unlisted days identical by reference', () => {
        const before = existingWeek();
        const parsed = parsePlanText('Friday: Back\n- Lat Pulldowns 3x10');
        const { plan } = buildWeekFromImport(parsed, before);
        expect(plan.Monday).toBe(before.Monday);
        expect(plan.Saturday).toBe(before.Saturday);
        expect(plan.Friday.name).toBe('Back');
        expect(plan.Friday.exercises).toHaveLength(1);
    });

    it('adds after the existing exercises and keeps the day label', () => {
        const before = existingWeek();
        const parsed = parsePlanText('Monday: Chest\n- Push-Ups 3x10');
        const { plan } = buildWeekFromImport(parsed, before, { preset: IMPORT_PRESETS.MERGE, perDay: { Monday: DAY_MODES.ADD } });
        expect(plan.Monday.name).toBe('Back');
        expect(plan.Monday.exercises.map(e => e.name)).toEqual(['Lat Pulldowns', 'Push-Ups']);
        expect(plan.Monday.exercises[0].weight).toBe('100');
        expect(plan.Monday.note).toBe('keep me');
    });

    it('takes the imported label when adding to a Rest day', () => {
        const parsed = parsePlanText('Tuesday: Legs\n- Barbell Squats 3x8');
        const { plan } = buildWeekFromImport(parsed, existingWeek(), { perDay: { Tuesday: DAY_MODES.ADD } });
        expect(plan.Tuesday.name).toBe('Legs');
        expect(plan.Tuesday.hidden).toBe(false);
    });

    it('skips a day on request', () => {
        const before = existingWeek();
        const parsed = parsePlanText('Monday: Chest\n- Push-Ups 3x10');
        const { plan } = buildWeekFromImport(parsed, before, { preset: IMPORT_PRESETS.MERGE, perDay: { Monday: DAY_MODES.SKIP } });
        expect(plan.Monday).toBe(before.Monday);
    });

    it('fills a missing group label from the matched exercises', () => {
        const parsed = parsePlanText('Monday:\n- Push-Ups 3x10\n- Cable Flyes 3x12\n- Lat Pulldowns 3x10');
        const { plan } = buildWeekFromImport(parsed, {});
        expect(plan.Monday.name).toBe('Chest');
    });

    it('handles minutes on strength entries and custom entries, and applies defaults', () => {
        const parsed = parsePlanText('Monday: Legs\n- Jump Rope 10 min\n- custom: Farm walk laps 15 min\n- Burpees 3x10');
        const { plan, warnings } = buildWeekFromImport(parsed, {});
        expect(plan.Monday.exercises[0]).toMatchObject({ dbId: idOf('Jump Rope'), sets: '1', reps: '10 min' });
        expect(plan.Monday.exercises[1]).toMatchObject({ dbId: null, sets: '1', reps: '15 min' });
        expect(plan.Monday.exercises[2]).toMatchObject({ dbId: idOf('Burpees'), sets: '3', reps: '' });
        const messages = warnings.map(w => w.message);
        expect(messages).toContain('Tracked as sets x reps');
        expect(messages).toContain('Sets read as minutes');
    });

    it('honors preview choices: pick a candidate or force custom', () => {
        const parsed = parsePlanText("Monday: Back\n- Farmer's Wa 3x40\n- Barbel Bench Pres 3x8");
        const [farmer, bench] = parsed.days.Monday.exercises;
        expect(farmer.match.confidence).toBe('none');
        expect(bench.match.confidence).toBe('fuzzy');
        const { plan } = buildWeekFromImport(parsed, {}, {
            choices: { [farmer.key]: idOf("Farmer's Walk"), [bench.key]: 'custom' }
        });
        expect(plan.Monday.exercises[0]).toMatchObject({ dbId: idOf("Farmer's Walk"), name: "Farmer's Walk" });
        expect(plan.Monday.exercises[1]).toMatchObject({ dbId: null, name: 'Barbel Bench Pres' });
    });

    it('stores hand-typed weights in pounds', () => {
        const parsed = parsePlanText('Monday: Chest\n- Barbell Bench Press 3x8 @ 60 kg\n- Push-Ups 3x10 @ 25');
        const { plan } = buildWeekFromImport(parsed, {}, { unit: 'lbs' });
        expect(Number(plan.Monday.exercises[0].weight)).toBeCloseTo(132.3, 0);
        expect(plan.Monday.exercises[1].weight).toBe('25');
    });
});

describe('looksLikePlan', () => {
    it('recognizes a header or a parsable day line, and nothing else', () => {
        expect(looksLikePlan('some chat text\nGYMPLAN v1\nMonday: Chest')).toBe(true);
        expect(looksLikePlan('Lunes: Pecho\n- Press de Banca con Barra 4x8')).toBe(true);
        expect(looksLikePlan('Nice work today, keep it up!')).toBe(false);
        expect(looksLikePlan('')).toBe(false);
        expect(looksLikePlan(null)).toBe(false);
    });
});
