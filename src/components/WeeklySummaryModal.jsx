/**
 * WeeklySummaryModal Component - Table view of the whole viewed week with
 * statistics (exercise count, total sets, sets per muscle group) and a
 * one-click CSV download that opens cleanly in Excel/Sheets.
 */

import React, { useMemo, useState } from 'react';
import Modal from './ui/Modal.jsx';
import Button from './ui/Button.jsx';
import { ButtonVariant } from './ui/Button.constants.js';
import WeekSummaryService from '../services/WeekSummaryService.js';
import ProgressService from '../services/ProgressService.js';
import LineChart from './charts/LineChart.jsx';
import { t } from '../translations/ui';
import { translateExercise, translateMuscleGroup } from '../translations/exercises';
import { formatWeekRange, parseISODate } from '../utils/dateHelper.js';
import { DAYS_OF_WEEK } from '../constants/AppConstants.js';
import { useUnits } from '../hooks/useUnits.js';
import { toDisplayWeight } from '../utils/weightUnits.js';

const thStyle = {
  textAlign: 'left',
  padding: '8px 10px',
  fontSize: '12px',
  fontWeight: 700,
  color: 'var(--brand)',
  backgroundColor: 'var(--brand-soft)',
  borderBottom: '2px solid var(--brand-border)',
  whiteSpace: 'nowrap'
};

const tdStyle = {
  padding: '7px 10px',
  fontSize: '13px',
  color: 'var(--text-2)',
  borderBottom: '1px solid var(--border)'
};

const numTd = { ...tdStyle, textAlign: 'center' };

const STATUS_ICONS = { completed: '✅', skipped: '⏭️', incomplete: '⬜' };

const tabStyle = (active) => ({
  flex: 1,
  padding: '8px 12px',
  borderRadius: '10px',
  border: `1px solid ${active ? 'var(--brand)' : 'var(--border)'}`,
  background: active ? 'var(--brand)' : 'var(--surface)',
  color: active ? 'var(--on-brand)' : 'var(--text-2)',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer'
});

const shortWeek = (weekStart, language) => parseISODate(weekStart)
  .toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { month: 'short', day: 'numeric' });

const formatNumber = (value, language) => Math.round(value).toLocaleString(language === 'es' ? 'es-ES' : 'en-US');

