import React, { useEffect, useState } from 'react';
import { conditioningConfig, conditioningClock, conditioningAction, conditioningScore } from '../utils/conditioning.js';
import { formatSeconds } from '../utils/restTimer.js';
import { translateExercise } from '../translations/exercises.js';
import { useUnits } from '../hooks/useUnits.js';
import { formatWeight } from '../utils/weightUnits.js';
import { workoutControlStyle } from './ui/workoutControlStyle.js';

export default function ConditioningPanel({ value, exercises = [], onChange, language = 'en', readOnly = false, canRun = true, onUndo, canUndo = false }) {
    const { unit } = useUnits();
    const es = language === 'es';
    const config = conditioningConfig(value);
    const session = value?.session;
    const [now, setNow] = useState(Date.now);
    useEffect(() => {
        if (readOnly || session?.status !== 'running') return;
        const update = () => setNow(Date.now());
        const timer = setInterval(update, 250);
        document.addEventListener('visibilitychange', update);
        window.addEventListener('focus', update);
        return () => { clearInterval(timer); document.removeEventListener('visibilitychange', update); window.removeEventListener('focus', update); };
    }, [session?.status, readOnly]);
    const clock = conditioningClock(value, now);
    const finished = session?.status === 'finished';
    const act = action => {
        setNow(Date.now());
        const updated = conditioningAction(value || config, action);
        if (action === 'start') updated.session.movements = exercises.map(({ id, dbId, name, reps, sets, weight }) => ({ id, dbId, name, reps, sets, weight }));
        onChange(updated);
    };
    const movements = session?.movements || exercises;
    const field = { ...workoutControlStyle, width: '100%', boxSizing: 'border-box' };
    if (readOnly && config.mode === 'standard') return null;
    return <section aria-label={es ? 'Entrenamiento por tiempo' : 'Conditioning workout'} style={{ border: '1px solid var(--brand-border)', borderRadius: 12, padding: 14, background: 'var(--surface-2)', marginBottom: 12 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
            {es ? 'Modo de entrenamiento' : 'Workout mode'}
            <select aria-label={es ? 'Modo de entrenamiento' : 'Workout mode'} value={config.mode} disabled={readOnly || Boolean(session)} onChange={e => onChange({ ...config, mode: e.target.value, session: null })} style={{ ...field, marginTop: 6 }}>
                <option value="standard">{es ? 'Series y repeticiones' : 'Sets and reps'}</option>
                <option value="emom">EMOM</option><option value="amrap">AMRAP</option><option value="forTime">{es ? 'Por tiempo' : 'For time'}</option>
            </select>
        </label>
        {config.mode !== 'standard' && <>
            <p style={{ color: 'var(--text-2)', fontSize: 13, lineHeight: 1.5 }}>
                {config.mode === 'emom'
                    ? (es ? 'Cada minuto inicia el siguiente ejercicio de la lista, repitiendo el orden. Completa las repeticiones previstas y descansa el tiempo restante.' : 'Start the next listed exercise every minute, cycling through the list. Complete the prescribed reps, then rest for the remainder of the minute.')
                    : (es ? 'Una ronda recorre todos los ejercicios del día una vez, con sus repeticiones o minutos indicados. Las series no se multiplican.' : 'One round goes through every exercise in this day once, using its prescribed reps or minutes. Set counts are not multiplied.')}
                {' '}{config.mode === 'amrap' ? (es ? 'Completa tantas rondas como puedas dentro del tiempo.' : 'Complete as many rounds as you can within the time.') : config.mode === 'forTime' ? (es ? 'Completa el objetivo de rondas antes del límite.' : 'Complete the target rounds before the time cap.') : ''}
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <label style={{ flex: 1, minWidth: 110, color: 'var(--text-2)', fontSize: 13 }}>{config.mode === 'forTime' ? (es ? 'Límite (min)' : 'Time cap (min)') : (es ? 'Duración (min)' : 'Duration (min)')}
                    <input aria-label={es ? 'Minutos de entrenamiento' : 'Workout minutes'} type="number" min="1" max="120" value={config.minutes} disabled={readOnly || Boolean(session)} onChange={e => onChange({ ...config, minutes: Math.max(1, Math.min(120, Number(e.target.value) || 1)) })} style={field} />
                </label>
                {config.mode === 'forTime' && <label style={{ flex: 1, minWidth: 110, color: 'var(--text-2)', fontSize: 13 }}>{es ? 'Objetivo de rondas' : 'Target rounds'}
                    <input aria-label={es ? 'Objetivo de rondas' : 'Target rounds'} type="number" min="1" max="100" value={config.targetRounds} disabled={readOnly || Boolean(session)} onChange={e => onChange({ ...config, targetRounds: Math.max(1, Math.min(100, Number(e.target.value) || 1)) })} style={field} />
                </label>}
            </div>
            {session && <>
                <div role="timer" aria-label={es ? 'Reloj del entrenamiento' : 'Workout clock'} style={{ fontSize: 40, fontWeight: 750, fontVariantNumeric: 'tabular-nums', color: 'var(--text)', marginTop: 12 }}>
                    {formatSeconds((config.mode === 'forTime' ? clock.elapsedMs : Math.ceil(clock.remainingMs / 1000) * 1000) / 1000)}
                </div>
                {config.mode === 'emom' && !finished && <p style={{ color: 'var(--brand)', fontWeight: 700 }}>
                    {es ? 'Minuto' : 'Minute'} {clock.interval}/{config.minutes}{movements.length ? ` · ${translateExercise(movements[(clock.interval - 1) % movements.length].name, language)}` : ''}
                    {' · '}{formatSeconds(clock.expired ? 0 : Math.ceil((60000 - clock.elapsedMs % 60000) / 1000))}
                </p>}
                {!finished && <p style={{ color: 'var(--text-2)' }}>{session.rounds || 0} {config.mode === 'emom' ? (es ? 'intervalos registrados' : 'intervals logged') : (es ? 'rondas registradas' : 'rounds logged')}</p>}
                {clock.expired && !finished && !readOnly && <p role="status" style={{ color: 'var(--done)', fontWeight: 700 }}>{es ? 'Tiempo terminado. Guarda tu resultado.' : 'Time is up. Save your result.'}</p>}
                {finished && <p role="status" style={{ color: 'var(--text)', fontWeight: 700 }}>{conditioningScore(value, language)}</p>}
            </>}
            {!readOnly && canRun && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                {!session && <button type="button" disabled={!exercises.length} onClick={() => act('start')} style={workoutControlStyle}>{es ? 'Iniciar entrenamiento' : 'Start workout'}</button>}
                {session && !finished && <>
                    {!clock.expired && <button type="button" onClick={() => act(clock.running ? 'pause' : 'resume')} style={workoutControlStyle}>{clock.running ? (es ? 'Pausar' : 'Pause') : (es ? 'Continuar' : 'Resume')}</button>}
                    <button type="button" disabled={!clock.running && (!clock.expired || config.mode === 'forTime')} onClick={() => act('round')} style={workoutControlStyle}>{config.mode === 'emom' ? (es ? '+ Registrar intervalo' : '+ Log interval') : (es ? '+ Registrar ronda' : '+ Log round')}</button>
                    <button type="button" disabled={!session.rounds} onClick={() => act('removeRound')} style={workoutControlStyle}>{es ? '− Corregir conteo' : '− Correct count'}</button>
                    {config.mode === 'amrap' && <label style={{ color: 'var(--text-2)', fontSize: 13 }}>{es ? 'Reps adicionales' : 'Extra reps'}
                        <input aria-label={es ? 'Reps adicionales' : 'Extra reps'} type="number" min="0" max="9999" value={session.extraReps || 0} onChange={e => onChange({ ...value, session: { ...session, extraReps: Math.max(0, Math.min(9999, Math.floor(Number(e.target.value) || 0))) } })} style={{ ...field, width: 100 }} />
                    </label>}
                    <button type="button" onClick={() => act('finish')} style={{ ...workoutControlStyle, background: 'var(--brand)', color: 'var(--on-brand)' }}>{es ? 'Finalizar y guardar' : 'Finish and save'}</button>
                </>}
                {session && <button type="button" onClick={() => act('reset')} style={workoutControlStyle}>{es ? 'Reiniciar sesión' : 'Reset session'}</button>}
                {onUndo && <button type="button" disabled={!canUndo} onClick={onUndo} style={workoutControlStyle}>{es ? 'Deshacer' : 'Undo'}</button>}
            </div>}
            {!exercises.length && <p style={{ color: 'var(--text-2)' }}>{es ? 'Añade ejercicios a este día para empezar.' : 'Add exercises to this day to begin.'}</p>}
            {!canRun && !readOnly && <p style={{ color: 'var(--text-2)', fontSize: 13 }}>{es ? 'Configuración guardada. Inicia el reloj cuando esta sea la semana actual.' : 'Setup saved. Start the clock when this becomes the current week.'}</p>}
            {session?.movements && <details style={{ marginTop: 12, color: 'var(--text-2)', fontSize: 13 }}>
                <summary>{es ? 'Ejercicios guardados al iniciar' : 'Movements saved at start'}</summary>
                <ol>{movements.map((movement, index) => <li key={`${movement.id}:${index}`}>{translateExercise(movement.name, language)} · {movement.reps ? `${movement.reps} reps` : `${movement.sets} min`}{movement.weight ? ` / ${formatWeight(movement.weight, unit)}` : ''}</li>)}</ol>
            </details>}
            <p style={{ color: 'var(--text-3)', fontSize: 12, marginBottom: 0 }}>{es ? 'El reloj continúa al salir de esta vista. Mantén la app visible para ver los cambios de intervalo. El resultado se guarda separado de las series de fuerza.' : 'The clock continues when you leave this view. Keep the app visible for interval cues. Results are saved separately from strength sets.'}</p>
        </>}
    </section>;
}
