import React, { useState } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import ExerciseItem from './ExerciseItem.jsx';

/**
 * An accordion component for a single day's workout plan.
 */
const DayAccordion = ({ day, data, isOpen, onToggle, onUpdateDay, onResetDay, onOpenAddExercise, activeDayRef }) => {
    const [draggedItem, setDraggedItem] = useState(null);

    const handleUpdateExercise = (exerciseId, updatedExercise) => {
        const updatedExercises = data.exercises.map(ex => ex.id === exerciseId ? updatedExercise : ex);
        onUpdateDay(day, { ...data, exercises: updatedExercises });
    };

    const handleDeleteExercise = (exerciseId) => {
        const updatedExercises = data.exercises.filter(ex => ex.id !== exerciseId);
        onUpdateDay(day, { ...data, exercises: updatedExercises });
    };
    
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
                    <span style={{ fontSize: '14px', opacity: 0.95, fontWeight: '500' }}>{data.name}</span>
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
                    padding: '32px',
                    background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)'
                }}>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '24px',
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
                        gap: '16px',
                        paddingTop: '32px',
                        borderTop: '2px solid #e5e7eb',
                        marginTop: '24px'
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