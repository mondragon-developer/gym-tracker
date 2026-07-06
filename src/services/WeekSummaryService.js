/**
 * Week Summary Service - Aggregates a week's plan into table rows and stats
 * (exercise count, total sets, sets per muscle group) and exports them as CSV.
 * Pure functions over the WorkoutPlan shape; no storage access.
 */

import { EXERCISE_DATABASE } from '../constants/index.js';
import { DAYS_OF_WEEK } from '../constants/AppConstants.js';
import ExerciseService from './ExerciseService.js';
import { t } from '../translations/ui';
import { translateExercise, translateMuscleGroup } from '../translations/exercises';

/**
 * Parses a sets/reps-style string ("4", "12") into a count; ranges and empty
 * values ("8-10", "") fall back to the leading number or 0.
 * @param {string|number} value - Raw field value
 * @returns {number} Parsed count
 */
const toCount = (value) => {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/**
 * Resolves an exercise's muscle group: library exercises map through the
 * database; custom exercises inherit the day's first muscle group.
 * @param {Object} exercise - Exercise row from the plan
 * @param {Object} dayPlan - The day the exercise belongs to
 * @returns {string} Muscle group name (English canonical)
 */
const resolveMuscleGroup = (exercise, dayPlan) => {
  if (exercise.dbId) {
    const dbExercise = EXERCISE_DATABASE.find(ex => ex.id === exercise.dbId);
    if (dbExercise?.muscleGroup) return dbExercise.muscleGroup;
  }
  const first = (dayPlan.name || '').split(' & ')[0];
  return first && first !== 'Rest' ? first : 'Other';
};

class WeekSummaryService {
  /**
   * Builds the weekly summary for a plan.
   * Cardio "sets" are minutes, so cardio is totalled separately and excluded
   * from the per-muscle sets table to avoid mixing units.
   * @param {Object} workoutPlan - WorkoutPlan (one week, day -> DayPlan)
   * @returns {{rows: Array, totals: Object, byMuscle: Array}} Summary data
   */
  static buildSummary(workoutPlan) {
    const rows = [];

    DAYS_OF_WEEK.forEach(day => {
      const dayPlan = workoutPlan?.[day];
      if (!dayPlan) return;
      dayPlan.exercises.forEach(exercise => {
        rows.push({
          day,
          focus: dayPlan.name || '',
          name: exercise.name,
          muscleGroup: resolveMuscleGroup(exercise, dayPlan),
          isCardio: ExerciseService.isCardioExercise(exercise),
          targetSets: toCount(exercise.sets),
          doneSets: toCount(exercise.effectiveSets),
          reps: exercise.reps || '',
          weight: exercise.weight || '',
          status: exercise.status || 'incomplete'
        });
      });
    });

    const strength = rows.filter(r => !r.isCardio);
    const cardio = rows.filter(r => r.isCardio);

    const totals = {
      exercises: rows.length,
      completed: rows.filter(r => r.status === 'completed').length,
      totalSets: strength.reduce((sum, r) => sum + r.targetSets, 0),
      doneSets: strength.reduce((sum, r) => sum + r.doneSets, 0),
      cardioMinutes: cardio.reduce((sum, r) => sum + r.targetSets, 0),
      cardioDoneMinutes: cardio.reduce((sum, r) => sum + r.doneSets, 0)
    };

    const groups = new Map();
    strength.forEach(row => {
      const entry = groups.get(row.muscleGroup) ?? { muscle: row.muscleGroup, exercises: 0, sets: 0, doneSets: 0 };
      entry.exercises += 1;
      entry.sets += row.targetSets;
      entry.doneSets += row.doneSets;
      groups.set(row.muscleGroup, entry);
    });
    const byMuscle = [...groups.values()].sort((a, b) => b.sets - a.sets);

    return { rows, totals, byMuscle };
  }

  /**
   * Escapes a CSV field (quotes fields containing separators or quotes)
   * @param {string|number} value - Field value
   * @returns {string} Escaped field
   */
  static csvEscape(value) {
    const s = String(value ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }

  /**
   * Renders the summary as a CSV file body (BOM included so Excel opens
   * accented Spanish text correctly).
   * @param {{rows: Array, totals: Object, byMuscle: Array}} summary - From buildSummary
   * @param {string} weekLabel - Human-readable week range for the header
   * @param {string} language - UI language for headers and names
   * @returns {string} CSV text
   */
  static toCsv(summary, weekLabel, language = 'en') {
    const esc = WeekSummaryService.csvEscape;
    const lines = [];

    lines.push(`${esc(t('Week of', language))},${esc(weekLabel)}`);
    lines.push('');
    lines.push([
      t('Day', language), t('Exercise', language), t('Muscle group', language),
      t('Sets', language), t('Reps', language), t('Weight', language),
      t('Sets done', language), t('Status', language)
    ].map(esc).join(','));

    summary.rows.forEach(row => {
      lines.push([
        t(row.day, language),
        translateExercise(row.name, language),
        translateMuscleGroup(row.muscleGroup, language),
        row.targetSets,
        row.reps,
        row.weight,
        row.doneSets,
        t(row.status, language)
      ].map(esc).join(','));
    });

    lines.push('');
    lines.push(`${esc(t('Total exercises', language))},${summary.totals.exercises}`);
    lines.push(`${esc(t('Completed', language))},${summary.totals.completed}`);
    lines.push(`${esc(t('Total sets', language))},${summary.totals.totalSets}`);
    lines.push(`${esc(t('Sets done', language))},${summary.totals.doneSets}`);
    if (summary.totals.cardioMinutes > 0) {
      lines.push(`${esc(t('Cardio (min)', language))},${summary.totals.cardioMinutes}`);
      lines.push(`${esc(t('Cardio done (min)', language))},${summary.totals.cardioDoneMinutes}`);
    }

    lines.push('');
    lines.push([
      t('Muscle group', language), t('Exercises', language),
      t('Sets', language), t('Sets done', language)
    ].map(esc).join(','));
    summary.byMuscle.forEach(group => {
      lines.push([
        translateMuscleGroup(group.muscle, language),
        group.exercises,
        group.sets,
        group.doneSets
      ].map(esc).join(','));
    });

    return '\uFEFF' + lines.join('\n');
  }
}

export default WeekSummaryService;
