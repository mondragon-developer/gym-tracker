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
    <div className="exercise-inputs">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div className="input-group">
          <label className="text-sm font-semibold text-gray-700 block mb-4">
            Effective Sets
          </label>
          <input
            type="number"
            className="w-full p-6 border border-gray-300 rounded-3xl text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
            min="0"
            max="10"
            value={exercise.progress?.effectiveSets || ''}
            onChange={(e) => handleInputChange('effectiveSets', e.target.value)}
            placeholder="0"
          />
        </div>
        
        <div className="input-group">
          <label className="text-sm font-semibold text-gray-700 block mb-4">
            Reps
          </label>
          <input
            type="number"
            className="w-full p-6 border border-gray-300 rounded-3xl text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
            min="0"
            max="50"
            value={exercise.progress?.reps || ''}
            onChange={(e) => handleInputChange('reps', e.target.value)}
            placeholder="0"
          />
        </div>
        
        <div className="input-group">
          <label className="text-sm font-semibold text-gray-700 block mb-4">
            Weight (lbs)
          </label>
          <input
            type="number"
            className="w-full p-6 border border-gray-300 rounded-3xl text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
            min="0"
            step="2.5"
            value={exercise.progress?.weight || ''}
            onChange={(e) => handleInputChange('weight', e.target.value)}
            placeholder="0"
          />
          {exercise.previousWeight && (
            <span className="text-xs text-gray-500 block mt-3 px-4 py-2 bg-gray-100 rounded-full inline-block">
              Previous: {exercise.previousWeight}lbs
            </span>
          )}
        </div>
      </div>
    </div>
  );
};