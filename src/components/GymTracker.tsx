import React from 'react';
import { useGym } from '../contexts/GymContext';
import { DayAccordion } from './DayAccordion';
import { VideoModal } from './VideoModal';
import { ConfirmModal } from './ConfirmModal';
import { NewExercise } from '../types/Exercise';

export const GymTracker: React.FC = () => {
  const { state, dispatch, services } = useGym();

  // Array of colors for the day accordions
  const dayColors = [
    'bg-gray-600',     // Monday - dark gray
    'bg-green-600',    // Tuesday - green
    'bg-gray-600',     // Wednesday
    'bg-green-600',    // Thursday
    'bg-gray-600',     // Friday
    'bg-green-600',    // Saturday
  ];

  const handleToggleDay = (dayId: string) => {
    dispatch({ type: 'TOGGLE_DAY', payload: dayId });
  };

  const handleAddExercise = async (exercise: NewExercise) => {
    try {
      const newExercise = await services.exerciseService.addCustomExercise(exercise);
      const exerciseWithProgress = {
        ...newExercise,
        progress: undefined,
        previousWeight: undefined
      };
      dispatch({ type: 'ADD_EXERCISE', payload: exerciseWithProgress });
    } catch (err) {
      console.error('Failed to add exercise:', err);
    }
  };

  const handleDeleteExercise = (exerciseId: string) => {
    const exercise = state.exercises.find(ex => ex.id === exerciseId);

    dispatch({
      type: 'SHOW_CONFIRM_MODAL',
      payload: {
        message: `Are you sure you want to delete "${exercise?.name || 'this exercise'}"?`,
        action: async () => {
          try {
            if (exercise?.isCustom) {
              await services.exerciseService.deleteExercise(exerciseId);
            }
            dispatch({ type: 'DELETE_EXERCISE', payload: exerciseId });
          } catch (err) {
            console.error('Failed to delete exercise:', err);
          }
          dispatch({ type: 'HIDE_CONFIRM_MODAL' });
        }
      }
    });
  };

  const handleStatusChange = (exerciseId: string, completed: boolean, skipped: boolean) => {
    dispatch({
      type: 'UPDATE_EXERCISE_STATUS',
      payload: { exerciseId, completed, skipped }
    });

    const exercise = state.exercises.find(ex => ex.id === exerciseId);
    if (exercise) {
      services.exerciseService
        .updateExerciseProgress(
          exerciseId,
          completed,
          skipped,
          exercise.progress?.effectiveSets || 0,
          exercise.progress?.reps || 0,
          exercise.progress?.weight || 0
        )
        .catch(err => console.error('Failed to save status:', err));
    }
  };

  const handleProgressChange = (exerciseId: string, effectiveSets: number, reps: number, weight: number) => {
    dispatch({
      type: 'UPDATE_EXERCISE_PROGRESS',
      payload: { exerciseId, effectiveSets, reps, weight }
    });

    const exercise = state.exercises.find(ex => ex.id === exerciseId);
    if (exercise) {
      services.exerciseService
        .updateExerciseProgress(
          exerciseId,
          exercise.progress?.completed || false,
          exercise.progress?.skipped || false,
          effectiveSets,
          reps,
          weight
        )
        .catch(err => console.error('Failed to save progress:', err));
    }
  };

  const handleOpenTutorial = (exerciseName: string) => {
    const exercise = state.exercises.find(ex => ex.name === exerciseName);
    dispatch({
      type: 'OPEN_VIDEO_MODAL',
      payload: {
        name: exerciseName,
        url: exercise?.videoUrl
      }
    });
  };

  const handleCloseTutorial = () => {
    dispatch({ type: 'CLOSE_VIDEO_MODAL' });
  };

  const handleConfirmModalCancel = () => {
    dispatch({ type: 'HIDE_CONFIRM_MODAL' });
  };

  const handleConfirmModalConfirm = () => {
    if (state.confirmAction) {
      state.confirmAction();
    }
  };

  const handleRestoreDefaultExercises = (dayId: string) => {
    dispatch({
      type: 'SHOW_CONFIRM_MODAL',
      payload: {
        message: 'Restore default exercises for this day? This will add the original workout plan.',
        action: () => {
          const defaultExercises = services.exerciseService.getDefaultExercisesForDay(dayId);
          defaultExercises.forEach(exercise => {
            const exerciseWithProgress = {
              ...exercise,
              progress: undefined,
              previousWeight: undefined
            };
            dispatch({ type: 'ADD_EXERCISE', payload: exerciseWithProgress });
          });
          dispatch({ type: 'HIDE_CONFIRM_MODAL' });
        }
      }
    });
  };

  const handleMarkAsRestDay = (dayId: string) => {
    services.notesRepository
      .saveDayNotes(dayId, '🛌 Rest Day')
      .catch(err => console.error('Failed to save rest day:', err));
    dispatch({ type: 'MARK_AS_REST_DAY', payload: dayId });
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      {/* Days Container */}
      <div className="space-y-2">
        {state.days.map((day, index) => (
          <DayAccordion
            key={day.id}
            day={day}
            exercises={state.exercises.filter(ex => ex.day === day.id)}
            isOpen={state.currentOpenDay === day.id}
            onToggle={handleToggleDay}
            onAddExercise={handleAddExercise}
            onDeleteExercise={handleDeleteExercise}
            onStatusChange={handleStatusChange}
            onProgressChange={handleProgressChange}
            onOpenTutorial={handleOpenTutorial}
            onRestoreDefaultExercises={handleRestoreDefaultExercises}
            onMarkAsRestDay={handleMarkAsRestDay}
            bgColor={dayColors[index % dayColors.length]}
          />
        ))}
      </div>

      <VideoModal
        isOpen={state.isVideoModalOpen}
        exerciseName={state.videoExerciseName}
        exerciseVideoUrl={state.videoExerciseUrl}
        onClose={handleCloseTutorial}
      />

      <ConfirmModal
        isOpen={state.isConfirmModalOpen}
        message={state.confirmMessage}
        onConfirm={handleConfirmModalConfirm}
        onCancel={handleConfirmModalCancel}
      />
    </div>
  );
};
