import React, { useState, useEffect } from 'react';
import { EXERCISE_DATABASE } from '../constants/index.js';
import { INDIVIDUAL_MUSCLE_GROUPS } from '../constants/AppConstants.js';
import Modal from './ui/Modal.jsx';
import { t } from '../translations/ui';
import { translateExercise } from '../translations/exercises';
import { translateEquipment } from '../translations/exerciseTerms';
import { getExerciseEquipment, listEquipment, hasExerciseEnrichment } from '../services/ExerciseEnrichmentService.js';
import { hasExerciseMedia } from '../services/ExerciseMediaService.js';
import ExerciseDemoModal from './ExerciseDemoModal.jsx';
import { fold } from '../utils/textFold.js';

// A library exercise matches when the term appears in its English name or
// its Spanish name, whatever language the UI is in.
const matchesTerm = (exercise, term) => {
    if (!term) return true;
    return fold(exercise.name).includes(term)
        || fold(translateExercise(exercise.name, 'es')).includes(term);
};

// Wraps the accent-insensitive match inside the displayed name. Folding
// keeps the string length (a precomposed accented letter maps to one base
// letter), so an index found in the folded name applies to the original;
// if the lengths ever differ the name is shown without highlight.
const markMatch = (text, foldedTerm) => {
    const folded = fold(text);
    const index = folded.indexOf(foldedTerm);
    if (index === -1 || folded.length !== text.length) return null;
    const end = index + foldedTerm.length;
    return (
        <>
            {text.slice(0, index)}
            <mark style={{ backgroundColor: 'var(--skipped-soft)', color: 'var(--text)', padding: '1px 2px', borderRadius: '2px' }}>
                {text.slice(index, end)}
            </mark>
            {text.slice(end)}
        </>
    );
};

// Highlights the match in the displayed name. When the match came from the
// other language's name, that name is shown after the displayed one with
// the match marked, so the user sees why the row matched.
const highlightMatch = (display, otherLanguageName, foldedTerm) => {
    if (!foldedTerm) return display;
    const inDisplay = markMatch(display, foldedTerm);
    if (inDisplay) return inDisplay;
    const alt = otherLanguageName && otherLanguageName !== display ? markMatch(otherLanguageName, foldedTerm) : null;
    if (!alt) return display;
    return (
        <>
            {display}
            <span style={{ color: 'var(--text-3)', fontWeight: 400, fontSize: '12px' }}> · {alt}</span>
        </>
    );
};

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Chip colors keyed to the movement family rather than one hue per group,
// so the picker reads as four tints in both themes: push (blue), pull
// (indigo), legs and core (teal), time-based work (amber).
const CHIP_FAMILY = {
    Chest: 'info', Shoulders: 'info', Triceps: 'info',
    Back: 'accent-b', Biceps: 'accent-b', Forearms: 'accent-b',
    Legs: 'done', Abs: 'done',
    Cardio: 'skipped', Combat: 'skipped'
};
const getMuscleGroupColor = (muscleGroup) => {
    const family = CHIP_FAMILY[muscleGroup];
    if (!family) return { bg: 'var(--surface-3)', text: 'var(--text-3)', border: 'var(--border)' };
    return { bg: `var(--${family}-soft)`, text: `var(--${family})`, border: `var(--${family}-border)` };
};

// Groups whose exercises are time-based (minutes) instead of sets × reps
const isDurationGroup = (muscleGroup) => muscleGroup === 'Cardio' || muscleGroup === 'Combat';

