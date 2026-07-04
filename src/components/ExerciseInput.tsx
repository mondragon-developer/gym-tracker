import React from 'react';
import { ExerciseWithProgress } from '../types/Exercise';

interface ExerciseInputProps {
  exercise: ExerciseWithProgress;
  onProgressChange: (exerciseId: string, effectiveSets: number, reps: number, weight: number) => void;
}

export const ExerciseInput: React.FC<ExerciseInputProps> = ({ exercise, onProgressChange }) => {
  const handleInputChange = (field: 'effectiveSets' | 'reps' | 'weight', value: string) => {
    const numValue = parseInt(value) || 0;
    const currentProgress = exercise.progress || { effectiveSets: 0, reps: 0, weight: 0 };
    
    const updatedProgress = {
      ...currentProgress,
      [field]: numValue
    };

    onProgressChange(exercise.id, updatedProgress.effectiveSets, updatedProgress.reps, updatedProgress.weight);
  };

  return (
    <div className="exercise-inputs space-y-2">
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600 w-24">Effective Sets</label>
        <input
          type="number"
          className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          min="0"
          max="10"
          value={exercise.progress?.effectiveSets || ''}
          onChange={(e) => handleInputChange('effectiveSets', e.target.value)}
          placeholder="0"
        />
      </div>
      
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600 w-24">Reps</label>
        <input
          type="number"
          className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          min="0"
          max="50"
          value={exercise.progress?.reps || ''}
          onChange={(e) => handleInputChange('reps', e.target.value)}
          placeholder="0"
        />
      </div>
      
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600 w-24">Weight (lbs)</label>
        <input
          type="number"
          className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          min="0"
          step="2.5"
          value={exercise.progress?.weight || ''}
          onChange={(e) => handleInputChange('weight', e.target.value)}
          placeholder="0"
        />
      </div>
      {exercise.previousWeight && (
        <div className="text-xs text-gray-500 mt-1">
          Previous: {exercise.previousWeight}lbs
        </div>
      )}
    </div>
  );
};