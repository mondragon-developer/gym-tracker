/**
 * Exercise Demo Modal
 * Shows how to perform an exercise by cross-fading between its start and end
 * frames on a loop, approximating the full range of motion from two stills.
 * Mounted only while open, so the animation timer and image loads are lazy.
 */

import React, { useState, useEffect } from 'react';
import Modal from './ui/Modal.jsx';
import { getExerciseMedia } from '../services/ExerciseMediaService.js';
import { t } from '../translations/ui';
import { translateExercise } from '../translations/exercises';

export default function ExerciseDemoModal({ exercise, onClose, language = 'en' }) {
  const media = getExerciseMedia(exercise.dbId);
  const [frame, setFrame] = useState(0);

  // Alternate start/end frames to convey the movement.
  useEffect(() => {
    if (!media || media.frames.length < 2) return;
    const timer = setInterval(() => setFrame(f => (f === 0 ? 1 : 0)), 900);
    return () => clearInterval(timer);
  }, [media]);

  return (
    <Modal isOpen onClose={onClose} title={`▶ ${translateExercise(exercise.name, language)}`}>
      {media ? (
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
      ) : (
        <p style={{ color: '#6b7280', margin: 0 }}>
          {t('No demonstration available yet', language)}
        </p>
      )}
    </Modal>
  );
}