const AddExerciseModal = ({ isOpen, onClose, onAddExercise, muscleGroup, language = 'en' }) => {
    const [searchTerm, setSearchTerm] = useState('');
    // Preselect the day's muscle group as the filter when a known group is supplied.
    const initialFilter = EXERCISE_DATABASE.some(ex => ex.muscleGroup === muscleGroup)
        ? muscleGroup
        : 'All';
    const [selectedMuscleGroup, setSelectedMuscleGroup] = useState(initialFilter);
    const [selectedEquipment, setSelectedEquipment] = useState('All');
    const [isCustom, setIsCustom] = useState(false);
    // Exercise whose demo is open on top of the picker, before it is added.
    // Cleared on close so a reopened picker does not start with a demo up.
    const [previewExercise, setPreviewExercise] = useState(null);
    useEffect(() => {
        if (!isOpen) setPreviewExercise(null);
    }, [isOpen]);
    const [customName, setCustomName] = useState('');
    const [customSets, setCustomSets] = useState('3');
    const [customReps, setCustomReps] = useState('10-12');
    const [defaultSets, setDefaultSets] = useState('3');
    const [defaultRepsMin, setDefaultRepsMin] = useState('8');
    const [defaultRepsMax, setDefaultRepsMax] = useState('12');
    const [customError, setCustomError] = useState('');

    // Get unique muscle groups from the database
    const allMuscleGroups = ['All', ...new Set(EXERCISE_DATABASE.map(ex => ex.muscleGroup))];
    // Equipment values come from the generated enrichment map (sync and tiny).
    const equipmentOptions = listEquipment();

    // Filter exercises based on search, selected muscle group, and equipment.
    // An active equipment filter excludes un-enriched exercises: their
    // equipment is unknown, not "other".
    const foldedTerm = fold(searchTerm.trim());
    const filteredExercises = EXERCISE_DATABASE.filter(ex => {
        const matchesSearch = matchesTerm(ex, foldedTerm);
        const matchesMuscleGroup = selectedMuscleGroup === 'All' || ex.muscleGroup === selectedMuscleGroup;
        const matchesEquipment = selectedEquipment === 'All' || getExerciseEquipment(ex.id) === selectedEquipment;
        return matchesSearch && matchesMuscleGroup && matchesEquipment;
    });

    // Handle adding exercise from library
    const handleAdd = (exercise) => {
        const isCardio = isDurationGroup(exercise.muscleGroup);
        
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
            setCustomError(t("Please enter an exercise name.", language));
            return;
        }
        setCustomError('');
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
        setSelectedEquipment('All');
        setIsCustom(false);
        setCustomName('');
        setCustomSets('3');
        setCustomReps('10-12');
        setDefaultSets('3');
        setDefaultRepsMin('8');
        setDefaultRepsMax('12');
        setCustomError('');
    };

    // Reset form when modal is opened/closed; preselect the day's muscle
    // group as the filter every time the modal opens (per-day default).
    useEffect(() => {
        if (!isOpen) {
            resetForm();
        } else {
            setSelectedMuscleGroup(initialFilter);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, muscleGroup]);

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`💪 ${t("Add New Exercise", language)}`}>
            <div style={{ backgroundColor: 'var(--surface)', padding: '16px', borderRadius: '8px' }}>
                {/* Tab Navigation */}
                <div style={{ display: 'flex', backgroundColor: 'var(--surface-3)', borderRadius: '8px', padding: '8px', marginBottom: '16px' }}>
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
                            backgroundColor: !isCustom ? 'var(--brand)' : 'transparent',
                            color: !isCustom ? 'var(--on-brand)' : 'var(--text-3)'
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
                            backgroundColor: isCustom ? 'var(--brand)' : 'transparent',
                            color: isCustom ? 'var(--on-brand)' : 'var(--text-3)'
                        }}
                    >
                        ✏️ {t("Custom Exercise", language)}
                    </button>
                </div>

                {isCustom ? (
                    // Custom Exercise Form
                    <div style={{ backgroundColor: 'var(--surface-2)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--text-2)', marginBottom: '8px' }}>{t("Exercise name", language)}</label>
                            <input
                                type="text"
                                value={customName}
                                onChange={(e) => {
                                    setCustomName(e.target.value);
                                    if (customError) setCustomError('');
                                }}
                                placeholder="e.g., Bench Press"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '1px solid var(--border-strong)',
                                    borderRadius: '8px',
                                    backgroundColor: 'var(--surface)',
                                    fontSize: '14px',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--text-2)', marginBottom: '8px' }}>{t("Target Sets", language)}</label>
                                <input 
                                    type="text" 
                                    value={customSets} 
                                    onChange={(e) => setCustomSets(e.target.value)} 
                                    placeholder="3" 
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '1px solid var(--border-strong)',
                                        borderRadius: '8px',
                                        backgroundColor: 'var(--surface)',
                                        fontSize: '14px',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--text-2)', marginBottom: '8px' }}>{t("Target Reps", language)}</label>
                                <input 
                                    type="text" 
                                    value={customReps} 
                                    onChange={(e) => setCustomReps(e.target.value)} 
                                    placeholder="8-12" 
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '1px solid var(--border-strong)',
                                        borderRadius: '8px',
                                        backgroundColor: 'var(--surface)',
                                        fontSize: '14px',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                        </div>
                        
                        {customError && (
                            <div
                                role="alert"
                                style={{
                                    padding: '10px 12px',
                                    marginBottom: '12px',
                                    backgroundColor: 'var(--danger-soft)',
                                    color: 'var(--danger)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--danger-border)',
                                    fontSize: '13px',
                                    fontWeight: '500'
                                }}
                            >
                                ⚠️ {customError}
                            </div>
                        )}
                        <button
                            onClick={handleAddCustom}
                            style={{
                                width: '100%',
                                backgroundColor: 'var(--brand)',
                                color: 'var(--on-brand)',
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
                                    border: '1px solid var(--border-strong)',
                                    borderRadius: '8px',
                                    backgroundColor: 'var(--surface)',
                                    fontSize: '14px',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>
                        
                        {/* Muscle Group Filter */}
                        <div style={{ marginBottom: '12px' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--text-2)', marginBottom: '8px' }}>{t("Filter by Muscle Group", language)}</label>
                            <select
                                value={selectedMuscleGroup}
                                onChange={(e) => setSelectedMuscleGroup(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '1px solid var(--border-strong)',
                                    borderRadius: '8px',
                                    backgroundColor: 'var(--surface)',
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

                        {/* Equipment Filter (options from the enrichment map) */}
                        <div style={{ marginBottom: '12px' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--text-2)', marginBottom: '8px' }}>{t("Filter by Equipment", language)}</label>
                            <select
                                aria-label={t("Filter by Equipment", language)}
                                value={selectedEquipment}
                                onChange={(e) => setSelectedEquipment(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '1px solid var(--border-strong)',
                                    borderRadius: '8px',
                                    backgroundColor: 'var(--surface)',
                                    fontSize: '14px',
                                    boxSizing: 'border-box',
                                    cursor: 'pointer'
                                }}
                            >
                                <option value="All">{t("All equipment", language)}</option>
                                {equipmentOptions.map(eq => (
                                    <option key={eq} value={eq}>{capitalize(translateEquipment(eq, language))}</option>
                                ))}
                            </select>
                        </div>
                        
                        {/* Default Configuration */}
                        <div style={{
                            backgroundColor: 'var(--surface-2)',
                            padding: '16px',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            marginBottom: '12px'
                        }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'var(--text-2)', marginBottom: '12px' }}>{t("Default Configuration for Selected Exercises", language)}</label>
                            
                            {isDurationGroup(selectedMuscleGroup) ? (
                                // Cardio/combat configuration
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-3)', marginBottom: '6px' }}>{t("Duration (minutes)", language)}</label>
                                        <select
                                            value={defaultSets}
                                            onChange={(e) => setDefaultSets(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '8px',
                                                border: '1px solid var(--border-strong)',
                                                borderRadius: '6px',
                                                backgroundColor: 'var(--surface)',
                                                fontSize: '14px',
                                                boxSizing: 'border-box',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {[...Array(120)].map((_, i) => (
                                                <option key={i+1} value={i+1}>{i+1} {t("minutes", language)}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            ) : (
                                // Regular exercise configuration
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-3)', marginBottom: '6px' }}>{t("Sets", language)}</label>
                                        <select
                                            value={defaultSets}
                                            onChange={(e) => setDefaultSets(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '8px',
                                                border: '1px solid var(--border-strong)',
                                                borderRadius: '6px',
                                                backgroundColor: 'var(--surface)',
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
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-3)', marginBottom: '6px' }}>{t("Min Reps", language)}</label>
                                        <select
                                            value={defaultRepsMin}
                                            onChange={(e) => setDefaultRepsMin(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '8px',
                                                border: '1px solid var(--border-strong)',
                                                borderRadius: '6px',
                                                backgroundColor: 'var(--surface)',
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
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-3)', marginBottom: '6px' }}>{t("Max Reps", language)}</label>
                                        <select
                                            value={defaultRepsMax}
                                            onChange={(e) => setDefaultRepsMax(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '8px',
                                                border: '1px solid var(--border-strong)',
                                                borderRadius: '6px',
                                                backgroundColor: 'var(--surface)',
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
                            color: 'var(--info)',
                            backgroundColor: 'var(--info-soft)',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid var(--info-border)',
                            marginBottom: '12px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <span>
                                💡 {t("Showing:", language)} <span style={{ fontWeight: '600' }}>{translateExercise(selectedMuscleGroup, language)}</span> {t("exercises", language)}
                            </span>
                            <span style={{ fontSize: '12px', fontWeight: '600' }}>
                                {filteredExercises.length} {t("results", language)}
                            </span>
                        </div>
                        
                        {/* Exercise List */}
                        <div style={{
                            maxHeight: '250px',
                            overflowY: 'auto',
                            backgroundColor: 'var(--surface-2)',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid var(--border)'
                        }}>
                            {filteredExercises.length > 0 ? (
                                filteredExercises.map(ex => (
                                    <div 
                                        key={ex.id} 
                                        onClick={() => handleAdd(ex)} 
                                        style={{
                                            padding: '12px',
                                            backgroundColor: 'var(--surface)',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            border: '1px solid var(--border)',
                                            marginBottom: '8px',
                                            boxShadow: '0 1px 3px var(--shadow)',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.backgroundColor = 'var(--surface-2)';
                                            e.currentTarget.style.transform = 'translateY(-1px)';
                                            e.currentTarget.style.boxShadow = '0 4px 12px var(--shadow)';
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.backgroundColor = 'var(--surface)';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 1px 3px var(--shadow)';
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ 
                                                    fontWeight: '600', 
                                                    color: 'var(--text)', 
                                                    fontSize: '14px',
                                                    marginBottom: '4px'
                                                }}>
                                                    {highlightMatch(
                                                        translateExercise(ex.name, language),
                                                        language === 'es' ? ex.name : translateExercise(ex.name, 'es'),
                                                        foldedTerm
                                                    )}
                                                </div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                                                    {isDurationGroup(ex.muscleGroup) ?
                                                        `${t("Target Duration (minutes)", language)}: ${defaultSets}` :
                                                        `${t("Target Sets", language)}: ${defaultSets} × ${defaultRepsMin === defaultRepsMax ? defaultRepsMin : `${defaultRepsMin}-${defaultRepsMax}`} ${t("reps", language)}`
                                                    }
                                                </div>
                                            </div>
                                            {(hasExerciseMedia(ex.id) || hasExerciseEnrichment(ex.id)) && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); setPreviewExercise({ dbId: ex.id, name: ex.name }); }}
                                                    title={t("How to do this exercise", language)}
                                                    aria-label={`${t("How to do this exercise", language)}: ${translateExercise(ex.name, language)}`}
                                                    style={{
                                                        flexShrink: 0,
                                                        width: '34px',
                                                        height: '34px',
                                                        borderRadius: '50%',
                                                        border: '1px solid var(--brand-border)',
                                                        backgroundColor: 'var(--brand-soft)',
                                                        color: 'var(--brand)',
                                                        cursor: 'pointer',
                                                        fontSize: '14px',
                                                        fontWeight: 700
                                                    }}
                                                >
                                                    ▶
                                                </button>
                                            )}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{
                                                    fontSize: '12px',
                                                    backgroundColor: getMuscleGroupColor(ex.muscleGroup).bg,
                                                    color: getMuscleGroupColor(ex.muscleGroup).text,
                                                    border: `1px solid ${getMuscleGroupColor(ex.muscleGroup).border}`,
                                                    padding: '3px 8px',
                                                    borderRadius: '12px',
                                                    fontWeight: '600'
                                                }}>
                                                    {translateExercise(ex.muscleGroup, language)}
                                                </span>
                                                <span style={{
                                                    fontSize: '18px',
                                                    color: 'var(--brand)'
                                                }}>➕</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '32px',
                                    backgroundColor: 'var(--surface)',
                                    borderRadius: '6px'
                                }}>
                                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔍</div>
                                    <p style={{ color: 'var(--text-3)', margin: '0 0 4px 0' }}>{t("No exercises found", language)}</p>
                                    <p style={{ fontSize: '12px', color: 'var(--text-3)', margin: '0' }}>{t("Try a different search term", language)}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            {previewExercise && (
                <ExerciseDemoModal
                    exercise={previewExercise}
                    onClose={() => setPreviewExercise(null)}
                    language={language}
                />
            )}
        </Modal>
    );
};

export default AddExerciseModal;