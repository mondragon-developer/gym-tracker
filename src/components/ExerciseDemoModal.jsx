/**
 * Exercise Demo Modal
 * Shows how to perform an exercise by cross-fading between its start and end
 * frames on a loop, approximating the full range of motion from two stills, and
 * (when available) a step-by-step how-to with equipment/target metadata.
 * Mounted only while open, so the animation timer and image loads are lazy.
 *
 * The enrichment data is a large module, loaded lazily (dynamic import inside
 * ExerciseEnrichmentService) once the modal opens — not shipped in the initial
 * bundle. `hasExerciseEnrichment` (sync, tiny) tells us whether to expect it.
 */

import React, { useState, useEffect } from 'react';
import Modal from './ui/Modal.jsx';
import { getExerciseMedia } from '../services/ExerciseMediaService.js';
import { getExerciseEnrichment, hasExerciseEnrichment } from '../services/ExerciseEnrichmentService.js';
import { t } from '../translations/ui';
import { translateExercise } from '../translations/exercises';
import { translateEquipment, translateTarget } from '../translations/exerciseTerms';

export default function ExerciseDemoModal({ exercise, onClose, language = 'en' }) {
  const media = getExerciseMedia(exercise.dbId);
  const [frame, setFrame] = useState(0);
  const [enrichment, setEnrichment] = useState(null);
  const enrichmentExpected = hasExerciseEnrichment(exercise.dbId);

  // Alternate start/end frames to convey the movement.
  useEffect(() => {
    if (!media || media.frames.length < 2) return;
    const timer = setInterval(() => setFrame(f => (f === 0 ? 1 : 0)), 900);
    return () => clearInterval(timer);
  }, [media]);

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
    <Modal isOpen onClose={onClose} title={`▶ ${translateExercise(exercise.name, language)}`}>
      {media && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '360px',
            margin: '0 auto',
            aspectRatio: '1 / 1',
            background: '#f3f4f6',
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            {media.frames.map((src, i) => (
              <img
                key={src}
                src={src}
                alt=""
                loading="lazy"
                onError={(e) => {
                  // Fall back to the source CDN if the self-hosted frame is missing.
                  const fb = media.fallback?.[i];
                  if (fb && e.currentTarget.src !== fb) e.currentTarget.src = fb;
                }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  opacity: frame === i ? 1 : 0,
                  transition: 'opacity 0.35s ease'
                }}
              />
            ))}
          </div>
          <p style={{ marginTop: '12px', fontSize: '13px', color: '#6b7280' }}>
            {t('Full range of motion — start to finish', language)}
          </p>
        </div>
      )}

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

          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 700, color: '#111827' }}>
            {t('How to perform', language)}
          </h4>
          <ol style={{ margin: 0, paddingLeft: '20px', color: '#374151', fontSize: '14px', lineHeight: 1.55 }}>
            {steps.map((step, i) => (
              <li key={i} style={{ marginBottom: '6px' }}>{step}</li>
            ))}
          </ol>

          <p style={{ marginTop: '14px', fontSize: '11px', color: '#9ca3af' }}>
            {t('Exercise data from the open exercises-dataset (MIT)', language)}
          </p>
        </div>
      )}

      {/* While the enrichment chunk loads for a covered exercise that has no
          animation, show a subtle placeholder instead of the "no demo" message. */}
      {!media && loadingEnrichment && (
        <p style={{ color: '#9ca3af', margin: 0, fontSize: '13px' }}>…</p>
      )}

      {!media && !steps && !loadingEnrichment && (
        <p style={{ color: '#6b7280', margin: 0 }}>
          {t('No demonstration available yet', language)}
        </p>
      )}
    </Modal>
  );
}

const chipStyle = {
  fontSize: '12px',
  color: '#374151',
  padding: '4px 10px',
  background: 'rgba(107, 114, 128, 0.1)',
  borderRadius: '6px',
  textTransform: 'capitalize',
};
