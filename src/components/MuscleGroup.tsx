import React, { useState } from 'react';
import { ExerciseWithProgress, NewExercise } from '../types/Exercise';
import { ExerciseItem } from './ExerciseItem';
import { AddExerciseForm } from './AddExerciseForm';

interface MuscleGroupProps {
  id: string;
  name: string;
  day: string;
  exercises: ExerciseWithProgress[];
  onAddExercise: (exercise: NewExercise) => void;
  onDeleteExercise: (exerciseId: string) => void;
  onStatusChange: (exerciseId: string, completed: boolean, skipped: boolean) => void;
  onProgressChange: (exerciseId: string, effectiveSets: number, reps: number, weight: number) => void;
  onOpenTutorial: (exerciseName: string) => void;
}

export const MuscleGroup: React.FC<MuscleGroupProps> = ({
  id,
  name,
  day,
  exercises,
  onAddExercise,
  onDeleteExercise,
  onStatusChange,
  onProgressChange,
  onOpenTutorial
}) => {
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddExercise = (exercise: NewExercise) => {
    onAddExercise(exercise);
    setShowAddForm(false);
  };

  return (
    <div className="muscle-group">
      <div className="muscle-title flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b-2 border-gradient-to-r from-primary-200 to-secondary-200 pb-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"></div>
          <span className="text-lg sm:text-xl font-bold text-gray-700 uppercase tracking-wide">{name}</span>
        </div>
        <button
          className="btn-secondary px-4 py-2 text-white text-sm font-semibold rounded-xl shadow-lg w-full sm:w-auto"
          onClick={() => setShowAddForm(true)}
        >
          ✨ Add Exercise
        </button>
      </div>
      
      <AddExerciseForm
        isVisible={showAddForm}
        muscleGroupId={id}
        day={day}
        onAdd={handleAddExercise}
        onCancel={() => setShowAddForm(false)}
      />
      
      <div className="space-y-4 sm:space-y-6">
        {exercises.map(exercise => (
          <ExerciseItem
            key={exercise.id}
            exercise={exercise}
            onStatusChange={onStatusChange}
            onProgressChange={onProgressChange}
            onDelete={onDeleteExercise}
            onOpenTutorial={onOpenTutorial}
          />
        ))}
      </div>
    </div>
  );
};