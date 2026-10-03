import React, { useState } from 'react';
import { DndContext } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import Modal from './ui/Modal.jsx';
import ExerciseItem from './ExerciseItem.jsx';
import ConditioningPanel from './ConditioningPanel.jsx';
import { workoutControlStyle } from './ui/workoutControlStyle.js';
import { lastPerformance } from '../utils/lastPerformance.js';
import { translateExercise } from '../translations/exercises.js';
import { t } from '../translations/ui.js';

export default function FocusWorkoutModal({ day, data, history, weekStart, onChange, onClose, language = 'en', favoriteExerciseIds = [], onToggleFavorite, onUndo, canUndo, timerHostRef, saveState = "idle", onSave }) {
    const es = language === 'es';
    const snapshot = data?.conditioning?.session?.movements;
    const exercises = snapshot || data?.exercises || [];
    const [selectedId, setSelectedId] = useState(() => exercises.find(ex => ex.status !== 'completed' && ex.status !== 'skipped')?.id || exercises[0]?.id);
    const index = Math.max(0, exercises.findIndex(ex => ex.id === selectedId));
    const exercise = exercises[index];
    const done = exercises.filter(ex => ex.status === 'completed').length;
    const conditioning = data?.conditioning?.mode && data.conditioning.mode !== 'standard';
    return <Modal isOpen onClose={onClose} title={`${t(day, language)} · ${es ? 'Entrenamiento enfocado' : 'Focus workout'}`} style={{ width: 640 }} className="focus-workout">
        <p style={{ color: 'var(--text-2)', marginTop: 0 }}>{es ? 'Tus cambios se guardan como en la vista semanal. Puedes salir y continuar.' : 'Your changes save just like the weekly view. You can leave and continue.'}</p>
        {conditioning && <ConditioningPanel value={data.conditioning} exercises={exercises} onChange={value => onChange({ ...data, conditioning: value })} language={language} onUndo={onUndo} canUndo={canUndo} />}
        <div style={{ margin: '12px 0', display: 'flex', justifyContent: 'space-between', gap: 8, color: 'var(--text-2)', fontSize: 13 }}>
            <span>{es ? 'Ejercicio' : 'Exercise'} {exercises.length ? index + 1 : 0}/{exercises.length}</span>
            {!conditioning && <span>{done}/{exercises.length} {es ? 'completados' : 'completed'}</span>}
        </div>
        {exercise ? <DndContext><SortableContext items={[exercise.id]}>
            <ExerciseItem key={exercise.id} exercise={exercise} readOnly={Boolean(snapshot)} focused conditioning={Boolean(conditioning)} language={language}
                previous={lastPerformance(history, weekStart, day, exercise)}
                onUpdate={(id, updated) => onChange({ ...data, exercises: exercises.map(ex => ex.id === id ? updated : ex) })}
                favorite={favoriteExerciseIds.includes(exercise.dbId)} onToggleFavorite={onToggleFavorite} onUndo={onUndo} canUndo={canUndo} />
        </SortableContext></DndContext> : <p>{es ? 'Añade ejercicios desde la vista semanal.' : 'Add exercises from the weekly view.'}</p>}
        <div ref={timerHostRef} style={{ marginTop: 16 }} />
        <div role="status" style={{ color: saveState === 'error' || saveState === 'conflict' ? 'var(--danger)' : 'var(--text-2)', fontSize: 13, marginTop: 12 }}>
            {saveState === 'conflict' && es ? 'Hay una versión más reciente. Vuelve a la semana para resolver el conflicto.' : t(({ idle: 'All changes saved', saved: 'All changes saved', saving: 'Saving...', dirty: 'Unsaved changes', error: 'Could not save your changes. Check your connection and try again.', conflict: 'A newer version exists. Return to the week view to resolve the conflict.' })[saveState] || 'Unsaved changes', language)}
            {onSave && ['dirty', 'error'].includes(saveState) && <button type="button" onClick={onSave} style={{ ...workoutControlStyle, marginLeft: 8 }}>{t('Save changes', language)}</button>}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button type="button" disabled={!index} onClick={() => setSelectedId(exercises[index - 1].id)} style={{ ...workoutControlStyle, flex: 1 }}>{es ? 'Anterior' : 'Previous'}</button>
            <button type="button" disabled={index >= exercises.length - 1} onClick={() => setSelectedId(exercises[index + 1].id)} style={{ ...workoutControlStyle, flex: 1 }}>{es ? 'Siguiente' : 'Next'}</button>
        </div>
        {exercises[index + 1] && <p style={{ fontSize: 13, color: 'var(--text-2)' }}>{es ? 'Después' : 'Up next'}: {translateExercise(exercises[index + 1].name, language)}</p>}
        <button type="button" onClick={onClose} style={{ ...workoutControlStyle, width: '100%', marginTop: 10 }}>{es ? 'Volver a la semana' : 'Back to week'}</button>
    </Modal>;
}
