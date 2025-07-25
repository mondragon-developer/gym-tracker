import React from 'react';
import { Check, X, Trash2, GripVertical } from 'lucide-react';
import { EXERCISE_DATABASE } from '../constants/index.js';
import { t } from '../translations/ui';
import { translateExercise } from '../translations/exercises';

/**
 * Displays a single exercise item, allowing for edits, status changes, and deletion.
 */
const ExerciseItem = ({ exercise, onUpdate, onDelete, onDragStart, onDragOver, onDragEnd, onDrop, index, language = 'en' }) => {
    // Check if this is a cardio exercise
    const isCardio = () => {
        if (exercise.dbId) {
            const dbExercise = EXERCISE_DATABASE.find(ex => ex.id === exercise.dbId);
            return dbExercise?.muscleGroup === 'Cardio';
        }
        return false;
    };
    const handleUpdate = (field, value) => {
        onUpdate(exercise.id, { ...exercise, [field]: value });
    };

    const handleStatusChange = (newStatus) => {
        handleUpdate('status', exercise.status === newStatus ? 'incomplete' : newStatus);
    };

    const getStatusStyles = () => {
        switch (exercise.status) {
            case 'completed':
                return {
                    background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                    border: '2px solid #10b981',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
                };
            case 'skipped':
                return {
                    background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                    border: '2px solid #ef4444',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)'
                };
            default:
                return {
                    background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
                    border: '2px solid #3b82f6',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.1)'
                };
        }
    };

    const getStatusIcon = () => {
        switch (exercise.status) {
            case 'completed':
                return '✅';
            case 'skipped':
                return '⏭️';
            default:
                return '⏱️';
        }
    };

    const statusStyles = getStatusStyles();

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, index)}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, index)}
            onDragEnd={onDragEnd}
            style={{
                padding: '16px',
                borderRadius: '16px',
                position: 'relative',
                transition: 'all 0.3s ease',
                cursor: 'grab',
                ...statusStyles
            }}
        >
            {/* Mobile-first layout */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Header with drag handle, status icon and action buttons */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <GripVertical style={{ color: '#6b7280' }} size={18} />
                        <span style={{ fontSize: '18px' }}>{getStatusIcon()}</span>
                    </div>
                    
                    {/* Action buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <button 
                            onClick={() => handleStatusChange('completed')} 
                            style={{
                                padding: '10px',
                                borderRadius: '12px',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                border: 'none',
                                cursor: 'pointer',
                                background: exercise.status === 'completed' 
                                    ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)' 
                                    : 'linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 100%)',
                                color: exercise.status === 'completed' ? 'white' : '#10b981'
                            }}
                            title="Mark as completed"
                        >
                            <Check size={18} />
                        </button>
                        <button 
                            onClick={() => handleStatusChange('skipped')} 
                            style={{
                                padding: '10px',
                                borderRadius: '12px',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                border: 'none',
                                cursor: 'pointer',
                                background: exercise.status === 'skipped' 
                                    ? 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)' 
                                    : 'linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 100%)',
                                color: exercise.status === 'skipped' ? 'white' : '#ef4444'
                            }}
                            title="Mark as skipped"
                        >
                            <X size={18} />
                        </button>
                        <button 
                            onClick={() => onDelete(exercise.id)} 
                            style={{
                                padding: '10px',
                                borderRadius: '12px',
                                background: 'linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 100%)',
                                color: '#ef4444',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                            title="Delete exercise"
                            onMouseOver={(e) => {
                                e.target.style.background = 'linear-gradient(90deg, #fee2e2 0%, #fecaca 100%)';
                            }}
                            onMouseOut={(e) => {
                                e.target.style.background = 'linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 100%)';
                            }}
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
                
                {/* Exercise name and target - moved down for better visual hierarchy */}
                <div style={{ paddingLeft: '34px', marginTop: '-2px' }}>
                    <h3 style={{
                        fontWeight: '600',
                        color: '#111827',
                        fontSize: '18px',
                        margin: '0 0 4px 0',
                        lineHeight: '1.3',
                        wordBreak: 'break-word',
                        hyphens: 'auto'
                    }}>
                        {translateExercise(exercise.name, language)}
                    </h3>
                    <div style={{ 
                        fontSize: '13px', 
                        color: '#6b7280', 
                        fontWeight: '500',
                        padding: '4px 8px',
                        background: 'rgba(107, 114, 128, 0.1)',
                        borderRadius: '6px',
                        display: 'inline-block'
                    }}>
                        {isCardio() ? 
                            `${t("Target Duration (minutes)", language)}: ${exercise.sets || '30'}` : 
                            `${t("Target Sets", language)}: ${exercise.sets} × ${exercise.reps} ${t("reps", language)}`
                        }
                    </div>
                </div>

                {/* Input fields - responsive grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: isCardio() ? '1fr 1fr' : 'repeat(2, 1fr)',
                    gap: '10px',
                    fontSize: '14px'
                }}>
                    {isCardio() ? (
                        // Cardio-specific fields
                        <>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '600', color: '#f59e0b' }}>{t("Duration", language)} (min)</label>
                                <select 
                                    value={exercise.sets || '30'} 
                                    onChange={e => handleUpdate('sets', e.target.value)} 
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        background: 'linear-gradient(90deg, #fef3c7 0%, #fde68a 100%)',
                                        border: '2px solid #f59e0b',
                                        borderRadius: '12px',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        color: '#374151',
                                        boxSizing: 'border-box',
                                        transition: 'all 0.3s ease',
                                        cursor: 'pointer'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.1)';
                                        e.target.style.borderColor = '#d97706';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.boxShadow = 'none';
                                        e.target.style.borderColor = '#f59e0b';
                                    }}
                                >
                                    {[...Array(120)].map((_, i) => (
                                        <option key={i+1} value={i+1}>{i+1} min</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '600', color: '#10b981' }}>{t("Effective", language)}</label>
                                <input 
                                    type="number" 
                                    value={exercise.effectiveSets || ''} 
                                    onChange={e => handleUpdate('effectiveSets', e.target.value)} 
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        background: 'linear-gradient(90deg, #d1fae5 0%, #a7f3d0 100%)',
                                        border: '2px solid #34d399',
                                        borderRadius: '12px',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        color: '#374151',
                                        boxSizing: 'border-box',
                                        transition: 'all 0.3s ease'
                                    }}
                                    placeholder="0"
                                    min="0"
                                    max="120"
                                    onFocus={(e) => {
                                        e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                                        e.target.style.borderColor = '#10b981';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.boxShadow = 'none';
                                        e.target.style.borderColor = '#34d399';
                                    }}
                                />
                            </div>
                        </>
                    ) : (
                        // Regular exercise fields
                        <>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '600', color: '#8b5cf6' }}>{t("Sets", language)}</label>
                                <input 
                                    type="text" 
                                    value={exercise.sets} 
                                    onChange={e => handleUpdate('sets', e.target.value)} 
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        background: 'linear-gradient(90deg, #f3e8ff 0%, #ddd6fe 100%)',
                                        border: '2px solid #c084fc',
                                        borderRadius: '12px',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        color: '#374151',
                                        boxSizing: 'border-box',
                                        transition: 'all 0.3s ease'
                                    }}
                                    placeholder="3"
                                    onFocus={(e) => {
                                        e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
                                        e.target.style.borderColor = '#8b5cf6';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.boxShadow = 'none';
                                        e.target.style.borderColor = '#c084fc';
                                    }}
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '600', color: '#3b82f6' }}>{t("Reps", language)}</label>
                                <input 
                                    type="text" 
                                    value={exercise.reps} 
                                    onChange={e => handleUpdate('reps', e.target.value)} 
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        background: 'linear-gradient(90deg, #dbeafe 0%, #bfdbfe 100%)',
                                        border: '2px solid #60a5fa',
                                        borderRadius: '12px',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        color: '#374151',
                                        boxSizing: 'border-box',
                                        transition: 'all 0.3s ease'
                                    }}
                                    placeholder="8-12"
                                    onFocus={(e) => {
                                        e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                                        e.target.style.borderColor = '#3b82f6';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.boxShadow = 'none';
                                        e.target.style.borderColor = '#60a5fa';
                                    }}
                                />
                            </div>
                        </>
                    )}
                    {!isCardio() && (
                        <>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '600', color: '#6366f1' }}>{t("Weight", language)}</label>
                                <input 
                                    type="text" 
                                    value={exercise.weight} 
                                    onChange={e => handleUpdate('weight', e.target.value)} 
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        background: 'linear-gradient(90deg, #e0e7ff 0%, #c7d2fe 100%)',
                                        border: '2px solid #818cf8',
                                        borderRadius: '12px',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        color: '#374151',
                                        boxSizing: 'border-box',
                                        transition: 'all 0.3s ease'
                                    }}
                                    placeholder="lbs/kg"
                                    onFocus={(e) => {
                                        e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                                        e.target.style.borderColor = '#6366f1';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.boxShadow = 'none';
                                        e.target.style.borderColor = '#818cf8';
                                    }}
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '600', color: '#10b981' }}>{t("Effective", language)}</label>
                                <input 
                                    type="number" 
                                    value={exercise.effectiveSets} 
                                    onChange={e => handleUpdate('effectiveSets', e.target.value)} 
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        background: 'linear-gradient(90deg, #d1fae5 0%, #a7f3d0 100%)',
                                        border: '2px solid #34d399',
                                        borderRadius: '12px',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        color: '#374151',
                                        boxSizing: 'border-box',
                                        transition: 'all 0.3s ease'
                                    }}
                                    placeholder="0"
                                    min="0"
                                    onFocus={(e) => {
                                        e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                                        e.target.style.borderColor = '#10b981';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.boxShadow = 'none';
                                        e.target.style.borderColor = '#34d399';
                                    }}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExerciseItem;