import React from 'react';
import { Day } from '../types/Day';
import { ExerciseWithProgress, NewExercise } from '../types/Exercise';
import { ExerciseItem } from './ExerciseItem';
import { DayNotes } from './DayNotes';

interface DayAccordionProps {
  day: Day;
  exercises: ExerciseWithProgress[];
  isOpen: boolean;
  dayNotes: string;
  onToggle: (dayId: string) => void;
  onAddExercise: (exercise: NewExercise) => void;
  onDeleteExercise: (exerciseId: string) => void;
  onStatusChange: (exerciseId: string, completed: boolean, skipped: boolean) => void;
  onProgressChange: (exerciseId: string, effectiveSets: number, reps: number, weight: number) => void;
  onOpenTutorial: (exerciseName: string) => void;
  onSaveNotes: (dayId: string, notes: string) => void;
  onRestoreDefaultExercises: (dayId: string) => void;
  onMarkAsRestDay: (dayId: string) => void;
}

export const DayAccordion: React.FC<DayAccordionProps> = ({
  day,
  exercises,
  isOpen,
  dayNotes,
  onToggle,
  onAddExercise,
  onDeleteExercise,
  onStatusChange,
  onProgressChange,
  onOpenTutorial,
  onSaveNotes,
  onRestoreDefaultExercises,
  onMarkAsRestDay
}) => {

  return (
    <div className="day-accordion rounded-3xl shadow-lg overflow-hidden border border-gray-200 bg-white">
      <div
        className={`day-header cursor-pointer flex justify-between items-center p-6 sm:p-10 text-white transition-all duration-300 ${
          isOpen
            ? 'bg-green-500 rounded-t-3xl'
            : 'bg-gray-700 hover:bg-gray-600 rounded-3xl'
        }`}
        onClick={() => onToggle(day.id)}
      >
        <span className="font-bold text-xl">{day.name}</span>
        <span className={`arrow text-2xl transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          {isOpen ? '▼' : '▲'}
        </span>
      </div>
      
      <div className={`day-content transition-all duration-600 overflow-hidden ${isOpen ? 'active' : ''}`}>
        <div className="p-6 sm:p-10 space-y-8 sm:space-y-10">
          {exercises.length === 0 ? (
            <div className="text-center py-20">
              <div className="bg-gray-50 rounded-3xl p-16 border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-600 mb-10">No exercises for today</h3>
                <p className="text-gray-500 mb-12">This day is currently empty. You can:</p>
                <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 justify-center">
                  <button 
                    className="px-12 py-6 bg-blue-500 text-white font-semibold rounded-3xl shadow-lg hover:bg-blue-600 transition-colors"
                    onClick={() => onRestoreDefaultExercises(day.id)}
                  >
                    🔄 Restore Default Exercises
                  </button>
                  <button 
                    className="px-12 py-6 bg-gray-500 text-white font-semibold rounded-3xl shadow-lg hover:bg-gray-600 transition-colors"
                    onClick={() => onMarkAsRestDay(day.id)}
                  >
                    😴 Mark as Rest Day
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Muscle Group Header with Add Exercise Button */}
              <div className="flex justify-between items-center mb-10 py-6">
                <h3 className="text-xl font-semibold text-gray-700 uppercase tracking-wide">
                  {day.muscleGroups.length > 0 ? day.muscleGroups[0].name : 'EXERCISES'}
                </h3>
                <button
                  className="px-10 py-5 bg-blue-500 text-white text-sm font-semibold rounded-3xl shadow-lg hover:bg-blue-600 transition-colors"
                  onClick={() => {
                    // For now, create a simple exercise - we'll need to handle the muscle group assignment
                    const exercise: NewExercise = {
                      name: 'New Exercise',
                      sets: 3,
                      reps: '8-12',
                      day: day.id,
                      muscleGroup: day.muscleGroups[0]?.id || 'default'
                    };
                    onAddExercise(exercise);
                  }}
                >
                  + Add Exercise
                </button>
              </div>

              {/* Exercise List */}
              <div className="space-y-8 sm:space-y-10">
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
            </>
          )}

          <DayNotes
            dayId={day.id}
            notes={dayNotes}
            onSaveNotes={onSaveNotes}
          />
        </div>
      </div>
    </div>
  );
};