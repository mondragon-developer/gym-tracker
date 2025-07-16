import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="modal fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="modal-content bg-white rounded-2xl shadow-2xl w-full max-w-sm text-center p-6 sm:p-8">
        <div className="mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-white">⚠️</span>
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Confirm Action</h3>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{message}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
          <button
            className="btn-success flex-1 px-6 py-3 text-white font-semibold rounded-xl shadow-lg"
            onClick={onConfirm}
          >
            ✅ Yes, Continue
          </button>
          <button
            className="btn-danger flex-1 px-6 py-3 text-white font-semibold rounded-xl shadow-lg"
            onClick={onCancel}
          >
            ❌ Cancel
          </button>
        </div>
      </div>
    </div>
  );
};