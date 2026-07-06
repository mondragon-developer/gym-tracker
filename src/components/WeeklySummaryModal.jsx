/**
 * WeeklySummaryModal Component - Table view of the whole viewed week with
 * statistics (exercise count, total sets, sets per muscle group) and a
 * one-click CSV download that opens cleanly in Excel/Sheets.
 */

import React, { useMemo } from 'react';
import Modal from './ui/Modal.jsx';
import Button from './ui/Button.jsx';
import { ButtonVariant } from './ui/Button.constants.js';
import WeekSummaryService from '../services/WeekSummaryService.js';
import { t } from '../translations/ui';
import { translateExercise, translateMuscleGroup } from '../translations/exercises';
import { formatWeekRange } from '../utils/dateHelper.js';
import { DAYS_OF_WEEK } from '../constants/AppConstants.js';

const thStyle = {
  textAlign: 'left',
  padding: '8px 10px',
  fontSize: '12px',
  fontWeight: 700,
  color: '#164e63',
  backgroundColor: '#ecfeff',
  borderBottom: '2px solid #a5f3fc',
  whiteSpace: 'nowrap'
};

const tdStyle = {
  padding: '7px 10px',
  fontSize: '13px',
  color: '#374151',
  borderBottom: '1px solid #f3f4f6'
};

const numTd = { ...tdStyle, textAlign: 'center' };

const STATUS_ICONS = { completed: '✅', skipped: '⏭️', incomplete: '⬜' };

function StatTile({ label, value }) {
  return (
    <div style={{
      flex: '1 1 110px',
      backgroundColor: '#f9fafb',
      border: '1px solid #e5e7eb',
      borderRadius: '10px',
      padding: '10px 12px',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '22px', fontWeight: 700, color: '#0e7490' }}>{value}</div>
      <div style={{ fontSize: '12px', color: '#6b7280' }}>{label}</div>
    </div>
  );
}

export default function WeeklySummaryModal({ isOpen, onClose, workoutPlan, weekStart, language }) {
  const summary = useMemo(
    () => (workoutPlan ? WeekSummaryService.buildSummary(workoutPlan) : null),
    [workoutPlan]
  );

  if (!summary) return null;

  const weekLabel = weekStart ? formatWeekRange(weekStart, language) : '';

  const downloadCsv = () => {
    const csv = WeekSummaryService.toCsv(summary, weekLabel, language);
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`📊 ${t('Weekly Summary', language)}`}
      style={{ width: '860px' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Week + download */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#164e63' }}>
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
            <h3 style={{ fontSize: '14px', margin: '0 0 8px 0', color: '#374151' }}>
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
          <h3 style={{ fontSize: '14px', margin: '0 0 8px 0', color: '#374151' }}>
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
                  <th style={{ ...thStyle, textAlign: 'center' }}>{t('Weight', language)}</th>
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
                          backgroundColor: '#f9fafb',
                          fontWeight: 700,
                          color: '#164e63'
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
      </div>
    </Modal>
  );
}
