import React from 'react';
import { X } from 'lucide-react';

const CustomModal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 z-[9999] flex items-center justify-center p-4" 
            aria-modal="true" 
            role="dialog"
            onClick={onClose}
            style={{ 
                position: 'fixed', 
                top: 0, 
                left: 0, 
                right: 0, 
                bottom: 0,
                maxWidth: 'none',
                width: '100vw',
                height: '100vh'
            }}
        >
            <div 
                className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col relative"
                onClick={(e) => e.stopPropagation()}
                style={{ zIndex: 10000 }}
            >
                {/* Header */}
                <div className="flex-shrink-0 p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-blue-500 to-purple-500 rounded-t-xl">
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                    <button 
                        onClick={onClose} 
                        className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all" 
                        aria-label="Close modal"
                    >
                        <X size={24} />
                    </button>
                </div>
                
                {/* Content */}
                <div className="flex-1 p-6 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default CustomModal;