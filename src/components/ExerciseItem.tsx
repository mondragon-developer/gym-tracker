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
    <div className="exercise-card bg-white border border-gray-200 rounded-3xl p-10 shadow-sm">
      <div className="flex items-start justify-between mb-10">
        <div className="flex-1">
          <div className="flex items-center gap-8 mb-8">
            <ExerciseCheckbox
              exercise={exercise}
              onStatusChange={onStatusChange}
            />
            <button
              className="text-red-500 hover:text-red-700 text-lg p-4 hover:bg-red-50 rounded-full transition-colors"
              onClick={() => onDelete(exercise.id)}
              title="Delete Exercise"
            >
              ✕
            </button>
          </div>
          <div className="flex items-center gap-5 mb-6">
            <h4 className={`font-semibold text-xl ${isCompleted || isSkipped ? 'line-through text-gray-500' : 'text-gray-900'}`}>
              {exercise.name}
            </h4>
            <button
              className="text-blue-500 hover:text-blue-700 text-sm px-5 py-3 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors"
              onClick={() => onOpenTutorial(exercise.name)}
              title="Watch Tutorial"
            >
              [Video]
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-10 bg-gray-50 px-5 py-4 rounded-2xl inline-block">{exercise.setsReps}</p>
        </div>
      </div>

      <ExerciseInput exercise={exercise} onProgressChange={onProgressChange} />
    </div>
  );
};
