import React from 'react';
import { X } from 'lucide-react';

const NewModal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-80 z-[9999] flex items-center justify-center p-4" 
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex-shrink-0 p-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-blue-500 to-purple-500 rounded-t-xl">
                    <h2 className="text-lg font-bold text-white">{title}</h2>
                    <button 
                        onClick={onClose} 
                        className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>
                
                {/* Content */}
                <div className="flex-1 p-4 overflow-y-auto bg-white">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default NewModal;