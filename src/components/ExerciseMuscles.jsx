import React from 'react';
import { EXERCISE_MUSCLES } from '../data/exerciseMuscles.js';
import { EXERCISE_DATABASE } from '../constants/index.js';
import { translateExercise } from '../translations/exercises.js';
const spanish = { Quadriceps: 'Cuádriceps', Hamstrings: 'Isquiotibiales', Glutes: 'Glúteos', Calves: 'Pantorrillas', Traps: 'Trapecios', 'Lower back': 'Espalda baja', 'Hip flexors': 'Flexores de cadera' };
export default function ExerciseMuscles({ exercise, language = 'en' }) {
    const id = exercise.dbId || EXERCISE_DATABASE.find(row => row.name.toLowerCase() === exercise.name?.toLowerCase())?.id;
    const muscles = EXERCISE_MUSCLES[id] || (exercise.muscleGroup ? [exercise.muscleGroup] : []);
    if (!muscles.length) return <small style={{ color: 'var(--text-3)' }}>{language === 'es' ? 'Grupo muscular sin especificar' : 'Muscle group not specified'}</small>;
    return <div aria-label={language === 'es' ? 'Músculos principales y de apoyo' : 'Primary and supporting muscles'} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '4px 7px', marginTop: 3, lineHeight: 1.5 }}>
        {muscles.map((muscle, index) => <React.Fragment key={muscle}>
            {index > 0 && <span aria-hidden="true" style={{ color: 'var(--text-3)', fontSize: 11 }}>·</span>}
            <span style={{ fontSize: index === 0 ? 14 : muscles[0] === 'Chest' && index > 1 ? 11 : 12, fontWeight: index === 0 ? 700 : muscles[0] === 'Chest' && index > 1 ? 500 : 600, color: index === 0 ? 'var(--text)' : 'var(--text-2)' }}>
                {language === 'es' ? spanish[muscle] || translateExercise(muscle, language) : muscle}
            </span>
        </React.Fragment>)}
    </div>;
}
