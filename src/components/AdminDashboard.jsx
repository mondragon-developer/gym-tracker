/**
 * Admin Dashboard Component
 * Lets admins list users, manage roles, and set each user's DEFAULT TRAINING
 * VALUES (sets / reps / weight) for the fixed weekly split. Admins deliberately
 * cannot add exercises, change muscle groups, set rest days, or add custom
 * exercises here — the plan structure stays the standard Push/Pull/Leg split.
 * All data access goes through AdminService; the database's admin RLS policies
 * are the real gatekeeper, so this UI failing open is not a security hole.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { useLanguage } from '../hooks/useLanguage.js';
import { t } from '../translations/ui';
import { translateMuscleGroup, translateExercise } from '../translations/exercises';
import { adminService } from '../services/AdminService';
import workoutService from '../services/workoutService.js';
import WeekPlanService from '../services/WeekPlanService.js';
import { formatWeekRange } from '../utils/dateHelper.js';
import Button from './ui/Button.jsx';
import { ButtonVariant } from './ui/Button.constants.js';
import { DAYS_OF_WEEK } from '../constants/AppConstants.js';

const cardStyle = {
  backgroundColor: 'white',
  borderRadius: '12px',
  border: '1px solid #e5e7eb',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)'
};

const inputStyle = {
  width: '100%',
  padding: '6px 8px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '13px',
  color: '#374151'
};

/**
 * Confirm-on-second-click button. Avoids native confirm() dialogs and keeps
 * destructive actions two-step without wiring a modal per action.
 */
function ConfirmButton({ label, confirmLabel, onConfirm, variant = ButtonVariant.DANGER }) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(timer);
  }, [armed]);

  return (
    <Button
      variant={armed ? ButtonVariant.DANGER : variant}
      onClick={() => {
        if (armed) {
          setArmed(false);
          onConfirm();
        } else {
          setArmed(true);
        }
      }}
      style={{ fontSize: '13px' }}
    >
      {armed ? confirmLabel : label}
    </Button>
  );
}

