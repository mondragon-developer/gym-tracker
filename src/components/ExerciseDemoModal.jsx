/**
 * Exercise Demo Modal
 * Displays reference positions as a two-photo loop or a packaged GIF, plus
 * step-by-step instructions. These photos do not cover intermediate phases.
 * Mounted only while open, so the animation timer and image loads are lazy.
 *
 * The enrichment data is a large module, loaded lazily (dynamic import inside
 * ExerciseEnrichmentService) once the modal opens — not shipped in the initial
 * bundle. `hasExerciseEnrichment` (sync, tiny) tells us whether to expect it.
 */

import React, { useState, useEffect, useMemo } from 'react';
import Modal from './ui/Modal.jsx';
import { getExerciseMedia } from '../services/ExerciseMediaService.js';
import { getExerciseEnrichment, hasExerciseEnrichment } from '../services/ExerciseEnrichmentService.js';
import { t } from '../translations/ui';
import { translateExercise } from '../translations/exercises';
import { translateEquipment, translateTarget } from '../translations/exerciseTerms';

export default function ExerciseDemoModal({ exercise, onClose, language = 'en' }) {
  const media = useMemo(() => getExerciseMedia(exercise.dbId), [exercise.dbId]);
  const [playing, setPlaying] = useState(() => !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  const [mediaFailed, setMediaFailed] = useState(false);
  const [frame, setFrame] = useState(0);
  const [enrichment, setEnrichment] = useState(null);
  const enrichmentExpected = hasExerciseEnrichment(exercise.dbId);

  // Alternate start/end frames to convey the movement.
  useEffect(() => {
    if (!playing || !media || media.frames.length < 2) return;
    const timer = setInterval(() => setFrame(f => (f === 0 ? 1 : 0)), 900);
    return () => clearInterval(timer);
  }, [media, playing]);

  useEffect(() => {
    const preference = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const stop = event => { if (event.matches) setPlaying(false); };
    preference?.addEventListener('change', stop);
    return () => preference?.removeEventListener('change', stop);
  }, []);

  // Lazily load the (heavy) enrichment record for this exercise.
  useEffect(() => {
    let alive = true;
    setEnrichment(null);
    getExerciseEnrichment(exercise.dbId).then(rec => { if (alive) setEnrichment(rec); });
    return () => { alive = false; };
  }, [exercise.dbId]);

  // Steps for the current language derive synchronously from the loaded record.
  const steps = enrichment
    ? (enrichment.instructions[language]?.length ? enrichment.instructions[language] : enrichment.instructions.en)
    : null;

  const loadingEnrichment = enrichmentExpected && !enrichment;

  return (
    <Modal isOpen onClose={onClose} title={`▶ ${translateExercise(exercise.name, language)}`} style={{ width: 560 }}>
      {media && !mediaFailed && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '360px',
            margin: '0 auto',
            aspectRatio: '1 / 1',
            background: 'var(--surface-3)',
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            {media.gif ? (
              <img
                src={playing ? media.gif : media.poster}
                alt={translateExercise(exercise.name, language)}
                onError={() => setMediaFailed(true)}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            ) : media.frames.map((src, i) => (
              <img
                key={src}
                src={src}
                alt={`${translateExercise(exercise.name, language)} (${i + 1}/2)`}
                aria-hidden={frame !== i}
                onError={() => setMediaFailed(true)}
                loading="lazy"
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  opacity: frame === i ? 1 : 0,
                  transition: playing ? 'opacity 0.35s ease' : 'none'
                }}
              />
            ))}
          </div>
          <p style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-3)' }}>
            {language === 'es' ? 'Dos posiciones de referencia. No se muestran las fases intermedias.' : 'Two reference positions. Intermediate phases are not shown.'}
          </p>
          <button type="button" onClick={() => setPlaying(value => !value)} style={{ ...chipStyle, padding: '10px 14px', border: '1px solid var(--border-strong)', cursor: 'pointer', textTransform: 'none' }}>
            {playing ? (language === 'es' ? 'Pausar demo' : 'Pause demo') : (language === 'es' ? 'Reproducir demo' : 'Play demo')}
          </button>
          {media.gif && <a href={media.gif} download style={{ marginLeft: 16, fontSize: 13, color: 'var(--info)' }}>
            {language === 'es' ? 'Descargar GIF' : 'Download GIF'}
          </a>}
          <p style={{ fontSize: 11, color: 'var(--text-3)' }}>
            <a href="https://github.com/yuhonas/free-exercise-db" target="_blank" rel="noreferrer" style={{ color: 'var(--info)' }}>free-exercise-db</a>
            {' · '}<a href="https://unlicense.org/" target="_blank" rel="noreferrer" style={{ color: 'var(--info)' }}>Unlicense</a>
          </p>
        </div>
      )}

      {mediaFailed && <p role="status">{language === 'es' ? 'No se pudo cargar la demo. Consulta las instrucciones.' : 'The demo could not load. Refer to the instructions.'}</p>}

      {steps && (
        <div style={{ marginTop: media ? '20px' : 0, textAlign: 'left' }}>
          {/* Equipment / target chips */}
          {enrichment && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
              {enrichment.equipment && (
                <span style={chipStyle}>
                  <strong>{t('Equipment', language)}:</strong>&nbsp;{translateEquipment(enrichment.equipment, language)}
                </span>
              )}
              {enrichment.target && (
                <span style={chipStyle}>
                  <strong>{t('Target', language)}:</strong>&nbsp;{translateTarget(enrichment.target, language)}
                </span>
              )}
            </div>
          )}

          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>
            {t('How to perform', language)}
          </h4>
          <ol style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-2)', fontSize: '14px', lineHeight: 1.55 }}>
            {steps.map((step, i) => (
              <li key={i} style={{ marginBottom: '6px' }}>{step}</li>
            ))}
          </ol>

          <p style={{ marginTop: '14px', fontSize: '11px', color: 'var(--text-3)' }}>
            {enrichment.source === 'free-exercise-db'
              ? (language === 'es' ? 'Datos: free-exercise-db (Unlicense). Resumen en español: Gym Tracker.' : 'Data: free-exercise-db (Unlicense). Spanish summary: Gym Tracker.')
              : t('Exercise data from the open exercises-dataset (MIT)', language)}
          </p>
        </div>
      )}

      {/* While the enrichment chunk loads for a covered exercise that has no
          animation, show a subtle placeholder instead of the "no demo" message. */}
      {!media && loadingEnrichment && (
        <p style={{ color: 'var(--text-3)', margin: 0, fontSize: '13px' }}>…</p>
      )}

      {!media && !steps && !loadingEnrichment && (
        <p style={{ color: 'var(--text-3)', margin: 0 }}>
          {t('No demonstration available yet', language)}
        </p>
      )}
    </Modal>
  );
}

const chipStyle = {
  fontSize: '12px',
  color: 'var(--text-2)',
  padding: '4px 10px',
  background: 'var(--surface-3)',
  borderRadius: '6px',
  textTransform: 'capitalize',
};
