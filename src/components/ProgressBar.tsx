import React from 'react';
import { WeeklyProgress } from '../types/Progress';

interface ProgressBarProps {
  progress: WeeklyProgress;
  onReset: () => void;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, onReset }) => {
  return (
    <div className="glass rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-10 text-center bg-gradient-to-r from-white/95 to-neutral-50/95 backdrop-blur-lg border-2 border-neutral-200">
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-3">
          Weekly Progress
        </h2>
        <p className="text-lg sm:text-xl text-neutral-700 font-semibold">
          {progress.completedExercises} of {progress.totalExercises} exercises completed
        </p>
      </div>
      
      <div className="progress-bar bg-neutral-300 rounded-3xl h-8 sm:h-10 lg:h-12 overflow-hidden mb-6 relative border-2 border-neutral-400 shadow-lg">
        <div
          className="progress-fill h-full rounded-3xl flex items-center justify-center text-white font-black text-sm sm:text-lg lg:text-xl transition-all duration-600 relative bg-gradient-to-r from-primary-500 to-primary-700 shadow-lg"
          style={{ width: `${progress.percentage}%` }}
        >
          <span className="absolute inset-0 flex items-center justify-center drop-shadow-lg">
            {progress.percentage}%
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mb-6">
        <div className="flex items-center gap-3 text-lg text-neutral-700 font-semibold bg-primary-100 px-4 py-2 rounded-2xl border-2 border-primary-300">
          <div className="w-4 h-4 bg-gradient-to-r from-primary-500 to-primary-700 rounded-full shadow-lg"></div>
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-3 text-lg text-neutral-700 font-semibold bg-neutral-100 px-4 py-2 rounded-2xl border-2 border-neutral-300">
          <div className="w-4 h-4 bg-neutral-400 rounded-full shadow-lg"></div>
          <span>Remaining</span>
        </div>
      </div>

      <button
        className="bg-gradient-to-r from-accent-500 to-accent-700 hover:from-accent-600 hover:to-accent-800 mt-8 px-8 sm:px-10 py-4 sm:py-5 text-white font-black rounded-2xl shadow-xl text-lg sm:text-xl w-full sm:w-auto transition-all duration-200 hover:scale-105 border-2 border-accent-600"
        onClick={onReset}
      >
        🔄 Start New Week
      </button>
    </div>
  );
};