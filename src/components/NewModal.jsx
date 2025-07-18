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
                <div style={{
                    flexShrink: 0,
                    padding: '16px',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'white',
                    borderTopLeftRadius: '12px',
                    borderTopRightRadius: '12px'
                }}>
                    <h2 style={{
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: '#1f2937',
                        margin: 0
                    }}>{title}</h2>
                    <button 
                        onClick={onClose} 
                        style={{
                            padding: '8px',
                            color: '#6b7280',
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                            e.target.style.backgroundColor = '#f3f4f6';
                        }}
                        onMouseOut={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>
                
                {/* Content */}
                <div style={{
                    flex: 1,
                    padding: '16px',
                    overflowY: 'auto',
                    backgroundColor: 'white',
                    borderBottomLeftRadius: '12px',
                    borderBottomRightRadius: '12px'
                }}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default NewModal;