function StatTile({ label, value }) {
  return (
    <div style={{
      flex: '1 1 110px',
      backgroundColor: 'var(--surface-2)',
      border: '1px solid var(--border)',
      borderRadius: '10px',
      padding: '10px 12px',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--brand)' }}>{value}</div>
      <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>{label}</div>
    </div>
  );
}

export default function WeeklySummaryModal({ isOpen, onClose, workoutPlan, weekStart, language, history = null, currentWeekStart = null }) {
  const { unit } = useUnits();
  const [tab, setTab] = useState('week');
  const progress = useMemo(
    () => (history ? ProgressService.buildProgress(history, { upTo: currentWeekStart ?? undefined }) : { weeks: [], exercises: [] }),
    [history, currentWeekStart]
  );
  const weeksWithData = ProgressService.weeksWithData(progress);
  // Weights are stored in pounds; show and export them in the chosen unit.
  const summary = useMemo(() => {
    if (!workoutPlan) return null;
    const built = WeekSummaryService.buildSummary(workoutPlan);
    return {
      ...built,
      rows: built.rows.map(row => ({ ...row, weight: toDisplayWeight(row.weight, unit) }))
    };
  }, [workoutPlan, unit]);

  if (!summary) return null;

  const weekLabel = weekStart ? formatWeekRange(weekStart, language) : '';

  const downloadCsv = () => {
    const csv = WeekSummaryService.toCsv(summary, weekLabel, language, unit);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gym-tracker-week-${weekStart || 'current'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadProgressCsv = () => {
    const csv = ProgressService.toCsv(progress, language, unit);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'gym-tracker-progress.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const volumePoints = progress.weeks.map(week => ({ label: week.weekStart, value: ProgressService.displayVolume(week.volume, unit) }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`📊 ${t('Weekly Summary', language)}`}
      style={{ width: '860px' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {history && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" style={tabStyle(tab === 'week')} aria-pressed={tab === 'week'} onClick={() => setTab('week')}>
              {t('This week', language)}
            </button>
            <button type="button" style={tabStyle(tab === 'progress')} aria-pressed={tab === 'progress'} onClick={() => setTab('progress')}>
              {t('Progress', language)}
            </button>
          </div>
        )}

        {tab === 'progress' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-3)' }}>
                {t('Volume is done sets x reps x weight, across the weeks stored on this account.', language)}
              </span>
              {weeksWithData >= 2 && (
                <Button variant={ButtonVariant.SECONDARY} onClick={downloadProgressCsv} style={{ fontSize: '13px' }}>
                  {t('Download progress CSV', language)}
                </Button>
              )}
            </div>

            {weeksWithData < 2 ? (
              <p style={{ margin: 0, padding: '24px 16px', textAlign: 'center', color: 'var(--text-3)', background: 'var(--surface-2)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
                {t('Progress appears once two weeks have logged sets. Keep tapping Log set.', language)}
              </p>
            ) : (
              <>
                <div>
                  <h3 style={{ fontSize: '14px', margin: '0 0 8px 0', color: 'var(--text-2)' }}>
                    {t('Weekly volume', language)} ({unit})
                  </h3>
                  <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px' }}>
                    <LineChart
                      points={volumePoints}
                      height={170}
                      ariaLabel={`${t('Weekly volume', language)} (${unit})`}
                      formatValue={(v) => formatNumber(v, language)}
                      formatLabel={(label) => shortWeek(label, language)}
                    />
                  </div>
                  <div style={{ overflowX: 'auto', marginTop: '10px' }}>
                    <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                      <thead>
                        <tr>
                          <th style={thStyle}>{t('Week', language)}</th>
                          <th style={{ ...thStyle, textAlign: 'center' }}>{t('Volume', language)} ({unit})</th>
                          <th style={{ ...thStyle, textAlign: 'center' }}>{t('Sets done', language)}</th>
                          <th style={{ ...thStyle, textAlign: 'center' }}>{t('Cardio (min)', language)}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...progress.weeks].reverse().map(week => (
                          <tr key={week.weekStart}>
                            <td style={tdStyle}>{formatWeekRange(week.weekStart, language)}</td>
                            <td style={numTd}>{formatNumber(ProgressService.displayVolume(week.volume, unit), language)}</td>
                            <td style={numTd}>{week.doneSets}</td>
                            <td style={numTd}>{week.cardioMinutes || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: '14px', margin: '0 0 8px 0', color: 'var(--text-2)' }}>
                    {t('By exercise', language)}
                  </h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                      <thead>
                        <tr>
                          <th style={thStyle}>{t('Exercise', language)}</th>
                          <th style={thStyle}>{t('Volume', language)}</th>
                          <th style={{ ...thStyle, textAlign: 'center' }}>{t('Best', language)} ({unit})</th>
                          <th style={{ ...thStyle, textAlign: 'center' }}>{t('Last', language)} ({unit})</th>
                          <th style={{ ...thStyle, textAlign: 'center' }}>{t('Last volume', language)}</th>
                          <th style={{ ...thStyle, textAlign: 'center' }}>{t('Change', language)}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {progress.exercises.filter(ex => ex.weeksLogged > 0).map(ex => {
                          const delta = ex.delta === null ? null : ProgressService.displayVolume(ex.delta, unit);
                          return (
                            <tr key={ex.key}>
                              <td style={tdStyle}>{translateExercise(ex.name, language)}</td>
                              <td style={{ ...tdStyle, width: '130px' }}>
                                {ex.weeksLogged >= 2 ? (
                                  <LineChart
                                    compact
                                    height={28}
                                    points={ex.points.map(p => ({ label: p.weekStart, value: ProgressService.displayVolume(p.volume, unit) }))}
                                    ariaLabel={`${translateExercise(ex.name, language)}: ${t('Volume', language)}`}
                                    formatValue={(v) => formatNumber(v, language)}
                                    formatLabel={(label) => shortWeek(label, language)}
                                  />
                                ) : '—'}
                              </td>
                              <td style={numTd}>{ex.bestWeight ? toDisplayWeight(ex.bestWeight, unit) : '—'}</td>
                              <td style={numTd}>{ex.lastWeight ? toDisplayWeight(ex.lastWeight, unit) : '—'}</td>
                              <td style={numTd}>{formatNumber(ProgressService.displayVolume(ex.lastVolume, unit), language)}</td>
                              <td style={{ ...numTd, color: delta === null || delta === 0 ? 'var(--text-3)' : (delta > 0 ? 'var(--done)' : 'var(--skipped)'), fontWeight: 600 }}>
                                {delta === null ? '—' : `${delta > 0 ? '+' : ''}${formatNumber(delta, language)}`}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {tab === 'week' && (<>
        {/* Week + download */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--brand)' }}>
            {t('Week of', language)} {weekLabel}
          </span>
          <Button variant={ButtonVariant.SECONDARY} onClick={downloadCsv} style={{ fontSize: '13px' }}>
            ⬇️ {t('Download CSV', language)}
          </Button>
        </div>

        {/* Stat tiles */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <StatTile label={t('Total exercises', language)} value={summary.totals.exercises} />
          <StatTile label={t('Completed', language)} value={summary.totals.completed} />
          <StatTile label={t('Total sets', language)} value={summary.totals.totalSets} />
          <StatTile label={t('Sets done', language)} value={summary.totals.doneSets} />
          {summary.totals.cardioMinutes > 0 && (
            <StatTile label={t('Cardio (min)', language)} value={summary.totals.cardioMinutes} />
          )}
        </div>

        {/* Sets per muscle group */}
        {summary.byMuscle.length > 0 && (
          <div>
            <h3 style={{ fontSize: '14px', margin: '0 0 8px 0', color: 'var(--text-2)' }}>
              {t('Sets per muscle group', language)}
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>{t('Muscle group', language)}</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>{t('Exercises', language)}</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>{t('Sets', language)}</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>{t('Sets done', language)}</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.byMuscle.map(group => (
                    <tr key={group.muscle}>
                      <td style={tdStyle}>{translateMuscleGroup(group.muscle, language)}</td>
                      <td style={numTd}>{group.exercises}</td>
                      <td style={numTd}>{group.sets}</td>
                      <td style={numTd}>{group.doneSets}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Full week table, grouped by day */}
        <div>
          <h3 style={{ fontSize: '14px', margin: '0 0 8px 0', color: 'var(--text-2)' }}>
            {t('Week detail', language)}
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  <th style={thStyle}>{t('Exercise', language)}</th>
                  <th style={thStyle}>{t('Muscle group', language)}</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>{t('Sets', language)}</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>{t('Reps', language)}</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>{t('Weight', language)} ({unit})</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>{t('Sets done', language)}</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>{t('Status', language)}</th>
                </tr>
              </thead>
              <tbody>
                {DAYS_OF_WEEK.map(day => {
                  const dayRows = summary.rows.filter(row => row.day === day);
                  if (dayRows.length === 0) return null;
                  return (
                    <React.Fragment key={day}>
                      <tr>
                        <td colSpan={7} style={{
                          ...tdStyle,
                          backgroundColor: 'var(--surface-2)',
                          fontWeight: 700,
                          color: 'var(--brand)'
                        }}>
                          {t(day, language)} — {translateMuscleGroup(dayRows[0].focus, language)}
                        </td>
                      </tr>
                      {dayRows.map((row, i) => (
                        <tr key={`${day}-${i}`}>
                          <td style={tdStyle}>{translateExercise(row.name, language)}</td>
                          <td style={tdStyle}>{translateMuscleGroup(row.muscleGroup, language)}</td>
                          <td style={numTd}>{row.targetSets}</td>
                          <td style={numTd}>{row.reps || '—'}</td>
                          <td style={numTd}>{row.weight || '—'}</td>
                          <td style={numTd}>{row.doneSets || '—'}</td>
                          <td style={numTd} title={t(row.status, language)}>
                            {STATUS_ICONS[row.status] ?? STATUS_ICONS.incomplete}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        </>)}
      </div>
    </Modal>
  );
}
