/* src/components/DayAccordion.tsx */
import React from "react";
import { Day } from "../types/Day";
import { ExerciseWithProgress, NewExercise } from "../types/Exercise";
import { ExerciseItem } from "./ExerciseItem";

interface DayAccordionProps {
  day: Day;
  exercises: ExerciseWithProgress[];
  isOpen: boolean;
  onToggle: (dayId: string) => void;
  onAddExercise: (exercise: NewExercise) => void;
  onDeleteExercise: (exerciseId: string) => void;
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
  onOpenTutorial: (exerciseName: string) => void;
  onRestoreDefaultExercises: (dayId: string) => void;
  onMarkAsRestDay: (dayId: string) => void;
  bgColor: string; // Prop for background color
}

export const DayAccordion: React.FC<DayAccordionProps> = ({
  day,
  exercises,
  isOpen,
  onToggle,
  onAddExercise,
  onDeleteExercise,
  onStatusChange,
  onProgressChange,
  onOpenTutorial,
  onRestoreDefaultExercises,
  onMarkAsRestDay,
  bgColor, // Receive the color
}) => {
  return (
    <div className="day-accordion overflow-hidden bg-white">
      <div
        className={`day-header cursor-pointer flex justify-between items-center p-4 text-white transition-all duration-300 ${
          isOpen
            ? "bg-green-500" // Active state is green
            : `${bgColor} hover:brightness-110` // Use passed color for inactive state
        }`}
        onClick={() => onToggle(day.id)}
      >
        <span className="font-bold text-lg">{day.name}</span>
        <span
          className={`arrow text-xl transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          ▲
        </span>
      </div>

      <div
        className={`day-content transition-all duration-600 overflow-hidden ${
          isOpen ? "active" : ""
        }`}
      >
        <div className="p-4 bg-gray-50">
          {exercises.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No exercises for today</p>
              <div className="flex flex-col gap-2">
                <button
                  className="px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                  onClick={() => onRestoreDefaultExercises(day.id)}
                >
                  Restore Default Exercises
                </button>
                <button
                  className="px-4 py-2 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
                  onClick={() => onMarkAsRestDay(day.id)}
                >
                  Mark as Rest Day
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Muscle Group Header with Add Exercise Button */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-gray-700 uppercase">
                  {day.muscleGroups.length > 0
                    ? day.muscleGroups[0].name
                    : "EXERCISES"}
                </h3>
                <button
                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                  onClick={() => {
                    const exercise: NewExercise = {
                      name: "New Exercise",
                      sets: 3,
                      reps: "8-12",
                      day: day.id,
                      muscleGroup: day.muscleGroups[0]?.id || "default",
                    };
                    onAddExercise(exercise);
                  }}
                >
                  + Add Exercise
                </button>
              </div>

              {/* Exercise List */}
              <div className="space-y-4">
                {exercises.map((exercise) => (
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};
