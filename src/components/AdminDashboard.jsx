/**
 * Admin Dashboard Component
 * Lets admins list users, manage roles, and view/edit any user's workout plan.
 * All data access goes through AdminService; the database's admin RLS policies
 * are the real gatekeeper, so this UI failing open is not a security hole.
 * Admin-only surface — intentionally English-only to keep translations lean.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { adminService } from '../services/AdminService';
import workoutService from '../services/workoutService.js';
import Button from './ui/Button.jsx';
import { ButtonVariant } from './ui/Button.constants.js';
import { DAYS_OF_WEEK } from '../constants/AppConstants.js';

const STATUS_OPTIONS = ['incomplete', 'completed', 'skipped'];

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

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedUser, setSelectedUser] = useState(null);
  const [plan, setPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saveState, setSaveState] = useState('idle'); // idle | saving | saved

  const loadUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      setError('');
      setUsers(await adminService.listUsers());
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users. Are you an admin?');
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const selectUser = async (user) => {
    setSelectedUser(user);
    setPlan(null);
    setIsDirty(false);
    setSaveState('idle');
    try {
      setPlanLoading(true);
      setError('');
      setPlan(await adminService.getWorkoutPlan(user.id));
    } catch (err) {
      console.error('Error loading workout plan:', err);
      setError(`Failed to load workout plan for ${user.email}`);
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
      setError(`Failed to change role for ${user.email}`);
    }
  };

  const updateExercise = (day, exerciseId, field, value) => {
    setPlan(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        exercises: prev[day].exercises.map(ex =>
          ex.id === exerciseId ? { ...ex, [field]: value } : ex
        )
      }
    }));
    setIsDirty(true);
    setSaveState('idle');
  };

  const removeExercise = (day, exerciseId) => {
    setPlan(prev => workoutService.removeExercise(prev, day, exerciseId));
    setIsDirty(true);
    setSaveState('idle');
  };

  const savePlan = async () => {
    try {
      setSaveState('saving');
      setError('');
      await adminService.saveWorkoutPlan(selectedUser.id, plan);
      setIsDirty(false);
      setSaveState('saved');
    } catch (err) {
      console.error('Error saving workout plan:', err);
      setError(`Failed to save workout plan for ${selectedUser.email}`);
      setSaveState('idle');
    }
  };

  const resetPlanToDefault = () => {
    setPlan(workoutService.getInitialPlan());
    setIsDirty(true);
    setSaveState('idle');
  };

  const deleteCloudPlan = async () => {
    try {
      setError('');
      await adminService.deleteWorkoutPlan(selectedUser.id);
      setPlan(null);
      setIsDirty(false);
    } catch (err) {
      console.error('Error deleting workout plan:', err);
      setError(`Failed to delete workout plan for ${selectedUser.email}`);
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
          <h1 style={{ color: 'white', fontSize: '22px', margin: 0 }}>🛡️ Admin panel</h1>
          <Button variant={ButtonVariant.SECONDARY} onClick={onBack} style={{ fontSize: '14px' }}>
            ← Back to tracker
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
              Users {usersLoading ? '' : `(${users.length})`}
            </div>
            {usersLoading ? (
              <p style={{ padding: '16px', margin: 0, color: '#6b7280' }}>Loading users…</p>
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
                      {user.role === 'admin' ? '🛡️ admin' : 'user'}
                      {user.id === currentUser?.id ? ' · you' : ''}
                    </span>
                  </button>
                  {/* Admins cannot demote themselves — prevents locking everyone out */}
                  {user.id !== currentUser?.id && (
                    <ConfirmButton
                      label={user.role === 'admin' ? 'Demote' : 'Make admin'}
                      confirmLabel="Confirm?"
                      variant={ButtonVariant.SECONDARY}
                      onConfirm={() => toggleRole(user)}
                    />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Plan editor */}
          <div style={{ ...cardStyle, flex: '2 1 420px', padding: '16px' }}>
            {!selectedUser ? (
              <p style={{ margin: 0, color: '#6b7280' }}>Select a user to view their workout plan.</p>
            ) : planLoading ? (
              <p style={{ margin: 0, color: '#6b7280' }}>Loading {selectedUser.email}'s plan…</p>
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
                  <h2 style={{ fontSize: '16px', margin: 0 }}>{selectedUser.email}</h2>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <ConfirmButton
                      label="Reset to default"
                      confirmLabel="Confirm reset?"
                      variant={ButtonVariant.SECONDARY}
                      onConfirm={resetPlanToDefault}
                    />
                    {plan && (
                      <ConfirmButton
                        label="Delete cloud data"
                        confirmLabel="Confirm delete?"
                        onConfirm={deleteCloudPlan}
                      />
                    )}
                    <Button
                      onClick={savePlan}
                      disabled={!isDirty || saveState === 'saving'}
                      style={{ fontSize: '13px' }}
                    >
                      {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved ✓' : 'Save changes'}
                    </Button>
                  </div>
                </div>

                {!plan ? (
                  <p style={{ margin: 0, color: '#6b7280' }}>
                    No cloud workout plan yet. "Reset to default" creates one you can save.
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
                          {day} — {dayPlan.name}
                        </h3>
                        {dayPlan.exercises.length === 0 ? (
                          <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>No exercises.</p>
                        ) : (
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                              <thead>
                                <tr style={{ textAlign: 'left', color: '#6b7280' }}>
                                  <th style={{ padding: '4px 8px 4px 0' }}>Exercise</th>
                                  <th style={{ padding: '4px 8px' }}>Sets</th>
                                  <th style={{ padding: '4px 8px' }}>Reps</th>
                                  <th style={{ padding: '4px 8px' }}>Weight</th>
                                  <th style={{ padding: '4px 8px' }}>Status</th>
                                  <th />
                                </tr>
                              </thead>
                              <tbody>
                                {dayPlan.exercises.map(ex => (
                                  <tr key={ex.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                                    <td style={{ padding: '6px 8px 6px 0', color: '#111827' }}>{ex.name}</td>
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
                                    <td style={{ padding: '6px 8px', width: '120px' }}>
                                      <select
                                        style={inputStyle}
                                        value={ex.status ?? 'incomplete'}
                                        onChange={e => updateExercise(day, ex.id, 'status', e.target.value)}
                                      >
                                        {STATUS_OPTIONS.map(s => (
                                          <option key={s} value={s}>{s}</option>
                                        ))}
                                      </select>
                                    </td>
                                    <td style={{ padding: '6px 0 6px 8px', width: '32px' }}>
                                      <button
                                        onClick={() => removeExercise(day, ex.id)}
                                        title="Remove exercise"
                                        style={{
                                          background: 'none',
                                          border: 'none',
                                          cursor: 'pointer',
                                          color: '#ef4444',
                                          fontSize: '15px'
                                        }}
                                      >
                                        ✕
                                      </button>
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
