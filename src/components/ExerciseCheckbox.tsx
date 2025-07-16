import React from 'react';
import { ExerciseWithProgress } from '../types/Exercise';

interface ExerciseCheckboxProps {
  exercise: ExerciseWithProgress;
  onStatusChange: (exerciseId: string, completed: boolean, skipped: boolean) => void;
}

export const ExerciseCheckbox: React.FC<ExerciseCheckboxProps> = ({ exercise, onStatusChange }) => {
  const handleCheckboxChange = (type: 'completed' | 'skipped', checked: boolean) => {
    if (type === 'completed') {
      onStatusChange(exercise.id, checked, checked ? false : exercise.progress?.skipped || false);
    } else {
      onStatusChange(exercise.id, checked ? false : exercise.progress?.completed || false, checked);
    }
  };

  const isCompleted = exercise.progress?.completed || false;
  const isSkipped = exercise.progress?.skipped || false;

  return (
    <div className="checkbox-container flex items-center gap-8">
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          className="h-6 w-6 text-green-500 focus:ring-green-400 border-gray-300 rounded"
          checked={isCompleted}
          onChange={(e) => handleCheckboxChange('completed', e.target.checked)}
        />
        <label className="text-base text-gray-700 font-medium">Done</label>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          className="h-6 w-6 text-orange-500 focus:ring-orange-400 border-gray-300 rounded"
          checked={isSkipped}
          onChange={(e) => handleCheckboxChange('skipped', e.target.checked)}
        />
        <label className="text-base text-gray-700 font-medium">Skip</label>
      </div>
    </div>
  );
};