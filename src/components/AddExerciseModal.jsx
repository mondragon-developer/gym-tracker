import React, { useState, useEffect } from 'react';
import { EXERCISE_DATABASE } from '../constants/index.js';
import { INDIVIDUAL_MUSCLE_GROUPS } from '../constants/AppConstants.js';
import Modal from './ui/Modal.jsx';
import { t } from '../translations/ui';
import { translateExercise } from '../translations/exercises';

// Helper function to get muscle group colors
const getMuscleGroupColor = (muscleGroup) => {
    const colors = {
        'Chest': { bg: '#fee2e2', text: '#dc2626' },
        'Back': { bg: '#dcfce7', text: '#16a34a' },
        'Shoulders': { bg: '#dbeafe', text: '#2563eb' },
        'Biceps': { bg: '#f3e8ff', text: '#9333ea' },
        'Triceps': { bg: '#fef3c7', text: '#d97706' },
        'Legs': { bg: '#ecfdf5', text: '#059669' },
        'Abs': { bg: '#fce7f3', text: '#e11d48' },
        'Cardio': { bg: '#f0f9ff', text: '#0284c7' },
        'Forearms': { bg: '#f5f3ff', text: '#7c3aed' }
    };
    return colors[muscleGroup] || { bg: '#f3f4f6', text: '#6b7280' };
};

