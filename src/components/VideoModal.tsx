import React from 'react';
import { ExerciseDatabaseService } from '../services/ExerciseDatabaseService';

interface VideoModalProps {
  isOpen: boolean;
  exerciseName: string;
  exerciseVideoUrl?: string;
  onClose: () => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({ isOpen, exerciseName, exerciseVideoUrl, onClose }) => {
  if (!isOpen) return null;

  const exerciseDbService = new ExerciseDatabaseService();

  const getVideoUrl = (exerciseName: string) => {
    // Always try to get the video URL from the database first
    const databaseUrl = exerciseDbService.getVideoUrl(exerciseName);
    
    // If we have a specific URL passed in and it's different from the fallback search URL, use it
    if (exerciseVideoUrl && !exerciseVideoUrl.includes('listType=search')) {
      return exerciseVideoUrl;
    }
    
    return databaseUrl;
  };

  return (
    <div className="modal fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="modal-content bg-white rounded-3xl shadow-2xl w-full max-w-2xl relative border-2 border-neutral-200">
        <div className="p-6 sm:p-8 border-b-2 border-neutral-200 flex justify-between items-center bg-gradient-to-r from-primary-100 to-secondary-100 rounded-t-3xl">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-neutral-800">📹 {exerciseName}</h2>
            <p className="text-lg text-neutral-600 font-semibold">Tutorial Video</p>
          </div>
          <button
            className="close-modal w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-2xl flex items-center justify-center transition-all duration-200 shadow-lg hover:scale-105 font-bold text-lg"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        
        <div className="video-container p-6 sm:p-8">
          <div className="bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl border-2 border-neutral-300">
            <iframe
              className="w-full h-72 sm:h-96"
              src={getVideoUrl(exerciseName)}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-lg text-neutral-700 font-semibold bg-gradient-to-r from-neutral-100 to-neutral-200 px-4 py-2 rounded-2xl border-2 border-neutral-300">
              Watch this tutorial to learn proper form and technique
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};