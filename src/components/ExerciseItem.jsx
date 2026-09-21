import React, { useState } from 'react';
import { Check, X, Trash2, GripVertical, PlayCircle } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ExerciseService from '../services/ExerciseService.js';
import { hasExerciseMedia } from '../services/ExerciseMediaService.js';
import { hasExerciseEnrichment } from '../services/ExerciseEnrichmentService.js';
import ExerciseDemoModal from './ExerciseDemoModal.jsx';
import StepperInput from './ui/StepperInput.jsx';
import { toDisplayWeight, fromDisplayWeight, weightStep, bumpStoredWeight, formatWeight, isNumericWeight } from '../utils/weightUnits.js';
import { t } from '../translations/ui';
import { translateExercise } from '../translations/exercises';
import { useUnits } from '../hooks/useUnits.js';

/**
 * Displays a single exercise item, allowing for edits, status changes, and deletion.
 */
// Fires the shared rest timer (RestTimer listens on window) after a set is
// logged, so the user never has to reach for the Start button mid-workout.
const startRestTimer = () => {
    try {
        window.dispatchEvent(new CustomEvent('gym:rest-start'));
    } catch {
        // No window (tests) or CustomEvent unsupported: the timer is optional.
    }
};

const ExerciseItem = ({ exercise, onUpdate, onDelete, previous = null, language = 'en', readOnly = false }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: exercise.id,
    });
    const { unit } = useUnits();
    const [showDemo, setShowDemo] = useState(false);
    // Show the demo button if we have an animation OR step-by-step instructions.
    const hasDemo = hasExerciseMedia(exercise.dbId) || hasExerciseEnrichment(exercise.dbId);
    const isCardio = () => ExerciseService.isCardioExercise(exercise);
    const handleUpdate = (field, value) => {
        onUpdate(exercise.id, { ...exercise, [field]: value });
    };

    const handleStatusChange = (newStatus) => {
        handleUpdate('status', exercise.status === newStatus ? 'incomplete' : newStatus);
    };

    // One tap per set: counts it, marks the exercise done on the last one,
    // and starts the rest timer.
    const targetSets = parseInt(exercise.sets, 10) || 0;
    const doneSets = parseInt(exercise.effectiveSets, 10) || 0;
    const allSetsDone = targetSets > 0 && doneSets >= targetSets;
    const logSet = () => {
        const next = targetSets > 0 ? Math.min(targetSets, doneSets + 1) : doneSets + 1;
        const completed = targetSets > 0 && next >= targetSets;
        onUpdate(exercise.id, {
            ...exercise,
            effectiveSets: String(next),
            status: completed ? 'completed' : (exercise.status === 'skipped' ? 'incomplete' : exercise.status)
        });
        startRestTimer();
    };

    // Last week's numbers for the same exercise, plus a one-tap bump that
    // applies progressive overload to this week's weight.
    const hasPrevious = Boolean(previous && (previous.weight || previous.reps || previous.effectiveSets));
    const bumpFromPrevious = () => {
        handleUpdate('weight', bumpStoredWeight(previous.weight, unit));
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

    const statusStyles = getStatusStyles();

    const sortableStyle = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : 'auto',
    };

    const actionButtonStyle = (active, activeBackground, color) => ({
        padding: '7px',
        borderRadius: '10px',
        transition: 'all 0.3s ease',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        background: active ? activeBackground : 'linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 100%)',
        color: active ? 'white' : color
    });

    const labelStyle = (color) => ({ fontSize: '11px', fontWeight: '600', color, lineHeight: 1.2 });
    const fieldStyle = { display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 };

    const cardio = isCardio();

    return (
        <div
            ref={setNodeRef}
            className="exercise-card"
            style={{
                padding: '12px',
                borderRadius: '12px',
                position: 'relative',
                ...statusStyles,
                ...sortableStyle,
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* One row: grip, name, demo, actions. Status is carried by the
                    card colors and the pressed check/skip button. */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    {!readOnly && (
                        <button
                            type="button"
                            {...attributes}
                            {...listeners}
                            aria-label={t("Reorder exercise", language)}
                            title={t("Reorder exercise", language)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                padding: '4px 0',
                                color: '#6b7280',
                                cursor: 'grab',
                                touchAction: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                flexShrink: 0
                            }}
                        >
                            <GripVertical size={18} />
                        </button>
                    )}
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                        <h3 style={{
                            fontWeight: '600',
                            color: '#111827',
                            fontSize: '16px',
                            margin: 0,
                            padding: '3px 0',
                            lineHeight: '1.3',
                            wordBreak: 'break-word',
                            hyphens: 'auto'
                        }}>
                            {translateExercise(exercise.name, language)}
                        </h3>
                        {hasDemo && (
                            <button
                                type="button"
                                onClick={() => setShowDemo(true)}
                                title={t("How to do this exercise", language)}
                                aria-label={t("How to do this exercise", language)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    padding: '4px 0',
                                    color: '#0e7490',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    flexShrink: 0
                                }}
                            >
                                <PlayCircle size={18} />
                            </button>
                        )}
                    </div>

                    {/* Action buttons, hidden when viewing a past (read-only) week */}
                    {!readOnly && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        <button
                            onClick={() => handleStatusChange('completed')}
                            aria-pressed={exercise.status === 'completed'}
                            style={actionButtonStyle(exercise.status === 'completed', 'linear-gradient(90deg, #10b981 0%, #059669 100%)', '#10b981')}
                            title={t("Mark as completed", language)}
                            aria-label={t("Mark as completed", language)}
                        >
                            <Check size={16} />
                        </button>
                        <button
                            onClick={() => handleStatusChange('skipped')}
                            aria-pressed={exercise.status === 'skipped'}
                            style={actionButtonStyle(exercise.status === 'skipped', 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)', '#ef4444')}
                            title="Mark as skipped"
                            aria-label="Mark as skipped"
                        >
                            <X size={16} />
                        </button>
                        <button
                            onClick={() => onDelete(exercise.id)}
                            style={actionButtonStyle(false, null, '#ef4444')}
                            title={t("Delete exercise", language)}
                            aria-label={t("Delete exercise", language)}
                            onMouseOver={(e) => {
                                e.currentTarget.style.background = 'linear-gradient(90deg, #fee2e2 0%, #fecaca 100%)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.background = 'linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 100%)';
                            }}
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                    )}
                </div>

                {/* Inputs. A disabled <fieldset> makes every control inside
                    read-only in one shot when viewing a past week. */}
                <fieldset disabled={readOnly} style={{ border: 'none', margin: 0, padding: 0, minWidth: 0 }}>
                {cardio ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '14px' }}>
                        <div style={fieldStyle}>
                            <label style={labelStyle('#f59e0b')}>{t("Duration", language)} (min)</label>
                            <select
                                value={exercise.sets || '30'}
                                onChange={e => handleUpdate('sets', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px',
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
                        <div style={fieldStyle}>
                            <label style={labelStyle('#10b981')}>{t("Effective", language)}</label>
                            <StepperInput
                                value={exercise.effectiveSets || ''}
                                onChange={v => handleUpdate('effectiveSets', v)}
                                step={5} min={0} max={120} inputMode="numeric" placeholder="0"
                                ariaLabel={t("Effective", language)}
                                background="linear-gradient(90deg, #d1fae5 0%, #a7f3d0 100%)"
                                borderColor="#34d399"
                                focusColor="#10b981"
                                focusShadow="0 0 0 3px rgba(16, 185, 129, 0.1)"
                                disabled={readOnly}
                            />
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Row 1: the plan. Row 2: what got done. */}
                        {/* Reps holds ranges like "10-12", so it gets the widest column. */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 0.8fr) minmax(0, 1.3fr) minmax(0, 1.1fr)', gap: '8px', fontSize: '14px' }}>
                            <div style={fieldStyle}>
                                <label style={labelStyle('#8b5cf6')}>{t("Sets", language)}</label>
                                <StepperInput
                                    value={exercise.sets}
                                    onChange={v => handleUpdate('sets', v)}
                                    step={1} min={1} max={20} fallback={3} inputMode="numeric" placeholder="3"
                                    ariaLabel={t("Sets", language)}
                                    background="linear-gradient(90deg, #f3e8ff 0%, #ddd6fe 100%)"
                                    borderColor="#c084fc"
                                    focusColor="#8b5cf6"
                                    focusShadow="0 0 0 3px rgba(139, 92, 246, 0.1)"
                                    disabled={readOnly}
                                />
                            </div>
                            <div style={fieldStyle}>
                                <label style={labelStyle('#3b82f6')}>{t("Reps", language)}</label>
                                <StepperInput
                                    value={exercise.reps}
                                    onChange={v => handleUpdate('reps', v)}
                                    step={1} min={1} max={100} fallback={10} inputMode="numeric" placeholder="8-12"
                                    ariaLabel={t("Reps", language)}
                                    background="linear-gradient(90deg, #dbeafe 0%, #bfdbfe 100%)"
                                    borderColor="#60a5fa"
                                    focusColor="#3b82f6"
                                    focusShadow="0 0 0 3px rgba(59, 130, 246, 0.1)"
                                    disabled={readOnly}
                                />
                            </div>
                            <div style={fieldStyle}>
                                <label style={labelStyle('#6366f1')}>{t("Weight", language)} ({unit})</label>
                                <StepperInput
                                    value={toDisplayWeight(exercise.weight, unit)}
                                    onChange={v => handleUpdate('weight', fromDisplayWeight(v, unit))}
                                    step={weightStep(unit)} min={0} max={2000} fallback={0} inputMode="decimal" placeholder={unit}
                                    ariaLabel={t("Weight", language)}
                                    background="linear-gradient(90deg, #e0e7ff 0%, #c7d2fe 100%)"
                                    borderColor="#818cf8"
                                    focusColor="#6366f1"
                                    focusShadow="0 0 0 3px rgba(99, 102, 241, 0.1)"
                                    disabled={readOnly}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                            <div style={{ ...fieldStyle, flex: '1 1 96px', maxWidth: '150px' }}>
                                <label style={labelStyle('#10b981')}>{t("Effective", language)}</label>
                                <StepperInput
                                    value={exercise.effectiveSets}
                                    onChange={v => handleUpdate('effectiveSets', v)}
                                    step={1} min={0} max={parseInt(exercise.sets, 10) || 20} inputMode="numeric" placeholder="0"
                                    ariaLabel={t("Effective", language)}
                                    background="linear-gradient(90deg, #d1fae5 0%, #a7f3d0 100%)"
                                    borderColor="#34d399"
                                    focusColor="#10b981"
                                    focusShadow="0 0 0 3px rgba(16, 185, 129, 0.1)"
                                    disabled={readOnly}
                                />
                            </div>
                            {!readOnly && (
                                <button
                                    type="button"
                                    onClick={logSet}
                                    disabled={allSetsDone}
                                    aria-label={`${t("Log set", language)} ${Math.min(doneSets + 1, targetSets || doneSets + 1)}${targetSets ? ` / ${targetSets}` : ''}`}
                                    style={{
                                        padding: '10px 14px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        background: allSetsDone
                                            ? 'linear-gradient(90deg, #d1fae5 0%, #a7f3d0 100%)'
                                            : 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                                        color: allSetsDone ? '#047857' : 'white',
                                        fontWeight: 700,
                                        fontSize: '14px',
                                        whiteSpace: 'nowrap',
                                        cursor: allSetsDone ? 'default' : 'pointer'
                                    }}
                                >
                                    {t("Log set", language)} {allSetsDone ? targetSets : Math.min(doneSets + 1, targetSets || doneSets + 1)}{targetSets ? `/${targetSets}` : ''}
                                </button>
                            )}
                            {hasPrevious && (
                                <span style={{ fontSize: '12px', color: '#6b7280', display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingBottom: '8px' }}>
                                    <span>
                                        {t("Last week", language)}: {isNumericWeight(previous.weight) ? formatWeight(previous.weight, unit) : (previous.weight || '')}
                                        {previous.reps ? ` × ${previous.reps}` : ''}
                                        {previous.effectiveSets ? ` · ${previous.effectiveSets}/${previous.sets || '?'} ${t("Sets", language).toLowerCase()}` : ''}
                                    </span>
                                    {!readOnly && isNumericWeight(previous.weight) && (
                                        <button
                                            type="button"
                                            onClick={bumpFromPrevious}
                                            title={`${formatWeight(previous.weight, unit)} + ${weightStep(unit)} ${unit}`}
                                            style={{
                                                border: '1px solid #c7d2fe',
                                                backgroundColor: '#eef2ff',
                                                color: '#4338ca',
                                                borderRadius: '999px',
                                                padding: '3px 10px',
                                                fontSize: '12px',
                                                fontWeight: 700,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            +{weightStep(unit)} {unit}
                                        </button>
                                    )}
                                </span>
                            )}
                        </div>
                    </>
                )}
                </fieldset>
            </div>

            {showDemo && (
                <ExerciseDemoModal
                    exercise={exercise}
                    onClose={() => setShowDemo(false)}
                    language={language}
                />
            )}
        </div>
    );
};

export default ExerciseItem;
