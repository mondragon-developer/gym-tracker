import React, { useState, useEffect } from 'react';
import { EXERCISE_DATABASE } from '../constants/index.js';
import NewModal from './NewModal.jsx';

const AddExerciseModal = ({ isOpen, onClose, onAddExercise, muscleGroup }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isCustom, setIsCustom] = useState(false);
    const [customName, setCustomName] = useState('');
    const [customSets, setCustomSets] = useState('3');
    const [customReps, setCustomReps] = useState('10-12');

    // Filter exercises based on search and muscle group
    const filteredExercises = EXERCISE_DATABASE.filter(ex =>
        ex.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (muscleGroup ? ex.muscleGroup.toLowerCase() === muscleGroup.toLowerCase() : true)
    );

    // Handle adding exercise from library
    const handleAdd = (exercise) => {
        onAddExercise({ 
            dbId: exercise.id, 
            name: exercise.name, 
            sets: '3', 
            reps: '10-12' 
        });
        onClose();
        resetForm();
    };

    // Handle adding custom exercise
    const handleAddCustom = () => {
        if (!customName.trim()) {
            alert("Please enter an exercise name.");
            return;
        }
        onAddExercise({ 
            dbId: null, 
            name: customName.trim(), 
            sets: customSets, 
            reps: customReps 
        });
        onClose();
        resetForm();
    };

    // Reset form when modal closes
    const resetForm = () => {
        setSearchTerm('');
        setIsCustom(false);
        setCustomName('');
        setCustomSets('3');
        setCustomReps('10-12');
    };

    // Reset form when modal is opened/closed
    useEffect(() => {
        if (!isOpen) {
            resetForm();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <NewModal isOpen={isOpen} onClose={onClose} title="💪 Add Exercise">
            <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px' }}>
                {/* Tab Navigation */}
                <div style={{ display: 'flex', backgroundColor: '#f3f4f6', borderRadius: '8px', padding: '8px', marginBottom: '16px' }}>
                    <button 
                        onClick={() => setIsCustom(false)} 
                        style={{
                            flex: 1,
                            padding: '12px 16px',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '500',
                            border: 'none',
                            cursor: 'pointer',
                            backgroundColor: !isCustom ? '#3b82f6' : 'transparent',
                            color: !isCustom ? 'white' : '#4b5563'
                        }}
                    >
                        📚 From Library
                    </button>
                    <button 
                        onClick={() => setIsCustom(true)} 
                        style={{
                            flex: 1,
                            padding: '12px 16px',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '500',
                            border: 'none',
                            cursor: 'pointer',
                            backgroundColor: isCustom ? '#8b5cf6' : 'transparent',
                            color: isCustom ? 'white' : '#4b5563'
                        }}
                    >
                        ✏️ Custom
                    </button>
                </div>

                {isCustom ? (
                    // Custom Exercise Form
                    <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Exercise Name</label>
                            <input 
                                type="text" 
                                value={customName} 
                                onChange={(e) => setCustomName(e.target.value)} 
                                placeholder="e.g., Bench Press" 
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '8px',
                                    backgroundColor: 'white',
                                    fontSize: '14px',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Sets</label>
                                <input 
                                    type="text" 
                                    value={customSets} 
                                    onChange={(e) => setCustomSets(e.target.value)} 
                                    placeholder="3" 
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        backgroundColor: 'white',
                                        fontSize: '14px',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Reps</label>
                                <input 
                                    type="text" 
                                    value={customReps} 
                                    onChange={(e) => setCustomReps(e.target.value)} 
                                    placeholder="8-12" 
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        backgroundColor: 'white',
                                        fontSize: '14px',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                        </div>
                        
                        <button 
                            onClick={handleAddCustom} 
                            style={{
                                width: '100%',
                                backgroundColor: '#10b981',
                                color: 'white',
                                padding: '12px',
                                borderRadius: '8px',
                                fontWeight: '600',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            ➕ Add Custom Exercise
                        </button>
                    </div>
                ) : (
                    // Exercise Library
                    <div>
                        {/* Search Input */}
                        <div style={{ marginBottom: '12px' }}>
                            <input
                                type="text"
                                placeholder="🔍 Search exercises..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '8px',
                                    backgroundColor: 'white',
                                    fontSize: '14px',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>
                        
                        {/* Filter Info */}
                        {muscleGroup && (
                            <div style={{
                                fontSize: '14px',
                                color: '#1d4ed8',
                                backgroundColor: '#dbeafe',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid #93c5fd',
                                marginBottom: '12px'
                            }}>
                                💡 Showing exercises for: <span style={{ fontWeight: '600' }}>{muscleGroup}</span>
                            </div>
                        )}
                        
                        {/* Exercise List */}
                        <div style={{
                            maxHeight: '200px',
                            overflowY: 'auto',
                            backgroundColor: '#f9fafb',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid #d1d5db'
                        }}>
                            {filteredExercises.length > 0 ? (
                                filteredExercises.map(ex => (
                                    <div 
                                        key={ex.id} 
                                        onClick={() => handleAdd(ex)} 
                                        style={{
                                            padding: '12px',
                                            backgroundColor: 'white',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            border: '1px solid #e5e7eb',
                                            marginBottom: '8px',
                                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontWeight: '600', color: '#111827', fontSize: '14px' }}>{ex.name}</div>
                                                <div style={{ fontSize: '12px', color: '#6b7280' }}>Target: 3 sets × 10-12 reps</div>
                                            </div>
                                            <span style={{
                                                fontSize: '12px',
                                                backgroundColor: '#bfdbfe',
                                                color: '#1e40af',
                                                padding: '4px 8px',
                                                borderRadius: '12px',
                                                fontWeight: '600'
                                            }}>
                                                {ex.muscleGroup}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '32px',
                                    backgroundColor: 'white',
                                    borderRadius: '6px'
                                }}>
                                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔍</div>
                                    <p style={{ color: '#6b7280', margin: '0 0 4px 0' }}>No exercises found</p>
                                    <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0' }}>Try a different search term</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </NewModal>
    );
};

export default AddExerciseModal;