import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, Edit3 } from 'lucide-react';
import {
    DndContext,
    PointerSensor,
    TouchSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
    closestCenter,
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    arrayMove,
    sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import ExerciseItem from './ExerciseItem.jsx';
import { INDIVIDUAL_MUSCLE_GROUPS } from '../constants/AppConstants.js';
import { t } from '../translations/ui';
import { translateExercise, translateMuscleGroup } from '../translations/exercises';

/**
 * An accordion component for a single day's workout plan.
 */
const DayAccordion = ({ day, data, isOpen, onToggle, onUpdateDay, onResetDay, onOpenAddExercise, onExerciseDeleted, previousData = null, activeDayRef, language = 'en', readOnly = false, date }) => {
    // Same exercise last week, by library id or (custom exercises) by name.
    const findPrevious = (exercise) => {
        const list = previousData?.exercises ?? [];
        return list.find(p => (exercise.dbId ? p.dbId === exercise.dbId : p.name === exercise.name)) ?? null;
    };
    const [showMuscleGroupDropdown, setShowMuscleGroupDropdown] = useState(false);
    // Empty notes collapse to a one-line button so exercises sit higher on
    // phones; a day with a note always shows the textarea.
    const [noteOpen, setNoteOpen] = useState(false);
    const showNote = Boolean(data.note) || noteOpen;


    // Touch sensor with delay so finger drag doesn't fight scroll on mobile.
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const handleDragEnd = (event) => {
        if (readOnly) return;
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = data.exercises.findIndex(ex => ex.id === active.id);
        const newIndex = data.exercises.findIndex(ex => ex.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;
        onUpdateDay(day, { ...data, exercises: arrayMove(data.exercises, oldIndex, newIndex) });
    };

    const handleUpdateExercise = (exerciseId, updatedExercise) => {
        const updatedExercises = data.exercises.map(ex => ex.id === exerciseId ? updatedExercise : ex);
        onUpdateDay(day, { ...data, exercises: updatedExercises });
    };

    const handleDeleteExercise = (exerciseId) => {
        const removed = data.exercises.find(ex => ex.id === exerciseId);
        const updatedExercises = data.exercises.filter(ex => ex.id !== exerciseId);
        onUpdateDay(day, { ...data, exercises: updatedExercises });
        // Lets the owner offer Undo; called after the update so it can
        // snapshot the pre-delete state from its own closure.
        if (removed && typeof onExerciseDeleted === 'function') onExerciseDeleted(day, removed);
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
    
    const getHeaderColors = () => {
        if (isOpen) {
            return {
                background: 'var(--day-open-bg)',
                color: 'var(--on-day)',
                boxShadow: '0 10px 25px var(--shadow-strong)'
            };
        }
        
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        if (day === today) {
            return {
                background: 'var(--day-today-bg)',
                    color: 'var(--on-day)',
                    boxShadow: '0 8px 20px var(--shadow-strong)'
            };
        }
        
        return {
            background: 'var(--day-idle-bg)',
            color: 'var(--on-day)',
            boxShadow: '0 4px 12px var(--shadow)'
        };
    };

    const exerciseCount = data.exercises.length;
    const completedCount = data.exercises.filter(ex => ex.status === 'completed').length;
    const headerStyle = getHeaderColors();
    // Only a day with nothing to train can be hidden; a day with exercises
    // must be emptied or set to Rest first so no work disappears from view.
    const canHide = !readOnly && (data.name === 'Rest' || exerciseCount === 0);

    return (
        <div 
            ref={isOpen ? activeDayRef : null} 
            style={{
                backgroundColor: 'var(--surface)',
                borderRadius: '16px',
                border: '2px solid var(--border)',
                overflow: 'hidden',
                boxShadow: '0 8px 20px var(--shadow)',
                transition: 'all 0.3s ease'
            }}
        >
            {/*
              Header uses role=button (not <button>) because the muscle-group editor
              renders nested interactive children, and <button> inside <button> is
              invalid HTML. Keyboard handler + aria-expanded keep it accessible.
            */}
            <div
                role="button"
                tabIndex={0}
                aria-expanded={isOpen}
                aria-controls={`day-panel-${day}`}
                className="day-header"
                style={{
                    padding: '14px 18px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all 0.3s ease',
                    ...headerStyle
                }}
                onClick={() => onToggle(day)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onToggle(day);
                    }
                }}
            >
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                        <span className="day-title" style={{ fontWeight: 'bold', fontSize: '18px', lineHeight: 1.2 }}>{t(day, language)}</span>
                        {date && (
                            <span style={{ fontSize: '12px', opacity: 0.85, fontWeight: 500 }}>{date}</span>
                        )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', position: 'relative', marginTop: '2px' }} className="muscle-group-dropdown">
                        <span style={{ fontSize: '13px', opacity: 0.95, fontWeight: '500' }}>{translateMuscleGroup(data.name, language)}</span>
                        {!readOnly && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowMuscleGroupDropdown(!showMuscleGroupDropdown);
                            }}
                            style={{
                                background: 'var(--day-chip-bg)',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                color: 'var(--on-day)',
                                transition: 'all 0.2s ease'
                            }}
                            title="Change muscle group"
                        >
                            <Edit3 size={14} />
                        </button>
                        )}
                        {!readOnly && showMuscleGroupDropdown && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                minWidth: '240px',
                                background: 'var(--surface)',
                                border: '2px solid var(--info-border)',
                                borderRadius: '12px',
                                boxShadow: '0 10px 25px var(--shadow-strong)',
                                zIndex: 1000,
                                maxHeight: '200px',
                                overflowY: 'auto',
                                marginTop: '8px'
                            }}>
                                <div style={{
                                    padding: '12px 16px 8px 16px',
                                    borderBottom: '1px solid var(--border)',
                                    marginBottom: '8px'
                                }}>
                                    <div style={{
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        color: 'var(--text-3)',
                                        marginBottom: '4px'
                                    }}>
                                        {t("Select up to 3 muscle groups:", language)}
                                    </div>
                                    <div style={{
                                        fontSize: '11px',
                                        color: 'var(--text-3)'
                                    }}>
                                        {parseSelectedMuscleGroups(data.name).filter(g => g !== 'Rest').length}/3 {t("selected", language)}
                                    </div>
                                </div>
                                {INDIVIDUAL_MUSCLE_GROUPS.map((option) => {
                                    const selectedGroups = parseSelectedMuscleGroups(data.name);
                                    const isSelected = selectedGroups.includes(option);
                                    const isRest = option === 'Rest';
                                    const maxReached = selectedGroups.filter(g => g !== 'Rest').length >= 3;
                                    const isDisabled = !isSelected && !isRest && maxReached;
                                    
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
                                                width: 'calc(100% - 16px)',
                                                boxSizing: 'border-box',
                                                padding: '12px 16px',
                                                border: 'none',
                                                background: isSelected ? 'var(--info-soft)' : 'transparent',
                                                textAlign: 'left',
                                                cursor: isDisabled ? 'not-allowed' : 'pointer',
                                                fontSize: '14px',
                                                fontWeight: isSelected ? '600' : '500',
                                                color: isDisabled ? 'var(--text-3)' : isSelected ? 'var(--info)' : 'var(--text-2)',
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
                                                    e.target.style.background = 'var(--surface-2)';
                                                }
                                            }}
                                            onMouseOut={(e) => {
                                                if (!isDisabled && !isSelected) {
                                                    e.target.style.background = 'transparent';
                                                }
                                            }}
                                        >
                                            <span>{translateExercise(option, language)}</span>
                                            {isSelected && (
                                                <span style={{
                                                    color: 'var(--done)',
                                                    fontSize: '16px',
                                                    fontWeight: 'bold'
                                                }}>✓</span>
                                            )}
                                        </button>
                                    );
                                })}
                                <div style={{
                                    padding: '12px 16px',
                                    borderTop: '1px solid var(--border)',
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
                                            background: 'var(--info)',
                                            color: 'var(--on-brand)',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseOver={(e) => {
                                            e.target.style.background = 'var(--info-border)';
                                        }}
                                        onMouseOut={(e) => {
                                            e.target.style.background = 'var(--info)';
                                        }}
                                    >
                                        {t("Done", language)}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {exerciseCount > 0 && (
                        <span style={{
                            backgroundColor: 'var(--day-chip-bg)',
                            fontSize: '12px',
                            fontWeight: '600',
                            padding: '3px 10px',
                            borderRadius: '12px',
                            backdropFilter: 'blur(4px)'
                        }}>
                            {completedCount}/{exerciseCount}
                        </span>
                    )}
                    <ChevronDown
                        style={{
                            transition: 'transform 0.3s ease',
                            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                        }}
                        size={22}
                    />
                </div>
            </div>
            
            {isOpen && (
                <div id={`day-panel-${day}`} className="day-panel" style={{
                    padding: '14px 16px 16px',
                    background: 'var(--surface-2)'
                }}>
                    {/* Day notes: shared between the client and their trainers
                        through the plan itself; carried into following weeks. */}
                    {!readOnly && !showNote && (
                        <button
                            type="button"
                            onClick={() => setNoteOpen(true)}
                            style={{
                                background: 'none',
                                border: 'none',
                                padding: '0 0 10px',
                                fontSize: '12px',
                                fontWeight: 700,
                                color: 'var(--brand)',
                                cursor: 'pointer'
                            }}
                        >
                            + {t('Add note', language)}
                        </button>
                    )}
                    {(readOnly ? Boolean(data.note) : showNote) && (
                        <div style={{ marginBottom: '12px' }}>
                            <label
                                htmlFor={`day-note-${day}`}
                                style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--brand)', marginBottom: '4px' }}
                            >
                                {t('Notes', language)}
                            </label>
                            {readOnly ? (
                                <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-2)', whiteSpace: 'pre-wrap' }}>{data.note}</p>
                            ) : (
                                <textarea
                                    id={`day-note-${day}`}
                                    value={data.note ?? ''}
                                    onChange={(e) => onUpdateDay(day, { ...data, note: e.target.value })}
                                    placeholder={t('Notes for this day, visible to you and your trainers', language)}
                                    rows={2}
                                    autoFocus={noteOpen && !data.note}
                                    style={{
                                        width: '100%',
                                        boxSizing: 'border-box',
                                        padding: '8px 10px',
                                        border: '1px solid var(--brand-border)',
                                        borderRadius: '10px',
                                        backgroundColor: 'var(--brand-soft)',
                                        fontSize: '14px',
                                        color: 'var(--text)',
                                        fontFamily: 'inherit',
                                        resize: 'vertical'
                                    }}
                                />
                            )}
                        </div>
                    )}
                    <div className="day-exercises" style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                    }}>
                        {data.exercises.length > 0 ? (
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={data.exercises.map(e => e.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {data.exercises.map((ex) => (
                                        <ExerciseItem
                                            key={ex.id}
                                            exercise={ex}
                                            previous={findPrevious(ex)}
                                            onUpdate={handleUpdateExercise}
                                            onDelete={handleDeleteExercise}
                                            language={language}
                                            readOnly={readOnly}
                                        />
                                    ))}
                                </SortableContext>
                            </DndContext>
                        ) : (
                            <div style={{
                                textAlign: 'center',
                                padding: '28px 16px',
                                background: 'var(--info-soft)',
                                borderRadius: '12px',
                                border: '2px dashed var(--info-border)'
                            }}>
                                <div style={{ fontSize: '36px', marginBottom: '8px' }}>💤</div>
                                <p style={{ color: 'var(--info)', fontWeight: '600', marginBottom: '8px', margin: '0 0 8px 0' }}>{t("No exercises for today", language)}</p>
                                <p style={{ fontSize: '14px', color: 'var(--info)', margin: '0' }}>{t("Add an exercise to get started!", language)}</p>
                            </div>
                        )}
                    </div>
                    
                    {!readOnly && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        paddingTop: '12px',
                        borderTop: '2px solid var(--border)',
                        marginTop: '12px'
                    }}>
                        <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={() => onOpenAddExercise(day)}
                            style={{
                                flex: 1,
                                minWidth: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                padding: '12px 16px',
                                background: 'var(--brand)',
                                color: 'var(--on-brand)',
                                fontWeight: '600',
                                borderRadius: '12px',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '16px',
                                boxShadow: '0 4px 12px var(--shadow)',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseOver={(e) => {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 8px 20px var(--shadow-strong)';
                            }}
                            onMouseOut={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 4px 12px var(--shadow)';
                            }}
                        >
                            <Plus size={18} /> {t("Add Exercise", language)}
                        </button>
                        <button
                            onClick={() => onResetDay(day)}
                            style={{
                                flexShrink: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                padding: '12px 14px',
                                background: 'var(--surface-3)',
                                color: 'var(--text-2)',
                                fontWeight: '600',
                                borderRadius: '12px',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '14px',
                                boxShadow: '0 4px 12px var(--shadow)',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseOver={(e) => {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 8px 20px var(--shadow-strong)';
                            }}
                            onMouseOut={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 4px 12px var(--shadow)';
                            }}
                        >
                            🔄 {t("Reset Day", language)}
                        </button>
                        </div>
                        {canHide && (
                            <button
                                type="button"
                                onClick={() => onUpdateDay(day, { ...data, hidden: true })}
                                style={{
                                    padding: '8px 16px',
                                    background: 'none',
                                    color: 'var(--text-3)',
                                    fontWeight: '600',
                                    borderRadius: '12px',
                                    border: '1px dashed var(--border)',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}
                            >
                                {t("Hide this day", language)}
                            </button>
                        )}
                    </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DayAccordion;