import React from "react";
import { ExerciseWithProgress } from "../types/Exercise";
import { ExerciseCheckbox } from "./ExerciseCheckbox";
import { ExerciseInput } from "./ExerciseInput";

interface ExerciseItemProps {
  exercise: ExerciseWithProgress;
  onStatusChange: (
    exerciseId: string,
    completed: boolean,
    skipped: boolean
  ) => void;
  onProgressChange: (
    exerciseId: string,
    effectiveSets: number,
    reps: number,
    weight: number
  ) => void;
  onDelete: (exerciseId: string) => void;
  onOpenTutorial: (exerciseName: string) => void;
}

export const ExerciseItem: React.FC<ExerciseItemProps> = ({
  exercise,
  onStatusChange,
  onProgressChange,
  onDelete,
  onOpenTutorial,
}) => {
  const isCompleted = exercise.progress?.completed || false;
  const isSkipped = exercise.progress?.skipped || false;


  return (
    <div className="exercise-card bg-white border border-gray-300 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <ExerciseCheckbox
            exercise={exercise}
            onStatusChange={onStatusChange}
          />
          <button
            className="text-red-500 hover:text-red-700 text-sm"
            onClick={() => onDelete(exercise.id)}
            title="Delete Exercise"
          >
            ✕
          </button>
        </div>
      </div>
      
      <div className="flex items-center gap-2 mb-3">
        <h4 className={`font-medium text-base ${isCompleted || isSkipped ? 'line-through text-gray-500' : 'text-gray-900'}`}>
          {exercise.name}
        </h4>
        <button
          className="text-blue-500 hover:text-blue-700 text-sm"
          onClick={() => onOpenTutorial(exercise.name)}
          title="Watch Tutorial"
        >
          [Video]
        </button>
      </div>
      
      <p className="text-sm text-gray-600 mb-3">{exercise.setsReps}</p>

      <ExerciseInput exercise={exercise} onProgressChange={onProgressChange} />
    </div>
  );
};
