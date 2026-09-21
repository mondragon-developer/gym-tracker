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
                    background: 'var(--done-soft)',
                    border: '2px solid var(--done-border)',
                    boxShadow: '0 4px 12px var(--shadow)'
                };
            case 'skipped':
                return {
                    background: 'var(--skipped-soft)',
                    border: '2px solid var(--skipped-border)',
                    boxShadow: '0 4px 12px var(--shadow)'
                };
            default:
                return {
                    background: 'var(--surface)',
                    border: '2px solid var(--border)',
                    boxShadow: '0 4px 12px var(--shadow)'
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
        boxShadow: '0 2px 8px var(--shadow)',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        background: active ? activeBackground : 'var(--surface-3)',
        color: active ? 'var(--text-inverse)' : color
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
                                color: 'var(--text-3)',
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
                            color: 'var(--text)',
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
                                    color: 'var(--brand)',
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
                            style={actionButtonStyle(exercise.status === 'completed', 'var(--done)', 'var(--done)')}
                            title={t("Mark as completed", language)}
                            aria-label={t("Mark as completed", language)}
                        >
                            <Check size={16} />
                        </button>
                        <button
                            onClick={() => handleStatusChange('skipped')}
                            aria-pressed={exercise.status === 'skipped'}
                            style={actionButtonStyle(exercise.status === 'skipped', 'var(--skipped)', 'var(--skipped)')}
                            title="Mark as skipped"
                            aria-label="Mark as skipped"
                        >
                            <X size={16} />
                        </button>
                        <button
                            onClick={() => onDelete(exercise.id)}
                            style={actionButtonStyle(false, null, 'var(--danger)')}
                            title={t("Delete exercise", language)}
                            aria-label={t("Delete exercise", language)}
                            onMouseOver={(e) => {
                                e.currentTarget.style.background = 'var(--danger-soft)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.background = 'var(--surface-3)';
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
                            <label style={labelStyle('var(--skipped)')}>{t("Duration", language)} (min)</label>
                                                        <select
                                aria-label={t("Duration", language)}
                                value={exercise.sets || '30'}
                                onChange={e => handleUpdate('sets', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    background: 'var(--skipped-soft)',
                                    border: '2px solid var(--skipped-border)',
                                    borderRadius: '12px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    color: 'var(--text)',
                                    boxSizing: 'border-box',
                                    transition: 'all 0.3s ease',
                                    cursor: 'pointer'
                                }}
                                onFocus={(e) => {
                                    e.target.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--focus) 25%, transparent)';
                                    e.target.style.borderColor = 'var(--skipped)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.boxShadow = 'none';
                                    e.target.style.borderColor = 'var(--skipped-border)';
                                }}
                            >
                                {[...Array(120)].map((_, i) => (
                                    <option key={i+1} value={i+1}>{i+1} min</option>
                                ))}
                            </select>
                        </div>
                        <div style={fieldStyle}>
                            <label style={labelStyle('var(--done)')}>{t("Effective", language)}</label>
                            <StepperInput
                                value={exercise.effectiveSets || ''}
                                onChange={v => handleUpdate('effectiveSets', v)}
                                step={5} min={0} max={120} inputMode="numeric" placeholder="0"
                                ariaLabel={t("Effective", language)}
                                background="var(--done-soft)"
                                borderColor="var(--done-border)"
                                focusColor="var(--done)"
                                focusShadow="0 0 0 3px color-mix(in srgb, var(--focus) 25%, transparent)"
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
                                <label style={labelStyle('var(--accent-a)')}>{t("Sets", language)}</label>
                                <StepperInput
                                    value={exercise.sets}
                                    onChange={v => handleUpdate('sets', v)}
                                    step={1} min={1} max={20} fallback={3} inputMode="numeric" placeholder="3"
                                    ariaLabel={t("Sets", language)}
                                    background="var(--accent-a-soft)"
                                    borderColor="var(--accent-a-border)"
                                    focusColor="var(--accent-a)"
                                    focusShadow="0 0 0 3px color-mix(in srgb, var(--focus) 25%, transparent)"
                                    disabled={readOnly}
                                />
                            </div>
                            <div style={fieldStyle}>
                                <label style={labelStyle('var(--info)')}>{t("Reps", language)}</label>
                                <StepperInput
                                    value={exercise.reps}
                                    onChange={v => handleUpdate('reps', v)}
                                    step={1} min={1} max={100} fallback={10} inputMode="numeric" placeholder="8-12"
                                    ariaLabel={t("Reps", language)}
                                    background="var(--info-soft)"
                                    borderColor="var(--info-border)"
                                    focusColor="var(--info)"
                                    focusShadow="0 0 0 3px color-mix(in srgb, var(--focus) 25%, transparent)"
                                    disabled={readOnly}
                                />
                            </div>
                            <div style={fieldStyle}>
                                <label style={labelStyle('var(--accent-b)')}>{t("Weight", language)} ({unit})</label>
                                <StepperInput
                                    value={toDisplayWeight(exercise.weight, unit)}
                                    onChange={v => handleUpdate('weight', fromDisplayWeight(v, unit))}
                                    step={weightStep(unit)} min={0} max={2000} fallback={0} inputMode="decimal" placeholder={unit}
                                    ariaLabel={t("Weight", language)}
                                    background="var(--accent-b-soft)"
                                    borderColor="var(--accent-b-border)"
                                    focusColor="var(--accent-b)"
                                    focusShadow="0 0 0 3px color-mix(in srgb, var(--focus) 25%, transparent)"
                                    disabled={readOnly}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                            <div style={{ ...fieldStyle, flex: '1 1 96px', maxWidth: '150px' }}>
                                <label style={labelStyle('var(--done)')}>{t("Effective", language)}</label>
                                <StepperInput
                                    value={exercise.effectiveSets}
                                    onChange={v => handleUpdate('effectiveSets', v)}
                                    step={1} min={0} max={parseInt(exercise.sets, 10) || 20} inputMode="numeric" placeholder="0"
                                    ariaLabel={t("Effective", language)}
                                    background="var(--done-soft)"
                                    borderColor="var(--done-border)"
                                    focusColor="var(--done)"
                                    focusShadow="0 0 0 3px color-mix(in srgb, var(--focus) 25%, transparent)"
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
                                            ? 'var(--done-soft)'
                                            : 'var(--done)',
                                        color: allSetsDone ? 'var(--done)' : 'var(--text-inverse)',
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
                                <span style={{ fontSize: '12px', color: 'var(--text-3)', display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingBottom: '8px' }}>
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
                                                border: '1px solid var(--accent-b-border)',
                                                backgroundColor: 'var(--accent-b-soft)',
                                                color: 'var(--accent-b)',
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
