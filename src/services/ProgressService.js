/**
 * Progress Service - Week-over-week numbers from the stored history: volume
 * per week and, per exercise, volume and top weight per week. Pure functions
 * over the versioned history object; no storage access.
 *
 * Volume is done sets x reps x weight, in stored pounds. Rep ranges count
 * their lower bound, so "8-10" is 8. Entries without a numeric weight add
 * sets but no volume. Cardio and combat entries are minutes and are kept
 * apart from volume.
 */

import { DAYS_OF_WEEK } from '../constants/AppConstants.js';
import ExerciseService from './ExerciseService.js';
import { t } from '../translations/ui';
import { translateExercise } from '../translations/exercises';
import { isNumericWeight, toDisplayWeight, LBS_PER_KG } from '../utils/weightUnits.js';

const toCount = (value) => {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const toWeight = (value) => (isNumericWeight(value) ? Number(String(value).replace(',', '.')) : 0);

const exerciseKey = (exercise) => (exercise.dbId ? `db:${exercise.dbId}` : `name:${String(exercise.name || '').trim().toLowerCase()}`);

class ProgressService {
  /**
   * @param {Object} history versioned history { currentWeekStart, weeks }
   * @param {{ upTo?: string }} [options] last week to include (defaults to the current week)
   * @returns {{ weeks: Array, exercises: Array }}
   */
  static buildProgress(history, { upTo } = {}) {
    if (!history || !history.weeks) return { weeks: [], exercises: [] };
    const limit = upTo ?? history.currentWeekStart;
    const weekStarts = Object.keys(history.weeks).filter(key => !limit || key <= limit).sort();

    const perExercise = new Map();
    const weeks = weekStarts.map(weekStart => {
      const plan = history.weeks[weekStart];
      let volume = 0;
      let doneSets = 0;
      let cardioMinutes = 0;
      let exercises = 0;

      DAYS_OF_WEEK.forEach(day => {
        (plan?.[day]?.exercises || []).forEach(exercise => {
          exercises += 1;
          const done = toCount(exercise.effectiveSets);
          if (ExerciseService.isCardioExercise(exercise)) {
            cardioMinutes += done;
            return;
          }
          const reps = toCount(exercise.reps);
          const weight = toWeight(exercise.weight);
          const lifted = done * reps * weight;
          volume += lifted;
          doneSets += done;

          const key = exerciseKey(exercise);
          const entry = perExercise.get(key) ?? { key, name: exercise.name, dbId: exercise.dbId ?? null, byWeek: new Map() };
          const point = entry.byWeek.get(weekStart) ?? { weekStart, volume: 0, topWeight: 0, doneSets: 0 };
          point.volume += lifted;
          point.doneSets += done;
          if (done > 0 && weight > point.topWeight) point.topWeight = weight;
          entry.byWeek.set(weekStart, point);
          perExercise.set(key, entry);
        });
      });

      return { weekStart, volume, doneSets, cardioMinutes, exercises };
    });

    const exercises = [...perExercise.values()].map(entry => {
      const points = weekStarts.map(weekStart => entry.byWeek.get(weekStart) ?? { weekStart, volume: 0, topWeight: 0, doneSets: 0 });
      const logged = points.filter(p => p.doneSets > 0);
      const bestWeight = points.reduce((best, p) => Math.max(best, p.topWeight), 0);
      const last = [...logged].reverse()[0] ?? null;
      const previous = [...logged].reverse()[1] ?? null;
      return {
        key: entry.key,
        name: entry.name,
        dbId: entry.dbId,
        points,
        weeksLogged: logged.length,
        bestWeight,
        lastWeight: last ? last.topWeight : 0,
        lastVolume: last ? last.volume : 0,
        // Change in volume against the previous logged week; null with one week.
        delta: last && previous ? last.volume - previous.volume : null
      };
    }).sort((a, b) => b.weeksLogged - a.weeksLogged || b.lastVolume - a.lastVolume || a.name.localeCompare(b.name));

    return { weeks, exercises };
  }

  /** Number of weeks with any logged set, the gate for showing charts. */
  static weeksWithData(progress) {
    return progress.weeks.filter(w => w.doneSets > 0 || w.cardioMinutes > 0).length;
  }

  /** Volume in the display unit, rounded to whole units. */
  static displayVolume(volumeLbs, unit) {
    const value = unit === 'kg' ? volumeLbs / LBS_PER_KG : volumeLbs;
    return Math.round(value);
  }

  static csvEscape(value) {
    const text = String(value ?? '');
    const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
    return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  }

  /**
   * One row per exercise per week, plus weekly totals at the end.
   */
  static toCsv(progress, language = 'en', unit = 'lbs') {
    const esc = ProgressService.csvEscape;
    const lines = [];
    lines.push([t('Exercise', language), t('Week', language), t('Sets done', language), `${t('Top weight', language)} (${unit})`, `${t('Volume', language)} (${unit})`].map(esc).join(','));
    progress.exercises.forEach(exercise => {
      exercise.points.forEach(point => {
        if (point.doneSets === 0) return;
        lines.push([
          translateExercise(exercise.name, language),
          point.weekStart,
          point.doneSets,
          toDisplayWeight(point.topWeight, unit),
          ProgressService.displayVolume(point.volume, unit)
        ].map(esc).join(','));
      });
    });
    lines.push('');
    lines.push([t('Week', language), t('Sets done', language), `${t('Volume', language)} (${unit})`, t('Cardio (min)', language)].map(esc).join(','));
    progress.weeks.forEach(week => {
      lines.push([week.weekStart, week.doneSets, ProgressService.displayVolume(week.volume, unit), week.cardioMinutes].map(esc).join(','));
    });
    return '\ufeff' + lines.join('\n');
  }
}

export default ProgressService;