const AddExerciseModal = ({ isOpen, onClose, onAddExercise, muscleGroup, language = 'en' }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('All');
    const [isCustom, setIsCustom] = useState(false);
    const [customName, setCustomName] = useState('');
    const [customSets, setCustomSets] = useState('3');
    const [customReps, setCustomReps] = useState('10-12');
    const [defaultSets, setDefaultSets] = useState('3');
    const [defaultRepsMin, setDefaultRepsMin] = useState('8');
    const [defaultRepsMax, setDefaultRepsMax] = useState('12');

    // Get unique muscle groups from the database
    const allMuscleGroups = ['All', ...new Set(EXERCISE_DATABASE.map(ex => ex.muscleGroup))];
    
    // Filter exercises based on search and selected muscle group
    const filteredExercises = EXERCISE_DATABASE.filter(ex => {
        const matchesSearch = ex.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesMuscleGroup = selectedMuscleGroup === 'All' || ex.muscleGroup === selectedMuscleGroup;
        return matchesSearch && matchesMuscleGroup;
    });

    // Handle adding exercise from library
    const handleAdd = (exercise) => {
        const isCardio = exercise.muscleGroup === 'Cardio';
        
        if (isCardio) {
            onAddExercise({ 
                dbId: exercise.id, 
                name: exercise.name, 
                sets: defaultSets, // This will be used as duration in minutes for cardio
                reps: '', // Not used for cardio
                weight: '', // Not used for cardio
                effectiveSets: '' // This will be used as completed duration for cardio
            });
        } else {
            const repsRange = defaultRepsMin === defaultRepsMax ? defaultRepsMin : `${defaultRepsMin}-${defaultRepsMax}`;
            onAddExercise({ 
                dbId: exercise.id, 
                name: exercise.name, 
                sets: defaultSets, 
                reps: repsRange 
            });
        }
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
        setSelectedMuscleGroup('All');
        setIsCustom(false);
        setCustomName('');
        setCustomSets('3');
        setCustomReps('10-12');
        setDefaultSets('3');
        setDefaultRepsMin('8');
        setDefaultRepsMax('12');
    };

    // Reset form when modal is opened/closed
    useEffect(() => {
        if (!isOpen) {
            resetForm();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`💪 ${t("Add New Exercise", language)}`}>
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
                        📚 {t("Popular", language)}
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
                        ✏️ {t("Custom Exercise", language)}
                    </button>
                </div>

                {isCustom ? (
                    // Custom Exercise Form
                    <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>{t("Exercise name", language)}</label>
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
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>{t("Target Sets", language)}</label>
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
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>{t("Target Reps", language)}</label>
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
                            ➕ {t("Add to Workout", language)}
                        </button>
                    </div>
                ) : (
                    // Exercise Library
                    <div>
                        {/* Search Input */}
                        <div style={{ marginBottom: '12px' }}>
                            <input
                                type="text"
                                placeholder={`🔍 ${t("Search exercises...", language)}`}
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
                        
                        {/* Muscle Group Filter */}
                        <div style={{ marginBottom: '12px' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Filter by Muscle Group</label>
                            <select
                                value={selectedMuscleGroup}
                                onChange={(e) => setSelectedMuscleGroup(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '8px',
                                    backgroundColor: 'white',
                                    fontSize: '14px',
                                    boxSizing: 'border-box',
                                    cursor: 'pointer'
                                }}
                            >
                                {allMuscleGroups.map(group => (
                                    <option key={group} value={group}>{translateExercise(group, language)}</option>
                                ))}
                            </select>
                        </div>
                        
                        {/* Default Configuration */}
                        <div style={{
                            backgroundColor: '#f8fafc',
                            padding: '16px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            marginBottom: '12px'
                        }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>Default Configuration for Selected Exercises</label>
                            
                            {selectedMuscleGroup === 'Cardio' ? (
                                // Cardio configuration
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '6px' }}>Duration (minutes)</label>
                                        <select
                                            value={defaultSets}
                                            onChange={(e) => setDefaultSets(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '8px',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '6px',
                                                backgroundColor: 'white',
                                                fontSize: '14px',
                                                boxSizing: 'border-box',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {[...Array(120)].map((_, i) => (
                                                <option key={i+1} value={i+1}>{i+1} minutes</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            ) : (
                                // Regular exercise configuration
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '6px' }}>Sets</label>
                                        <select
                                            value={defaultSets}
                                            onChange={(e) => setDefaultSets(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '8px',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '6px',
                                                backgroundColor: 'white',
                                                fontSize: '14px',
                                                boxSizing: 'border-box',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {[1,2,3,4,5,6,7,8,9,10].map(num => (
                                                <option key={num} value={num}>{num}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '6px' }}>Min Reps</label>
                                        <select
                                            value={defaultRepsMin}
                                            onChange={(e) => setDefaultRepsMin(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '8px',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '6px',
                                                backgroundColor: 'white',
                                                fontSize: '14px',
                                                boxSizing: 'border-box',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {[...Array(20)].map((_, i) => (
                                                <option key={i+1} value={i+1}>{i+1}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '6px' }}>Max Reps</label>
                                        <select
                                            value={defaultRepsMax}
                                            onChange={(e) => setDefaultRepsMax(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '8px',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '6px',
                                                backgroundColor: 'white',
                                                fontSize: '14px',
                                                boxSizing: 'border-box',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {[...Array(20)].map((_, i) => (
                                                <option key={i+1} value={i+1}>{i+1}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {/* Results Info */}
                        <div style={{
                            fontSize: '14px',
                            color: '#1d4ed8',
                            backgroundColor: '#dbeafe',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid #93c5fd',
                            marginBottom: '12px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <span>
                                💡 Showing: <span style={{ fontWeight: '600' }}>{selectedMuscleGroup}</span> exercises
                            </span>
                            <span style={{ fontSize: '12px', fontWeight: '600' }}>
                                {filteredExercises.length} results
                            </span>
                        </div>
                        
                        {/* Exercise List */}
                        <div style={{
                            maxHeight: '250px',
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
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            border: '1px solid #e5e7eb',
                                            marginBottom: '8px',
                                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.backgroundColor = '#f3f4f6';
                                            e.currentTarget.style.transform = 'translateY(-1px)';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.backgroundColor = 'white';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ 
                                                    fontWeight: '600', 
                                                    color: '#111827', 
                                                    fontSize: '14px',
                                                    marginBottom: '4px'
                                                }}>
                                                    {searchTerm && ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ? (
                                                        <span dangerouslySetInnerHTML={{
                                                            __html: translateExercise(ex.name, language).replace(
                                                                new RegExp(`(${searchTerm})`, 'gi'),
                                                                '<mark style="background-color: #fef3c7; padding: 1px 2px; border-radius: 2px;">$1</mark>'
                                                            )
                                                        }} />
                                                    ) : (
                                                        translateExercise(ex.name, language)
                                                    )}
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                                    {ex.muscleGroup === 'Cardio' ? 
                                                        `${t("Target Duration (minutes)", language)}: ${defaultSets}` : 
                                                        `${t("Target Sets", language)}: ${defaultSets} × ${defaultRepsMin === defaultRepsMax ? defaultRepsMin : `${defaultRepsMin}-${defaultRepsMax}`} ${t("reps", language)}`
                                                    }
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{
                                                    fontSize: '12px',
                                                    backgroundColor: getMuscleGroupColor(ex.muscleGroup).bg,
                                                    color: getMuscleGroupColor(ex.muscleGroup).text,
                                                    padding: '4px 8px',
                                                    borderRadius: '12px',
                                                    fontWeight: '600'
                                                }}>
                                                    {translateExercise(ex.muscleGroup, language)}
                                                </span>
                                                <span style={{
                                                    fontSize: '18px',
                                                    color: '#10b981'
                                                }}>➕</span>
                                            </div>
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
        </Modal>
    );
};

export default AddExerciseModal;