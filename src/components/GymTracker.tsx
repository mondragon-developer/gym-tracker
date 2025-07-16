import React from 'react';
import { useGym } from '../contexts/GymContext';
import { ProgressBar } from './ProgressBar';
import { DayAccordion } from './DayAccordion';
import { VideoModal } from './VideoModal';
import { ConfirmModal } from './ConfirmModal';
import { NewExercise } from '../types/Exercise';

export const GymTracker: React.FC = () => {
  const { state, dispatch, services } = useGym();

  const handleToggleDay = (dayId: string) => {
    dispatch({ type: 'TOGGLE_DAY', payload: dayId });
  };

  const handleAddExercise = (exercise: NewExercise) => {
    const newExercise = services.exerciseService.addCustomExercise(exercise);
    const exerciseWithProgress = {
      ...newExercise,
      progress: undefined,
      previousWeight: undefined
    };
    dispatch({ type: 'ADD_EXERCISE', payload: exerciseWithProgress });
  };

  const handleDeleteExercise = (exerciseId: string) => {
    const exercise = state.exercises.find(ex => ex.id === exerciseId);
    
    dispatch({
      type: 'SHOW_CONFIRM_MODAL',
      payload: {
        message: `Are you sure you want to delete "${exercise?.name || 'this exercise'}"?`,
        action: () => {
          // Delete from service if it's a custom exercise
          if (exercise?.isCustom) {
            services.exerciseService.deleteExercise(exerciseId);
          }
          // Always remove from state to delete any exercise
          dispatch({ type: 'DELETE_EXERCISE', payload: exerciseId });
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
      services.exerciseService.updateExerciseProgress(
        exerciseId,
        completed,
        skipped,
        exercise.progress?.effectiveSets || 0,
        exercise.progress?.reps || 0,
        exercise.progress?.weight || 0
      );
    }
  };

  const handleProgressChange = (exerciseId: string, effectiveSets: number, reps: number, weight: number) => {
    dispatch({
      type: 'UPDATE_EXERCISE_PROGRESS',
      payload: { exerciseId, effectiveSets, reps, weight }
    });

    const exercise = state.exercises.find(ex => ex.id === exerciseId);
    if (exercise) {
      services.exerciseService.updateExerciseProgress(
        exerciseId,
        exercise.progress?.completed || false,
        exercise.progress?.skipped || false,
        effectiveSets,
        reps,
        weight
      );
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

  const handleResetProgress = () => {
    dispatch({
      type: 'SHOW_CONFIRM_MODAL',
      payload: {
        message: 'Start a new week? This will save current weights and reset all exercises.',
        action: () => {
          services.progressService.resetWeeklyProgress();
          dispatch({ type: 'RESET_PROGRESS' });
          dispatch({ type: 'HIDE_CONFIRM_MODAL' });
          
          // Reload exercises to get updated previous weights
          const exercises = services.exerciseService.getAllExercises();
          dispatch({ type: 'SET_EXERCISES', payload: exercises });
        }
      }
    });
  };

  const handleConfirmModalCancel = () => {
    dispatch({ type: 'HIDE_CONFIRM_MODAL' });
  };

  const handleConfirmModalConfirm = () => {
    if (state.confirmAction) {
      state.confirmAction();
    }
  };

  const handleSaveNotes = (dayId: string, notes: string) => {
    services.notesRepository.saveDayNotes(dayId, notes);
    dispatch({ type: 'SAVE_DAY_NOTES', payload: { dayId, notes } });
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
    services.notesRepository.saveDayNotes(dayId, '🛌 Rest Day');
    dispatch({ type: 'MARK_AS_REST_DAY', payload: dayId });
  };

  return (
    <div className="min-h-screen p-16 bg-gray-100">
      <div className="container max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-md p-16 mb-16">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
            6-Day Gym Training Program
          </h1>
          <p className="text-center text-gray-600 text-lg">
            Track your progress and stay motivated! 💪
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-16">
          <ProgressBar
            progress={state.weeklyProgress}
            onReset={handleResetProgress}
          />
        </div>

        {/* Days Container */}
        <div className="days-container space-y-12">
          {state.days.map(day => (
            <DayAccordion
              key={day.id}
              day={day}
              exercises={state.exercises.filter(ex => ex.day === day.id)}
              isOpen={state.currentOpenDay === day.id}
              dayNotes={state.dayNotes[day.id] || ''}
              onToggle={handleToggleDay}
              onAddExercise={handleAddExercise}
              onDeleteExercise={handleDeleteExercise}
              onStatusChange={handleStatusChange}
              onProgressChange={handleProgressChange}
              onOpenTutorial={handleOpenTutorial}
              onSaveNotes={handleSaveNotes}
              onRestoreDefaultExercises={handleRestoreDefaultExercises}
              onMarkAsRestDay={handleMarkAsRestDay}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-20 text-sm text-gray-500">
          <p>Keep pushing your limits! 🚀</p>
        </div>
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