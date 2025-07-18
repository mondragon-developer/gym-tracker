import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, Edit3 } from 'lucide-react';
import ExerciseItem from './ExerciseItem.jsx';
import { INDIVIDUAL_MUSCLE_GROUPS } from '../constants/AppConstants.js';

/**
 * An accordion component for a single day's workout plan.
 */
const DayAccordion = ({ day, data, isOpen, onToggle, onUpdateDay, onResetDay, onOpenAddExercise, activeDayRef }) => {
    const [draggedItem, setDraggedItem] = useState(null);
    const [showMuscleGroupDropdown, setShowMuscleGroupDropdown] = useState(false);

    const handleUpdateExercise = (exerciseId, updatedExercise) => {
        const updatedExercises = data.exercises.map(ex => ex.id === exerciseId ? updatedExercise : ex);
        onUpdateDay(day, { ...data, exercises: updatedExercises });
    };

    const handleDeleteExercise = (exerciseId) => {
        const updatedExercises = data.exercises.filter(ex => ex.id !== exerciseId);
        onUpdateDay(day, { ...data, exercises: updatedExercises });
    };
    
    const parseSelectedMuscleGroups = (nameString) => {
        if (nameString === 'Rest') return ['Rest'];
        return nameString.split(' & ').filter(group => group.length > 0);
    };
    
    const formatMuscleGroupsName = (selectedGroups) => {
        if (selectedGroups.length === 0) return 'Rest';
        if (selectedGroups.includes('Rest')) return 'Rest';
        return selectedGroups.join(' & ');
    };
    
    const handleMuscleGroupToggle = (muscleGroup) => {
        const currentGroups = parseSelectedMuscleGroups(data.name);
        
        if (muscleGroup === 'Rest') {
            onUpdateDay(day, { ...data, name: 'Rest' });
            setShowMuscleGroupDropdown(false);
            return;
        }
        
        if (currentGroups.includes('Rest')) {
            onUpdateDay(day, { ...data, name: muscleGroup });
            return;
        }
        
        let newGroups;
        if (currentGroups.includes(muscleGroup)) {
            newGroups = currentGroups.filter(group => group !== muscleGroup);
        } else {
            if (currentGroups.length >= 3) {
                return;
            }
            newGroups = [...currentGroups, muscleGroup];
        }
        
        const newName = formatMuscleGroupsName(newGroups);
        onUpdateDay(day, { ...data, name: newName });
    };
    
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showMuscleGroupDropdown && !event.target.closest('.muscle-group-dropdown')) {
                setShowMuscleGroupDropdown(false);
            }
        };
        
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [showMuscleGroupDropdown]);
    
    const onDragStart = (e, index) => {
        setDraggedItem(data.exercises[index]);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target);
    };

    const onDragOver = (e) => {
        e.preventDefault();
    };

    const onDrop = (e, index) => {
        const newExercises = [...data.exercises];
        const draggedItemIndex = newExercises.findIndex(ex => ex.id === draggedItem.id);
        newExercises.splice(draggedItemIndex, 1);
        newExercises.splice(index, 0, draggedItem);
        onUpdateDay(day, { ...data, exercises: newExercises });
        setDraggedItem(null);
    };

    const onDragEnd = () => setDraggedItem(null);

    const getHeaderColors = () => {
        if (isOpen) {
            return {
                background: 'linear-gradient(90deg, #10b981 0%, #059669 50%, #047857 100%)',
                color: 'white',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)'
            };
        }
        
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        if (day === today) {
            return {
                background: 'linear-gradient(90deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)',
                color: 'white',
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.12)'
            };
        }
        
        return {
            background: 'linear-gradient(90deg, #64748b 0%, #475569 50%, #334155 100%)',
            color: 'white',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
        };
    };

    const exerciseCount = data.exercises.length;
    const completedCount = data.exercises.filter(ex => ex.status === 'completed').length;
    const headerStyle = getHeaderColors();

    return (
        <div 
            ref={isOpen ? activeDayRef : null} 
            style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                border: '2px solid #a855f7',
                overflow: 'hidden',
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.08)',
                transition: 'all 0.3s ease'
            }}
        >
            <div
                style={{
                    padding: '20px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.3s ease',
                    ...headerStyle
                }}
                onClick={() => onToggle(day)}
            >
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '20px' }}>{day}</span>
                        {exerciseCount > 0 && (
                            <span style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                                fontSize: '12px',
                                fontWeight: '600',
                                padding: '4px 12px',
                                borderRadius: '12px',
                                backdropFilter: 'blur(4px)'
                            }}>
                                {completedCount}/{exerciseCount}
                            </span>
                        )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }} className="muscle-group-dropdown">
                        <span style={{ fontSize: '14px', opacity: 0.95, fontWeight: '500' }}>{data.name}</span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowMuscleGroupDropdown(!showMuscleGroupDropdown);
                            }}
                            style={{
                                background: 'rgba(255, 255, 255, 0.25)',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                color: 'white',
                                transition: 'all 0.2s ease'
                            }}
                            title="Change muscle group"
                        >
                            <Edit3 size={14} />
                        </button>
                        {showMuscleGroupDropdown && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: '20px',
                                right: '20px',
                                background: 'white',
                                border: '2px solid #3b82f6',
                                borderRadius: '12px',
                                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                                zIndex: 1000,
                                maxHeight: '200px',
                                overflowY: 'auto',
                                marginTop: '8px'
                            }}>
                                <div style={{
                                    padding: '12px 16px 8px 16px',
                                    borderBottom: '1px solid #e5e7eb',
                                    marginBottom: '8px'
                                }}>
                                    <div style={{
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        color: '#6b7280',
                                        marginBottom: '4px'
                                    }}>
                                        Select up to 3 muscle groups:
                                    </div>
                                    <div style={{
                                        fontSize: '11px',
                                        color: '#9ca3af'
                                    }}>
                                        {parseSelectedMuscleGroups(data.name).filter(g => g !== 'Rest').length}/3 selected
                                    </div>
                                </div>
                                {INDIVIDUAL_MUSCLE_GROUPS.map((option) => {
                                    const selectedGroups = parseSelectedMuscleGroups(data.name);
                                    const isSelected = selectedGroups.includes(option);
                                    const isRest = option === 'Rest';
                                    const isRestSelected = selectedGroups.includes('Rest');
                                    const maxReached = selectedGroups.filter(g => g !== 'Rest').length >= 3;
                                    const isDisabled = !isSelected && !isRest && (maxReached || isRestSelected);
                                    
                                    return (
                                        <button
                                            key={option}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (!isDisabled) {
                                                    handleMuscleGroupToggle(option);
                                                }
                                            }}
                                            style={{
                                                width: '100%',
                                                padding: '12px 16px',
                                                border: 'none',
                                                background: isSelected ? '#dbeafe' : 'transparent',
                                                textAlign: 'left',
                                                cursor: isDisabled ? 'not-allowed' : 'pointer',
                                                fontSize: '14px',
                                                fontWeight: isSelected ? '600' : '500',
                                                color: isDisabled ? '#9ca3af' : isSelected ? '#3b82f6' : '#374151',
                                                transition: 'all 0.2s ease',
                                                borderRadius: '8px',
                                                margin: '4px 8px',
                                                opacity: isDisabled ? 0.5 : 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between'
                                            }}
                                            onMouseOver={(e) => {
                                                if (!isDisabled && !isSelected) {
                                                    e.target.style.background = '#f9fafb';
                                                }
                                            }}
                                            onMouseOut={(e) => {
                                                if (!isDisabled && !isSelected) {
                                                    e.target.style.background = 'transparent';
                                                }
                                            }}
                                        >
                                            <span>{option}</span>
                                            {isSelected && (
                                                <span style={{
                                                    color: '#10b981',
                                                    fontSize: '16px',
                                                    fontWeight: 'bold'
                                                }}>✓</span>
                                            )}
                                        </button>
                                    );
                                })}
                                <div style={{
                                    padding: '12px 16px',
                                    borderTop: '1px solid #e5e7eb',
                                    marginTop: '8px'
                                }}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowMuscleGroupDropdown(false);
                                        }}
                                        style={{
                                            width: '100%',
                                            padding: '8px 16px',
                                            background: '#3b82f6',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseOver={(e) => {
                                            e.target.style.background = '#2563eb';
                                        }}
                                        onMouseOut={(e) => {
                                            e.target.style.background = '#3b82f6';
                                        }}
                                    >
                                        Done
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <ChevronDown 
                    style={{
                        transition: 'transform 0.3s ease',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                    }} 
                    size={22} 
                />
            </div>
            
            {isOpen && (
                <div style={{
                    padding: '20px',
                    background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)'
                }}>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                        maxHeight: '400px',
                        overflowY: 'auto'
                    }}>
                        {data.exercises.length > 0 ? (
                            data.exercises.map((ex, index) => (
                                <ExerciseItem 
                                    key={ex.id} 
                                    exercise={ex} 
                                    index={index} 
                                    onUpdate={handleUpdateExercise} 
                                    onDelete={handleDeleteExercise} 
                                    onDragStart={onDragStart} 
                                    onDragOver={onDragOver} 
                                    onDrop={onDrop} 
                                    onDragEnd={onDragEnd} 
                                />
                            ))
                        ) : (
                            <div style={{
                                textAlign: 'center',
                                padding: '48px',
                                background: 'linear-gradient(135deg, #dbeafe 0%, #e0f2fe 100%)',
                                borderRadius: '12px',
                                border: '2px dashed #60a5fa'
                            }}>
                                <div style={{ fontSize: '48px', marginBottom: '12px' }}>💤</div>
                                <p style={{ color: '#2563eb', fontWeight: '600', marginBottom: '8px', margin: '0 0 8px 0' }}>No exercises for today</p>
                                <p style={{ fontSize: '14px', color: '#60a5fa', margin: '0' }}>Add an exercise to get started!</p>
                            </div>
                        )}
                    </div>
                    
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        paddingTop: '20px',
                        borderTop: '2px solid #e5e7eb',
                        marginTop: '16px'
                    }}>
                        <button 
                            onClick={() => onOpenAddExercise(day)} 
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                padding: '16px 24px',
                                background: 'linear-gradient(90deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)',
                                color: 'white',
                                fontWeight: '600',
                                borderRadius: '12px',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '16px',
                                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseOver={(e) => {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.4)';
                            }}
                            onMouseOut={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                            }}
                        >
                            <Plus size={20} /> Add Exercise
                        </button>
                        <button 
                            onClick={() => onResetDay(day)} 
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                padding: '16px 24px',
                                background: 'linear-gradient(90deg, #d1d5db 0%, #9ca3af 100%)',
                                color: '#374151',
                                fontWeight: '600',
                                borderRadius: '12px',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '16px',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseOver={(e) => {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.15)';
                            }}
                            onMouseOut={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                            }}
                        >
                            🔄 Reset Day
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DayAccordion;