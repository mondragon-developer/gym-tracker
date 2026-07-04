import React, { useEffect, useMemo, useState } from 'react';
import { AdminService } from '../services/AdminService';
import { UserProfile, UserRole } from '../types/Admin';
import { Exercise, ExerciseProgress, ProgressData, DayNotes } from '../types/Exercise';
import { DEFAULT_EXERCISES } from '../data/exercisesWithVideos';
import { DAYS } from '../types/Day';

/**
 * Admin-only screen. Lists every user, lets an admin change roles, and (for a
 * selected user) view + edit their custom exercises, progress, and day notes.
 * Access is really enforced by the database RLS admin policies; this UI just
 * drives the AdminService.
 */
export const AdminDashboard: React.FC = () => {
  const admin = useMemo(() => new AdminService(), []);

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<UserProfile | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [progress, setProgress] = useState<ProgressData>({});
  const [notes, setNotes] = useState<DayNotes>({});

  // Resolve an exercise id to a readable name (custom first, then the catalog).
  const nameFor = (exerciseId: string): string => {
    const custom = exercises.find(e => e.id === exerciseId);
    if (custom) return custom.name;
    const preset = DEFAULT_EXERCISES.find(e => e.id === exerciseId);
    return preset ? preset.name : exerciseId;
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    setError(null);
    try {
      setUsers(await admin.listUsers());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users.');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectUser = async (user: UserProfile) => {
    setSelected(user);
    setLoadingDetail(true);
    setError(null);
    try {
      const [ex, pr, no] = await Promise.all([
        admin.getExercises(user.id),
        admin.getProgress(user.id),
        admin.getDayNotes(user.id)
      ]);
      setExercises(ex);
      setProgress(pr);
      setNotes(no);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user data.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const changeRole = async (user: UserProfile, role: UserRole) => {
    try {
      await admin.setUserRole(user.id, role);
      setUsers(prev => prev.map(u => (u.id === user.id ? { ...u, role } : u)));
      if (selected?.id === user.id) setSelected({ ...selected, role });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change role.');
    }
  };

  const editProgress = (exerciseId: string, patch: Partial<ExerciseProgress>) => {
    setProgress(prev => ({
      ...prev,
      [exerciseId]: { ...prev[exerciseId], exerciseId, ...patch } as ExerciseProgress
    }));
  };

  const saveProgress = async (exerciseId: string) => {
    if (!selected) return;
    try {
      await admin.updateProgress(selected.id, progress[exerciseId]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save progress.');
    }
  };

  const deleteProgress = async (exerciseId: string) => {
    if (!selected) return;
    try {
      await admin.deleteProgress(selected.id, exerciseId);
      setProgress(prev => {
        const next = { ...prev };
        delete next[exerciseId];
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete progress.');
    }
  };

  const deleteExercise = async (exerciseId: string) => {
    if (!selected) return;
    try {
      await admin.deleteExercise(selected.id, exerciseId);
      setExercises(prev => prev.filter(e => e.id !== exerciseId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete exercise.');
    }
  };

  const saveNote = async (dayId: string) => {
    if (!selected) return;
    try {
      await admin.saveDayNote(selected.id, dayId, notes[dayId] ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save note.');
    }
  };

  const progressEntries = Object.values(progress);

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Admin dashboard</h1>

      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Users list */}
        <aside className="md:col-span-1 bg-white rounded-xl shadow p-4 h-fit">
          <h2 className="font-semibold text-gray-700 mb-3">Users ({users.length})</h2>
          {loadingUsers ? (
            <p className="text-gray-500 text-sm">Loading…</p>
          ) : (
            <ul className="space-y-2">
              {users.map(u => (
                <li key={u.id}>
                  <button
                    onClick={() => selectUser(u)}
                    className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                      selected?.id === u.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-800 truncate">{u.email}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          u.role === 'admin'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {u.role}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Detail */}
        <section className="md:col-span-2 space-y-6">
          {!selected ? (
            <div className="bg-white rounded-xl shadow p-6 text-gray-500">
              Select a user to view and edit their data.
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl shadow p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-800">{selected.email}</div>
                  <div className="text-xs text-gray-500">
                    Joined {new Date(selected.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <label className="text-sm text-gray-600 flex items-center gap-2">
                  Role
                  <select
                    value={selected.role}
                    onChange={e => changeRole(selected, e.target.value as UserRole)}
                    className="border border-gray-300 rounded-lg px-2 py-1"
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </label>
              </div>

              {loadingDetail ? (
                <div className="bg-white rounded-xl shadow p-6 text-gray-500">Loading…</div>
              ) : (
                <>
                  {/* Custom exercises */}
                  <div className="bg-white rounded-xl shadow p-4">
                    <h3 className="font-semibold text-gray-700 mb-3">
                      Custom exercises ({exercises.length})
                    </h3>
                    {exercises.length === 0 ? (
                      <p className="text-sm text-gray-500">None.</p>
                    ) : (
                      <ul className="divide-y divide-gray-100">
                        {exercises.map(e => (
                          <li key={e.id} className="flex items-center justify-between py-2">
                            <span className="text-sm text-gray-800">
                              {e.name}{' '}
                              <span className="text-gray-400">
                                · {e.day} · {e.setsReps}
                              </span>
                            </span>
                            <button
                              onClick={() => deleteExercise(e.id)}
                              className="text-xs text-red-600 hover:underline"
                            >
                              Delete
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Progress */}
                  <div className="bg-white rounded-xl shadow p-4">
                    <h3 className="font-semibold text-gray-700 mb-3">
                      Progress ({progressEntries.length})
                    </h3>
                    {progressEntries.length === 0 ? (
                      <p className="text-sm text-gray-500">No progress recorded.</p>
                    ) : (
                      <div className="space-y-3">
                        {progressEntries.map(p => (
                          <div
                            key={p.exerciseId}
                            className="border border-gray-200 rounded-lg p-3"
                          >
                            <div className="text-sm font-medium text-gray-800 mb-2">
                              {nameFor(p.exerciseId)}
                            </div>
                            <div className="flex flex-wrap items-end gap-3">
                              <label className="text-xs text-gray-500">
                                Sets
                                <input
                                  type="number"
                                  value={p.effectiveSets}
                                  onChange={e =>
                                    editProgress(p.exerciseId, {
                                      effectiveSets: Number(e.target.value)
                                    })
                                  }
                                  className="block w-16 border border-gray-300 rounded px-2 py-1 text-sm text-gray-800"
                                />
                              </label>
                              <label className="text-xs text-gray-500">
                                Reps
                                <input
                                  type="number"
                                  value={p.reps}
                                  onChange={e =>
                                    editProgress(p.exerciseId, { reps: Number(e.target.value) })
                                  }
                                  className="block w-16 border border-gray-300 rounded px-2 py-1 text-sm text-gray-800"
                                />
                              </label>
                              <label className="text-xs text-gray-500">
                                Weight
                                <input
                                  type="number"
                                  value={p.weight}
                                  onChange={e =>
                                    editProgress(p.exerciseId, {
                                      weight: Number(e.target.value)
                                    })
                                  }
                                  className="block w-20 border border-gray-300 rounded px-2 py-1 text-sm text-gray-800"
                                />
                              </label>
                              <label className="text-xs text-gray-500 flex items-center gap-1">
                                <input
                                  type="checkbox"
                                  checked={p.completed}
                                  onChange={e =>
                                    editProgress(p.exerciseId, { completed: e.target.checked })
                                  }
                                />
                                Done
                              </label>
                              <label className="text-xs text-gray-500 flex items-center gap-1">
                                <input
                                  type="checkbox"
                                  checked={p.skipped}
                                  onChange={e =>
                                    editProgress(p.exerciseId, { skipped: e.target.checked })
                                  }
                                />
                                Skipped
                              </label>
                              <div className="flex gap-2 ml-auto">
                                <button
                                  onClick={() => saveProgress(p.exerciseId)}
                                  className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => deleteProgress(p.exerciseId)}
                                  className="text-xs text-red-600 hover:underline"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Day notes */}
                  <div className="bg-white rounded-xl shadow p-4">
                    <h3 className="font-semibold text-gray-700 mb-3">Day notes</h3>
                    <div className="space-y-3">
                      {DAYS.map(day => (
                        <div key={day.id}>
                          <label className="text-xs font-medium text-gray-600">{day.name}</label>
                          <div className="flex gap-2 mt-1">
                            <textarea
                              rows={2}
                              value={notes[day.id] ?? ''}
                              onChange={e =>
                                setNotes(prev => ({ ...prev, [day.id]: e.target.value }))
                              }
                              className="flex-1 border border-gray-300 rounded-lg px-2 py-1 text-sm text-gray-800 resize-none"
                            />
                            <button
                              onClick={() => saveNote(day.id)}
                              className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 rounded self-stretch"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
};
