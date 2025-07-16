import React, { useState } from 'react';

interface DayNotesProps {
  dayId: string;
  notes: string;
  onSaveNotes: (dayId: string, notes: string) => void;
}

export const DayNotes: React.FC<DayNotesProps> = ({ dayId, notes, onSaveNotes }) => {
  const [currentNotes, setCurrentNotes] = useState(notes);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    onSaveNotes(dayId, currentNotes);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setCurrentNotes(notes);
    setIsEditing(false);
  };

  return (
    <div className="day-notes bg-gray-50 rounded-3xl p-10 mt-10 border border-gray-200">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-bold text-gray-700 flex items-center gap-3">
          📝 Daily Notes
        </h3>
        {!isEditing && (
          <button
            className="px-8 py-4 bg-gray-500 text-white text-sm font-semibold rounded-3xl hover:bg-gray-600 transition-colors"
            onClick={() => setIsEditing(true)}
          >
            ✏️ Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-6 sm:space-y-8">
          <textarea
            className="w-full p-8 border border-gray-300 rounded-3xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
            rows={6}
            placeholder="Add your notes for today's workout... How did it go? Any observations or goals for next time?"
            value={currentNotes}
            onChange={(e) => setCurrentNotes(e.target.value)}
          />
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            <button
              className="flex-1 px-8 py-4 bg-green-500 text-white font-semibold rounded-3xl hover:bg-green-600 transition-colors"
              onClick={handleSave}
            >
              ✅ Save Notes
            </button>
            <button
              className="flex-1 px-8 py-4 bg-red-500 text-white font-semibold rounded-3xl hover:bg-red-600 transition-colors"
              onClick={handleCancel}
            >
              ❌ Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="min-h-[8rem] p-6 sm:p-8 bg-white rounded-3xl border border-gray-200">
          {notes ? (
            <p className="text-gray-700 whitespace-pre-wrap text-base leading-relaxed">{notes}</p>
          ) : (
            <p className="text-gray-500 italic text-base">No notes yet. Click "Edit" to add your thoughts about today's workout.</p>
          )}
        </div>
      )}
    </div>
  );
};