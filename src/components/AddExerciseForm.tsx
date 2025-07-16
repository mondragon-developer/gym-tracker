import React, { useState, useEffect } from 'react';
import { NewExercise } from '../types/Exercise';
import { ExerciseDatabaseService, DatabaseExercise } from '../services/ExerciseDatabaseService';

interface AddExerciseFormProps {
  isVisible: boolean;
  muscleGroupId: string;
  day: string;
  onAdd: (exercise: NewExercise) => void;
  onCancel: () => void;
}

export const AddExerciseForm: React.FC<AddExerciseFormProps> = ({
  isVisible,
  muscleGroupId,
  day,
  onAdd,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    name: '',
    sets: '',
    reps: '',
    videoUrl: ''
  });
  const [exerciseOptions, setExerciseOptions] = useState<DatabaseExercise[]>([]);
  const [isCustom, setIsCustom] = useState(false);
  const exerciseDbService = new ExerciseDatabaseService();

  useEffect(() => {
    if (isVisible) {
      const muscleGroupName = muscleGroupId.split('-')[1]; // Extract muscle group name
      const exercises = exerciseDbService.getExercisesByMuscle(muscleGroupName);
      setExerciseOptions(exercises);
    }
  }, [isVisible, muscleGroupId]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleExerciseSelect = (exercise: DatabaseExercise) => {
    const [sets, repsRange] = exercise.sets.split(' sets × ');
    setFormData({
      name: exercise.name,
      sets: sets,
      reps: repsRange.replace(' reps', ''),
      videoUrl: exercise.videoUrl
    });
    setIsCustom(false);
  };

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.sets || !formData.reps.trim()) {
      alert('Please fill in all fields.');
      return;
    }

    const newExercise: NewExercise = {
      name: formData.name.trim(),
      sets: parseInt(formData.sets),
      reps: formData.reps.trim(),
      muscleGroup: muscleGroupId,
      day,
      videoUrl: formData.videoUrl
    };

    onAdd(newExercise);
    
    // Reset form
    setFormData({ name: '', sets: '', reps: '', videoUrl: '' });
    setIsCustom(false);
  };

  if (!isVisible) return null;

  return (
    <div className={`custom-exercise-form bg-gray-50 rounded-3xl shadow-lg border border-gray-200 p-6 sm:p-8 mb-8 ${isVisible ? 'active' : ''}`}>
      <div className="space-y-6 sm:space-y-8">
        <div className="text-center">
          <h3 className="text-lg font-bold text-gray-700 mb-2">✨ Add New Exercise</h3>
          <p className="text-sm text-gray-600">Choose from our database or create a custom exercise</p>
        </div>

        {/* Exercise Selection */}
        {exerciseOptions.length > 0 && (
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">📋 Choose Exercise</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-40 overflow-y-auto p-4 bg-white rounded-2xl border border-gray-200">
              {exerciseOptions.map((exercise, index) => (
                <button
                  key={index}
                  type="button"
                  className="text-left p-4 rounded-2xl border border-gray-300 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 text-sm"
                  onClick={() => handleExerciseSelect(exercise)}
                >
                  <div className="font-medium">{exercise.name}</div>
                  <div className="text-xs text-gray-500">{exercise.sets}</div>
                  <div className="text-xs text-gray-400">Equipment: {exercise.equipment}</div>
                </button>
              ))}
            </div>
            <div className="text-center mt-2">
              <button
                type="button"
                className="text-sm text-primary-600 hover:text-primary-800 font-medium"
                onClick={() => setIsCustom(true)}
              >
                Or create a custom exercise
              </button>
            </div>
          </div>
        )}
        
        {/* Manual Input Fields */}
        {(isCustom || exerciseOptions.length === 0) && (
          <div className="mobile-grid gap-6 sm:gap-8">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-3">🏋️ Exercise Name</label>
              <input
                type="text"
                className="exercise-name-input w-full p-5 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                placeholder="e.g., Dumbbell Flyes"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-3">🔢 Sets</label>
              <input
                type="number"
                className="sets-input w-full p-5 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                placeholder="e.g., 3"
                min="1"
                max="10"
                value={formData.sets}
                onChange={(e) => handleInputChange('sets', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-3">🔄 Rep Range</label>
              <input
                type="text"
                className="reps-input w-full p-5 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                placeholder="e.g., 10-12"
                value={formData.reps}
                onChange={(e) => handleInputChange('reps', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Selected Exercise Preview */}
        {formData.name && (
          <div className="bg-white p-5 rounded-2xl border border-gray-300">
            <h4 className="font-medium text-gray-700 mb-2">Selected: {formData.name}</h4>
            <p className="text-sm text-gray-600">{formData.sets} sets × {formData.reps} reps</p>
          </div>
        )}
        
        <div className="form-buttons flex flex-col sm:flex-row gap-4 pt-6">
          <button
            className="flex-1 px-8 py-4 bg-green-500 text-white font-semibold rounded-2xl shadow-lg hover:bg-green-600 transition-colors"
            onClick={handleSubmit}
          >
            ✅ Save Exercise
          </button>
          <button
            className="flex-1 px-8 py-4 bg-red-500 text-white font-semibold rounded-2xl shadow-lg hover:bg-red-600 transition-colors"
            onClick={onCancel}
          >
            ❌ Cancel
          </button>
        </div>
      </div>
    </div>
  );
};