export default function AdminDashboard({ onBack }) {
  const { user: currentUser } = useAuth();
  const { language } = useLanguage();

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedUser, setSelectedUser] = useState(null);
  // The user's whole weekly history; admins edit only its CURRENT week.
  const [history, setHistory] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saveState, setSaveState] = useState('idle'); // idle | saving | saved

  const plan = history ? history.weeks[history.currentWeekStart] ?? null : null;

  const loadUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      setError('');
      setUsers(await adminService.listUsers());
    } catch (err) {
      console.error('Error loading users:', err);
      setError(t('Failed to load users. Are you an admin?', language));
    } finally {
      setUsersLoading(false);
    }
  }, [language]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const selectUser = async (user) => {
    setSelectedUser(user);
    setHistory(null);
    setIsDirty(false);
    setSaveState('idle');
    try {
      setPlanLoading(true);
      setError('');
      const raw = await adminService.getWorkoutPlan(user.id);
      // raw is null when the user has no cloud plan yet; otherwise migrate the
      // stored blob to the versioned history and edit its current week.
      setHistory(raw ? WeekPlanService.migrate(raw) : null);
    } catch (err) {
      console.error('Error loading workout plan:', err);
      setError(`${t('Failed to load workout plan for', language)} ${user.email}`);
    } finally {
      setPlanLoading(false);
    }
  };

  const toggleRole = async (user) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    try {
      setError('');
      await adminService.setUserRole(user.id, newRole);
      setUsers(prev => prev.map(u => (u.id === user.id ? { ...u, role: newRole } : u)));
    } catch (err) {
      console.error('Error changing role:', err);
      setError(`${t('Failed to change role for', language)} ${user.email}`);
    }
  };

  // Admins edit only the numeric training targets (sets/reps/weight). The plan
  // structure — which days, muscle groups, and exercises — is intentionally
  // fixed, so there is no add/remove/muscle-group affordance here.
  const updateExercise = (day, exerciseId, field, value) => {
    setHistory(prev => {
      if (!prev) return prev;
      const wk = prev.currentWeekStart;
      const week = prev.weeks[wk];
      const nextWeek = {
        ...week,
        [day]: {
          ...week[day],
          exercises: week[day].exercises.map(ex =>
            ex.id === exerciseId ? { ...ex, [field]: value } : ex
          )
        }
      };
      return { ...prev, weeks: { ...prev.weeks, [wk]: nextWeek } };
    });
    setIsDirty(true);
    setSaveState('idle');
  };

  const savePlan = async () => {
    try {
      setSaveState('saving');
      setError('');
      await adminService.saveWorkoutPlan(selectedUser.id, history);
      setIsDirty(false);
      setSaveState('saved');
    } catch (err) {
      console.error('Error saving workout plan:', err);
      setError(`${t('Failed to save workout plan for', language)} ${selectedUser.email}`);
      setSaveState('idle');
    }
  };

  const resetPlanToDefault = () => {
    setHistory(prev => {
      if (prev) {
        return {
          ...prev,
          weeks: { ...prev.weeks, [prev.currentWeekStart]: workoutService.getInitialPlan() }
        };
      }
      // No cloud plan yet — create a fresh single-week history to save.
      return WeekPlanService.migrate(null);
    });
    setIsDirty(true);
    setSaveState('idle');
  };

  const deleteCloudPlan = async () => {
    try {
      setError('');
      await adminService.deleteWorkoutPlan(selectedUser.id);
      setHistory(null);
      setIsDirty(false);
    } catch (err) {
      console.error('Error deleting workout plan:', err);
      setError(`${t('Failed to delete workout plan for', language)} ${selectedUser.email}`);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      color: '#374151',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
        {/* Header */}
        <div style={{
          padding: '24px 32px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #06b6d4 0%, #0e7490 50%, #0f172a 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '24px'
        }}>
          <div>
            <h1 style={{ color: 'white', fontSize: '22px', margin: '0 0 4px 0' }}>
              🛡️ {t('Admin panel', language)}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', margin: 0 }}>
              {t("Set each user's default training values.", language)}{' '}
              {t("You can't add exercises, change muscle groups, or set rest days.", language)}
            </p>
          </div>
          <Button variant={ButtonVariant.SECONDARY} onClick={onBack} style={{ fontSize: '14px' }}>
            ← {t('Back to tracker', language)}
          </Button>
        </div>

        {error && (
          <div style={{
            ...cardStyle,
            padding: '12px 16px',
            marginBottom: '16px',
            borderColor: '#fca5a5',
            backgroundColor: '#fef2f2',
            color: '#b91c1c',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* User list */}
          <div style={{ ...cardStyle, flex: '1 1 300px', maxWidth: '420px' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', fontWeight: 600 }}>
              {t('Users', language)} {usersLoading ? '' : `(${users.length})`}
            </div>
            {usersLoading ? (
              <p style={{ padding: '16px', margin: 0, color: '#6b7280' }}>
                {t('Loading users...', language)}
              </p>
            ) : (
              users.map(user => (
                <div
                  key={user.id}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #f3f4f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    backgroundColor: selectedUser?.id === user.id ? '#ecfeff' : 'transparent'
                  }}
                >
                  <button
                    onClick={() => selectUser(user)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      textAlign: 'left',
                      flex: 1,
                      minWidth: 0
                    }}
                  >
                    <span style={{
                      display: 'block',
                      fontSize: '14px',
                      color: '#111827',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {user.email || user.id}
                    </span>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                      {user.role === 'admin' ? `🛡️ ${t('admin', language)}` : t('user', language)}
                      {user.id === currentUser?.id ? ` · ${t('you', language)}` : ''}
                    </span>
                  </button>
                  {/* Admins cannot demote themselves — prevents locking everyone out */}
                  {user.id !== currentUser?.id && (
                    <ConfirmButton
                      label={user.role === 'admin' ? t('Demote', language) : t('Make admin', language)}
                      confirmLabel={t('Confirm?', language)}
                      variant={ButtonVariant.SECONDARY}
                      onConfirm={() => toggleRole(user)}
                    />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Plan editor — default training values only */}
          <div style={{ ...cardStyle, flex: '2 1 420px', padding: '16px' }}>
            {!selectedUser ? (
              <p style={{ margin: 0, color: '#6b7280' }}>
                {t('Select a user to view their workout plan.', language)}
              </p>
            ) : planLoading ? (
              <p style={{ margin: 0, color: '#6b7280' }}>
                {t('Loading plan for', language)} {selectedUser.email}…
              </p>
            ) : (
              <>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginBottom: '16px'
                }}>
                  <div>
                    <h2 style={{ fontSize: '16px', margin: 0 }}>{selectedUser.email}</h2>
                    {history && (
                      <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0 0' }}>
                        {t('Week of', language)} {formatWeekRange(history.currentWeekStart, language)}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <ConfirmButton
                      label={t('Reset to default', language)}
                      confirmLabel={t('Confirm reset?', language)}
                      variant={ButtonVariant.SECONDARY}
                      onConfirm={resetPlanToDefault}
                    />
                    {plan && (
                      <ConfirmButton
                        label={t('Delete cloud data', language)}
                        confirmLabel={t('Confirm delete?', language)}
                        onConfirm={deleteCloudPlan}
                      />
                    )}
                    <Button
                      onClick={savePlan}
                      disabled={!isDirty || saveState === 'saving'}
                      style={{ fontSize: '13px' }}
                    >
                      {saveState === 'saving'
                        ? t('Saving...', language)
                        : saveState === 'saved'
                          ? `${t('Saved', language)} ✓`
                          : t('Save changes', language)}
                    </Button>
                  </div>
                </div>

                {!plan ? (
                  <p style={{ margin: 0, color: '#6b7280' }}>
                    {t('No cloud workout plan yet. "Reset to default" creates one you can save.', language)}
                  </p>
                ) : (
                  DAYS_OF_WEEK.map(day => {
                    const dayPlan = plan[day];
                    if (!dayPlan) return null;
                    return (
                      <div key={day} style={{ marginBottom: '16px' }}>
                        <h3 style={{
                          fontSize: '14px',
                          margin: '0 0 8px 0',
                          color: '#0e7490'
                        }}>
                          {t(day, language)} — {translateMuscleGroup(dayPlan.name, language)}
                        </h3>
                        {dayPlan.exercises.length === 0 ? (
                          <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>
                            {t('No exercises.', language)}
                          </p>
                        ) : (
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                              <thead>
                                <tr style={{ textAlign: 'left', color: '#6b7280' }}>
                                  <th style={{ padding: '4px 8px 4px 0' }}>{t('Exercise', language)}</th>
                                  <th style={{ padding: '4px 8px' }}>{t('Sets', language)}</th>
                                  <th style={{ padding: '4px 8px' }}>{t('Reps', language)}</th>
                                  <th style={{ padding: '4px 8px' }}>{t('Weight', language)}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {dayPlan.exercises.map(ex => (
                                  <tr key={ex.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                                    <td style={{ padding: '6px 8px 6px 0', color: '#111827' }}>
                                      {translateExercise(ex.name, language)}
                                    </td>
                                    <td style={{ padding: '6px 8px', width: '64px' }}>
                                      <input
                                        style={inputStyle}
                                        value={ex.sets ?? ''}
                                        onChange={e => updateExercise(day, ex.id, 'sets', e.target.value)}
                                      />
                                    </td>
                                    <td style={{ padding: '6px 8px', width: '80px' }}>
                                      <input
                                        style={inputStyle}
                                        value={ex.reps ?? ''}
                                        onChange={e => updateExercise(day, ex.id, 'reps', e.target.value)}
                                      />
                                    </td>
                                    <td style={{ padding: '6px 8px', width: '80px' }}>
                                      <input
                                        style={inputStyle}
                                        value={ex.weight ?? ''}
                                        onChange={e => updateExercise(day, ex.id, 'weight', e.target.value)}
                                      />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
